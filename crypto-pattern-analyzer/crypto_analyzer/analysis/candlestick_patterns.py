"""
Detección de patrones clásicos de velas japonesas (candlestick patterns)
sobre un DataFrame OHLCV.

Cada función `es_<patron>` evalúa una o más velas (por posición de índice
entero `i` dentro del DataFrame) y devuelve (bool, confianza) donde
confianza está en [0, 1] e indica qué tan limpio calza el patrón con su
definición clásica.

Estas funciones implementan reconocimiento de forma geométrica de velas,
NO predicen movimientos de precio ni constituyen señales de compra/venta.
"""
import pandas as pd
import numpy as np


def _cuerpo(vela: pd.Series) -> float:
    return abs(float(vela['close']) - float(vela['open']))


def _rango_total(vela: pd.Series) -> float:
    rango = float(vela['high']) - float(vela['low'])
    return rango if rango > 0 else 1e-9  # evitar división por cero


def _mecha_superior(vela: pd.Series) -> float:
    return float(vela['high']) - max(float(vela['open']), float(vela['close']))


def _mecha_inferior(vela: pd.Series) -> float:
    return min(float(vela['open']), float(vela['close'])) - float(vela['low'])


def _es_alcista(vela: pd.Series) -> bool:
    return float(vela['close']) > float(vela['open'])


def _es_bajista(vela: pd.Series) -> bool:
    return float(vela['close']) < float(vela['open'])


# ---------- Patrones de una sola vela ----------

def es_hammer(vela: pd.Series) -> tuple[bool, float]:
    """
    Hammer (martillo): cuerpo pequeño en la parte superior del rango,
    mecha inferior larga (al menos 2x el cuerpo), mecha superior mínima.
    Aparece típicamente al final de una tendencia bajista.
    """
    cuerpo = _cuerpo(vela)
    rango = _rango_total(vela)
    mecha_inf = _mecha_inferior(vela)
    mecha_sup = _mecha_superior(vela)

    if cuerpo / rango > 0.35:
        return False, 0.0
    if mecha_inf < rango * 0.55:
        return False, 0.0
    if mecha_sup > rango * 0.1:
        return False, 0.0

    confianza = min(1.0, (mecha_inf / rango) * 1.2)
    return True, round(confianza, 2)


def es_inverted_hammer(vela: pd.Series) -> tuple[bool, float]:
    """
    Inverted hammer: igual que hammer pero con la mecha larga arriba.
    """
    cuerpo = _cuerpo(vela)
    rango = _rango_total(vela)
    mecha_sup = _mecha_superior(vela)
    mecha_inf = _mecha_inferior(vela)

    if cuerpo / rango > 0.35:
        return False, 0.0
    if mecha_sup < rango * 0.55:
        return False, 0.0
    if mecha_inf > rango * 0.1:
        return False, 0.0

    confianza = min(1.0, (mecha_sup / rango) * 1.2)
    return True, round(confianza, 2)


def es_doji(vela: pd.Series, umbral_cuerpo: float = 0.1) -> tuple[bool, float]:
    """
    Doji: apertura y cierre prácticamente iguales (cuerpo muy pequeño
    respecto al rango total). Indica indecisión del mercado.
    """
    cuerpo = _cuerpo(vela)
    rango = _rango_total(vela)
    ratio = cuerpo / rango

    if ratio > umbral_cuerpo:
        return False, 0.0

    confianza = round(1.0 - (ratio / umbral_cuerpo), 2)
    return True, max(confianza, 0.5)


# ---------- Patrones de dos velas ----------

def es_bullish_engulfing(vela_prev: pd.Series, vela_actual: pd.Series) -> tuple[bool, float]:
    """
    Bullish engulfing: vela bajista seguida de una vela alcista cuyo
    cuerpo envuelve completamente el cuerpo de la vela anterior.
    """
    if not _es_bajista(vela_prev) or not _es_alcista(vela_actual):
        return False, 0.0

    open_prev, close_prev = float(vela_prev['open']), float(vela_prev['close'])
    open_act, close_act = float(vela_actual['open']), float(vela_actual['close'])

    envuelve = open_act <= close_prev and close_act >= open_prev
    if not envuelve:
        return False, 0.0

    cuerpo_prev = _cuerpo(vela_prev)
    cuerpo_act = _cuerpo(vela_actual)
    if cuerpo_prev == 0:
        return False, 0.0

    ratio = cuerpo_act / cuerpo_prev
    confianza = min(1.0, ratio / 2)
    return True, round(confianza, 2)


def es_bearish_engulfing(vela_prev: pd.Series, vela_actual: pd.Series) -> tuple[bool, float]:
    """
    Bearish engulfing: vela alcista seguida de una vela bajista cuyo
    cuerpo envuelve completamente el cuerpo de la vela anterior.
    """
    if not _es_alcista(vela_prev) or not _es_bajista(vela_actual):
        return False, 0.0

    open_prev, close_prev = float(vela_prev['open']), float(vela_prev['close'])
    open_act, close_act = float(vela_actual['open']), float(vela_actual['close'])

    envuelve = open_act >= close_prev and close_act <= open_prev
    if not envuelve:
        return False, 0.0

    cuerpo_prev = _cuerpo(vela_prev)
    cuerpo_act = _cuerpo(vela_actual)
    if cuerpo_prev == 0:
        return False, 0.0

    ratio = cuerpo_act / cuerpo_prev
    confianza = min(1.0, ratio / 2)
    return True, round(confianza, 2)


# ---------- Patrones de tres velas ----------

def es_morning_star(v1: pd.Series, v2: pd.Series, v3: pd.Series) -> tuple[bool, float]:
    """
    Morning star: vela bajista grande, vela pequeña (indecisión, hueco
    a la baja), vela alcista grande que cierra dentro del cuerpo de v1.
    Patrón de reversión alcista tras tendencia bajista.
    """
    if not _es_bajista(v1):
        return False, 0.0
    if not _es_alcista(v3):
        return False, 0.0

    cuerpo1 = _cuerpo(v1)
    cuerpo2 = _cuerpo(v2)
    cuerpo3 = _cuerpo(v3)

    if cuerpo1 == 0 or cuerpo3 == 0:
        return False, 0.0

    # La vela del medio debe ser pequeña respecto a las otras dos
    if cuerpo2 > cuerpo1 * 0.5 or cuerpo2 > cuerpo3 * 0.5:
        return False, 0.0

    # v3 debe cerrar dentro (o más allá) del cuerpo de v1, hacia arriba
    punto_medio_v1 = (float(v1['open']) + float(v1['close'])) / 2
    if float(v3['close']) <= punto_medio_v1:
        return False, 0.0

    ratio_recuperacion = min(1.0, cuerpo3 / cuerpo1)
    confianza = round(ratio_recuperacion, 2)
    return True, max(confianza, 0.5)


def es_evening_star(v1: pd.Series, v2: pd.Series, v3: pd.Series) -> tuple[bool, float]:
    """
    Evening star: vela alcista grande, vela pequeña (indecisión, hueco
    al alza), vela bajista grande que cierra dentro del cuerpo de v1.
    Patrón de reversión bajista tras tendencia alcista.
    """
    if not _es_alcista(v1):
        return False, 0.0
    if not _es_bajista(v3):
        return False, 0.0

    cuerpo1 = _cuerpo(v1)
    cuerpo2 = _cuerpo(v2)
    cuerpo3 = _cuerpo(v3)

    if cuerpo1 == 0 or cuerpo3 == 0:
        return False, 0.0

    if cuerpo2 > cuerpo1 * 0.5 or cuerpo2 > cuerpo3 * 0.5:
        return False, 0.0

    punto_medio_v1 = (float(v1['open']) + float(v1['close'])) / 2
    if float(v3['close']) >= punto_medio_v1:
        return False, 0.0

    ratio_recuperacion = min(1.0, cuerpo3 / cuerpo1)
    confianza = round(ratio_recuperacion, 2)
    return True, max(confianza, 0.5)


# ---------- Orquestador principal ----------

def detectar_patrones(df: pd.DataFrame) -> list[dict]:
    """
    Recorre todo el DataFrame y devuelve una lista de patrones detectados.

    Cada elemento: {'indice': int, 'timestamp': ..., 'patron': str, 'confianza': float}

    El DataFrame debe tener columnas ['timestamp', 'open', 'high', 'low', 'close']
    y estar ordenado ascendentemente por timestamp.
    """
    detecciones = []
    n = len(df)

    for i in range(n):
        vela = df.iloc[i]
        ts = vela['timestamp']

        # Patrones de 1 vela
        ok, conf = es_hammer(vela)
        if ok:
            detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'hammer', 'confianza': conf})

        ok, conf = es_inverted_hammer(vela)
        if ok:
            detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'inverted_hammer', 'confianza': conf})

        ok, conf = es_doji(vela)
        if ok:
            detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'doji', 'confianza': conf})

        # Patrones de 2 velas
        if i >= 1:
            vela_prev = df.iloc[i - 1]

            ok, conf = es_bullish_engulfing(vela_prev, vela)
            if ok:
                detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'bullish_engulfing', 'confianza': conf})

            ok, conf = es_bearish_engulfing(vela_prev, vela)
            if ok:
                detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'bearish_engulfing', 'confianza': conf})

        # Patrones de 3 velas
        if i >= 2:
            v1, v2, v3 = df.iloc[i - 2], df.iloc[i - 1], vela

            ok, conf = es_morning_star(v1, v2, v3)
            if ok:
                detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'morning_star', 'confianza': conf})

            ok, conf = es_evening_star(v1, v2, v3)
            if ok:
                detecciones.append({'indice': i, 'timestamp': ts, 'patron': 'evening_star', 'confianza': conf})

    return detecciones
