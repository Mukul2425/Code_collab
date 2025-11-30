from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import FileViewSet, FolderViewSet

# File router
file_router = DefaultRouter()
file_router.register(r'', FileViewSet, basename='file')

# Folder router
folder_router = DefaultRouter()
folder_router.register(r'', FolderViewSet, basename='folder')

urlpatterns = [
    path('', include(file_router.urls)),
    path('folders/', include(folder_router.urls)),
]
