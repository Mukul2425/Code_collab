"""
Django settings for config project.

This file now imports from the settings package structure.
For development, it uses settings.development (default)
For production, set ENVIRONMENT=prod in .env file
"""

# Import from the new settings package structure
# The settings/__init__.py will determine which settings to load
from .settings import *
