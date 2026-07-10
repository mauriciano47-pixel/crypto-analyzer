"""
Indicadores técnicos clásicos calculados sobre un DataFrame de velas OHLCV.

Convención de entrada: un pandas.DataFrame con columnas
['timestamp', 'open', 'high', 'low', 'close', 'volume'], ordenado
ascendentemente por timestamp.
"""
import pandas as pd
import numpy as np


def calcular_rsi(df: pd.DataFrame, periodo: int = 14, columna_close: str = 'close') -> pd.Series:
    """
    Calcula el RSI (Relative Strength Index) clásico de Wilder.

    Devuelve una Serie alineada al índice de df, con NaN en las primeras
    `periodo` filas (no hay suficientes datos para calcular el promedio).
    """
    close = df[columna_close].astype(float)
    delta = close.diff()

    ganancia = delta.clip(lower=0)
    perdida = -delta.clip(upper=0)

    # Promedio móvil exponencial tipo Wilder (alpha = 1/periodo)
    avg_ganancia = ganancia.ewm(alpha=1 / periodo, min_periods=periodo, adjust=False).mean()
    avg_perdida = perdida.ewm(alpha=1 / periodo, min_periods=periodo, adjust=False).mean()

    rs = avg_ganancia / avg_perdida.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))

    # Si avg_perdida es 0 y avg_ganancia > 0, RSI debería ser 100
    rsi = rsi.where(avg_perdida != 0, 100)
    # Si ambos son 0 (precio plano), RSI queda indefinido -> 50 es razonable
    rsi = rsi.where(~((avg_perdida == 0) & (avg_ganancia == 0)), 50)

    rsi.name = f'rsi_{periodo}'
    return rsi


def calcular_media_movil_simple(df: pd.DataFrame, periodo: int, columna_close: str = 'close') -> pd.Series:
    """Media móvil simple (SMA) sobre el precio de cierre."""
    sma = df[columna_close].astype(float).rolling(window=periodo, min_periods=periodo).mean()
    sma.name = f'sma_{periodo}'
    return sma


def calcular_media_movil_exponencial(df: pd.DataFrame, periodo: int, columna_close: str = 'close') -> pd.Series:
    """Media móvil exponencial (EMA) sobre el precio de cierre."""
    ema = df[columna_close].astype(float).ewm(span=periodo, adjust=False, min_periods=periodo).mean()
    ema.name = f'ema_{periodo}'
    return ema


def calcular_indicadores(df: pd.DataFrame, rsi_periodo: int = 14,
                          sma_periodos=(20, 50), ema_periodos=(12, 26)) -> pd.DataFrame:
    """
    Calcula y agrega todos los indicadores estándar a una copia del DataFrame.
    No modifica el DataFrame original.
    """
    resultado = df.copy()
    resultado[f'rsi_{rsi_periodo}'] = calcular_rsi(df, periodo=rsi_periodo)

    for periodo in sma_periodos:
        resultado[f'sma_{periodo}'] = calcular_media_movil_simple(df, periodo)

    for periodo in ema_periodos:
        resultado[f'ema_{periodo}'] = calcular_media_movil_exponencial(df, periodo)

    return resultado


def interpretar_rsi(valor_rsi: float) -> str:
    """
    Traduce un valor de RSI a una etiqueta de lectura estándar.
    No es una recomendación de inversión, solo la lectura técnica convencional.
    """
    if pd.isna(valor_rsi):
        return 'sin_datos'
    if valor_rsi >= 70:
        return 'sobrecompra'
    if valor_rsi <= 30:
        return 'sobreventa'
    return 'neutral'
