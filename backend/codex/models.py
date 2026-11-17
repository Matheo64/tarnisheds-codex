from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.templatetags.static import static
from django.utils.text import slugify

PINES = [
    ("boss", "Jefe"),
    ("weapon", "Equipo / arma"),
    ("talisman", "Talismán"),
    ("npc", "NPC"),
    ("item", "Objeto / otro"),
]
PORCENTAJE = [MinValueValidator(0), MaxValueValidator(100)]


class Categoria(models.Model):
    """Grupo (Equipo, Jefes…) o subcategoría (Armas, Talismanes…)."""

    nombre = models.CharField(max_length=80)
    slug = models.SlugField(unique=True)
    padre = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE,
                              related_name="hijas", help_text="Vacío = grupo principal.")
    pin = models.CharField("Color del pin", max_length=10, choices=PINES, blank=True,
                           help_text="Vacío = hereda el del grupo.")
    endpoint_api = models.CharField("Recurso de la API", max_length=30, blank=True,
                                    help_text="Ej.: weapons, bosses, npcs.")
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["orden", "nombre"]

    def __str__(self):
        return f"{self.padre.nombre} › {self.nombre}" if self.padre_id else self.nombre

    @property
    def pin_efectivo(self):
        return self.pin or (self.padre.pin if self.padre_id else "") or "item"


class Capa(models.Model):
    """Una imagen de mapa: la superficie o una de las 3 capas subterráneas."""

    nombre = models.CharField(max_length=80)
    slug = models.SlugField(unique=True)
    imagen = models.CharField(max_length=200, help_text="Ruta estática, ej.: img/mapas/web/superficie.jpg")
    ancho = models.PositiveIntegerField(help_text="Ancho en px de la imagen web.")
    alto = models.PositiveIntegerField(help_text="Alto en px de la imagen web.")
    subterranea = models.BooleanField(default=False)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return self.nombre


class Registro(models.Model):
    """Un objeto del catálogo (arma, jefe, NPC…)."""

    nombre = models.CharField(max_length=150)
    slug = models.SlugField(unique=True, max_length=160)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="registros")
    descripcion = models.TextField(blank=True)
    imagen_url = models.URLField(blank=True)
    imagen_local = models.CharField("Imagen propia", max_length=200, blank=True,
                                    help_text="Ruta estática, ej.: img/objetos/margit-the-fell-omen.jpg. Si se llena, se usa en vez de la de la API.")
    ubicacion_texto = models.TextField("Ubicación (texto)", blank=True,
                                       help_text="Texto de la API; guía para colocar el pin.")
    api_id = models.CharField(max_length=60, blank=True)
    datos = models.JSONField(default=dict, blank=True, help_text="Respuesta original de la API.")

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre

    @property
    def imagen_src(self):
        return static(self.imagen_local) if self.imagen_local else self.imagen_url

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)[:160]
        super().save(*args, **kwargs)


class Marcador(models.Model):
    """Un pin. Un registro puede tener varios: uno por fase de misión o aparición."""

    registro = models.ForeignKey(Registro, on_delete=models.CASCADE, related_name="marcadores")
    capa = models.ForeignKey(Capa, on_delete=models.PROTECT, related_name="marcadores")
    x = models.FloatField("X (%)", validators=PORCENTAJE, help_text="0 = borde izquierdo, 100 = derecho.")
    y = models.FloatField("Y (%)", validators=PORCENTAJE, help_text="0 = borde superior, 100 = inferior.")
    fase = models.CharField(max_length=160, blank=True,
                            help_text="Ej.: «Mistwood Ruins». Vacío si solo tiene una ubicación.")
    orden = models.PositiveSmallIntegerField(default=1, help_text="Orden de la fase (1, 2, 3…).")
    verificado = models.BooleanField(default=False, help_text="Marca cuando compruebes la posición en el juego.")

    class Meta:
        ordering = ["registro", "orden"]

    def __str__(self):
        return f"{self.registro} · {self.fase or 'ubicación'} ({self.capa})"
