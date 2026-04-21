import sys
import os

# Add the root directory to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app

# Export the app for Vercel
# Vercel's Python runtime will look for an 'app' instance in this file.
# Since we imported it above, it's already in the global namespace.
