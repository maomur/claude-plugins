/* oficina-eventos — conecta una aplicación con su oficina virtual (LiveStage).
   Sin dependencias (Node 14 o superior). Va en la aplicación, no en la oficina.
   Dos archivos, mismo contenido: oficina-eventos.cjs (CommonJS) y oficina-eventos.mjs (ESM, lo envuelve).

     CommonJS:  const oficina = require('./oficina-eventos.cjs');
     ESM:       import oficina from './oficina-eventos.mjs';

   1) Servir la oficina y sus eventos desde la propia aplicación (mismo origen, mismo login):
        app.get('/oficina/eventos', proteger, oficina.sse);              // en directo (Server-Sent Events)
        app.get('/oficina/sondeo', proteger, oficina.sondeo);            // alternativa por sondeo (JSON)
        app.get(['/oficina', '/oficina/:archivo'], proteger, oficina.estatico('docs/oficina-virtual'));
      Con http puro: oficina.sse(req, res), oficina.sondeo(req, res), oficina.estatico(carpeta)(req, res).
      La oficina se entrega siempre como URL: http://localhost:<puerto>/oficina/

   2) En datos.js de la oficina:   directo: { url: 'eventos' }
      (o directo: { url: 'sondeo', modo: 'sondeo', cada: 2000 } si no hay proceso que mantenga la conexión)

   3) Avisar desde el código, en los puntos donde ya ocurre cada cosa:
        const c = oficina.canal(job.id);                  // un canal por trabajo; oficina.canal() si solo hay uno
        c.inicio({ titulo: 'Pedido 123', resumen: '24 productos' });
        c.trabaja('nadia', 'Busca el producto 4 de 24');   // también: espera, bloqueado, hecho, libre
        c.entrega('nadia', 'rosa', 'box', 'Producto 4');    // objetos: ticket box photos folder postit pen sign zip
        c.paso('Búsqueda', 'Nadia busca productos');        // texto de la barra
        c.progreso(0.25);                                   // barra de progreso, de 0 a 1
        c.fin({ filas: [['Procesados', '24'], ['Encontrados', '22', 'ok'], ['No encontrados', '2', 'mal']] });
        c.fin({ ok: false, titulo: 'Trabajo detenido', nota: 'Motivo…', filas: [...] });   // si se para o falla

   Las claves de las personas (nadia, rosa…) son las de T en datos.js.
   Avisar nunca debe romper el trabajo real: todas las llamadas son seguras aunque nadie mire. */
'use strict';
const fs = require('fs');
const path = require('path');

const VERBO = { working: 'trabaja', waiting: 'espera', blocked: 'bloqueado', done: 'hecho', idle: 'libre' };
const canales = new Map();
const oyentes = new Set();          // { res, canal: id | null }   null = sigue al último trabajo que empezó
let ultimo = null;

function enviar(res, ev) { try { res.write(`data: ${JSON.stringify(ev)}\n\n`); } catch (e) { /* conexión cerrada */ } }

class Canal {
  constructor(id) { this.id = id; this.reiniciar(); this.activo = false; this.ultimaEntrega = 0; }
  reiniciar() {
    this.base = (this.base || 0) + (this.registro ? this.registro.length : 0);   // posición del primer evento guardado
    this.registro = []; this.estados = {}; this.inicioEv = null; this.pasoEv = null; this.progresoV = null; this.finEv = null;
  }
  _emitir(ev) {
    ev.canal = this.id;
    this.registro.push(ev); if (this.registro.length > 3000) { this.registro.shift(); this.base++; }
    for (const o of oyentes) if (o.canal === this.id || (o.canal === null && ultimo === this)) enviar(o.res, ev);
  }
  inicio(info = {}) {
    this.reiniciar(); this.activo = true; ultimo = this;
    this.inicioEv = { t: 'inicio', titulo: info.titulo || '', resumen: info.resumen || '' };
    this._emitir({ ...this.inicioEv });
    return this;
  }
  _estado(id, estado, texto) {
    if (!this.activo && !this.finEv) this.inicio();
    const prev = this.estados[id];
    if (prev && prev.estado === estado && prev.texto === (texto || '')) return this;
    this.estados[id] = { estado, texto: texto || '' };
    this._emitir({ t: 'estado', id, estado, texto: texto || '' });
    return this;
  }
  trabaja(id, texto) { return this._estado(id, 'working', texto); }
  espera(id, texto) { return this._estado(id, 'waiting', texto); }
  bloqueado(id, texto) { return this._estado(id, 'blocked', texto); }
  hecho(id, texto) { return this._estado(id, 'done', texto); }
  libre(id, texto) { return this._estado(id, 'idle', texto); }
  /** Estado actual de una persona: 'trabaja' | 'espera' | 'bloqueado' | 'hecho' | 'libre'. */
  estado(id) { return VERBO[(this.estados[id] || {}).estado || 'idle']; }
  /** Personas que ya han tenido algún estado en este trabajo. */
  personas() { return Object.keys(this.estados); }
  /** Algo pasa de una persona a otra ('door' = entra por la puerta). Las repetitivas se espacian
      (1,6 s) para no llenar el plano; las que son un hito pasan con { importante: true }. */
  entrega(de, a, objeto, etiqueta, opc = {}) {
    const t = Date.now();
    if (!opc.importante && t - this.ultimaEntrega < 1600) return this;
    this.ultimaEntrega = t;
    this._emitir({ t: 'entrega', de, a, objeto: objeto || 'box', etiqueta: etiqueta || '' });
    return this;
  }
  paso(titulo, texto) { this.pasoEv = { t: 'paso', titulo: titulo || '', texto: texto || '' }; this._emitir({ ...this.pasoEv }); return this; }
  progreso(p) {
    const v = Math.max(0, Math.min(1, Number(p) || 0));
    if (this.progresoV !== null && Math.abs(v - this.progresoV) < 0.005) return this;
    this.progresoV = v; this._emitir({ t: 'progreso', valor: v });
    return this;
  }
  /** Final: lo anuncia el jefe con el informe. info = { ok, titulo, dice, sub, filas: [[etiqueta, valor, 'ok'|'mal']], nota } */
  fin(info = {}) {
    this.finEv = { t: 'fin', ...info }; this.activo = false;
    this._emitir({ ...this.finEv });
    const id = this.id;
    const tm = setTimeout(() => { const c = canales.get(id); if (c && !c.activo) canales.delete(id); }, 6 * 3600 * 1000);
    if (tm.unref) tm.unref();
    return this;
  }
  /** Lo que recibe quien se conecta a mitad de trabajo. */
  _foto() {
    const ev = [];
    if (this.inicioEv) ev.push({ ...this.inicioEv });
    for (const [id, s] of Object.entries(this.estados)) ev.push({ t: 'estado', id, estado: s.estado, texto: s.texto });
    if (this.pasoEv) ev.push({ ...this.pasoEv });
    if (this.progresoV !== null) ev.push({ t: 'progreso', valor: this.progresoV });
    if (this.finEv) ev.push({ ...this.finEv, repeticion: true });
    return ev.map(e => ({ ...e, canal: this.id, foto: true }));
  }
  /** Para el modo sondeo: eventos desde la posición `desde` (0 = estado completo actual). */
  historial(desde) {
    const fin = this.base + this.registro.length;
    const d = Number(desde) || 0;
    if (!d || d < this.base || d > fin) return { eventos: this._foto(), siguiente: fin };
    return { eventos: this.registro.slice(d - this.base), siguiente: fin };
  }
}

function canal(id = 'principal') {
  id = String(id);
  if (!canales.has(id)) canales.set(id, new Canal(id));
  return canales.get(id);
}

function pedido(req) {
  const url = new URL(req.url, 'http://local');
  return { url, canalId: url.searchParams.get('canal') || url.searchParams.get('job') || null };
}

/** Ruta de eventos en directo (Server-Sent Events). ?job=<id> o ?canal=<id> para un trabajo
    concreto; sin parámetro, sigue al último trabajo que empezó. ?visto=<id>: la pestaña ya estaba
    viendo ese trabajo (se ocultó y vuelve); si sigue siendo el último, recibe su estado aunque ya
    haya terminado, para ponerse al día con el informe final. */
function sse(req, res) {
  const { url, canalId } = pedido(req);
  const visto = url.searchParams.get('visto');
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',          // que Nginx no lo retenga
  });
  res.write('retry: 3000\n\n');
  const o = { res, canal: canalId };
  oyentes.add(o);
  let c = canalId ? canales.get(canalId) : (ultimo && ultimo.activo ? ultimo : null);
  if (!c && !canalId && visto && ultimo && ultimo.id === visto) c = ultimo;
  if (c) for (const ev of c._foto()) enviar(res, ev);
  const latido = setInterval(() => { try { res.write(': latido\n\n'); } catch (e) { /* cerrada */ } }, 25000);
  req.on('close', () => { clearInterval(latido); oyentes.delete(o); });
}

/** Ruta de sondeo (JSON): ?desde=<n>&job=<id>. Devuelve { eventos, siguiente }. Para cuando no
    sirve una conexión abierta (proxies que la cortan…). En serverless, la aplicación escribe su
    propio endpoint con la misma forma leyendo los eventos de su almacén. */
function sondeo(req, res) {
  const { url, canalId } = pedido(req);
  const c = canalId ? canales.get(canalId) : ultimo;
  const cuerpo = c ? c.historial(url.searchParams.get('desde')) : { eventos: [], siguiente: 0 };
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(cuerpo));
}

/** Sirve la carpeta de la oficina de forma segura: solo archivos .html y .js de esa carpeta
    (sin subcarpetas ni nombres raros). /oficina/ redirige al estilo de datos.js. */
function estatico(carpeta) {
  const raiz = path.resolve(carpeta);
  return function (req, res, next) {
    const no = () => (typeof next === 'function' ? next() : (res.writeHead(404), res.end()));
    let u; try { u = new URL(req.url, 'http://local'); } catch (e) { return no(); }
    const trozos = u.pathname.split('/');
    let nombre = '';
    try { nombre = decodeURIComponent(trozos[trozos.length - 1] || ''); } catch (e) { return no(); }
    if (!nombre || nombre === 'oficina') {
      let estilo = '4-ilustracion-plana.html';
      try { const m = fs.readFileSync(path.join(raiz, 'datos.js'), 'utf8').match(/^\s*estilo:\s*'([\w.-]+\.html)'/m); if (m) estilo = m[1]; } catch (e) { /* sin datos.js */ }
      const base = u.pathname.endsWith('/') ? u.pathname : u.pathname + '/';
      res.writeHead(302, { Location: base + estilo + u.search });
      return res.end();
    }
    if (!/^[\w.-]+\.(html|js)$/.test(nombre) || nombre.startsWith('.')) return no();
    const archivo = path.join(raiz, nombre);
    if (path.dirname(archivo) !== raiz) return no();
    fs.stat(archivo, (err, st) => {
      if (err || !st.isFile()) return no();
      res.writeHead(200, { 'Content-Type': nombre.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      fs.createReadStream(archivo).pipe(res);
    });
  };
}

/** Ensayo sin coste: reproduce un guion de llamadas con sus pausas, sin tocar servicios externos.
    guion = [[ms, (c) => { c.trabaja(…) }], …]. Para la ruta /oficina/prueba. */
function ensayo(guion, id = 'prueba-' + Date.now().toString(36)) {
  const c = canal(id);
  let t = 0;
  for (const [ms, fn] of guion) { t += ms; const tm = setTimeout(() => { try { fn(c); } catch (e) { /* nunca rompe */ } }, t); if (tm.unref) tm.unref(); }
  return id;
}

module.exports = { canal, sse, sondeo, estatico, ensayo };
