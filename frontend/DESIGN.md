---
name: Tarnished's Codex
description: Wiki y mapa interactivo de Elden Ring. Estética antigua, apagada y elegante, con ornamentos dorados sobre fondos oscuros.
colors:
  # Dorados: el medio coincide con el de las diapositivas (#c09850) y con el sitio oficial (rgb 193,157,83)
  gold: "#c19d53"            # marcos, botones, líneas, iconos
  gold-deep: "#8f7a45"       # líneas finas, bordes secundarios
  gold-pale: "#f8e898"       # solo texto resaltado y títulos de contorno (tomado de las diapositivas)
  # Fondos: degradado petróleo → negro azulado de las diapositivas
  teal: "#1c5a64"            # parte superior del degradado
  teal-deep: "#0f3a45"
  night: "#061726"
  black: "#010310"           # parte inferior, fondo base
  # Texto
  ivory: "#e9e2cf"           # texto principal (nunca blanco puro)
  ivory-soft: "#b9b09a"      # texto secundario
  # Marcadores del mapa (apagados, no neón)
  marker-boss: "#c19d53"
  marker-weapon: "#b5694a"
  marker-talisman: "#6fa59b"
  marker-npc: "#8c86c4"
typography:
  display:
    fontFamily: "Cinzel"
    fontWeight: 600
    letterSpacing: "0.12em"
    textTransform: uppercase
  display-ornate:
    fontFamily: "Cinzel Decorative"
    fontWeight: 400
  body:
    fontFamily: "Cormorant Garamond"
    fontSize: 20
    lineHeight: 1.6
  label:
    fontFamily: "Cinzel"
    fontSize: 12
    fontWeight: 600
    letterSpacing: "0.1em"
    textTransform: uppercase
rounded:
  none: 0
  sm: 3
  md: 6
  pill: 999
spacing:
  scale: [4, 8, 16, 24, 40, 64, 96]
components:
  button-primary:
    background: "gradient gold-pale 15% → gold → gold-deep"
    color: black
    font: label
    rounded: sm
  pill:
    background: "gradient gold → gold-deep"
    color: black
    font: label
    rounded: pill
  frame:
    border: "2px solid gold + línea interior de 1px gold-deep a 5px de distancia"
    background: black
  card:
    background: "rgba(1,3,16,.7)"
    border: "frame"
  input:
    background: "rgba(1,3,16,.6)"
    border: "1px solid gold-deep"
    color: ivory
---

## Overview

Tarnished's Codex es un compendio de las Tierras Intermedias: una enciclopedia que se siente como un libro antiguo, no como una aplicación moderna. La estética es **antigua, apagada y elegante, con mucho ornamento**. Todo lo que brilla en el juego, aquí se oxida un poco: el oro es envejecido, el texto es marfil y no blanco, y las sombras son profundas, sin resplandores de neón.

Las referencias son las diapositivas del curso (degradado petróleo a negro, marcos y etiquetas doradas, títulos en letras de contorno) y la página oficial de Elden Ring de Bandai Namco (acento dorado, cabecera a todo ancho, divisores en forma de hoja, una pluma como adorno).

La página debe leerse primero como solemne y después como útil: el buscador y el mapa son los protagonistas, el ornamento los acompaña y nunca los tapa.

## Colors

- **Fondo:** degradado vertical de `teal` a `night` y a `black`. Las secciones largas terminan siempre en `black`.
- **Dorado (`gold`):** es el color de la marca. Se usa en marcos, botones, líneas finas, iconos y subrayados. Es el mismo tono de las diapositivas y del sitio oficial.
- **Dorado pálido (`gold-pale`):** solo para texto que debe destacar (palabras clave, título de contorno). Nunca como relleno de botones ni de fondos.
- **Texto:** `ivory` para el cuerpo, `ivory-soft` para lo secundario. Se evita el blanco puro.
- **Marcadores del mapa:** cuatro tonos apagados, uno por tipo (jefe, arma, talismán, NPC). Siempre llevan borde oscuro para leerse sobre el mapa.
- Las capturas del juego van con un velo oscuro por encima (opacidad 35 a 55 %) para que el texto sea legible.

## Typography

- **Títulos (`display`):** Cinzel en mayúsculas, con letras muy espaciadas. El título principal usa **letras de contorno** (relleno transparente, trazo `gold-pale` de 1,5 px).
- **Letra capitular (`display-ornate`):** Cinzel Decorative, solo en la primera letra del primer párrafo de una sección.
- **Cuerpo (`body`):** Cormorant Garamond a 20 px, interlineado de 1,6. Las citas y los subtítulos van en cursiva.
- **Etiquetas (`label`):** Cinzel pequeño en mayúsculas para píldoras, menú y botones.
- Fuentes de respaldo: Georgia o una serif del sistema. Nunca una sans-serif.

## Layout

- Contenido centrado, ancho máximo de 1200 px; el texto corrido, máximo 70 caracteres por línea.
- Cabecera fija con el emblema, el menú en mayúsculas (Inicio, Armas, Armaduras, Talismanes, Jefes, Ítems, NPCs, Mapa) y el acceso del administrador a la derecha.
- Portada a todo ancho con imagen oscurecida, título de contorno, lema en cursiva y buscador enmarcado.
- Mucho aire entre secciones (64 a 96 px). Las secciones se separan con un **divisor ornamental**: línea fina de oro que se desvanece hacia los lados y un adorno central (por ahora ✦; la hoja de la página oficial se decide más adelante).
- Se prioriza el escritorio; la página no tiene diseño responsivo.

## Elevation & Depth

La profundidad viene de la oscuridad, no de la luz. Sombras negras, amplias y suaves (`0 10px 30px rgba(0,0,0,.55)`). Se admite una **viñeta** oscura en los bordes de portada y mapa. No hay resplandor dorado salvo un halo muy leve (`rgba(193,157,83,.25)`) al pasar el cursor sobre una tarjeta.

## Shapes

- Esquinas casi rectas (`sm`, 3 px), como una página enmarcada. Las únicas formas redondas son las **píldoras** de etiqueta y las **fotos circulares** de categorías.
- **Marco ornamental:** borde de oro de 2 px más una segunda línea fina (`gold-deep`) por dentro; en las esquinas, un pequeño adorno (L o florón) cuando el espacio lo permite.
- Líneas finas de 1 px en `gold-deep` para tablas, separadores y campos.

## Components

- **Botón principal:** degradado dorado, texto `black` en Cinzel, esquinas `sm`. Al pasar el cursor sube 1 px y se aclara un poco.
- **Píldora:** etiqueta dorada, texto en mayúsculas pequeñas. Indica tipo (Jefe, Arma, Talismán…).
- **Buscador:** caja con marco dorado, campo oscuro, selector de categoría y botón principal.
- **Tarjeta de registro:** imagen 16:9 con borde dorado inferior, píldora, nombre en Cinzel, descripción corta y enlace "Ver ubicación en el mapa →".
- **Círculo de categoría:** foto circular con borde dorado y píldora debajo, más una frase corta en cursiva.
- **Mapa:** imagen del juego en un marco, marcadores en forma de gota, filtros por tipo en chips con borde dorado.
- **Tablas del panel de administración:** encabezado con fondo dorado al 15 %, filas separadas por líneas finas.
- **Palabras clave en el texto:** `gold-pale` con subrayado fino de `gold-deep`.

## Do's and Don'ts

**Sí**
- Usar el dorado con medida: marcos, botones, líneas y títulos.
- Mantener el texto en marfil sobre fondos oscuros, con buen contraste.
- Repetir los mismos ornamentos (divisor, marco, píldora) en todas las páginas.
- Dejar que las imágenes del juego aporten el color; la interfaz se mantiene sobria.

**No**
- No usar blanco puro, dorados brillantes ni colores saturados.
- No agregar resplandores o neón.
- No mezclar tipografías sans-serif.
- No poner ornamento sobre el buscador ni sobre el mapa: ahí manda la función.
- No usar imágenes ni elementos del contenido adicional (DLC): quedó fuera del alcance del proyecto.
