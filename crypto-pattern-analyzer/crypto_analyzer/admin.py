from django.contrib import admin
from .models import PriceDataset, OHLCVRecord, PatternDetection, NewsItem


class OHLCVRecordInline(admin.TabularInline):
    model = OHLCVRecord
    extra = 0
    fields = ('timestamp', 'open', 'high', 'low', 'close', 'volume')
    ordering = ('timestamp',)


@admin.register(PriceDataset)
class PriceDatasetAdmin(admin.ModelAdmin):
    list_display = ('asset_symbol', 'timeframe', 'nombre_archivo', 'fecha_carga', 'total_velas')
    list_filter = ('asset_symbol', 'timeframe')
    readonly_fields = ('fecha_carga',)

    def total_velas(self, obj):
        return obj.velas.count()
    total_velas.short_description = 'Velas cargadas'


@admin.register(OHLCVRecord)
class OHLCVRecordAdmin(admin.ModelAdmin):
    list_display = ('dataset', 'timestamp', 'open', 'high', 'low', 'close', 'volume')
    list_filter = ('dataset',)
    date_hierarchy = 'timestamp'


@admin.register(PatternDetection)
class PatternDetectionAdmin(admin.ModelAdmin):
    list_display = ('dataset', 'vela', 'tipo_patron', 'confianza', 'fecha_deteccion')
    list_filter = ('tipo_patron', 'dataset')


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ('asset_symbol', 'titular', 'fuente', 'sentimiento', 'fecha_publicacion')
    list_filter = ('asset_symbol', 'sentimiento')
    search_fields = ('titular',)
