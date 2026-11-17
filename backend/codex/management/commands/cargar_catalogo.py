"""Carga el catálogo inicial (~20 objetos) desde la API y deja los pines de ejemplo.

Uso:
    python manage.py cargar_catalogo            # consulta la API
    python manage.py cargar_catalogo --offline  # sin red: usa los textos de respaldo

Es una herramienta de desarrollo, no una función del sitio. No pisa los pines que ya hayas
colocado desde el admin: solo crea los de ejemplo si el objeto aún no tiene ninguno.
"""
import json
import unicodedata
from pathlib import Path

import requests
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from codex.models import Capa, Categoria, Marcador, Registro

API = "https://eldenring.fanapis.com/api"
DATA = Path(__file__).resolve().parents[2] / "data" / "catalogo.json"


def norm(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().replace("’", "'")


def consultar(endpoint, buscar):
    """Devuelve el primer elemento de la API cuyo nombre coincide, o None."""
    clave = norm(buscar)
    params = [{"name": buscar, "limit": 100}] + [{"limit": 100, "page": p} for p in range(0, 5)]
    for pr in params:
        r = requests.get(f"{API}/{endpoint}", params=pr, timeout=15)
        r.raise_for_status()
        datos = r.json().get("data", [])
        exactos = [d for d in datos if norm(d.get("name", "")) == clave]
        parecidos = [d for d in datos if clave in norm(d.get("name", ""))]
        if exactos or parecidos:
            return (exactos or parecidos)[0]
        if len(datos) < pr["limit"] and "page" in pr:
            break
    return None


class Command(BaseCommand):
    help = "Carga capas, categorías y los ~20 objetos del catálogo."

    def add_arguments(self, parser):
        parser.add_argument("--offline", action="store_true", help="No consultar la API.")

    def handle(self, *args, **opts):
        cat = json.loads(DATA.read_text(encoding="utf-8"))
        capas = {}
        for c in cat["capas"]:
            capas[c["slug"]], _ = Capa.objects.update_or_create(slug=c["slug"], defaults={k: v for k, v in c.items() if k != "slug"})
        cats = {}
        for g in [c for c in cat["categorias"] if not c["padre"]] + [c for c in cat["categorias"] if c["padre"]]:
            cats[g["slug"]], _ = Categoria.objects.update_or_create(slug=g["slug"], defaults=dict(
                nombre=g["nombre"], padre=cats.get(g["padre"]), pin=g["pin"], endpoint_api=g["endpoint"], orden=g["orden"]))
        faltan, hechos = [], 0
        for item in cat["registros"]:
            api = None
            if not opts["offline"]:
                try:
                    api = consultar(item["endpoint"], item["buscar"])
                except requests.RequestException as e:
                    self.stderr.write(f"  ! API no disponible ({e.__class__.__name__}); sigo con los textos de respaldo.")
                    opts["offline"] = True
            if not api and not opts["offline"]:
                faltan.append(item["nombre"])
            api = api or {}
            reg, _ = Registro.objects.update_or_create(slug=slugify(item["nombre"])[:160], defaults=dict(
                nombre=api.get("name") or item["nombre"],
                categoria=cats[item["categoria"]],
                descripcion=api.get("description") or item["descripcion_respaldo"],
                imagen_url=api.get("image") or "",
                imagen_local=item.get("imagen_local", ""),
                ubicacion_texto=api.get("location") or "",
                api_id=api.get("id", ""),
                datos=api,
            ))
            if not reg.marcadores.exists():
                for i, m in enumerate(item["marcadores"], 1):
                    Marcador.objects.create(registro=reg, capa=capas[m["capa"]], x=m["x"], y=m["y"],
                                            fase=m["fase"], orden=m.get("orden", i), verificado=False)
            hechos += 1
            self.stdout.write(f"  ✓ {reg.nombre}" + ("" if api else "  (sin datos de la API)"))
        self.stdout.write(self.style.SUCCESS(f"{hechos} objetos cargados."))
        if faltan:
            self.stdout.write(self.style.WARNING("No encontrados en la API (revisa el campo 'buscar' en data/catalogo.json):\n  - " + "\n  - ".join(faltan)))
