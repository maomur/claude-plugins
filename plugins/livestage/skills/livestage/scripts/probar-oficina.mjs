// Prueba de punta a punta de una oficina conectada, sin dependencias (usa el Chrome instalado).
// uso: node probar-oficina.mjs http://localhost:PUERTO/oficina/prueba [segundos_max]
// Abre la ruta de prueba (que lanza un trabajo falso y redirige a la oficina) y comprueba:
//   1) la oficina pasa a modo directo, 2) sale el informe final del jefe, 3) no hay errores de consola,
//   4) con el trabajo en directo, 10 cambios de estilo responden en menos de 1 s, no crecen el historial y dejan
//      una sola conexión en directo abierta. La caché de ida y vuelta (bfcache) va activada, como en Chrome normal:
//      si cada cambio dejara la página anterior en la caché con su conexión viva, se agotarían las 6 por origen.
// Guarda dos capturas en la carpeta temporal y sale con 0 si todo va bien.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [url, maxSeg = '90'] = process.argv.slice(2);
if (!url) { console.log('uso: node probar-oficina.mjs http://localhost:PUERTO/oficina/prueba'); process.exit(2); }
const candidatos = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
const chromeBin = candidatos.find(p => { try { return fs.existsSync(p); } catch { return false; } });
if (!chromeBin) { console.log('prueba     no encuentro Chrome (variable CHROME=ruta para indicarlo)'); process.exit(1); }

const puerto = 9300 + Math.floor(Math.random() * 500);
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'livestage-'));
const chrome = spawn(chromeBin, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
const salir = (codigo) => { try { chrome.kill(); } catch {} process.exit(codigo); };

let ws;
for (let i = 0; i < 60 && !ws; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); const p = l.find(t => t.type === 'page'); if (p) ws = p.webSocketDebuggerUrl; } catch {}
  if (!ws) await espera(250);
}
if (!ws) { console.log('prueba     Chrome no arrancó'); salir(1); }
const s = new WebSocket(ws); await new Promise(r => (s.onopen = r));
// Conexiones en directo de la página actual (requestId → documento). Las de páginas anteriores no se cuentan aquí: que
// ninguna siga viva en la bfcache lo garantiza que el historial no crezca (Chrome no siempre avisa del cierre al salir).
let id = 0; const pend = {}; const errores = []; const conexiones = new Map(); let docActual = null;
s.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.method === 'Network.requestWillBeSent' && d.params.type === 'EventSource') conexiones.set(d.params.requestId, d.params.loaderId);
  if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) docActual = d.params.frame.loaderId;
  if (d.method === 'Network.loadingFinished' || d.method === 'Network.loadingFailed') conexiones.delete(d.params.requestId);
  if (d.id && pend[d.id]) { pend[d.id](d.result); delete pend[d.id]; }
  if (d.method === 'Runtime.exceptionThrown') errores.push(d.params.exceptionDetails.exception?.description?.split('\n')[0] || 'excepción');
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errores.push(d.params.args.map(a => a.value ?? a.description).join(' '));
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon/.test(d.params.entry.url || '')) errores.push(d.params.entry.text);
};
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; s.send(JSON.stringify({ id: i, method, params })); });
const evaluar = async e => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true }))?.result?.value;
const captura = async nombre => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); const f = path.join(os.tmpdir(), nombre); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); return f; };

await cmd('Runtime.enable'); await cmd('Log.enable'); await cmd('Page.enable'); await cmd('Network.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 860, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url });

let directo = false, final = false, capDirecto = '', capFinal = '', cambios = null;
const ESTILOS = ['1-pixel.html', '4-ilustracion-plana.html', '6-pizarra.html', '2-isometrica.html', '5-maqueta-papel.html',
  '3-plano-arquitecto.html', '8-realista-3d.html', '7-holografico.html'];
async function probarCambios() {   // 10 cambios de estilo con el trabajo en marcha
  const historial = async () => (await cmd('Page.getNavigationHistory'))?.entries?.length || 0;
  const h0 = await historial(), tiempos = [];
  for (let k = 0; k < 10; k++) {
    const actual = await evaluar('location.pathname.split("/").pop()');
    const dest = ESTILOS.filter(e => e !== actual)[k % (ESTILOS.length - 1)];
    await evaluar(`(()=>{const b=document.getElementById('estilo'),o=document.querySelector('#estiloMenu li[data-v="${dest}"]');if(!b||!o)return 0;b.click();o.click();return 1;})()`);
    // se cuenta desde que el clic se ha ejecutado: en un Chrome sin tarjeta gráfica, el estilo 3D ocupa la página y
    // la propia orden de pulsar tarda en llegar, lo que no tiene que ver con las conexiones
    let ms = null; const t0 = Date.now();
    // responde = el navegador ya está en la página nueva (si no quedan conexiones libres, la petición se queda en cola y no llega)
    while (Date.now() - t0 < 3000) { const v = await evaluar('location.pathname'); if (v && v.includes(dest)) { ms = Date.now() - t0; break; } await espera(25); }
    tiempos.push({ ms, desde3d: actual === '8-realista-3d.html' });
    const t1 = Date.now();   // antes del siguiente cambio, que la página nueva esté lista (no cuenta en el tiempo de respuesta)
    while (Date.now() - t1 < 10000) { if (await evaluar(`document.readyState==='complete'&&!!window.OF_LISTA`)) break; await espera(80); }
    await espera(900);
  }
  await espera(1500);
  return { tiempos, crece: (await historial()) - h0, abiertas: [...conexiones.values()].filter(l => l === docActual).length };
}
const limite = Date.now() + Number(maxSeg) * 1000;
while (Date.now() < limite && !final) {
  await espera(700);
  const e = await evaluar(`(()=>{const p=document.getElementById('play'),f=document.querySelector('.fin');
    return JSON.stringify({directo:!!(p&&p.hidden), final:!!(f&&!f.hidden), barra:(document.getElementById('log')||{}).textContent||''});})()`);
  if (!e) continue;
  const v = JSON.parse(e);
  if (v.directo && !directo) { directo = true; await espera(2500); capDirecto = await captura('livestage-directo.png'); console.log('prueba     en directo: ' + v.barra.slice(0, 90));
    if (!v.final) cambios = await probarCambios(); }
  if (v.final) { final = true; await espera(1500); capFinal = await captura('livestage-final.png'); }
}
console.log('prueba     modo directo: ' + (directo ? 'sí' : 'NO'));
console.log('prueba     informe final: ' + (final ? 'sí' : 'NO'));
// Límite: 1 s. Al salir del 3D, 2,5 s: este Chrome lo dibuja por software (swiftshader) y acabar su último fotograma
// tarda; con las conexiones agotadas la página nueva no llegaría nunca, así que el bloqueo se sigue detectando.
const cambiosOk = !!cambios && cambios.tiempos.every(t => t.ms !== null && t.ms < (t.desde3d ? 2500 : 1000)) && cambios.crece === 0 && cambios.abiertas <= 1;
if (cambios) console.log('prueba     cambios de estilo en directo: ' + cambios.tiempos.map(t => t.ms === null ? 'NO' : t.ms + ' ms' + (t.desde3d ? ' (desde 3D)' : '')).join(' ')
  + ` · historial +${cambios.crece} · conexiones abiertas ${cambios.abiertas} → ` + (cambiosOk ? 'bien' : 'MAL'));
else console.log('prueba     cambios de estilo en directo: no se pudo probar (el trabajo acabó antes)');
console.log('prueba     errores de consola: ' + (errores.length ? errores.slice(0, 5).join(' | ') : 'ninguno'));
if (capDirecto || capFinal) console.log('prueba     capturas: ' + [capDirecto, capFinal].filter(Boolean).join(' · '));
salir(directo && final && cambiosOk && !errores.length ? 0 : 1);
