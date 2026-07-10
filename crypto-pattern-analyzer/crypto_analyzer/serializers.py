from rest_framework import serializers
from .models import PriceDataset, OHLCVRecord, PatternDetection, NewsItem


class OHLCVRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = OHLCVRecord
        fields = ['id', 'timestamp', 'open', 'high', 'low', 'close', 'volume']


class PatternDetectionSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source='vela.timestamp', read_only=True)
    tipo_patron_display = serializers.CharField(source='get_tipo_patron_display', read_only=True)
    close = serializers.DecimalField(source='vela.close', max_digits=20, decimal_places=8, read_only=True)

    class Meta:
        model = PatternDetection
        fields = ['id', 'tipo_patron', 'tipo_patron_display', 'confianza', 'timestamp', 'close']


class PriceDatasetSerializer(serializers.ModelSerializer):
    total_velas = serializers.SerializerMethodField()

    class Meta:
        model = PriceDataset
        fields = ['id', 'asset_symbol', 'nombre_archivo', 'fecha_carga', 'timeframe', 'total_velas']

    def get_total_velas(self, obj):
        return obj.velas.count()


class PriceDatasetUploadSerializer(serializers.Serializer):
    """Serializer de entrada para la subida de un CSV de precios."""
    asset_symbol = serializers.CharField(max_length=20)
    timeframe = serializers.CharField(max_length=10, default='1d')
    archivo = serializers.FileField()

    def validate_archivo(self, value):
        if not value.name.lower().endswith('.csv'):
            raise serializers.ValidationError('El archivo debe ser un CSV.')
        return value


class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = ['id', 'asset_symbol', 'titular', 'fuente', 'url', 'fecha_publicacion', 'sentimiento']

class CCXTFetchSerializer(serializers.Serializer):
    exchange_id = serializers.CharField(max_length=50, default='binance')
    symbol = serializers.CharField(max_length=20, help_text='Ej. BTC/USDT')
    timeframe = serializers.CharField(max_length=10, default='1d')
    limit = serializers.IntegerField(default=100, min_value=1, max_value=1000)

