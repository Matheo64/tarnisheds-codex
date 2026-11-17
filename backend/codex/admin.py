from django.contrib import admin
from django.templatetags.static import static

from .models import Capa, Categoria, Marcador, Registro


class SinUbicarFilter(admin.SimpleListFilter):
    title = "ubicación"
    parameter_name = "ubicacion"

    def lookups(self, request, model_admin):
        return [("sin", "Sin ubicar"), ("pendiente", "Por verificar"), ("ok", "Verificados")]

    def queryset(self, request, qs):
        v = self.value()
        if v == "sin":
            return qs.filter(marcadores__isnull=True)
        if v == "pendiente":
            return qs.filter(marcadores__verificado=False).distinct()
        if v == "ok":
            return qs.filter(marcadores__isnull=False).exclude(marcadores__verificado=False).distinct()
        return qs


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "padre", "pin", "endpoint_api", "orden")
    list_filter = ("padre",)
    prepopulated_fields = {"slug": ("nombre",)}


@admin.register(Capa)
class CapaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "subterranea", "ancho", "alto", "orden")


class MarcadorInline(admin.TabularInline):
    model = Marcador
    extra = 0
    fields = ("capa", "fase", "orden", "x", "y", "verificado")


@admin.register(Registro)
class RegistroAdmin(admin.ModelAdmin):
    list_display = ("nombre", "categoria", "n_pines", "estado")
    list_filter = ("categoria", SinUbicarFilter)
    search_fields = ("nombre", "descripcion")
    prepopulated_fields = {"slug": ("nombre",)}
    inlines = [MarcadorInline]

    @admin.display(description="Pines")
    def n_pines(self, obj):
        return obj.marcadores.count()

    @admin.display(description="Estado")
    def estado(self, obj):
        m = list(obj.marcadores.all())
        if not m:
            return "⚠ sin ubicar"
        return "✓ verificado" if all(x.verificado for x in m) else "· por verificar"


@admin.register(Marcador)
class MarcadorAdmin(admin.ModelAdmin):
    """Formulario con el mapa: se hace clic sobre la imagen para fijar X e Y."""

    list_display = ("registro", "fase", "orden", "capa", "x", "y", "verificado")
    list_filter = ("capa", "verificado")
    search_fields = ("registro__nombre", "fase")
    autocomplete_fields = ("registro",)
    change_form_template = "admin/codex/marcador/change_form.html"

    def render_change_form(self, request, context, *args, **kwargs):
        context["capas_json"] = ({
            str(c.pk): {"nombre": c.nombre, "url": static(c.imagen), "ancho": c.ancho, "alto": c.alto}
            for c in Capa.objects.all()
        })
        return super().render_change_form(request, context, *args, **kwargs)
