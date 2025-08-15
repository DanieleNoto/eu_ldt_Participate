import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import yaml
from main import app

OPEN_API_VERSION = "3.0.2"
OUTPUT_FILE = "backend-py/api_documentation.yml"


def generate_openapi_schema():
    openapi_schema = app.openapi()
    openapi_schema["openapi"] = OPEN_API_VERSION

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        yaml.dump(openapi_schema, f, allow_unicode=True, default_flow_style=False)


if __name__ == "__main__":
    generate_openapi_schema()
