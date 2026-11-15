---
name: livestage
description: Analiza el flujo de una aplicación o web (código, rutas, integraciones, páginas publicadas), define los procesos que la hacen funcionar, inventa el equipo ficticio que los llevaría —una persona por rol, con nombre, edad, estudios, experiencia y responsabilidades— y entrega todo en un único archivo HTML como los que se adjuntan a una tarea de Jira. Además monta la oficina virtual: el equipo sentado en una planta de oficina, con la simulación de un trabajo paso a paso, en el estilo que elija entre ocho (pixel art, isométrico, plano de arquitecto, ilustración plana, maqueta de papel, pizarra, holográfico o 3D realista). Úsala siempre que Mauricio pida analizar cómo funciona una aplicación, mapear sus procesos, «qué equipo haría falta», definir roles o perfiles para un proyecto, preparar un documento HTML para el equipo de IT, o ver al equipo en una oficina, un plano o una simulación, y también cuando quiera cambiar nombres de áreas, personas o procesos de una oficina ya montada en su proyecto, aunque no diga «skill» ni «HTML».
---

# LiveStage: analizar una aplicación, su flujo, sus procesos y su equipo

El resultado es **un solo archivo HTML** que se puede abrir, imprimir o adjuntar a
una tarea de Jira. Sirve para que cualquiera entienda de un vistazo qué hace la
aplicación, qué procesos la sostienen y quién se ocuparía de cada uno.

Mauricio no es desarrollador y prefiere respuestas breves: el detalle técnico va
dentro del HTML, no en el chat.

## Modo guiado: para quien no sabe nada de esto

Usarlo cuando la petición llega por `/livestage`, cuando es vaga («hazme lo de la
oficina») o cuando quien escribe no parece técnico. La persona no tiene por qué
saber qué es un flujo, un proceso ni un HTML: solo responde y recibe el resultado.

**0. Lo primero de todo, antes de preguntar nada: buscar si el proyecto ya
tiene oficina**, con `python3 scripts/oficina.py buscar <carpeta del proyecto>`
(el script está en la carpeta de esta skill). Si encuentra alguna, **no hacer
las preguntas de abajo ni volver a analizar**: ir directamente a «Si el proyecto
ya tiene oficina». Las preguntas de inicio son solo para proyectos sin oficina.

**Y comprobar si hay una versión nueva**, con `python3 scripts/oficina.py
version` (si hay oficina de tipo `datos`, pasarle su carpeta:
`version <carpeta de la oficina>`). Si sale `ACTUALIZAR_PLUGIN`, decirlo en una
sola línea antes de las preguntas, sin frenar nada: «Hay una versión nueva de
LiveStage (la X; tienes la Y). Para tenerla, escribe `/plugin update
livestage@livestage` y vuelve a escribir `/livestage`.» Claude no puede
ejecutar ese comando por la persona: lo escribe ella. Si no hay conexión
(`ultima` sale «desconocida»), no decir nada.

**Todas las preguntas de esta skill se hacen con el menú de selección**
(`AskUserQuestion`), nunca escritas en un bloque de texto con opciones a), b),
c): quien la usa espera pulsar una opción, no escribir «1a, 2b». Esto vale cada
vez que se ejecute `/livestage`, también si en esta misma conversación un menú
anterior se canceló o se cerró sin respuesta: se vuelve a mostrar el menú. Si
`AskUserQuestion` no aparece entre las herramientas, cargarla con `ToolSearch`
(`select:AskUserQuestion`) antes de preguntar.

**1. Hacer las preguntas de una vez**, todas en la misma llamada al menú, para
que sea un único momento:

- **¿Qué quieres analizar?** — «Este proyecto (la carpeta que tengo abierta)» ·
  «Una página web» · «Te lo explico yo con mis palabras»
- **¿Qué quieres recibir?** — «La oficina virtual con el equipo (Recomendado)» ·
  «Un informe para el equipo técnico» · «Las dos cosas»
- **¿En qué estilo quieres la oficina?** — «Ilustración plana, amable y moderna
  (Recomendado)» · «3D realista, se puede girar» · «Isométrico, maqueta de
  juguete» · «Ver los 8 estilos con ejemplos»
- **¿Dónde quieres ver la oficina?** — «Solo en mi ordenador, mientras trabajo
  (Recomendado)» · «También en internet, dentro de mi aplicación publicada» ·
  «No lo sé todavía»

La cuarta solo cuenta si va a recibir la oficina y se analiza un proyecto con
servidor; si no, se ignora la respuesta. «No lo sé todavía» se trata como «solo
en mi ordenador», y al entregar se le dice en una frase que se puede publicar
más adelante volviendo a escribir `/livestage`.

Si elige «Ver los 8 estilos», enseñar la lista del paso 5 con sus enlaces de
ejemplo y preguntar cuál quiere también con el menú: como admite cuatro opciones,
poner los cuatro que mejor encajen; los otros se eligen escribiendo su nombre en
la opción libre del menú. Si elige «Una página web», pedirle la dirección;
si elige «Te lo explico yo», pedirle que cuente en dos o tres frases qué hace la
aplicación. Si `/livestage` llega con texto detrás, usarlo como respuesta a la
primera pregunta y no volver a preguntarla. Solo si después de intentar cargarla
la herramienta de preguntas sigue sin existir (por ejemplo, en una ejecución sin
nadie delante), hacer las mismas preguntas en un mensaje numerado.

**2. Trabajar sin más preguntas,** salvo una: **confirmar las áreas** antes de
montar la oficina (paso 5). Para todo lo demás, seguir los pasos de abajo con lo
que se tenga y tomar decisiones razonables en lugar de consultar. Mientras tanto, una línea
breve de vez en cuando para que sepa que sigue en marcha: «Estoy leyendo cómo
funciona…», «Ya tengo el equipo, monto la oficina…».

**3. Entregar en lenguaje llano.** Al final, el enlace o la ruta y tres o cuatro
frases: qué hace la aplicación, cuántas personas tiene el equipo y cómo se usa la
oficina (pulsar a alguien para ver qué hace, «Simular» para verlos
trabajar). Nada de nombres de archivos internos ni términos técnicos.

## Paso 1 — Entender el flujo

Partir de lo que existe, no de lo que parece. Según lo que haya disponible:

- **Código:** `README`, `CLAUDE.md`, `package.json`, punto de entrada (`server.js`,
  `src/`), rutas y endpoints, tareas programadas, colas, integraciones externas
  (pagos, correo, APIs, IA), variables de `.env.example` (solo los nombres, nunca
  los valores).
- **Web publicada:** descargar las páginas clave con `curl` (portada, ficha, carrito,
  formulario) y leer lo que entrega: texto, enlaces, datos estructurados JSON-LD.
- **Lo que cuente Mauricio**, que manda sobre lo anterior cuando hay conflicto.

Reconstruir el recorrido de principio a fin: qué lo dispara, por qué pasos va, qué
sistemas toca y qué produce. Anotar de dónde sale cada afirmación (archivo o URL):
el documento tiene que poder comprobarse.

Si falta algo esencial para entender el flujo, preguntar una sola vez y de forma
concreta antes de seguir.

## Paso 2 — Definir los procesos

Un proceso es algo que alguien tiene que hacer, vigilar o decidir para que la
aplicación funcione. Para cada uno:

| Campo | Qué poner |
|---|---|
| Nombre | Verbo + objeto: «Dar de alta una marca», «Publicar fichas» |
| Disparador | Qué lo inicia y con qué frecuencia |
| Pasos | Lo que ocurre, en orden, breve |
| Entradas / salidas | Qué recibe y qué entrega |
| Herramientas | Sistemas y servicios que usa |
| Puntos de fallo | Dónde se rompe y cómo se nota |
| Indicador | Cómo se sabe que va bien (con número si es posible) |

Separar los procesos **automáticos** (los hace el código) de los **humanos** (los
hace una persona). Los automáticos también necesitan un responsable que los vigile.

Si en el análisis aparecen errores o mejoras concretas, recogerlos: irán como
tareas en el paso 4.

## Paso 3 — Inventar el equipo

A partir de los procesos, deducir qué roles hacen falta y crear **un perfil
ficticio por rol**. El tamaño del equipo sale de la carga real: una aplicación
pequeña no necesita diez personas, y un rol puede cubrir varios procesos.

Cada perfil lleva:

- **Nombre y apellido** inventados, **edad**, **ciudad**
- **Rol** y **nivel** (junior, semi-senior, senior)
- **Formación:** estudios y certificaciones coherentes con el rol
- **Experiencia:** años y trayectoria previa en una o dos líneas
- **Procesos de los que es responsable** (los del paso 2, por su nombre)
- **Herramientas** que domina
- **Habilidades clave**: tres o cuatro
- **Cómo se mide su trabajo:** uno o dos indicadores
- **Con quién colabora**

Que sea creíble: la edad encaja con los años de experiencia, los estudios con el
rol, el nivel con la responsabilidad. Variar edades, orígenes y trayectorias como
en un equipo real, sin caer en estereotipos.

**Todo perfil se marca como ficticio** en el documento. Nunca usar nombres de
personas reales ni de empleados que aparezcan en el código o en la web: si salen,
se describen por su rol.

Cerrar con una **matriz de responsabilidades**: procesos en filas, personas en
columnas, y en cada cruce R (responsable), A (aprueba), C (consultado) o I
(informado).

## Paso 4 — Montar el HTML

Partir de `assets/plantilla.html` (en la carpeta de esta skill). Ya trae los
estilos, el modo oscuro, la impresión a PDF, las tarjetas de perfil, las tablas y
el botón de copiar código. Rellenar las secciones y borrar las que no apliquen.

Estructura:

1. **Cabecera:** título concreto, etiquetas (para quién es, área), fecha
2. **Contexto:** qué es la aplicación y para qué sirve este documento, en un párrafo
3. **Flujo:** el recorrido paso a paso (lista numerada de pasos con el sistema que
   interviene en cada uno)
4. **Procesos:** una tarjeta por proceso con los campos del paso 2
5. **Equipo:** una tarjeta por persona
6. **Matriz de responsabilidades**
7. **Tareas detectadas** (si las hay): cada una con problema, situación actual,
   arreglo, ejemplo de código si ayuda y **criterios de aceptación** comprobables
8. **Fuera de alcance:** lo que no se pide y por qué
9. **Fuentes:** archivos y URLs en los que se basa el análisis

Las tareas tienen el nivel de detalle de una tarea de Jira para IT: el problema,
dónde está, cómo debería quedar y cómo se comprueba que está bien. Lo que ya está
bien se dice también, para que nadie lo toque.

Guardar el archivo junto al proyecto analizado (por ejemplo en su `docs/`), con
un nombre descriptivo en minúsculas y guiones, y abrirlo con `open`.

## Paso 5 — La oficina virtual

Con el equipo ya inventado, ofrecer verlo trabajando en una oficina: cada persona
en su puesto y un «Job» simulado paso a paso, con quién trabaja, quién espera,
quién se bloquea y qué se pasan entre ellos. Al pulsar a alguien se ve lo que
está haciendo y su registro.

**Leer antes `references/oficina-virtual.md`:** explica el archivo de datos, las
nueve salas del dibujo, los 17 puestos y el script que la instala.

### 5a — Proponer las áreas y dejar que las cambie

La oficina tiene nueve salas fijas. Repartir el equipo en ellas según los
procesos (quien trabaja junto, cerca) y darle a cada sala **un nombre que
signifique algo en este proyecto** («Atención al cliente», «Obrador»…), no los
del ejemplo. Una sala puede quedarse vacía.

Enseñar la propuesta en una tabla corta y en lenguaje llano:

| # | Área | Quién trabaja allí | Qué se hace |
|---|---|---|---|
| 1 | Gerencia | Ana (directora) | Decide prioridades y aprueba |
| … | | | |

Y preguntar con `AskUserQuestion`: **«¿Te valen estas áreas?»** — «Sí, monta la
oficina (Recomendado)» · «Quiero cambiar algún nombre» · «Quiero mover a alguien
de área». Si quiere cambios, pedirle que los escriba como le salga («la 3 se
llama Obrador», «Leo pasa a Calidad»), aplicarlos, enseñar solo lo que ha
cambiado y volver a preguntar hasta que diga que sí. Es la única pregunta del
modo guiado aparte de las de inicio.

### 5b — El estilo y la instalación

**Preguntar el estilo** (en el modo guiado ya viene de las preguntas de inicio) y
no elegirlo por él. Es solo el que se abre primero: dentro de la oficina hay un
selector arriba a la derecha para pasar a cualquiera de los otros. Presentar las
ocho opciones en una lista corta, cada una con una frase y su enlace de ejemplo
para que pueda verlas:

1. **Pixel art** — retro, de videojuego
2. **Isométrico** — maqueta en 3D de juguete
3. **Plano de arquitecto** — cianotipo técnico con cotas; serio, para IT o dirección
4. **Ilustración plana** — amable, de web tecnológica; para clientes
5. **Maqueta de papel** — recortes de cartón y cartulina
6. **Pizarra a mano** — rotulador sobre pizarra blanca
7. **Futurista holográfico** — neón sobre negro, centro de operaciones
8. **3D realista** — escena giratoria con luz y sombras y modo Ultra 4K

Todas se abren a pantalla completa, solo con la escena y la barra de simulación.

Instalarla en el proyecto, en `docs/oficina-virtual/`, con
`python3 scripts/oficina.py instalar <proyecto>/docs/oficina-virtual` (el script
está en la carpeta de esta skill). Después escribir su `datos.js`: equipo, áreas
confirmadas en 5a, el estilo elegido y el Job. Los pasos del Job salen del flujo
del paso 1 y las entregas, de lo que de verdad pasa de un proceso a otro.
Revisar los datos con `python3 scripts/oficina.py comprobar <carpeta>`.

### 5c — Conectarla con el trabajo real (obligatorio antes de entregar)

La conexión **no es una oferta al final: es un paso del montaje.** Se propone
siempre; lo único que se pide es el visto bueno a los archivos que se tocan.
Seguir `references/conexion.md` entero. En resumen:

1. **Buscar todos los sitios donde corre trabajo real**, no solo «un servidor»:
   servidores HTTP (`createServer`, Express, Fastify, rutas API de Next…),
   servidores y scripts locales (`npm run …`, carpetas `local/`, `scripts/`) y
   ejecutores de tareas (Trigger.dev en `src/trigger/`, colas, cron, workers,
   Lambda).
2. **Elegir cómo llegan los eventos** según dónde corre el trabajo: mismo proceso
   que el servidor → en directo (SSE); otro proceso o serverless → sondeo sobre
   un almacén o el tiempo real del propio proveedor; si no hay otra cosa, al
   menos el punto local donde corre el mismo proceso.
3. **Engancharse a lo que ya existe** (observadores, callbacks, emisores de
   progreso, logs estructurados) con una línea en cada sitio, y la traducción en
   un archivo aparte, todo dentro de `try/catch`. No inventar actividad: quien no
   tenga equivalente real en ese entorno no se mueve, y se dice.
4. **Servir la oficina desde la aplicación** (`/oficina/`, protegida con el mismo
   login) y añadir **`/oficina/prueba`**, que reproduce un trabajo falso de unos
   40 s sin llamar a ningún servicio externo.
5. **No reiniciar el servidor de la persona si hay trabajo en curso**: mirarlo
   antes (log, estado de los trabajos) y, si lo hay, esperar o preguntar diciendo
   que se perdería.
6. **Comprobar de verdad**: `python3 scripts/oficina.py comprobar
   http://localhost:<puerto>/oficina/ --prueba` (oficina, datos y eventos
   responden, y la prueba pasa a modo directo y llega al informe final sin
   errores de consola).

7. **Si la quiere también en producción**, seguir el apartado «9 · Producción»
   de `references/conexion.md`: averiguar dónde está publicada la aplicación,
   dejar el código listo para ese entorno y decirle qué tiene que hacer él para
   publicarla. **Nunca publicar ni desplegar por él** sin que lo pida
   expresamente.

Si de verdad no se puede conectar, **decirlo claro y por qué**. Nunca entregar en
silencio una oficina sin conexión.

**Si el proyecto no tiene servidor** (una web estática, una librería…), publicar
la oficina como artefacto: la página principal es el estilo elegido y los otros
siete más `datos.js` van como archivos adjuntos (`files`), para que el selector
funcione. Así hay una dirección https que se puede abrir y compartir.

## Si el proyecto ya tiene oficina

Pasa cuando `buscar` encuentra una oficina, se haya pedido con `/livestage` o con
otras palabras. La persona ya la tiene montada: lo que quiere es **cambiar
cosas**, no empezar de cero. No volver a analizar ni a hacer las preguntas de
inicio.

`buscar` dice de qué tipo es cada oficina, y eso decide **dónde** se hacen los
cambios:

| Tipo | Qué es | Dónde se cambia |
|---|---|---|
| `datos` | Carpeta con `datos.js` y los 8 estilos | En `datos.js`; lo recogen los 8 estilos |
| `integrada` | Un HTML dentro de la aplicación que lee datos reales (por ejemplo `public/oficina.html`) | **En ese mismo HTML**, en sus bloques `T`, `ZONES`, `STEPS`, `ACT` y `HAND`. Nunca se migra ni se copia a otra carpeta: es la que usa la aplicación |
| `antigua` | Un HTML suelto con los datos dentro | Pasarla antes al formato nuevo con `python3 scripts/oficina.py migrar <html> <proyecto>/docs/oficina-virtual` (el archivo antiguo no se borra) y seguir como `datos` |

Si hay más de una, preguntar en el menú cuál quiere cambiar.

**En una oficina `integrada`, la aplicación conecta sus jobs reales con la
oficina por posición:** no cambiar las claves de las personas (`merce`,
`tomi`…), ni el número ni el orden de los pasos de `STEPS`, ni los índices de
`ACT` y `HAND`. Los nombres, cargos y textos sí se cambian.

Después, preguntar **con el menú** (varias respuestas a la vez): **«¿Qué quieres
cambiar de la oficina?»** — «Áreas y personas: nombres, cargos o quién se
sienta dónde» · «Pasos del trabajo y nombres de los procesos» · «Conectarla con
mi aplicación o verla en producción» · «Actualizar a la última versión». Si
`version` dio `ACTUALIZAR_PLUGIN` o `ACTUALIZAR_DISENO`, añadir a esa opción
«(hay una nueva)» y ponerla la primera; si dio `AL_DIA`, ponerla la última. En
la propia pregunta, recordar que puede escribir otra cosa, como «analizar el
proyecto de nuevo».

Para cada cosa elegida, enseñar lo que hay ahora como lista numerada y pedirle
que escriba los cambios con sus palabras («la 3 se llama Obrador»). Aplicarlos
donde diga la tabla de arriba:

- **Área renombrada:** `name` en `ZONES` y el mismo nombre al principio de los
  textos de `STEPS` («Recepción · …»).
- **Proceso renombrado:** en `STEPS`, `ACT`, las etiquetas de `HAND` y el `mod`
  de quien lo lleva. Si en `docs/` está el informe HTML del paso 4, cambiarlo
  también allí, en todas sus apariciones.
- **Persona:** `name` y `short` para el nombre; `role` y `perfil` para el cargo;
  para moverla de área, su clave en `ids` de `ZONES` y su `SEAT` (un puesto libre
  de la sala nueva, de la tabla de la guía).
- **Actualizar a la última versión:** son dos cosas, y se hace lo que toque
  según `version`:
  1. **El plugin** (`ACTUALIZAR_PLUGIN`): Claude no puede actualizarlo. Decirle
     que escriba `/plugin update livestage@livestage` y luego `/livestage` otra
     vez, y que ahí se terminará de actualizar su oficina. No seguir con el
     diseño hasta entonces: se instalaría el diseño viejo.
  2. **El diseño de su oficina** (`ACTUALIZAR_DISENO`, con el plugin ya al día):
     en una oficina `datos`, `python3 scripts/oficina.py instalar …` sobre la
     misma carpeta; no toca `datos.js` ni la conexión, y apunta la versión.
     Si la aplicación tiene la librería de conexión (`oficina-eventos.cjs`/`.mjs`
     en su código), actualizarla también con `python3 scripts/oficina.py
     libreria <su carpeta>`: trae mejoras de la conexión en directo (por ejemplo,
     que una pestaña que vuelve se ponga al día con el informe final).
     En una `integrada` no hay instalador ni versión apuntada: comparar su
     HTML con la plantilla del mismo estilo en `assets/oficinas/` y llevar a
     mano las mejoras de diseño, sin tocar su conexión con la aplicación ni sus
     datos. Avisar de que esto es más trabajo que las otras opciones.
  Si sale `AL_DIA`, decirle que ya tiene la última versión, sin hacer nada.
- **Conectarla con mi aplicación o verla en producción:** preguntar con el menú
  la misma cuarta pregunta del inicio («¿Dónde quieres ver la oficina?») y
  seguir `references/conexion.md`, incluido su apartado «9 · Producción» si la
  quiere en internet. Si ya está conectada (`datos.js` tiene `directo`), revisar
  que la ruta y las llamadas siguen en su sitio y añadir solo lo que falte.
- **Analizar de nuevo:** volver al paso 1; al llegar a 5a, partir de las áreas que
  ya tenía y decir qué cambiaría.

Terminar siempre con `python3 scripts/oficina.py comprobar <carpeta o html>` y,
si la oficina se sirve desde la aplicación y está en marcha, con `comprobar
http://localhost:<puerto>/oficina/ --prueba`. Al entregar, una frase con lo que ha
cambiado y la **dirección** donde se ve (nunca una ruta de disco).

## Al entregar

Una línea con para quién está escrito, la ruta completa del informe HTML (si se
hizo) y dos o tres frases con lo más importante que ha salido. Nada más: el resto
está en el HTML.

La oficina se entrega **siempre como dirección web, nunca como ruta de disco**:
`http://localhost:<puerto>/oficina/` si la sirve la aplicación, o el enlace del
artefacto si no hay servidor. Junto a ella:

- la dirección de **la prueba** (`/oficina/prueba`) para verla moverse sin gastar;
- **qué está conectado** y a qué parte del trabajo real, y qué personas no se
  mueven en ese entorno y por qué;
- **si hay que reiniciar la aplicación** para que se cargue la conexión;
- si la quiere en producción: la dirección que tendrá
  (`https://<su dominio>/oficina/`), lo que queda listo y los pasos que le
  tocan a él para publicarla, en lenguaje llano;
- que el estilo se cambia con el selector de arriba a la derecha.

## Reglas

- **Lo único inventado son las personas.** Procesos, flujo, errores y datos de la
  aplicación salen del análisis. Si algo es una suposición, se marca como tal.
- **Ningún secreto en el documento:** ni claves, ni tokens, ni valores de `.env`.
  El HTML se adjunta y circula.
- **Sin cifras económicas inventadas** (sueldos, costes, facturación) salvo que
  Mauricio las dé.
