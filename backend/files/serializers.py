from rest_framework import serializers
from .models import File, Folder


class FolderSerializer(serializers.ModelSerializer):
    """Serializer for Folder model."""
    full_path = serializers.CharField(read_only=True)
    children_count = serializers.SerializerMethodField()
    files_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Folder
        fields = ('id', 'name', 'project', 'parent', 'full_path', 
                  'children_count', 'files_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'full_path',
                          'children_count', 'files_count')
    
    def get_children_count(self, obj):
        """Get number of child folders."""
        return obj.children.count()
    
    def get_files_count(self, obj):
        """Get number of files in folder."""
        return obj.files.count()


class FileListSerializer(serializers.ModelSerializer):
    """Serializer for listing files with basic info."""
    full_path = serializers.CharField(read_only=True)
    line_count = serializers.IntegerField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = File
        # Include content so the frontend gets the latest saved text when listing files
        fields = ('id', 'name', 'path', 'full_path', 'language', 'size',
                  'content', 'line_count', 'created_by_username', 'updated_by_username',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'full_path', 
                          'line_count', 'size')


class FileSerializer(serializers.ModelSerializer):
    """Full serializer for file details."""
    full_path = serializers.CharField(read_only=True)
    line_count = serializers.IntegerField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    
    class Meta:
        model = File
        fields = ('id', 'name', 'path', 'full_path', 'folder', 'folder_name', 'project',
                  'content', 'language', 'encoding', 'size', 'line_count',
                  'created_by', 'created_by_username', 'updated_by', 'updated_by_username',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'path', 'full_path', 'size', 'line_count',
                          'created_at', 'updated_at', 'created_by_username', 'updated_by_username')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the queryset for project field based on request user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from projects.models import Project
            # Update the project field's queryset
            if 'project' in self.fields:
                self.fields['project'].queryset = Project.objects.filter(owner=request.user)
    
    def validate_name(self, value):
        """Validate file name."""
        if not value or not value.strip():
            raise serializers.ValidationError("File name cannot be empty.")
        # Check for invalid characters
        invalid_chars = ['<', '>', ':', '"', '|', '?', '*']
        for char in invalid_chars:
            if char in value:
                raise serializers.ValidationError(f"File name cannot contain '{char}'")
        return value.strip()
    
    def create(self, validated_data):
        """Create file and set created_by."""
        # Ensure project is set
        if 'project' not in validated_data or not validated_data['project']:
            raise serializers.ValidationError({'project': 'Project is required.'})
        
        validated_data['created_by'] = self.context['request'].user
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update file and set updated_by."""
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)
