from decouple import config

# Determine which settings to use based on environment
ENVIRONMENT = config('ENVIRONMENT', default='dev')

if ENVIRONMENT == 'prod':
    from .production import *
else:
    from .development import *


