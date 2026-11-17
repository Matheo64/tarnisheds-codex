# Tarnished's Codex

Wiki y mapa interactivo de **Elden Ring** hecho con Django. Se pueden buscar armas, jefes, NPCs y más por nombre o categoría, y ver dónde están en el mapa (superficie y 3 capas subterráneas: Siofra River, Ainsel River y Deeproot Depths). Algunos objetos, como Blaidd, tienen varias ubicaciones según la fase de su misión.

Proyecto final de Programación en la Web (UIS) · Matheo Salamanca (2252262).

## Estructura

- `backend/` — proyecto Django (modelos, vistas, panel de administración, API JSON y comando de carga). Ver `backend/README.md`.
- `frontend/` — plantillas, CSS, JavaScript (Leaflet) e imágenes. `frontend/DESIGN.md` describe el diseño.

## Cómo ejecutarlo

Requiere Python 3.10 o superior. En una terminal, dentro de `backend/`:

```
python -m venv venv
venv\Scripts\activate        # en Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata pines_respaldo.json
python manage.py createsuperuser
python manage.py runserver
```

Después abre http://127.0.0.1:8000/ (sitio) y http://127.0.0.1:8000/admin/ (administración).

`loaddata pines_respaldo.json` carga los 20 objetos del catálogo con sus pines ya colocados, sin necesidad de internet. Como alternativa, `python manage.py cargar_catalogo` consulta la [Elden Ring Fan API](https://eldenring.fanapis.com/) (deja los objetos sin pines).

El sitio carga Leaflet y las tipografías desde internet.

## Roles

- **Usuario:** usa el sitio público (mapa, búsqueda, filtros, ficha). No necesita cuenta.
- **Administrador:** entra con su usuario en `/admin/` y vuelve al mapa; puede crear, editar y borrar categorías y objetos, y colocar, mover o borrar pines con un clic en el mapa.

Proyecto de aficionado, sin relación con FromSoftware ni Bandai Namco. Las imágenes del juego pertenecen a sus dueños.
