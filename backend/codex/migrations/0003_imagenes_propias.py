from django.db import migrations

IMAGENES = {
    "margit-the-fell-omen": "img/objetos/margit-the-fell-omen.jpg",
    "flame-grant-me-strength": "img/objetos/flame-grant-me-strength.jpg",
}


def poner_imagenes(apps, schema_editor):
    Registro = apps.get_model("codex", "Registro")
    for slug, ruta in IMAGENES.items():
        Registro.objects.filter(slug=slug, imagen_local="").update(imagen_local=ruta)


class Migration(migrations.Migration):
    dependencies = [("codex", "0002_quitar_portal_imagen_local")]
    operations = [migrations.RunPython(poner_imagenes, migrations.RunPython.noop)]
