/* oficina-eventos.js — conecta una aplicación con su oficina virtual.
   Sin dependencias (Node 14 o superior). Va en la aplicación, no en la oficina.

   1) Exponer la ruta de eventos (Express, Connect o http puro):
        const oficina = require('./oficina-eventos');
        app.get('/oficina/eventos', oficina.sse);        // con el mismo login que el resto de la app

   2) En datos.js de la oficina:   directo: { url: 'eventos' }
      (relativa a la carpeta donde se sirven los estilos; la oficina añade ?job=… si la página lo trae)

   3) Avisar desde el código, en los puntos donde ya ocurre cada cosa:
        const c = oficina.canal(job.id);                  // un canal por trabajo; oficina.canal() si solo hay uno
        c.inicio({ titulo: 'Pedido 123', resumen: '24 productos' });
        c.trabaja('nadia', 'Busca el producto 4 de 24');   // también: espera, bloqueado, hecho, libre
        c.entrega('nadia', 'rosa', 'box', 'Producto 4');    // objetos: ticket box photos folder postit pen sign zip
        c.paso('Data Sourcing', 'Nadia busca productos');   // texto de la barra
        c.progreso(0.25);                                   // barra de progreso, de 0 a 1
        c.fin({ filas: [['Procesados', '24'], ['Encontrados', '22', 'ok'], ['No encontrados', '2', 'mal']] });
        c.fin({ ok: false, titulo: 'Job detenido', nota: 'Motivo…', filas: [...] });   // si se para o falla

   Las claves de las personas (nadia, rosa…) son las de T en datos.js.
   Avisar nunca debe romper el trabajo real: todas las llamadas son seguras aunque nadie mire. */
'use strict';

const VERBO = { working: 'trabaja', waiting: 'espera', blocked: 'bloqueado', done: 'hecho', idle: 'libre' };
const canales = new Map();
const oyentes = new Set();          // { res, canal: id | null }   null = sigue al último trabajo que empezó
let ultimo = null;

function enviar(res, ev) { try { res.write(`data: ${JSON.stringify(ev)}\n\n`); } catch (e) { /* conexión cerrada */ } }

class Canal {
  constructor(id) { this.id = id; this.reiniciar(); this.activo = false; this.ultimaEntrega = 0; }
  reiniciar() { this.estados = {}; this.inicioEv = null; this.pasoEv = null; this.progresoV = null; this.finEv = null; }
  _emitir(ev) {
    ev.canal = this.id;
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
    return ev.map(e => ({ ...e, canal: this.id }));
  }
}

function canal(id = 'principal') {
  id = String(id);
  if (!canales.has(id)) canales.set(id, new Canal(id));
  return canales.get(id);
}

/** Ruta de eventos (Server-Sent Events). ?job=<id> o ?canal=<id> para un trabajo concreto;
    sin parámetro, sigue al último trabajo que empezó. */
function sse(req, res) {
  const url = new URL(req.url, 'http://local');
  const pedido = url.searchParams.get('canal') || url.searchParams.get('job') || null;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',          // que Nginx no lo retenga
  });
  res.write('retry: 3000\n\n');
  const o = { res, canal: pedido };
  oyentes.add(o);
  const c = pedido ? canales.get(pedido) : (ultimo && ultimo.activo ? ultimo : null);
  if (c) for (const ev of c._foto()) enviar(res, ev);
  const latido = setInterval(() => { try { res.write(': latido\n\n'); } catch (e) { /* cerrada */ } }, 25000);
  req.on('close', () => { clearInterval(latido); oyentes.delete(o); });
}

module.exports = { canal, sse };
