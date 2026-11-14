# Conectar la oficina con la aplicación

Con la conexión, la oficina deja de ser solo una simulación: el equipo se mueve
con el trabajo real de la aplicación (quién trabaja, quién espera, qué se pasan,
el progreso) y, al terminar, el jefe enseña el informe con los datos de verdad.
Si no hay ningún trabajo en marcha, la oficina sigue con la simulación de ejemplo.

**Es un paso obligatorio del montaje, no una oferta al final.** Se propone siempre;
lo que se pide es el visto bueno a los archivos que se tocan. Si de verdad no se
puede, se dice claro y por qué: nunca se entrega en silencio una oficina sin conexión.

## La pieza: la librería

`assets/conexion/` trae dos archivos que van juntos dentro de la aplicación (por
ejemplo en `lib/`): `oficina-eventos.cjs` (CommonJS) y `oficina-eventos.mjs` (ESM,
envuelve al anterior). Sin dependencias; Node 14 o superior.

```
python3 scripts/oficina.py libreria <app>/lib
```

copia los dos y lee el `package.json` más cercano para decir cuál importar:

```js
import oficina from './lib/oficina-eventos.mjs';          // "type": "module"
const oficina = require('./lib/oficina-eventos.cjs');     // CommonJS
```

Lo que trae:

| Función | Para qué |
|---|---|
| `oficina.estatico(carpeta)` | Sirve la oficina (`/oficina/` y sus 8 estilos) de forma segura: solo `.html` y `.js` de esa carpeta, sin subcarpetas ni nombres raros; `/oficina/` redirige al estilo de `datos.js` |
| `oficina.sse` | Eventos en directo (Server-Sent Events) |
| `oficina.sondeo` | Los mismos eventos por sondeo (JSON `{ eventos, siguiente }`) |
| `oficina.canal(id)` | Un canal por trabajo, con las llamadas de abajo |
| `oficina.ensayo(guion)` | Reproduce un trabajo falso con sus pausas: para `/oficina/prueba` |

## 1 · Dónde corre el trabajo real

Buscar **todos** los sitios, no solo «un servidor»:

- **Servidores HTTP:** `createServer`, Express, Fastify, Koa, rutas API de Next.
- **Servidores y scripts locales:** `npm run …`, carpetas `local/`, `scripts/`,
  `worker/`, generadores que se lanzan a mano.
- **Ejecutores de tareas:** Trigger.dev (`src/trigger/*`), colas (BullMQ, SQS…),
  cron, workers, Lambda/funciones serverless.

## 2 · Cómo llegan los eventos a la oficina

| El trabajo corre… | Transporte | `datos.js` |
|---|---|---|
| En el mismo proceso que el servidor web | **En directo**: `oficina.sse` | `directo: { url: 'eventos' }` |
| En otro proceso o serverless (Trigger.dev, Lambda, colas) | **Sondeo**: el trabajo escribe sus eventos en un almacén (KV, base de datos, Redis…) y la app expone un endpoint con la forma `{ eventos: [...], siguiente: n }` que la oficina pide cada pocos segundos (`?desde=n&job=…`) | `directo: { url: 'sondeo', modo: 'sondeo', cada: 2000 }` |
| Igual, y el proveedor tiene tiempo real propio | Ese canal (p. ej. metadatos y suscripción en tiempo real de Trigger.dev). **Comprobar la API actual antes de usarla** | Según el caso |
| Solo es posible en local | Como mínimo, conectar el punto local donde corre el mismo proceso (un generador, un servidor de pruebas) y decir que en producción no se mueve | `directo: { url: 'eventos' }` |

En sondeo dentro del mismo proceso basta `oficina.sondeo`. En serverless, el
endpoint lo escribe la skill leyendo del almacén, con la misma forma JSON: cada
evento es un objeto como los que manda `canal` (`{ t: 'estado', id, estado, texto }`…).

## 3 · Engancharse a lo que ya existe

Antes de meter llamadas en la lógica de negocio, buscar **observadores,
callbacks, emisores de progreso, eventos o logs estructurados que ya existan**
(un `emit`, un `onProgress`, un `observarConsumo()`…). Engancharse ahí con **una
sola línea** y poner la traducción en un archivo aparte (`oficina-<app>.mjs` o
`.cjs`), todo dentro de `try/catch`: la oficina nunca puede romper ni frenar el
trabajo real.

**No inventar actividad.** Si una persona no tiene equivalente real en ese
entorno (en local no hay cobro, ni revisión, ni correo…), no se mueve, y se dice
en la entrega.

## 4 · El idioma de eventos

```js
const c = oficina.canal(job.id);                     // o oficina.canal() si solo hay un trabajo a la vez
c.inicio({ titulo: 'Pedido 123', resumen: '24 productos' });
c.trabaja('nadia', 'Busca el producto 4 de 24');     // también: espera, bloqueado, hecho, libre
c.entrega('nadia', 'rosa', 'box', 'Producto 4');      // de 'door' = entra por la puerta
c.paso('Búsqueda', 'Nadia busca productos');          // texto de la barra
c.progreso(0.25);                                     // de 0 a 1
c.fin({ filas: [['Procesados', '24'], ['Encontrados', '22', 'ok'], ['No encontrados', '2', 'mal']] });
c.fin({ ok: false, titulo: 'Trabajo detenido', nota: 'Motivo…', filas: [...] });
c.estado('nadia');                                    // 'trabaja' | 'espera' | 'bloqueado' | 'hecho' | 'libre'
```

Objetos de las entregas: `ticket box photos folder postit pen sign zip`. Las
repetitivas se espacian solas; los hitos, con `{ importante: true }`. Las personas
son las claves de `T` en `datos.js`. Quien abre la oficina a mitad de trabajo
recibe el estado actual.

## 5 · Las rutas en la aplicación

Las cuatro, con **el mismo login que el resto de la aplicación**, y la de eventos
antes que la de estáticos:

```js
app.get('/oficina/eventos', proteger, oficina.sse);
app.get('/oficina/sondeo', proteger, oficina.sondeo);          // si se usa el sondeo
app.get('/oficina/prueba', proteger, (req, res) => {           // trabajo falso, sin gastar
  const id = oficina.ensayo(GUION_DE_PRUEBA);                   // [[ms, c => { c.trabaja(…) }], …] ~40 s
  res.redirect(`/oficina/?job=${id}`);
});
app.get(['/oficina', '/oficina/:archivo'], proteger, oficina.estatico('docs/oficina-virtual'));
```

`GUION_DE_PRUEBA` repite **las mismas fases** que el traductor real, con sus
mismas llamadas, unos 40 s en total y **sin llamar a ningún servicio externo**
(ni APIs de pago ni bases de datos). La oficina se entrega siempre como
**`http://localhost:<puerto>/oficina/`**, nunca como ruta de disco: desde
`file://` la conexión no funciona.

## 6 · Plan, visto bueno y reinicio

1. Enseñar el plan antes de tocar nada: los archivos que se cambian y qué línea va
   en cada sitio. Esperar el visto bueno con el menú.
2. Aplicar: librería, traductor, rutas, `directo` en `datos.js`.
3. **Antes de reiniciar el servidor de la persona, mirar si hay trabajo en curso**
   (log, estado de los trabajos, procesos). Si lo hay, esperar o preguntar diciendo
   que se perdería. Si no se puede reiniciar, probar en una copia en otro puerto.
4. Avisar en la entrega de que hay que reiniciar la aplicación para ver la conexión.

## 7 · Comprobar de verdad

```
python3 scripts/oficina.py comprobar http://localhost:<puerto>/oficina/ --prueba
```

Revisa que `/oficina/` y `datos.js` responden 200, que los eventos responden
como `text/event-stream` (o el sondeo como JSON) y, con `--prueba`, abre
`/oficina/prueba` en un Chrome sin ventana: tiene que pasar a modo directo, llegar
al informe final y no tener errores de consola. Guarda dos capturas. Si falla, se
arregla antes de entregar.

## 8 · Entregar

- La dirección de la oficina y la de la prueba.
- Qué está conectado y a qué parte del trabajo real; qué personas no se mueven
  en ese entorno y por qué; si falta algo (p. ej. producción en serverless), qué
  haría falta.
- Si hay que reiniciar la aplicación.
