from rest_framework import serializers
from .models import Project
from django.contrib.auth.models import User


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for listing projects with basic info."""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    file_count = serializers.IntegerField(read_only=True)
    folder_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'owner_username', 'visibility', 
                  'default_language', 'file_count', 'folder_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'file_count', 'folder_count')


class ProjectSerializer(serializers.ModelSerializer):
    """Full serializer for project details."""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    file_count = serializers.IntegerField(read_only=True)
    folder_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'owner', 'owner_username', 'owner_email',
                  'visibility', 'default_language', 'file_count', 'folder_count',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'owner', 'owner_username', 'owner_email', 
                          'created_at', 'updated_at', 'file_count', 'folder_count')
    
    def validate_name(self, value):
        """Validate project name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Project name cannot be empty.")
        return value.strip()
