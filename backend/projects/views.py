from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Project
from .serializers import ProjectSerializer, ProjectListSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project CRUD operations."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get projects owned by user, with optional search/filter."""
        queryset = Project.objects.filter(owner=self.request.user)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Filter by visibility
        visibility = self.request.query_params.get('visibility', None)
        if visibility:
            queryset = queryset.filter(visibility=visibility)
        
        # Filter by language
        language = self.request.query_params.get('language', None)
        if language:
            queryset = queryset.filter(default_language=language)
        
        return queryset.select_related('owner').prefetch_related('files')

    def get_serializer_class(self):
        """Use different serializers for list vs detail."""
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        """Set owner when creating project."""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get project statistics."""
        project = self.get_object()
        return Response({
            'file_count': project.file_count,
            'folder_count': project.folder_count,
            'total_size': sum(f.size for f in project.files.all()),
            'languages': list(project.files.values_list('language', flat=True).distinct()),
        })
