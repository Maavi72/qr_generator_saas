from django.urls import path
from .views import (
    CreateDynamicQRView,
    CreateStaticQRView,
    QRListView,
    QRSingleView,
    UpdateQRRedirectView,
    AnalyticsView,
    QRDebugView,
    redirect_qr,
)

urlpatterns = [
    path('', QRListView.as_view(), name='qr-list'),
    path('<int:pk>/', QRSingleView.as_view(), name='qr-detail'),
    path('<int:pk>/analytics/', AnalyticsView.as_view(), name='qr-analytics'),
    path('create-static/', CreateStaticQRView.as_view(), name='create-static-qr'),
    path('create-dynamic/', CreateDynamicQRView.as_view(), name='create-dynamic-qr'),
    path('<int:pk>/update-url/', UpdateQRRedirectView.as_view(), name='update-url'),
    path('debug/', QRDebugView.as_view(), name='qr-debug'),
    path('r/<uuid:unique_id>/', redirect_qr, name='redirect-qr'),
]
