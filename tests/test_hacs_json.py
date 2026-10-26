"""Tests for the HACS files."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_hacs_json_shape() -> None:
    data = json.loads((ROOT / "hacs.json").read_text())
    assert data["name"] == "Hverdagsro"
    assert data["homeassistant"] == "2026.3.0"


def test_single_integration_manifest() -> None:
    """HACS finds the integration by the only file named *manifest.json in the repository."""
    manifests = [p for p in ROOT.rglob("*manifest.json") if ".git" not in p.parts and "node_modules" not in p.parts]
    assert [p.relative_to(ROOT).as_posix() for p in manifests] == ["custom_components/hverdagsro/manifest.json"]


def test_translations_match() -> None:
    """The Danish and English translations have the same keys."""

    def keys(data: object, prefix: str = "") -> set[str]:
        if isinstance(data, dict):
            return set().union(*(keys(value, f"{prefix}.{key}") for key, value in data.items())) | {prefix}
        return {prefix}

    folder = ROOT / "custom_components/hverdagsro/translations"
    english = json.loads((folder / "en.json").read_text())
    danish = json.loads((folder / "da.json").read_text())
    assert keys(english) == keys(danish)
