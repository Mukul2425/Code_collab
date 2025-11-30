from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    current_user_view,
    change_password_view,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Profile
    path('me/', current_user_view, name='current_user'),
    path('profile/', ProfileView.as_view(), name='user_profile'),
    path('change-password/', change_password_view, name='change_password'),
]
