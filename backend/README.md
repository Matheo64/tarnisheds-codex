# Backend · Tarnished's Codex

Proyecto Django. Modelos: `Categoria`, `Capa`, `Registro` (objeto), y `Marcador` (pin, con fase de misión).
Las plantillas, el CSS, el JS y las imágenes viven en `../frontend/` (Django las lee desde ahí).

## Puesta en marcha (Windows, PowerShell)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py cargar_catalogo      # consulta la API y carga los 20 objetos (necesita internet)
python manage.py createsuperuser      # tu usuario administrador
python manage.py runserver
```

- Sitio: http://127.0.0.1:8000/
- Administración: http://127.0.0.1:8000/admin/

`python manage.py cargar_catalogo --offline` carga el catálogo sin consultar la API (usa textos de respaldo).
Si algún objeto no se encuentra en la API, el comando lo lista; corrige el campo `buscar` en `codex/data/catalogo.json` y vuelve a ejecutarlo.
El comando no pisa los pines que ya hayas colocado.

## Roles

- **Administrador:** entra en `/admin/`. Crea/edita/borra categorías y objetos, y coloca pines en **Marcadores → Añadir**: eliges la capa y haces clic sobre la imagen (X e Y se rellenan solos).
  Un objeto con varias ubicaciones (p. ej. Blaidd) tiene un marcador por fase: se distinguen con `fase` y `orden`.
- **Usuario:** usa el sitio público (mapa, búsqueda, filtros, detalle). No necesita cuenta.

## Colocar pines desde el mapa (solo superusuario)

Inicia sesión en `/admin/` con tu superusuario y vuelve a `/`. Elige **cualquier objeto** (por categoría o buscándolo)
y, en el cuadro «Administrador» de su ficha:

- **Colocar pin en el mapa** (si aún no tiene) o **Mover el pin**: haz clic en el mapa. Para un pin subterráneo, cambia primero a su capa.
- **Añadir otra ubicación**: escribe el nombre de la fase y haz clic; así se crean las fases de una misión.
- **Eliminar este pin**: se pulsa dos veces para confirmar.
- `Esc` cancela. Los pines guardados así quedan como verificados.

Los usuarios normales no ven estas herramientas y el servidor rechaza sus peticiones (403).

## Pines por verificar

Los pines de ejemplo se colocaron a ojo (`verificado = No`). Revísalos en
Admin → Registros (filtro «Por verificar») y marca «verificado» cuando coincidan con el juego.

## Variables de entorno (producción)

`SECRET_KEY`, `DEBUG=0`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `DB_PATH` (opcional).
Comando de arranque: `gunicorn tarnished.wsgi` (antes: `python manage.py collectstatic --noinput`).
