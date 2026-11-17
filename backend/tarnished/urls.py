from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Tarnished’s Codex · Administración"
admin.site.site_title = "Tarnished’s Codex"
admin.site.index_title = "Catálogo, capas y marcadores"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("codex.urls")),
]
