from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import pandas as pd

from .models import PriceDataset, OHLCVRecord, PatternDetection, NewsItem
from .serializers import (
    PriceDatasetSerializer,
    PriceDatasetUploadSerializer,
    PatternDetectionSerializer,
    OHLCVRecordSerializer,
    NewsItemSerializer,
)
from .analysis.csv_parser import parsear_csv_ohlcv, CSVFormatoInvalido
from .analysis.indicators import calcular_indicadores, interpretar_rsi
from .analysis.candlestick_patterns import detectar_patrones


class PriceDatasetUploadView(APIView):
    """
    POST /api/datasets/upload/
    Recibe un CSV con columnas OHLCV, crea un PriceDataset y sus OHLCVRecord.
    """

    def post(self, request):
        serializer = PriceDatasetUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        archivo = serializer.validated_data['archivo']
        asset_symbol = serializer.validated_data['asset_symbol'].upper()
        timeframe = serializer.validated_data['timeframe']

        try:
            df = parsear_csv_ohlcv(archivo)
        except CSVFormatoInvalido as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        dataset = PriceDataset.objects.create(
            asset_symbol=asset_symbol,
            nombre_archivo=archivo.name,
            timeframe=timeframe,
        )

        registros = [
            OHLCVRecord(
                dataset=dataset,
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
            )
            for _, row in df.iterrows()
        ]
        OHLCVRecord.objects.bulk_create(registros)

        return Response(
            PriceDatasetSerializer(dataset).data,
            status=status.HTTP_201_CREATED,
        )


class PriceDatasetListView(APIView):
    """GET /api/datasets/ - lista todos los datasets cargados."""

    def get(self, request):
        datasets = PriceDataset.objects.all()
        return Response(PriceDatasetSerializer(datasets, many=True).data)


def _dataset_a_dataframe(dataset: PriceDataset) -> pd.DataFrame:
    """Convierte las velas de un dataset a un DataFrame ordenado por tiempo."""
    velas = dataset.velas.all().order_by('timestamp').values(
        'id', 'timestamp', 'open', 'high', 'low', 'close', 'volume'
    )
    df = pd.DataFrame(list(velas))
    if df.empty:
        return df
    for c in ['open', 'high', 'low', 'close', 'volume']:
        df[c] = df[c].astype(float)
    return df


class DatasetPatternsView(APIView):
    """
    GET /api/datasets/<id>/patterns/
    Corre la detección de patrones de velas y la persiste, devolviendo el resultado.
    """

    def get(self, request, dataset_id):
        dataset = get_object_or_404(PriceDataset, id=dataset_id)
        df = _dataset_a_dataframe(dataset)

        if df.empty:
            return Response(
                {'error': 'Este dataset no tiene velas cargadas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        detecciones = detectar_patrones(df)

        # Persistir (evitando duplicar si ya se corrió antes)
        dataset.patrones.all().delete()
        objetos = [
            PatternDetection(
                dataset=dataset,
                vela_id=int(df.iloc[d['indice']]['id']),
                tipo_patron=d['patron'],
                confianza=d['confianza'],
            )
            for d in detecciones
        ]
        PatternDetection.objects.bulk_create(objetos)

        patrones_guardados = dataset.patrones.select_related('vela').all()
        return Response({
            'dataset': PriceDatasetSerializer(dataset).data,
            'total_patrones': len(patrones_guardados),
            'patrones': PatternDetectionSerializer(patrones_guardados, many=True).data,
        })


class DatasetIndicatorsView(APIView):
    """
    GET /api/datasets/<id>/indicators/
    Calcula RSI y medias móviles para todas las velas del dataset.
    """

    def get(self, request, dataset_id):
        dataset = get_object_or_404(PriceDataset, id=dataset_id)
        df = _dataset_a_dataframe(dataset)

        if df.empty:
            return Response(
                {'error': 'Este dataset no tiene velas cargadas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        df_ind = calcular_indicadores(df)
        df_ind['timestamp'] = df_ind['timestamp'].astype(str)

        resultado_crudo = df_ind[[
            'timestamp', 'open', 'high', 'low', 'close', 'volume', 'rsi_14', 'sma_20', 'sma_50', 'ema_12', 'ema_26'
        ]].to_dict(orient='records')

        import math
        resultado = []
        for row in resultado_crudo:
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, float) and math.isnan(v):
                    clean_row[k] = None
                else:
                    clean_row[k] = v
            # También renombramos timestamp a fecha para coincidir con el frontend si es necesario
            # o el frontend usa timestamp? No, el frontend usa d.fecha
            clean_row['fecha'] = clean_row.pop('timestamp')
            resultado.append(clean_row)
        ultimo_rsi = df_ind['rsi_14'].iloc[-1]
        lectura_rsi = interpretar_rsi(ultimo_rsi) if pd.notna(ultimo_rsi) else 'sin_datos'

        return Response({
            'dataset': PriceDatasetSerializer(dataset).data,
            'lectura_rsi_actual': lectura_rsi,
            'serie': resultado,
        })


class DatasetNewsContextView(APIView):
    """
    GET /api/datasets/<id>/news-context/
    Devuelve noticias relacionadas al activo del dataset, correlacionadas
    por fecha con los patrones detectados, además de noticias de actualidad.
    """

    def get(self, request, dataset_id):
        dataset = get_object_or_404(PriceDataset, id=dataset_id)

        # Sincronizar noticias del RSS feed en tiempo real
        from .analysis.news_cross_analysis import sincronizar_noticias
        try:
            sincronizar_noticias(dataset.asset_symbol)
        except Exception as e:
            print(f"Error al sincronizar noticias de RSS: {e}")

        # Traer todas las noticias locales del activo ordenadas por fecha más reciente
        noticias = NewsItem.objects.filter(asset_symbol=dataset.asset_symbol).order_by('-fecha_publicacion')
        patrones = dataset.patrones.select_related('vela').all()

        # 1. Agrupar noticias por fecha para cruzarlas con patrones del mismo día
        contexto = []
        for patron in patrones:
            fecha_patron = patron.vela.timestamp.date()
            noticias_del_dia = [
                n for n in noticias if n.fecha_publicacion.date() == fecha_patron
            ]
            if noticias_del_dia:
                contexto.append({
                    'fecha': str(fecha_patron),
                    'patron': patron.get_tipo_patron_display(),
                    'confianza': patron.confianza,
                    'noticias': NewsItemSerializer(noticias_del_dia, many=True).data,
                })

        # 2. Agregar también las noticias más recientes del activo para dar contexto de actualidad
        ultimas_noticias = noticias[:15]
        for n in ultimas_noticias:
            contexto.append({
                'fecha': n.fecha_publicacion.isoformat(),
                'patron': 'Actualidad',
                'confianza': 1.0,
                'noticias': [NewsItemSerializer(n).data],
            })

        return Response({
            'dataset': PriceDatasetSerializer(dataset).data,
            'nota': (
                'Esta vista correlaciona noticias por fecha de patrones y '
                'también incluye noticias de actualidad recientes.'
            ),
            'coincidencias': contexto,
        })
from .analysis.ccxt_fetcher import fetch_ohlcv_from_exchange, CCXTFetchError
from .serializers import CCXTFetchSerializer

class PriceDatasetCCXTFetchView(APIView):
    """
    POST /api/datasets/fetch-ccxt/
    Descarga OHLCV usando CCXT y crea un PriceDataset.
    """
    def post(self, request):
        serializer = CCXTFetchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exchange_id = serializer.validated_data['exchange_id']
        symbol = serializer.validated_data['symbol']
        timeframe = serializer.validated_data['timeframe']
        limit = serializer.validated_data['limit']

        try:
            df = fetch_ohlcv_from_exchange(exchange_id, symbol, timeframe, limit)
        except CCXTFetchError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        dataset = PriceDataset.objects.create(
            asset_symbol=symbol,
            nombre_archivo=f"ccxt_{exchange_id}_{symbol.replace('/', '_')}_{timeframe}",
            timeframe=timeframe,
        )

        registros = [
            OHLCVRecord(
                dataset=dataset,
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
            )
            for _, row in df.iterrows()
        ]
        OHLCVRecord.objects.bulk_create(registros)

        return Response(
            PriceDatasetSerializer(dataset).data,
            status=status.HTTP_201_CREATED,
        )


class LoadExampleDatasetView(APIView):
    """
    POST /api/datasets/load-example/
    Carga un dataset de ejemplo predefinido desde el servidor (BTC, ETH, SOL, ADA, XRP).
    """
    def post(self, request):
        import os
        from django.conf import settings
        
        symbol = request.data.get('symbol', 'BTC').upper()
        
        if symbol not in ['BTC', 'ETH', 'SOL', 'ADA', 'XRP']:
            return Response({'error': f'Símbolo {symbol} no soportado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        filename = f"{symbol}_ejemplo_diario.csv"
        base_dir = settings.BASE_DIR
        filepath = os.path.join(base_dir, 'ejemplos', filename)
        
        if not os.path.exists(filepath):
            return Response({'error': f'El archivo de ejemplo {filename} no existe.'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            df = parsear_csv_ohlcv(filepath)
        except Exception as e:
            return Response({'error': f'Error al leer el CSV: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        dataset = PriceDataset.objects.create(
            asset_symbol=symbol,
            nombre_archivo=filename,
            timeframe='1d',
        )
        
        registros = [
            OHLCVRecord(
                dataset=dataset,
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
            )
            for _, row in df.iterrows()
        ]
        OHLCVRecord.objects.bulk_create(registros)
        
        return Response(
            PriceDatasetSerializer(dataset).data,
            status=status.HTTP_201_CREATED,
        )


class DatasetCCXTUpdateView(APIView):
    """
    POST /api/datasets/<id>/update-ccxt/
    Se conecta al exchange correspondiente, descarga las velas más recientes,
    las actualiza/inserta, re-evalúa los patrones y devuelve la cantidad de velas del dataset.
    """
    def post(self, request, dataset_id):
        dataset = get_object_or_404(PriceDataset, id=dataset_id)
        if not dataset.nombre_archivo.startswith('ccxt_'):
            return Response({'error': 'Este dataset no fue creado vía CCXT.'}, status=status.HTTP_400_BAD_REQUEST)
            
        parts = dataset.nombre_archivo.split('_')
        if len(parts) < 5:
            return Response({'error': 'Nombre de archivo de dataset CCXT inválido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        exchange_id = parts[1]
        # El formato guardado es: ccxt_{exchange_id}_{symbol.replace('/', '_')}_{timeframe}
        # Ej: ccxt_binance_BTC_USDT_1h
        symbol = f"{parts[2]}/{parts[3]}"
        timeframe = parts[4]
        
        try:
            # Descargamos solo las últimas 20 velas para que la actualización sea veloz
            df = fetch_ohlcv_from_exchange(exchange_id, symbol, timeframe, limit=20)
        except CCXTFetchError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        # Insertar o actualizar velas individuales
        for _, row in df.iterrows():
            OHLCVRecord.objects.update_or_create(
                dataset=dataset,
                timestamp=row['timestamp'],
                defaults={
                    'open': row['open'],
                    'high': row['high'],
                    'low': row['low'],
                    'close': row['close'],
                    'volume': row['volume'],
                }
            )
            
        # Re-detectar patrones
        df_completo = _dataset_a_dataframe(dataset)
        detecciones = detectar_patrones(df_completo)
        
        # Eliminar patrones viejos de este dataset y guardar los nuevos detectados
        dataset.patrones.all().delete()
        objetos = [
            PatternDetection(
                dataset=dataset,
                vela_id=int(df_completo.iloc[d['indice']]['id']),
                tipo_patron=d['patron'],
                confianza=d['confianza'],
            )
            for d in detecciones
        ]
        PatternDetection.objects.bulk_create(objetos)
        
        # También actualizar noticias del activo
        from .analysis.news_cross_analysis import sincronizar_noticias
        try:
            sincronizar_noticias(dataset.asset_symbol)
        except Exception as e:
            print(f"Error actualizando noticias: {e}")
            
        return Response({
            'status': 'ok',
            'dataset': PriceDatasetSerializer(dataset).data,
            'total_velas': dataset.velas.count()
        })

