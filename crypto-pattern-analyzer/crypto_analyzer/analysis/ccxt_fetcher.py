import ccxt
import pandas as pd

class CCXTFetchError(Exception):
    pass

def fetch_ohlcv_from_exchange(exchange_id: str, symbol: str, timeframe: str, limit: int = 100) -> pd.DataFrame:
    """
    Se conecta al exchange especificado vía CCXT y descarga las velas OHLCV.
    Retorna un DataFrame de Pandas con las columnas requeridas.
    """
    try:
        # Instanciar el exchange dinámicamente
        from django.conf import settings
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({
            'enableRateLimit': True,
            'verify': getattr(settings, 'CCXT_VERIFY_SSL', True)
        })
    except AttributeError:
        raise CCXTFetchError(f"Exchange no soportado: {exchange_id}")

    try:
        # Descargar las velas
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    except Exception as e:
        raise CCXTFetchError(f"Error descargando datos del exchange: {str(e)}")

    if not ohlcv:
        raise CCXTFetchError("El exchange devolvió una lista vacía de velas.")

    # Convertir a DataFrame
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    
    # El timestamp de CCXT viene en milisegundos UTC
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms', utc=True)
    
    # Ordenar por si acaso
    df = df.sort_values('timestamp')
    
    return df
