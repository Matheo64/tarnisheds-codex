from django.db import migrations

# Descripciones traducidas al español (la API de Elden Ring las devuelve en inglés).
DESCRIPCIONES = {
    "godrick-the-grafted": "Godrick el Injertado es el gobernante del castillo de Stormveil y empuña una gran hacha dorada. Se ha injertado muchos brazos en el cuerpo, símbolo de poder para quienes intenten derrocarlo.",
    "mimic-tear": "Un ser excéntrico capaz de adoptar la forma completa de su adversario, desde los rasgos corporales hasta el armamento.",
    "starscourge-radahn": "El general Radahn está maldito y condenado a vagar para siempre. Devorado desde dentro por la podredumbre escarlata de Malenia, hace tiempo que perdió el juicio. Ahora reúne los cadáveres de antiguos amigos y enemigos por igual y se ceba con ellos, como un perro.",
    "malenia-blade-of-miquella": "...Escucha mis palabras. Soy Malenia, la Espada de Miquella. Y jamás he conocido la derrota.",
    "uchigatana": "Una katana de hoja larga, curva y de un solo filo. Arma singular que empuñan los samuráis de la Tierra de las Cañas. La hoja, de diseño ondulado, posee un filo extraordinario y sus tajos provocan pérdida de sangre.",
    "moonveil": "Katana forjada con glintstone. Obra maestra de un forjador de palabras de Sellia. La luz envuelve la hoja cuando está envainada, lo que explica su nombre, Moonveil.",
    "rivers-of-blood": "Arma de Okina, espadachín de la Tierra de las Cañas. Un arma maldita que ha abatido a incontables hombres. Cuando Mohg, el Señor de la Sangre, sintió por primera vez en su carne la espada y la locura de Okina, le hizo una propuesta: ofrecerle la vida de un demonio cuya sed jamás quedaría saciada.",
    "raging-wolf-armor": "Armadura que vistió Vargram el Lobo Furioso, uno de los primeros Tarnished en llegar a la Roundtable Hold.",
    "carian-knights-shield": "Escudo en forma de lágrima con incrustaciones de glintstones azules. Lo portaban los caballeros que servían a la familia real de Carian. Destaca frente a ataques mágicos o sagrados. ¿Con quién se preparaban a luchar esos caballeros?",
    "radagons-soreseal": "Este legendario talismán es un ojo grabado con una Runa del Elden; se dice que es el sello del rey consorte Radagon.",
    "erdtrees-favor": "Talismán que representa una bendición especial del Erdtree. Aumenta ligeramente los PV máximos, la resistencia y la carga de equipo.",
    "lions-claw": "Esta Ceniza de Guerra concede a un arma la afinidad Pesada y la siguiente habilidad: «Lion's Claw: habilidad de los Redmane, que lucharon junto al general Radahn. Da una voltereta hacia delante y golpea a los enemigos con el arma». Se puede usar en espadas, hachas y martillos (excepto armas pequeñas y espadas de estocada).",
    "mimic-tear-ashes": "Restos de ceniza legendarios. Sirven para invocar el espíritu de un Mimic Tear. La invocación consume PV en lugar de PC.",
    "comet-azur": "Hechicería legendaria ideada por Azur, hechicero primigenio. Dispara un cometa colosal en un torrente similar a la lejana extensión estrellada, el lugar donde se dice que se originó la glintstone. Mantén pulsado para seguir liberando el poder de la hechicería. Cuando Azur se asomó a la corriente primigenia, solo vio oscuridad. Quedó hechizado y a la vez aterrado por el abismo.",
    "golden-seed": "Una semilla dorada, hallada en la base de un árbol ilusorio.",
}


def traducir(apps, schema_editor):
    Registro = apps.get_model("codex", "Registro")
    for slug, texto in DESCRIPCIONES.items():
        Registro.objects.filter(slug=slug).update(descripcion=texto)


class Migration(migrations.Migration):
    dependencies = [("codex", "0003_imagenes_propias")]
    operations = [migrations.RunPython(traducir, migrations.RunPython.noop)]
