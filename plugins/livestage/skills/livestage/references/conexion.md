# Conectar la oficina con la aplicación

Con la conexión, la oficina deja de ser solo una simulación: el equipo se mueve
con el trabajo real de la aplicación (quién trabaja, quién espera, qué se pasan,
el progreso) y, al terminar, el jefe enseña el informe con los datos de verdad.
Si no hay ningún trabajo en marcha, la oficina sigue con la simulación de ejemplo.

## Cómo funciona

```
aplicación ──(oficina-eventos.js)──▶ /oficina/eventos ──(Server-Sent Events)──▶ oficina (8 estilos)
```

1. **La librería** `assets/conexion/oficina-eventos.js` va dentro de la aplicación
   (por ejemplo en `lib/`). No tiene dependencias; Node 14 o superior.
2. **La ruta de eventos**: `app.get('/oficina/eventos', proteger, oficina.sse)`, con
   el mismo login que el resto de la aplicación.
3. **`datos.js` de la oficina**: `directo: { url: 'eventos' }` (relativa a donde se
   sirven los estilos). La oficina pasa a la ruta los parámetros de su propia URL,
   así que `…/4-ilustracion-plana.html?job=123` escucha solo ese trabajo; sin `?job`,
   sigue al último que empezó.
4. **Las llamadas**, en el código de la aplicación, justo donde ya ocurre cada cosa.

## El idioma de eventos

Un canal por trabajo: `const c = oficina.canal(job.id)` (o `oficina.canal()` si la
aplicación solo hace un trabajo a la vez).

| Llamada | Qué se ve |
|---|---|
| `c.inicio({ titulo, resumen })` | La oficina pasa a modo directo y se limpia |
| `c.trabaja(persona, texto)` | La persona trabaja (foco, anillo) y el texto va a su registro |
| `c.espera(persona, texto)` · `c.bloqueado(persona, texto)` · `c.hecho(persona, texto)` · `c.libre(persona)` | Su estado |
| `c.entrega(de, a, objeto, etiqueta, { importante })` | Un objeto vuela de una mesa a otra. `de` puede ser `'door'`. Objetos: `ticket box photos folder postit pen sign zip`. Las repetitivas se espacian solas; los hitos, con `importante: true` |
| `c.paso(titulo, texto)` | Texto de la barra superior |
| `c.progreso(0..1)` | Barra de progreso |
| `c.fin({ ok, titulo, dice, sub, filas, nota })` | El jefe anuncia el final con el informe. `filas: [[etiqueta, valor, 'ok'|'mal']]`. Con `ok: false`, sale como detenido |
| `c.estado(persona)` | Lee el estado actual (`'trabaja'`, `'espera'`…), útil para decidir |

Las personas son las claves de `T` en `datos.js`. Quien abre la oficina a mitad de
trabajo recibe el estado actual al conectarse.

## Cómo lo hace la skill

1. **Ver si se puede**: la aplicación tiene que tener servidor propio. Node.js es el
   caso directo. En otro lenguaje, escribir el equivalente: es una ruta que devuelve
   `text/event-stream` y mensajes `data: {json}` con los campos de arriba; avisar de
   que esa parte va con menos garantías.
2. **Mapa de puntos**: por cada proceso del análisis (el `mod` de cada persona dice
   dónde vive en el código), localizar dónde empieza, avanza, falla y termina el
   trabajo real. Si la aplicación ya tiene un punto central de eventos (como el
   función que ya emite los eventos de cada trabajo), engancharse ahí con **una sola
   línea** y poner la traducción en un archivo aparte (`lib/oficina<App>.js`).
3. **Enseñar el plan antes de tocar nada**: lista corta de los archivos que se
   cambian y qué llamada va en cada sitio. Esperar el visto bueno (menú).
4. **Aplicar**: copiar la librería (`python3 scripts/oficina.py libreria <app>/lib`),
   añadir la ruta, las llamadas y `directo` en `datos.js`. Las llamadas van envueltas
   para que **nunca** puedan romper ni frenar el trabajo real (la librería ya lo es;
   el traductor, dentro de `try/catch`).
5. **Probar**: arrancar una copia de la aplicación en otro puerto o un script que
   llame al traductor con un trabajo simulado, y abrir la oficina para ver que se
   mueve y que el informe final sale con datos. No reiniciar el servidor de la
   persona sin preguntar.
6. **Entregar**: decir qué archivos se han tocado y que hay que reiniciar la
   aplicación para verlo.

Patrón probado en una aplicación real: la librería en `lib/oficina-eventos.js`, la
traducción en `lib/oficina<App>.js`, una línea en el punto central de eventos y la
ruta `/oficina/eventos` junto a la de los estilos.
