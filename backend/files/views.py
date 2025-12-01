from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import File, Folder
from versions.models import Version
from .serializers import FileSerializer, FileListSerializer, FolderSerializer
from projects.models import Project


class FolderViewSet(viewsets.ModelViewSet):
    """ViewSet for Folder CRUD operations."""
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get folders for user's projects."""
        project_id = self.request.query_params.get('project', None)
        if project_id:
            return Folder.objects.filter(
                project_id=project_id,
                project__owner=self.request.user
            )
        return Folder.objects.filter(project__owner=self.request.user)

    def perform_create(self, serializer):
        """Validate project ownership before creating folder."""
        project_id = serializer.validated_data.get('project').id
        project = get_object_or_404(Project, id=project_id, owner=self.request.user)
        serializer.save()


class FileViewSet(viewsets.ModelViewSet):
    """ViewSet for File CRUD operations."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get files for user's projects with filtering."""
        queryset = File.objects.filter(project__owner=self.request.user)
        
        # Filter by project
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by folder
        folder_id = self.request.query_params.get('folder', None)
        if folder_id:
            queryset = queryset.filter(folder_id=folder_id)
        elif folder_id == '':  # Empty string means root (no folder)
            queryset = queryset.filter(folder__isnull=True)
        
        # Filter by language
        language = self.request.query_params.get('language', None)
        if language:
            queryset = queryset.filter(language=language)
        
        # Search by name or path
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(path__icontains=search)
            )
        
        return queryset.select_related('project', 'folder', 'created_by', 'updated_by')

    def get_serializer_class(self):
        """Use different serializers for list vs detail."""
        if self.action == 'list':
            return FileListSerializer
        return FileSerializer

    def perform_create(self, serializer):
        """Set created_by and updated_by when creating file."""
        # Project ownership is validated by the serializer's queryset
        # created_by and updated_by are set in the serializer's create method
        serializer.save()

    def perform_update(self, serializer):
        """Set updated_by when updating file and create a snapshot if content changed."""
        instance = self.get_object()
        old_content = instance.content

        # Let DRF validate and update the instance
        file_obj = serializer.save(updated_by=self.request.user)

        # If content was part of the update and actually changed, create a Version snapshot
        if 'content' in serializer.validated_data and old_content != file_obj.content:
            Version.objects.create(
                file=file_obj,
                content=old_content,
                created_by=self.request.user,
                description="Auto-snapshot before save"
            )

    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        """Rename a file."""
        file = self.get_object()
        new_name = request.data.get('name')
        
        if not new_name:
            return Response(
                {'error': 'Name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if name already exists in same location
        if File.objects.filter(
            project=file.project,
            folder=file.folder,
            name=new_name
        ).exclude(pk=file.pk).exists():
            return Response(
                {'error': 'A file with this name already exists in this location'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file.name = new_name
        file.updated_by = request.user
        file.save()
        
        serializer = self.get_serializer(file)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Move a file to a different folder."""
        file = self.get_object()
        folder_id = request.data.get('folder_id')
        
        if folder_id is None:
            # Move to root
            file.folder = None
        else:
            folder = get_object_or_404(
                Folder, 
                id=folder_id, 
                project=file.project
            )
            file.folder = folder
        
        # Check if name already exists in target location
        if File.objects.filter(
            project=file.project,
            folder=file.folder,
            name=file.name
        ).exclude(pk=file.pk).exists():
            return Response(
                {'error': 'A file with this name already exists in the target location'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file.updated_by = request.user
        file.save()
        
        serializer = self.get_serializer(file)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        """Copy a file to a different location or project."""
        file = self.get_object()
        new_name = request.data.get('name', file.name)
        folder_id = request.data.get('folder_id')
        project_id = request.data.get('project_id', file.project.id)
        
        # Validate project ownership
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        
        # Get folder if provided
        folder = None
        if folder_id:
            folder = get_object_or_404(Folder, id=folder_id, project=project)
        
        # Check if name already exists
        if File.objects.filter(
            project=project,
            folder=folder,
            name=new_name
        ).exists():
            return Response(
                {'error': 'A file with this name already exists in the target location'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create copy
        new_file = File.objects.create(
            project=project,
            name=new_name,
            folder=folder,
            content=file.content,
            language=file.language,
            encoding=file.encoding,
            created_by=request.user,
            updated_by=request.user
        )
        
        serializer = self.get_serializer(new_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get file statistics."""
        file = self.get_object()
        return Response({
            'size': file.size,
            'line_count': file.line_count,
            'language': file.language,
            'encoding': file.encoding,
            'full_path': file.full_path,
        })
