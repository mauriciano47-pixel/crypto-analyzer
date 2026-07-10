# Crypto Pattern Analyzer

Backend Django + DRF para análisis técnico de patrones de velas japonesas
y cruce con noticias, sobre datos OHLCV subidos como CSV.

## Qué incluye este prototipo

- **Modelos**: `PriceDataset`, `OHLCVRecord`, `PatternDetection`, `NewsItem`
- **Indicadores** (`analysis/indicators.py`): RSI (método Wilder), SMA, EMA — **probados** con pandas/numpy
- **Patrones de velas** (`analysis/candlestick_patterns.py`): hammer, inverted hammer,
  doji, bullish/bearish engulfing, morning star, evening star — **los 7 probados y verificados**
- **Parser de CSV** (`analysis/csv_parser.py`): acepta columnas timestamp/date/time/datetime + OHLCV
- **Noticias** (`analysis/news_cross_analysis.py`): integración placeholder con
  CryptoPanic y NewsAPI (requiere API keys reales, ver `.env.example`)
- **Endpoints DRF**: subir CSV, listar datasets, ver patrones, ver indicadores,
  ver cruce de patrones + noticias por fecha

## ⚠️ Decisión de diseño importante

El cruce de noticias + patrones (`/api/datasets/<id>/news-context/`) **solo
correlaciona fechas** — muestra qué noticias se publicaron el mismo día que
se detectó un patrón técnico. **No genera señales de compra/venta ni
recomendaciones de inversión.** Esa es información de contexto para que el
usuario decida; no una predicción del sistema.

## Cómo correrlo en tu máquina (Windows + VS Code)

Este proyecto fue escrito en un entorno sin acceso a internet, así que
**no se pudo instalar Django ni correr migraciones aquí**. La lógica de
indicadores y patrones SÍ se probó con pandas/numpy reales (ver sección de
pruebas abajo). Pasos para correrlo en tu entorno:

```bash
# 1. Entrar a la carpeta del proyecto
cd crypto-pattern-analyzer

# 2. Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Copiar variables de entorno
copy .env.example .env         # Windows
# cp .env.example .env         # Mac/Linux

# 5. Crear las migraciones y la base de datos
python manage.py makemigrations
python manage.py migrate

# 6. Crear un superusuario para el admin
python manage.py createsuperuser

# 7. Levantar el servidor
python manage.py runserver
```

Luego abre `http://127.0.0.1:8000/admin/` para ver los modelos, o usa el
CSV de ejemplo en `ejemplos/BTC_ejemplo_diario.csv` para probar el endpoint
de subida:

```bash
curl -X POST http://127.0.0.1:8000/api/datasets/upload/ \
  -F "asset_symbol=BTC" \
  -F "timeframe=1d" \
  -F "archivo=@ejemplos/BTC_ejemplo_diario.csv"
```

Luego, con el `id` que te devuelva:

```bash
curl http://127.0.0.1:8000/api/datasets/1/patterns/
curl http://127.0.0.1:8000/api/datasets/1/indicators/
```

## Pruebas ya realizadas (en el entorno de construcción)

Se probó la lógica de `indicators.py` y `candlestick_patterns.py` con
pandas/numpy directamente (sin Django, ya que esas dos librerías no
requieren Django para funcionar):

- ✅ RSI, SMA, EMA calculados correctamente sobre series sintéticas de 60 días
- ✅ Los 7 patrones de velas detectados correctamente en casos sintéticos
  limpios (cada uno probado individualmente con vela(s) construida(s) a mano)
- ✅ Casos negativos verificados (una vela "normal" no dispara ningún patrón)
- ✅ Se encontró y corrigió un bug real en `es_hammer`/`es_inverted_hammer`
  (la condición de mecha superior fallaba cuando el cuerpo de la vela era
  exactamente cero, por comparar contra `cuerpo * 0.5` en vez de contra el
  rango total de la vela)
- ✅ Pipeline completo (`detectar_patrones` + `calcular_indicadores`) corrido
  sobre 60 velas sintéticas: 26 patrones detectados con distribución coherente
- ✅ Parser de CSV probado con CSV válido (incluyendo alias de columna `Date`)
  y CSV inválido (sin columna de fecha → error claro)

**Lo que falta probar** (requiere Django real, en tu entorno):
- Migraciones y modelos contra una base de datos real
- Endpoints DRF end-to-end (subida de archivo → guardado → consulta)
- Admin de Django (visualización)

## Próximos pasos sugeridos

1. Correr `migrate` y probar el flujo completo end-to-end en tu VS Code
2. Cargar el CSV de ejemplo vía admin o vía el endpoint de upload
3. Verificar en el admin que las velas, patrones y su confianza se vean bien
4. Conseguir una API key de CryptoPanic (tiene plan gratuito) para probar
   `sincronizar_noticias()` con datos reales
5. Recién ahí, conectar el frontend React Native a estos endpoints
