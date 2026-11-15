# Oficina virtual: los 8 estilos y cómo adaptarlos

La oficina virtual coloca al equipo inventado en una planta de oficina, con cada
persona en su puesto, y simula un trabajo (un «Job») paso a paso: quién trabaja,
quién espera, quién se bloquea y qué se pasan unos a otros.

Las ocho plantillas están en `assets/oficinas/`. Todas leen **un único archivo
de datos, `datos.js`**, que está a su lado; solo cambia cómo se dibuja la escena.
Por eso adaptar la oficina a un proyecto, o cambiarle un nombre después, es
editar `datos.js` y nada más: los ocho estilos lo recogen a la vez.

**Selector de estilo:** arriba a la derecha de la barra hay un desplegable con
los ocho estilos. Cambia de página dentro de la misma carpeta, así que los ocho
archivos y `datos.js` tienen que ir siempre juntos.

## Los 8 estilos

| # | Archivo | Estilo | Para qué va bien | Ejemplo publicado |
|---|---|---|---|---|
| 1 | `1-pixel.html` | Pixel art, vista desde arriba | Divertido, de videojuego retro | https://claude.ai/artifact/LA9pn2qqFxsEYCh7aK2VuA |
| 2 | `2-isometrica.html` | Isométrico, maqueta en 3D de juguete | El más vistoso en 2D | https://claude.ai/artifact/TWdUuePDdH9qQ4AmmEJdqn |
| 3 | `3-plano-arquitecto.html` | Plano técnico en cianotipo, con cotas | Presentar a IT o dirección | https://claude.ai/artifact/FYemGkfcsaYiyrWKmAZGL4 |
| 4 | `4-ilustracion-plana.html` | Ilustración plana de web tecnológica | Enseñar a un cliente | https://claude.ai/artifact/JfsBKmVLjBEmsVZ4geQLtG |
| 5 | `5-maqueta-papel.html` | Recortes de cartón y cartulina | Artesanal, se recuerda | https://claude.ai/artifact/Lj7b1qzhpLHEt11Cyuat6w |
| 6 | `6-pizarra.html` | Pizarra blanca a rotulador | Informal, de reunión | https://claude.ai/artifact/A6abu4iQutJFQhjKc7fo69 |
| 7 | `7-holografico.html` | Futurista holográfico, neón sobre negro | Impactar, ciencia ficción | https://claude.ai/artifact/CH52EBMcb7My8TTimshCjx |
| 8 | `8-realista-3d.html` | Escena 3D realista (Three.js), giratoria, modo Ultra 4K | Lo más espectacular; pide tarjeta gráfica | https://claude.ai/artifact/VQqb3t6duLeD9rXjpQumTn |

La 8 no es fotográfica: es un render 3D hecho con código. Si alguien pide
«realista», decirlo claro: una foto de verdad necesitaría imágenes que aquí no se
usan.

**Todas se abren a pantalla completa:** la escena ocupa toda la ventana, con solo
la barra de simulación encima. No hay cabecera, ni nota explicativa debajo, ni
pie de página; quien la ve no quiere textos alrededor, así que no volver a
añadirlos. Los planos 2D (1–7) se escalan para caber enteros sin deformarse; la
3D llena toda la ventana. El botón «⛶ Pantalla completa» (`#fsBtn`) pone además
el navegador en pantalla completa de verdad, y se oculta si el navegador no lo
permite.

**Durante la simulación hay foco en quien trabaja:** el resto de la oficina se
oscurece y cada persona en estado `working` queda iluminada, con un anillo verde
que late y su etiqueta brillando (bloque «Foco en quien trabaja»: el SVG `.spot`
que sigue a los `pins` en cada fotograma). **Al terminar el Job** aparece un
cartel grande «Job completado» con confeti en los colores del equipo, un aviso
sonoro corto y botones Repetir y Cerrar (bloque «Fin del Job», `showDone()`).
Ambos son comunes a los ocho estilos y no dependen de los datos: al adaptar una
plantilla no hay que tocarlos.

## Dónde vive la oficina de un proyecto

En la carpeta **`docs/oficina-virtual/`** del proyecto analizado, con esto dentro:

```
docs/oficina-virtual/
├── datos.js                  ← lo único que se edita
├── 1-pixel.html … 8-realista-3d.html
```

Todo se hace con `scripts/oficina.py` (en la carpeta de esta skill):

| Para qué | Orden |
|---|---|
| Saber si el proyecto ya tiene oficina, dónde y de qué tipo (`datos`, `integrada` o `antigua`) | `python3 scripts/oficina.py buscar <proyecto>` |
| Montarla por primera vez, o actualizar el diseño a la última versión sin perder los datos | `python3 scripts/oficina.py instalar <proyecto>/docs/oficina-virtual` |
| Pasar una oficina antigua (un solo HTML con los datos dentro) al formato nuevo | `python3 scripts/oficina.py migrar <html_antiguo> <proyecto>/docs/oficina-virtual` |
| Revisar que `datos.js` esté bien después de cualquier cambio | `python3 scripts/oficina.py comprobar <proyecto>/docs/oficina-virtual` |

`instalar` nunca sobrescribe un `datos.js` que ya exista. Una oficina
`integrada` (metida en la aplicación y leyendo sus datos reales) no se instala
ni se migra: se cambia en su propio HTML, como explica SKILL.md. `comprobar` necesita
`node`; si da problemas, arreglarlos antes de entregar.

**Cómo reconocer una oficina antigua:** un `.html` suelto (en `docs/` o donde se
guardara) que contiene `const T = {` y `const STEPS = [` dentro del propio
archivo, sin `datos.js` al lado. `migrar` saca sus datos tal cual, incluidos los
nombres que ya se hubieran cambiado; después se revisa `empresa` y `job` en el
`datos.js` nuevo, por si no se detectaron bien.

## `datos.js`: qué se cambia y qué no

Arriba del todo:

- **`empresa`** — sale en el título de la pestaña y en los rótulos del plano.
- **`job`** — `nombre` y `resumen` del trabajo que se simula; salen en la barra,
  en la pizarra y en el cartel final.
- **`primera`** — clave de la persona cuya ficha se abre al empezar.
- **`estilo`** — archivo del estilo que la skill abre primero.

Y los seis bloques:

1. **`T`** — las personas. Por cada una: `name`, `short` (nombre corto para la
   etiqueta), `age`, `from`, `role`, `mod` (la pieza del sistema o el proceso
   del que se ocupa), `color` y `colorName` (su color de identidad), `perfil`,
   `gesto`, `frase`, y `s` (cómo se dibuja):
   - `skin`, `hair`, `shirt` — colores en hexadecimal
   - `hs` — peinado: `short`, `bob`, `curly`, `pony`, `beanie`, `bun`, `slick`,
     `fringe`, `bald`, `wavy`, `cap`, `shortside`, `braid`, `receding`,
     `twotone`, `parted`
   - opcionales: `hat` (con `beanie`/`cap`), `hair2` (con `twotone`), `vest`,
     `pat` (`stripes` + `stripe`, `checks` + `check`, `flowers`, `blazer`,
     `hoodie`)
   - `x` — accesorios: `glasses:#color`, `headset`, `backpack`, `beard`,
     `camera`, `phones`, `earrings`, `necklace`, `scarf:#color`, `pen`,
     `suspenders`

   Con `s` se dibuja a la persona en el plano y también su **retrato de
   frente** en el panel «Team» (fichas tipo LinkedIn) y en la barra del Job.
   Variar peinados, colores y accesorios para que cada retrato se distinga;
   `perfil` sale como «Acerca de» y `mod` y `gesto` como «Experiencia».
2. **`SEAT`** — en qué puesto se sienta cada persona (ver abajo) y una frase
   `seat` que describe su sitio. `x`, `y`, `dir`, `standing` y `chair` no se
   inventan: se copian de la tabla de puestos.
3. **`ZONES`** — las áreas: `sala` (cuál de las nueve salas del dibujo es; no se
   cambia), `name` (**el nombre que se ve en el plano**: este sí se cambia), `x` e
   `y` (dónde va la etiqueta; no se cambian), `ids` (quién trabaja allí) y, si
   está vacía, `empty` (qué hay en ella).
4. **`STEPS`** — los pasos del Job: `[{persona:'estado',…}, 'texto del paso', milisegundos]`.
   Estados: `working`, `waiting`, `blocked`, `done`, `idle`. El texto suele empezar
   por el nombre del área («Recepción · …»): **si se renombra un área, cambiarlo
   también aquí**.
5. **`ACT`** — qué hace cada persona en cada paso: `{índice_paso:{persona:'tarea'}}`.
   Es lo que sale en «Ahora» y en el registro al pulsar a alguien.
6. **`HAND`** — lo que se pasan entre ellos: `{índice_paso:[[de, a, objeto, 'etiqueta']]}`.
   `de` puede ser `'door'` (entra por la puerta). Objetos: `ticket`, `box`,
   `photos`, `folder`, `postit`, `pen`, `sign`, `zip`.

Las claves de las personas (`merce`, `tomi`…) se pueden cambiar, pero entonces
en todos los bloques a la vez; para cambiar cómo se llama alguien basta con
`name` y `short`.

## Las salas y los 17 puestos

La distribución está dibujada en cada estilo y es la misma en los ocho. Hay
nueve salas fijas; lo que cambia de un proyecto a otro es **cómo se llaman** y
**quién se sienta en ellas**:

| `sala` | Dónde está en el dibujo | Puestos (x, y, dir) | Lo que hay alrededor |
|---|---|---|---|
| `despacho` | Despacho acristalado, arriba a la izquierda | (52,22,down) | Mesa de dirección, tablet, estantería, mesa de reuniones |
| `recepcion` | Abajo a la izquierda, junto a la puerta | (46,200,down) | Mostrador con campanita, puerta de entrada |
| `izquierda` | Zona izquierda central | (34,113,up) · (78,113,up) · (77,134,down, de pie) | Archivadores y trituradora · tablón y mochila · mesa de fotos con focos |
| `isla` | Isla de cuatro mesas, arriba al centro | (176,24,down) · (212,24,down) · (176,58,up) · (212,58,up) | Pared de post-its, estantería |
| `mesa-larga` | Mesa larga, centro | (166,118,down) · (200,118,down) · (234,118,down) · (183,146,up) · (217,146,up) | Una pluma compartida en el centro |
| `arriba-derecha` | Sala de la derecha, arriba | (326,48,up) | Dos pantallas, mesa de corte (el puesto está centrado; un 320,36 antiguo se recoloca solo) |
| `derecha` | Zona derecha central | (318,122,up) · (352,152,up) | Impresora, pizarra y mesa de reuniones; si alguien ocupa (352,152), la mesa de reuniones pasa a ser su escritorio (sirve para que dos áreas compartan sala) |
| `abajo-derecha` | Despacho abajo a la derecha | (326,224,up) | Caja fuerte, calculadora, hucha |
| `office` | Abajo al centro | sin puestos | Cocina, sofá, mesa redonda |

Un área puede quedarse sin gente: se deja con `ids:[]` y una frase en `empty`.
Los muebles de cada sala (focos, trituradora, caja fuerte…) se quedan como
decoración aunque no le peguen del todo al proyecto. Los detalles animados (la
campanita de recepción, el flash de fotos, la calculadora, la pluma de la mesa
larga) van ligados al **puesto**, no a la persona, así que funcionan con
cualquier equipo.

**Vida en la oficina** (común a los ocho estilos, no depende de los datos): quien
no tiene tarea del job teclea a ratos en su mesa y, de vez en cuando, se levanta
a la cocina (café, agua, nevera, mesa redonda, sofá) o al baño. Como mucho dos
fuera a la vez; al cruzarse se apartan, y si el job les necesita vuelven
deprisa. Recepción y dirección no se levantan. Las rutas están en `SALIDA` y los
sitios en `SITIOS` (bloque «Vida en la oficina» de cada plantilla).

**Con más de 18 personas**, o si la empresa necesita salas muy distintas, hay
que redibujar muebles en los ocho estilos: avisar a Mauricio antes, porque es
bastante más trabajo que cambiar datos.

## Conexión en directo

Con `directo: { url: … }` en `datos.js`, los ocho estilos escuchan los eventos de
la aplicación y el equipo se mueve con el trabajo real. Todo está en
`references/conexion.md`: la librería, el idioma de eventos y cómo lo monta la
skill. Las opciones `volver` y `extras` siguen disponibles para casos especiales.

## Cómo entregarla

1. `instalar` en `docs/oficina-virtual/` del proyecto.
2. Escribir `datos.js` con el equipo, las áreas confirmadas y el Job.
3. `comprobar`. Si hay forma, abrir un estilo y hacer una captura a mitad de
   simulación (pulsar «Simular» y esperar unos segundos).
4. Abrir con `open` el estilo de `estilo`. Si Mauricio quiere un enlace para
   compartir, publicarla como artefacto: la página principal es ese estilo y los
   otros siete más `datos.js` van como archivos adjuntos (`files`), con su mismo
   nombre, para que el selector funcione.

Cada archivo empieza por `<!doctype html>` y `<meta charset="utf-8">`: no
quitarlos, o al abrirlo desde el disco las tildes salen rotas («DIRECCIÃ³N»).
La 8 carga Three.js desde `cdn.jsdelivr.net` (versión 0.160.0) con un mapa de
importación; el resto no depende de nada externo salvo las fuentes de Google.
