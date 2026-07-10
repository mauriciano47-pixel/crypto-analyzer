"""
Utilidades para parsear un CSV de precios (formato OHLCV) y convertirlo
en objetos OHLCVRecord listos para guardar en la base de datos.

Formato esperado del CSV (columnas, sin importar mayúsculas):
    timestamp, open, high, low, close, volume

`timestamp` puede ser una fecha ISO (2026-01-01) o un datetime completo
(2026-01-01 00:00:00). También se aceptan los alias comunes: date, time,
o un timestamp unix en segundos/milisegundos.
"""
import pandas as pd

COLUMNAS_REQUERIDAS = ['open', 'high', 'low', 'close']
ALIASES_TIMESTAMP = ['timestamp', 'date', 'time', 'datetime']


class CSVFormatoInvalido(Exception):
    pass


def _detectar_columna_timestamp(columnas_normalizadas: list[str]) -> str | None:
    for alias in ALIASES_TIMESTAMP:
        if alias in columnas_normalizadas:
            return alias
    return None


def parsear_csv_ohlcv(archivo) -> pd.DataFrame:
    """
    Lee un archivo CSV (file-like object) y devuelve un DataFrame normalizado
    con columnas ['timestamp', 'open', 'high', 'low', 'close', 'volume'],
    ordenado ascendentemente por timestamp.

    Lanza CSVFormatoInvalido si faltan columnas requeridas.
    """
    df = pd.read_csv(archivo)
    df.columns = [c.strip().lower() for c in df.columns]

    columna_ts = _detectar_columna_timestamp(list(df.columns))
    if columna_ts is None:
        raise CSVFormatoInvalido(
            "No se encontró una columna de fecha/hora. Se esperaba alguna de: "
            + ", ".join(ALIASES_TIMESTAMP)
        )

    faltantes = [c for c in COLUMNAS_REQUERIDAS if c not in df.columns]
    if faltantes:
        raise CSVFormatoInvalido(
            f"Faltan columnas requeridas en el CSV: {', '.join(faltantes)}"
        )

    df = df.rename(columns={columna_ts: 'timestamp'})

    # Intentar parsear timestamp como fecha; si falla, asumir unix epoch
    try:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
    except (ValueError, TypeError):
        # epoch en segundos o milisegundos
        muestra = df['timestamp'].iloc[0]
        unidad = 'ms' if muestra > 10_000_000_000 else 's'
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit=unidad)

    if 'volume' not in df.columns:
        df['volume'] = 0

    columnas_finales = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
    df = df[columnas_finales].copy()

    for c in ['open', 'high', 'low', 'close', 'volume']:
        df[c] = pd.to_numeric(df[c], errors='coerce')

    filas_invalidas = df[COLUMNAS_REQUERIDAS].isna().any(axis=1).sum()
    if filas_invalidas > 0:
        df = df.dropna(subset=COLUMNAS_REQUERIDAS)

    df = df.sort_values('timestamp').reset_index(drop=True)

    if df.empty:
        raise CSVFormatoInvalido("El CSV no contiene filas válidas tras la limpieza.")

    return df
