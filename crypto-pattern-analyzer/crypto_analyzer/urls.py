from django.urls import path
from .views import (
    PriceDatasetUploadView,
    PriceDatasetListView,
    DatasetPatternsView,
    DatasetIndicatorsView,
    DatasetNewsContextView,
    PriceDatasetCCXTFetchView,
    LoadExampleDatasetView,
    DatasetCCXTUpdateView,
)

urlpatterns = [
    path('datasets/', PriceDatasetListView.as_view(), name='dataset-list'),
    path('datasets/upload/', PriceDatasetUploadView.as_view(), name='dataset-upload'),
    path('datasets/fetch-ccxt/', PriceDatasetCCXTFetchView.as_view(), name='dataset-fetch-ccxt'),
    path('datasets/load-example/', LoadExampleDatasetView.as_view(), name='load-example'),
    path('datasets/<int:dataset_id>/patterns/', DatasetPatternsView.as_view(), name='dataset-patterns'),
    path('datasets/<int:dataset_id>/indicators/', DatasetIndicatorsView.as_view(), name='dataset-indicators'),
    path('datasets/<int:dataset_id>/news-context/', DatasetNewsContextView.as_view(), name='dataset-news-context'),
    path('datasets/<int:dataset_id>/update-ccxt/', DatasetCCXTUpdateView.as_view(), name='dataset-update-ccxt'),
]
