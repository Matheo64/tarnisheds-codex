import json

from django.db.models import Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.templatetags.static import static
from django.views.decorators.http import require_POST

from .models import Capa, Categoria, Marcador, Registro


def datos_mapa(es_admin=False):
    """Todo lo que necesita el mapa. El catálogo es pequeño (~20 objetos), así que
    se envía completo y el filtrado/búsqueda ocurre en el navegador, al instante."""
    capas = list(Capa.objects.all())
    cats = list(Categoria.objects.select_related("padre"))
    regs = Registro.objects.select_related("categoria__padre").prefetch_related("marcadores__capa")
    out_regs = []
    for r in regs:
        c = r.categoria
        grupo = c.padre or c
        out_regs.append({
            "slug": r.slug,
            "nombre": r.nombre,
            "categoria": c.slug,
            "categoria_nombre": c.nombre,
            "grupo": grupo.slug,
            "pin": c.pin_efectivo,
            "descripcion": r.descripcion[:280],
            "imagen": r.imagen_src,
            "ubicacion": r.ubicacion_texto,
            "marcadores": [
                {"id": m.pk, "capa": m.capa.slug, "x": m.x, "y": m.y, "fase": m.fase, "orden": m.orden}
                for m in r.marcadores.all()
            ],
        })
    return {
        "es_admin": es_admin,
        "capas": [{"slug": c.slug, "nombre": c.nombre, "url": static(c.imagen), "ancho": c.ancho,
                   "alto": c.alto, "subterranea": c.subterranea} for c in capas],
        "categorias": [{"slug": c.slug, "nombre": c.nombre, "padre": c.padre.slug if c.padre_id else None,
                        "pin": c.pin_efectivo} for c in cats],
        "registros": out_regs,
    }


def mapa(request):
    return render(request, "mapa.html", {"datos": datos_mapa(request.user.is_superuser)})


def api_mapa(request):
    return JsonResponse(datos_mapa(request.user.is_superuser))


def registro_detalle(request, slug):
    r = get_object_or_404(Registro.objects.select_related("categoria__padre"), slug=slug)
    return render(request, "registro.html", {"r": r, "marcadores": r.marcadores.select_related("capa")})


def acerca(request):
    return render(request, "acerca.html")


def _marcadores_json(registro):
    return [{"id": m.pk, "capa": m.capa.slug, "x": m.x, "y": m.y, "fase": m.fase, "orden": m.orden}
            for m in registro.marcadores.select_related("capa")]


@require_POST
def api_marcador(request):
    """Solo superusuarios. Acciones: crear, mover, borrar un marcador desde el mapa.

    Cuerpo JSON: {"accion": "crear"|"mover"|"borrar", "registro": slug, "capa": slug,
                  "x": 0-100, "y": 0-100, "fase": texto, "id": id_del_marcador}
    """
    if not (request.user.is_authenticated and request.user.is_superuser):
        return JsonResponse({"error": "Solo el superusuario puede hacer esto."}, status=403)
    try:
        d = json.loads(request.body or b"{}")
    except ValueError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    accion = d.get("accion")
    registro = Registro.objects.filter(slug=d.get("registro")).first()
    if not registro:
        return JsonResponse({"error": "Objeto no encontrado."}, status=404)

    if accion == "borrar":
        n, _ = Marcador.objects.filter(pk=d.get("id"), registro=registro).delete()
        if not n:
            return JsonResponse({"error": "Marcador no encontrado."}, status=404)
        return JsonResponse({"marcadores": _marcadores_json(registro)})

    if accion not in ("crear", "mover"):
        return JsonResponse({"error": "Acción desconocida."}, status=400)
    try:
        x, y = float(d["x"]), float(d["y"])
    except (KeyError, TypeError, ValueError):
        return JsonResponse({"error": "Coordenadas inválidas."}, status=400)
    if not (0 <= x <= 100 and 0 <= y <= 100):
        return JsonResponse({"error": "Las coordenadas deben estar entre 0 y 100."}, status=400)
    capa = Capa.objects.filter(slug=d.get("capa")).first()
    if not capa:
        return JsonResponse({"error": "Capa no encontrada."}, status=404)

    if accion == "mover":
        m = Marcador.objects.filter(pk=d.get("id"), registro=registro).first()
        if not m:
            return JsonResponse({"error": "Marcador no encontrado."}, status=404)
        m.capa, m.x, m.y, m.verificado = capa, round(x, 2), round(y, 2), True
        m.save()
    else:
        orden = (registro.marcadores.aggregate(Max("orden"))["orden__max"] or 0) + 1
        Marcador.objects.create(registro=registro, capa=capa, x=round(x, 2), y=round(y, 2),
                                fase=(d.get("fase") or "").strip()[:160], orden=orden, verificado=True)
    return JsonResponse({"marcadores": _marcadores_json(registro)})
