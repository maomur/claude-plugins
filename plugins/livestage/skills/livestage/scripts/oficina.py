#!/usr/bin/env python3
"""Instala, migra y revisa la oficina virtual de un proyecto.

La oficina de un proyecto vive en una carpeta (por defecto docs/oficina-virtual/)
con los 8 estilos y un único archivo de datos, datos.js, que leen todos.

Uso:
  python3 oficina.py buscar PROYECTO
      Busca oficinas ya montadas en el proyecto y dice de qué tipo es cada una:
        datos      carpeta con datos.js y los 8 estilos (formato actual)
        integrada  un HTML dentro de la aplicación que lee datos reales
                   (fetch, /api/…): se cambia en su sitio, nunca se migra
        antigua    un HTML suelto con los datos dentro: se puede migrar
      Si no hay ninguna, dice «ninguna» (no es un error: sale con código 0).

  python3 oficina.py libreria CARPETA
      Copia la librería que conecta la aplicación con la oficina en directo a
      CARPETA (p. ej. su lib/): oficina-eventos.cjs y oficina-eventos.mjs.
      Lee el package.json más cercano y dice cuál importar (ESM o CommonJS).

  python3 oficina.py instalar DESTINO
      Copia (o actualiza) los 8 estilos en DESTINO. Si DESTINO ya tiene
      datos.js, NO lo toca: así se actualiza el diseño sin perder los datos.
      Si no lo tiene, copia el de ejemplo para rellenarlo después.

  python3 oficina.py migrar HTML_ANTIGUO DESTINO
      Saca los datos de una oficina antigua (un único HTML con los datos
      dentro) a DESTINO/datos.js e instala los 8 estilos al lado.

  python3 oficina.py version [CARPETA_OFICINA]
      Dice qué versión de LiveStage está instalada, cuál es la última
      publicada en GitHub (si hay conexión; si no, «desconocida») y, si se da
      la carpeta de una oficina, con qué versión se instaló su diseño
      («anterior» si es de antes de que se apuntara). Termina con las
      recomendaciones: ACTUALIZAR_PLUGIN, ACTUALIZAR_DISENO o AL_DIA.

  python3 oficina.py comprobar DESTINO|HTML
      Revisa que los datos sean coherentes: personas, puestos, áreas, pasos,
      tareas y entregas. Acepta la carpeta con datos.js o el HTML de una
      oficina integrada o antigua. Necesita node.

  python3 oficina.py comprobar http://localhost:PUERTO/oficina/ [--prueba]
      Revisa la oficina servida por la aplicación: /oficina/ y datos.js
      responden 200 y /oficina/eventos responde como text/event-stream (o
      /oficina/sondeo como JSON). Con --prueba, lanza /oficina/prueba en un
      Chrome sin ventana y comprueba que pasa a modo directo, que sale el
      informe final y que no hay errores en la consola; además, con el trabajo
      en directo, hace 10 cambios de estilo con la bfcache activada y exige que
      respondan en menos de 1 s, sin crecer el historial y con una sola
      conexión en directo abierta (scripts/probar-oficina.mjs).
"""
import json, os, re, shutil, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
PLANTILLAS = os.path.normpath(os.path.join(AQUI, '..', 'assets', 'oficinas'))
ESTILOS = ['1-pixel.html', '2-isometrica.html', '3-plano-arquitecto.html', '4-ilustracion-plana.html',
           '5-maqueta-papel.html', '6-pizarra.html', '7-holografico.html', '8-realista-3d.html']
# Posición de la etiqueta de cada área en el dibujo -> sala física
SALAS = {(15, 6): 'despacho', (7, 178): 'recepcion', (17, 84): 'izquierda', (127, 6): 'isla',
         (127, 99): 'mesa-larga', (276, 6): 'arriba-derecha', (276, 86): 'derecha',
         (276, 180): 'abajo-derecha', (138, 180): 'office'}
BLOQUES = ['T', 'SEAT', 'ZONES', 'STEPS', 'ACT', 'HAND']
SALTAR = {'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'vendor', '.venv', 'venv', '__pycache__', 'coverage', '.cache'}
PLUGIN_JSON = os.path.normpath(os.path.join(AQUI, '..', '..', '..', '.claude-plugin', 'plugin.json'))
ULTIMA_URL = 'https://raw.githubusercontent.com/maomur/livestage/main/plugins/livestage/.claude-plugin/plugin.json'
MARCA = '.livestage-version'   # en la carpeta de la oficina: versión con la que se instaló el diseño
VIVO = re.compile(r'fetch\(|EventSource|WebSocket|/api/|XMLHttpRequest|socket\.io')


def buscar(proyecto):
    halladas = []
    for raiz, dirs, archivos in os.walk(proyecto):
        dirs[:] = [d for d in dirs if d not in SALTAR]
        for a in archivos:
            if not a.endswith(('.html', '.js')):
                continue
            ruta = os.path.join(raiz, a)
            try:
                if os.path.getsize(ruta) > 3_000_000:
                    continue
                s = open(ruta, encoding='utf-8', errors='ignore').read()
            except OSError:
                continue
            if a == 'datos.js' and 'window.OFICINA' in s:
                halladas.append(('datos', raiz))
            elif a.endswith('.html') and 'const ZONES' in s and 'const STEPS' in s and 'id="plano"' in s \
                    and 'src="datos.js"' not in s:
                halladas.append(('integrada' if VIVO.search(s) else 'antigua', ruta))
    for tipo, ruta in halladas:
        print('%s\t%s' % (tipo, os.path.relpath(ruta, proyecto)))
    if not halladas:
        print('ninguna')


def version_instalada():
    try:
        return json.load(open(PLUGIN_JSON, encoding='utf-8')).get('version') or 'desconocida'
    except Exception:
        return 'desconocida'


def _tupla(v):
    try:
        return tuple(int(x) for x in v.split('.'))
    except Exception:
        return None


def version(carpeta=None):
    actual = version_instalada()
    ultima = 'desconocida'
    try:
        import urllib.request
        with urllib.request.urlopen(ULTIMA_URL, timeout=4) as r:
            ultima = json.loads(r.read().decode('utf-8')).get('version') or 'desconocida'
    except Exception:
        pass
    print('plugin\t' + actual)
    print('ultima\t' + ultima)
    avisos = []
    if _tupla(actual) and _tupla(ultima) and _tupla(ultima) > _tupla(actual):
        avisos.append('ACTUALIZAR_PLUGIN')
    if carpeta:
        oficina = 'anterior'
        try:
            oficina = open(os.path.join(carpeta, MARCA), encoding='utf-8').read().strip() or 'anterior'
        except OSError:
            pass
        print('oficina\t' + oficina)
        if os.path.exists(os.path.join(carpeta, 'datos.js')) and _tupla(actual) and \
                (oficina == 'anterior' or (_tupla(oficina) and _tupla(oficina) < _tupla(actual))):
            avisos.append('ACTUALIZAR_DISENO')
    print('\n'.join(avisos) if avisos else 'AL_DIA')


def instalar(destino):
    os.makedirs(destino, exist_ok=True)
    for f in ESTILOS:
        shutil.copyfile(os.path.join(PLANTILLAS, f), os.path.join(destino, f))
    try:
        open(os.path.join(destino, MARCA), 'w', encoding='utf-8').write(version_instalada() + '\n')
    except OSError:
        pass
    datos = os.path.join(destino, 'datos.js')
    if os.path.exists(datos):
        print('Estilos actualizados. datos.js se ha dejado como estaba.')
    else:
        shutil.copyfile(os.path.join(PLANTILLAS, 'datos.js'), datos)
        print('Estilos instalados con datos.js de ejemplo: hay que rellenarlo.')
    print(os.path.abspath(destino))


def _bloque(s, nombre):
    m = re.search(r'^const ' + nombre + r'\s*=\s*', s, re.M)
    if not m:
        raise SystemExit('No encuentro el bloque %s en la oficina antigua.' % nombre)
    i = m.end(); ab = s[i]; ci = {'{': '}', '[': ']'}[ab]; d = 0; j = i; cad = None
    while True:
        c = s[j]
        if cad:
            if c == '\\':
                j += 2; continue
            if c == cad:
                cad = None
        elif c in '\'"`':
            cad = c
        elif c == ab:
            d += 1
        elif c == ci:
            d -= 1
            if d == 0:
                return s[i:j + 1]
        j += 1


def _js(texto):
    return "'" + texto.replace('\\', '\\\\').replace("'", "\\'") + "'"


def migrar(antiguo, destino):
    s = open(antiguo, encoding='utf-8').read()
    if 'window.OFICINA' in s:
        raise SystemExit('Esta oficina ya usa datos.js: no hace falta migrarla.')
    b = {n: _bloque(s, n) for n in BLOQUES}

    def con_sala(m):
        clave = SALAS.get((int(m.group(2)), int(m.group(3))))
        return m.group(0) if not clave else "{sala:'%s', name:%s, x:%s, y:%s" % (clave, m.group(1), m.group(2), m.group(3))
    b['ZONES'] = re.sub(r"\{name:\s*('(?:[^'\\]|\\.)*'),\s*x:\s*(\d+),\s*y:\s*(\d+)", con_sala, b['ZONES'])

    intro = re.search(r"const INTRO='<span class=\"step\">[^<]*</span>([^']*)'", s)
    partes = (intro.group(1) if intro else '').split(' · ', 1)
    titulo = re.search(r'<title>([^<]*)</title>', s)
    empresa = ''
    if titulo:
        m = re.search(r'\bde (?:la oficina )?([^<]+)$', titulo.group(1)) or re.search(r'oficina ([^<]+)$', titulo.group(1))
        empresa = m.group(1).strip() if m else ''
    primera = re.search(r"select\('([a-z0-9_]+)'\)", s)

    ejemplo = open(os.path.join(PLANTILLAS, 'datos.js'), encoding='utf-8').read()
    cabecera = ejemplo[:ejemplo.index('window.OFICINA')]
    datos = cabecera + 'window.OFICINA = {\n\n'
    datos += 'empresa: %s,\n' % _js(empresa)
    datos += 'job: { nombre: %s, resumen: %s },\n' % (_js(partes[0]), _js(partes[1] if len(partes) > 1 else ''))
    nombre = os.path.basename(antiguo)
    estilo = nombre if nombre in ESTILOS else next((e for e in ESTILOS if e.split('-', 1)[1].split('.')[0] in nombre), '4-ilustracion-plana.html')
    datos += 'primera: %s,   // persona cuya ficha se abre al empezar\n' % _js(primera.group(1) if primera else '')
    datos += 'estilo: %s,   // el estilo que se abre primero (se cambia con el selector)\n\n' % _js(estilo)
    datos += ',\n\n'.join('%s: %s' % (n, b[n]) for n in BLOQUES) + '\n\n};\n'

    os.makedirs(destino, exist_ok=True)
    ruta = os.path.join(destino, 'datos.js')
    if os.path.exists(ruta):
        raise SystemExit('Ya existe %s: no lo sobrescribo.' % ruta)
    open(ruta, 'w', encoding='utf-8').write(datos)
    sin_sala = len(re.findall(r'\{name:', b['ZONES']))
    print('Datos migrados a %s (empresa: %r).' % (ruta, empresa))
    if sin_sala:
        print('AVISO: %d área(s) sin sala reconocida; revisar ZONES a mano.' % sin_sala)
    instalar(destino)


COMPROBAR_JS = r'''
global.window = {};
try { require(process.argv[1]); } catch (e) { console.log('ERROR de sintaxis en datos.js: ' + e.message); process.exit(1); }
const O = window.OFICINA, P = [];
if (!O) { console.log('ERROR: datos.js no define window.OFICINA'); process.exit(1); }
const ids = Object.keys(O.T || {});
const PUESTOS = ['52,22','46,200','34,113','78,113','77,134','176,24','212,24','176,58','212,58','166,118','200,118','234,118','183,146','217,146','320,36','326,48','318,122','352,152','326,224'];
const SALAS = ['despacho','recepcion','izquierda','isla','mesa-larga','arriba-derecha','derecha','abajo-derecha','office'];
const EST = ['working','waiting','blocked','done','idle'], OBJ = ['ticket','box','photos','folder','postit','pen','sign','zip'];
if (!ids.length) P.push('No hay personas en T.');
if (ids.length > 17) P.push('Hay ' + ids.length + ' personas y la oficina solo tiene 17 puestos.');
for (const id of ids) {
  const t = O.T[id];
  for (const k of ['name','short','role','color','s']) if (!t[k]) P.push('T.' + id + ': falta «' + k + '».');
  const s = (O.SEAT || {})[id];
  if (!s) P.push('SEAT: ' + id + ' no tiene puesto.');
  else if (!PUESTOS.includes(s.x + ',' + s.y)) P.push('SEAT.' + id + ': ' + s.x + ',' + s.y + ' no es uno de los puestos del dibujo.');
}
const usados = {};
for (const [id, s] of Object.entries(O.SEAT || {})) {
  if (!O.T[id]) P.push('SEAT.' + id + ': no existe esa persona en T.');
  const k = s.x + ',' + s.y; if (usados[k]) P.push('SEAT: ' + usados[k] + ' y ' + id + ' comparten puesto.'); usados[k] = id;
}
const enZona = new Set();
for (const z of O.ZONES || []) {
  if (z.sala !== undefined && !SALAS.includes(z.sala)) P.push('ZONES «' + z.name + '»: sala «' + z.sala + '» desconocida.');
  if (!z.name) P.push('ZONES (' + z.sala + '): falta el nombre.');
  for (const id of z.ids || []) { if (!O.T[id]) P.push('ZONES «' + z.name + '»: ' + id + ' no existe.'); enZona.add(id); }
}
for (const id of ids) if (!enZona.has(id)) P.push(id + ' no está en ningún área (ZONES).');
const n = (O.STEPS || []).length;
if (!n) P.push('No hay pasos en STEPS.');
(O.STEPS || []).forEach((st, i) => {
  if (!Array.isArray(st) || typeof st[1] !== 'string' || typeof st[2] !== 'number') { P.push('STEPS[' + i + ']: formato [ {persona:estado}, texto, milisegundos ].'); return; }
  for (const [id, e] of Object.entries(st[0])) { if (!O.T[id]) P.push('STEPS[' + i + ']: ' + id + ' no existe.'); if (!EST.includes(e)) P.push('STEPS[' + i + ']: estado «' + e + '» no válido.'); }
});
for (const [k, v] of Object.entries(O.ACT || {})) {
  if (+k >= n) P.push('ACT[' + k + ']: no existe ese paso.');
  for (const id of Object.keys(v)) if (!O.T[id]) P.push('ACT[' + k + ']: ' + id + ' no existe.');
}
for (const [k, v] of Object.entries(O.HAND || {})) {
  if (+k >= n) P.push('HAND[' + k + ']: no existe ese paso.');
  for (const h of v) {
    if (h[0] !== 'door' && !O.T[h[0]]) P.push('HAND[' + k + ']: ' + h[0] + ' no existe.');
    if (!O.T[h[1]]) P.push('HAND[' + k + ']: ' + h[1] + ' no existe.');
    if (!OBJ.includes(h[2])) P.push('HAND[' + k + ']: objeto «' + h[2] + '» no válido.');
  }
}
if (O.primera && !O.T[O.primera]) P.push('primera: ' + O.primera + ' no existe.');
console.log(P.length ? P.map(p => '- ' + p).join('\n') : 'OK: ' + ids.length + ' personas, ' + (O.ZONES || []).length + ' áreas, ' + n + ' pasos.');
process.exit(P.length ? 1 : 0);
'''


def comprobar_url(base, prueba):
    sys.stdout.reconfigure(line_buffering=True)   # que las líneas salgan en orden con las de la prueba
    import urllib.request, json as _json
    base = base if base.endswith('/') else base + '/'
    fallos = []
    def pedir(url, cabeceras_solo=False):
        req = urllib.request.Request(url, headers={'Accept': '*/*'})
        r = urllib.request.urlopen(req, timeout=8)
        if cabeceras_solo:
            ct = r.headers.get('Content-Type', ''); r.close(); return r.status, ct, b''
        return r.status, r.headers.get('Content-Type', ''), r.read(200000)
    for nombre, url in [('oficina', base), ('datos.js', base + 'datos.js')]:
        try:
            st, ct, cuerpo = pedir(url)
            print('%-10s %s %s' % (nombre, st, ct.split(';')[0]))
            if st != 200: fallos.append(nombre)
            if nombre == 'datos.js':
                m = re.search(rb"directo:\s*\{\s*url:\s*'([^']+)'(?:\s*,\s*modo:\s*'(\w+)')?", cuerpo)
                directo = (m.group(1).decode(), (m.group(2) or b'sse').decode()) if m else None
        except Exception as e:
            print('%-10s ERROR %s' % (nombre, e)); fallos.append(nombre); directo = None
    if not directo:
        print('directo    sin configurar en datos.js (la oficina no se moverá con la aplicación)'); fallos.append('directo')
    else:
        url, modo = base + directo[0], directo[1]
        try:
            st, ct, cuerpo = pedir(url, cabeceras_solo=(modo != 'sondeo'))
            esperado = 'application/json' if modo == 'sondeo' else 'text/event-stream'
            print('%-10s %s %s' % (directo[0], st, ct.split(';')[0]))
            if st != 200 or esperado not in ct: fallos.append(directo[0])
            if modo == 'sondeo': _json.loads(cuerpo or b'{}')
        except Exception as e:
            print('%-10s ERROR %s' % (directo[0], e)); fallos.append(directo[0])
    if prueba and not fallos:
        if not shutil.which('node'):
            print('prueba     sin node: no se puede lanzar el navegador'); fallos.append('prueba')
        else:
            r = subprocess.run(['node', os.path.join(AQUI, 'probar-oficina.mjs'), base + 'prueba'])
            if r.returncode: fallos.append('prueba')
    print('OK' if not fallos else 'FALLA: ' + ', '.join(fallos))
    sys.exit(1 if fallos else 0)


def comprobar(destino):
    if not shutil.which('node'):
        raise SystemExit('Sin node no puedo revisar los datos: abrir la oficina en el navegador y mirar que cargue.')
    temporal = None
    if destino.endswith('.html'):
        # oficina integrada o antigua: sacar sus bloques a un archivo temporal
        import tempfile
        s = open(destino, encoding='utf-8').read()
        js = 'window.OFICINA = {\n' + ',\n'.join('%s: %s' % (n, _bloque(s, n)) for n in BLOQUES) + '\n};\n'
        fd, temporal = tempfile.mkstemp(suffix='.js'); os.close(fd)
        open(temporal, 'w', encoding='utf-8').write(js)
        ruta = temporal
    else:
        ruta = os.path.abspath(os.path.join(destino, 'datos.js'))
        if not os.path.exists(ruta):
            raise SystemExit('No existe %s' % ruta)
    try:
        r = subprocess.run(['node', '-e', COMPROBAR_JS, ruta])
    finally:
        if temporal:
            os.remove(temporal)
    sys.exit(r.returncode)


if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) == 2 and a[0] == 'buscar':
        buscar(a[1])
    elif len(a) == 2 and a[0] == 'libreria':
        os.makedirs(a[1], exist_ok=True)
        for ext in ('cjs', 'mjs'):
            shutil.copyfile(os.path.join(AQUI, '..', 'assets', 'conexion', 'oficina-eventos.' + ext), os.path.join(a[1], 'oficina-eventos.' + ext))
        # ¿ESM o CommonJS? Lo dice el package.json más cercano
        d, tipo = os.path.abspath(a[1]), 'commonjs'
        while True:
            pj = os.path.join(d, 'package.json')
            if os.path.exists(pj):
                try:
                    import json as _json
                    tipo = _json.load(open(pj, encoding='utf-8')).get('type', 'commonjs')
                except Exception:
                    pass
                break
            if os.path.dirname(d) == d: break
            d = os.path.dirname(d)
        print(os.path.abspath(a[1]))
        if tipo == 'module':
            print("Proyecto ESM: import oficina from './oficina-eventos.mjs';")
        else:
            print("Proyecto CommonJS: const oficina = require('./oficina-eventos.cjs');")
    elif len(a) in (1, 2) and a[0] == 'version':
        version(a[1] if len(a) == 2 else None)
    elif len(a) == 2 and a[0] == 'instalar':
        instalar(a[1])
    elif len(a) == 3 and a[0] == 'migrar':
        migrar(a[1], a[2])
    elif len(a) in (2, 3) and a[0] == 'comprobar' and a[1].startswith(('http://', 'https://')):
        comprobar_url(a[1], '--prueba' in a[2:])
    elif len(a) == 2 and a[0] == 'comprobar':
        comprobar(a[1])
    else:
        print(__doc__)
        sys.exit(2)
