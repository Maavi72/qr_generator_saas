from django.urls import path
from .views import RegisterView, LoginView, ProfileView, ProfileUpdateView, ConfirmUpgradeView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),

    path('profile/', ProfileView.as_view()),
    path('accounts/me/', ProfileView.as_view()),
    path('profile/update/', ProfileUpdateView.as_view()),
    path('accounts/confirm-upgrade/', ConfirmUpgradeView.as_view()),
]