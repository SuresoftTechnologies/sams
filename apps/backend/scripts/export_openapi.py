#!/usr/bin/env python3
"""
Export OpenAPI specification from FastAPI application.

This script generates the openapi.json file that will be consumed by
the @ams/api-client package for TypeScript type generation.
"""

import json
import sys
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.main import app


def export_openapi() -> None:
    """Export OpenAPI spec to packages/api-client/openapi.json"""

    # Get OpenAPI schema from FastAPI
    openapi_schema = app.openapi()

    # Output path - relative to backend app
    output_path = Path(__file__).parent.parent.parent.parent / "packages" / "api-client" / "openapi.json"

    # Ensure directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write OpenAPI spec
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

    print(f"✅ OpenAPI spec exported successfully!")
    print(f"   Output: {output_path}")
    print(f"   Title: {openapi_schema['info']['title']}")
    print(f"   Version: {openapi_schema['info']['version']}")
    print(f"   Paths: {len(openapi_schema['paths'])} endpoints")
    print(f"   Schemas: {len(openapi_schema.get('components', {}).get('schemas', {}))} models")


if __name__ == "__main__":
    export_openapi()
