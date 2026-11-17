from django.urls import path

from . import views

urlpatterns = [
    path("", views.mapa, name="mapa"),
    path("api/mapa/", views.api_mapa, name="api_mapa"),
    path("api/marcador/", views.api_marcador, name="api_marcador"),
    path("registro/<slug:slug>/", views.registro_detalle, name="registro"),
    path("acerca/", views.acerca, name="acerca"),
]
