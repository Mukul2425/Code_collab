from rest_framework import serializers
from .models import Version

class VersionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Version
        fields = ['id', 'file', 'content', 'created_by', 'created_by_username', 'created_at', 'description']
        read_only_fields = ['created_at', 'created_by']
