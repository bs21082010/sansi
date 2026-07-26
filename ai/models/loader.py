import os
from pathlib import Path

MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/app/models"))


class ModelLoader:
    def __init__(self):
        self.models: dict[str, object] = {}

    def list_available(self) -> list[str]:
        if not MODEL_DIR.exists():
            return []
        return [f.name for f in MODEL_DIR.iterdir() if f.suffix in (".gguf", ".bin", ".safetensors")]

    def load(self, model_name: str):
        path = MODEL_DIR / model_name
        if not path.exists():
            raise FileNotFoundError(f"Model not found: {path}")
        self.models[model_name] = {"path": str(path), "loaded": True}
        return self.models[model_name]

    def unload(self, model_name: str):
        self.models.pop(model_name, None)


loader = ModelLoader()
