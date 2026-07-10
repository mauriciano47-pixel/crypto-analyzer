from django.db import models


class PriceDataset(models.Model):
    """
    Representa un CSV de precios (OHLCV) subido por el usuario para un activo.
    """
    asset_symbol = models.CharField(
        max_length=20,
        help_text="Símbolo del activo, ej. BTC, ETH, SOL"
    )
    nombre_archivo = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='datasets/', null=True, blank=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    timeframe = models.CharField(
        max_length=10,
        default='1d',
        help_text="Marco temporal de las velas, ej. 1h, 4h, 1d"
    )

    class Meta:
        ordering = ['-fecha_carga']
        verbose_name = 'Dataset de precios'
        verbose_name_plural = 'Datasets de precios'

    def __str__(self):
        return f"{self.asset_symbol} ({self.timeframe}) - {self.fecha_carga:%Y-%m-%d}"


class OHLCVRecord(models.Model):
    """
    Una vela individual: Open, High, Low, Close, Volume en un timestamp dado.
    """
    dataset = models.ForeignKey(
        PriceDataset, on_delete=models.CASCADE, related_name='velas'
    )
    timestamp = models.DateTimeField()
    open = models.DecimalField(max_digits=20, decimal_places=8)
    high = models.DecimalField(max_digits=20, decimal_places=8)
    low = models.DecimalField(max_digits=20, decimal_places=8)
    close = models.DecimalField(max_digits=20, decimal_places=8)
    volume = models.DecimalField(max_digits=24, decimal_places=8, default=0)

    class Meta:
        ordering = ['timestamp']
        unique_together = ('dataset', 'timestamp')
        verbose_name = 'Vela OHLCV'
        verbose_name_plural = 'Velas OHLCV'
        indexes = [
            models.Index(fields=['dataset', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.dataset.asset_symbol} @ {self.timestamp:%Y-%m-%d %H:%M}"


class PatternDetection(models.Model):
    """
    Un patrón de velas detectado en un registro OHLCV específico.
    """
    TIPO_PATRON_CHOICES = [
        ('hammer', 'Hammer (martillo)'),
        ('inverted_hammer', 'Inverted hammer'),
        ('doji', 'Doji'),
        ('bullish_engulfing', 'Bullish engulfing'),
        ('bearish_engulfing', 'Bearish engulfing'),
        ('morning_star', 'Morning star'),
        ('evening_star', 'Evening star'),
    ]

    dataset = models.ForeignKey(
        PriceDataset, on_delete=models.CASCADE, related_name='patrones'
    )
    vela = models.ForeignKey(
        OHLCVRecord, on_delete=models.CASCADE, related_name='patrones_detectados'
    )
    tipo_patron = models.CharField(max_length=30, choices=TIPO_PATRON_CHOICES)
    confianza = models.FloatField(
        default=1.0,
        help_text="Valor entre 0 y 1 indicando qué tan bien calza la vela con la definición del patrón"
    )
    fecha_deteccion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['vela__timestamp']
        verbose_name = 'Patrón detectado'
        verbose_name_plural = 'Patrones detectados'

    def __str__(self):
        return f"{self.get_tipo_patron_display()} en {self.vela}"


class NewsItem(models.Model):
    """
    Noticia relacionada a un activo cripto. Placeholder hasta conectar
    CryptoPanic / NewsAPI con una key real.
    """
    SENTIMIENTO_CHOICES = [
        ('positive', 'Positivo'),
        ('negative', 'Negativo'),
        ('neutral', 'Neutral'),
        ('unknown', 'Desconocido'),
    ]

    asset_symbol = models.CharField(max_length=20)
    titular = models.CharField(max_length=500)
    fuente = models.CharField(max_length=200, blank=True)
    url = models.URLField(blank=True)
    fecha_publicacion = models.DateTimeField()
    sentimiento = models.CharField(
        max_length=10, choices=SENTIMIENTO_CHOICES, default='unknown'
    )
    fecha_importacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = 'Noticia'
        verbose_name_plural = 'Noticias'

    def __str__(self):
        return f"[{self.asset_symbol}] {self.titular[:60]}"
