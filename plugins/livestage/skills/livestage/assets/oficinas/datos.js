/* =====================================================================
   DATOS DE LA OFICINA VIRTUAL
   Este es el único archivo que hay que tocar para cambiar nombres: lo leen
   los 8 estilos de esta carpeta. Guarda y recarga la página para verlo.

   Se puede cambiar sin miedo (siempre entre comillas):
   - empresa, job.nombre, job.resumen, estilo, jefe, informe
   - en ZONES: name (el nombre del área que se ve en el plano) y empty
   - en T: name, short, age, from, role, mod, perfil, gesto, frase, colorName
   - en STEPS: el texto de cada paso (y su duración en milisegundos)
   - en ACT: lo que hace cada persona en cada paso
   - en HAND: la etiqueta de lo que se pasan

   No cambiar: sala, x, y, dir, standing, chair (son la posición física de
   cada área y cada puesto en el dibujo) ni las claves de las personas
   (merce, tomi…) salvo que se cambien en todos los bloques a la vez.
   ===================================================================== */
window.OFICINA = {

empresa: 'Nova Market',
job: { nombre: 'Colección Primavera', resumen: '24 productos · es, fr, ca · modo «all»' },
primera: 'merce',   // persona cuya ficha se abre al empezar
jefe: 'merce',      // quien anuncia el final del Job (si no, quien esté en el despacho de dirección)
// informe que enseña el jefe al acabar la simulación (en directo lo manda la aplicación)
informe: [['Productos procesados','24'],['Encontrados','23','ok'],['No encontrados','1','mal'],['Imágenes descargadas','96'],['Descripciones','23 × 3 idiomas'],['Coste estimado','~0,41 €']],
estilo: '4-ilustracion-plana.html',   // el estilo que se abre primero (se cambia con el selector)
// Solo si la oficina va metida en una aplicación:
// volver: { texto: '← Volver a la app', url: '../' },
// directo: { url: 'eventos' },   // la oficina se mueve con el trabajo real (ver references/conexion.md)
// directo: { url: 'sondeo', modo: 'sondeo', cada: 2000 },   // igual, preguntando cada 2 s (trabajo en serverless, colas…)
// extras: ['otro.js'],          // scripts propios, si hicieran falta

/* ---------- Personas ---------- */
T: {
  merce:{name:'Mercè Vidal',short:'Mercè',age:52,from:'Barcelona (Gràcia)',role:'Directora de operaciones',mod:'Orquesta cada trabajo de principio a fin',color:'#24365F',colorName:'Azul marino',
    perfil:'Ex jefa de logística en el puerto de Barcelona. Ve cada Job como un barco que hay que cargar en orden.',
    gesto:'Toca el hombro a quien le toca empezar; al terminar, cierra la tablet.',frase:'Cada uno a lo suyo y el barco sale a la hora.',
    s:{skin:'#E9B99A',hair:'#BFC2C9',hs:'bob',shirt:'#24365F',pat:'blazer',x:['glasses:#D0283C']}},
  tomi:{name:'Tomás «Tomi» Herrera',short:'Tomi',age:34,from:'Sevilla',role:'Recepcionista · turnos',mod:'Cola de trabajos',color:'#D9A21B',colorName:'Mostaza',
    perfil:'Viene de la recepción de un hotel. Domina las listas de espera y las caras largas.',
    gesto:'Toca la campanita cuando entra un Job; con la cola en pausa, cuelga el cartel «VUELVO ENSEGUIDA».',frase:'Usted es el tercero, mi arma. Siéntese, que ahora le llamo.',
    s:{skin:'#C98E64',hair:'#1E1A18',hs:'curly',shirt:'#D9A21B',pat:'flowers',x:['headset']}},
  nadia:{name:'Nadia Benali',short:'Nadia',age:29,from:'Valencia, familia marroquí',role:'Exploradora web',mod:'Busca los productos en la web de cada proveedor',color:'#2F6B3A',colorName:'Verde bosque',
    perfil:'Ex investigadora OSINT. Encuentra cualquier dato escondido en cualquier web.',
    gesto:'Sale por una puerta con el logo de la marca y vuelve con una caja. Si la web se cuelga, mira el reloj y da un pisotón.',frase:'Si está en internet, lo traigo. Si tarda más de dos minutos, no lo merecía.',
    s:{skin:'#B9805A',hair:'#5A3A24',hs:'pony',shirt:'#2F6B3A',x:['backpack']}},
  iker:{name:'Iker Etxeberria',short:'Iker',age:41,from:'Bilbao',role:'Fotógrafo de campo',mod:'Descarga de fotos',color:'#C2622D',colorName:'Naranja teja',
    perfil:'Quince años como fotógrafo de producto. Distingue una foto buena de una miniatura a primera vista.',
    gesto:'Destellos de flash; deja un montón de fotos con un número encima.',frase:'Seis fotos. Una salió movida, pero esa no cuenta.',
    s:{skin:'#EDC2A3',hair:'#B4532A',hs:'beanie',hat:'#4A4F57',shirt:'#3E4A57',vest:'#C2622D',x:['beard','camera']}},
  rosa:{name:'Rosa Lin',short:'Rosa',age:63,from:'Badalona, familia de Zhejiang',role:'Archivista',mod:'Limpieza de textos',color:'#7A2234',colorName:'Granate',
    perfil:'Bibliotecaria jubilada que volvió porque se aburría. Convierte cualquier amasijo en un expediente perfecto.',
    gesto:'Pasa hojas por la trituradora y saca una carpeta limpia atada con cinta.',frase:'Cuarenta etiquetas div para decir «algodón orgánico». Qué paciencia.',
    s:{skin:'#E6C29E',hair:'#2A2523',hs:'bun',shirt:'#7A2234',x:['glasses:#C9A94A']}},
  bruno:{name:'Bruno Costa',short:'Bruno',age:38,from:'Lisboa',role:'Investigador SEO · consultor externo',mod:'Investigación de palabras clave',color:'#6FB6DE',colorName:'Celeste',
    perfil:'Analista de datos de búsqueda. Piensa en volúmenes mensuales.',
    gesto:'Abre el portátil, flotan barras de gráfico y entrega tres post-its al redactor de turno.',frase:'«Cuna de madera» tiene 2.400 búsquedas al mes. Úsala, pero con cariño.',
    s:{skin:'#D9A57E',hair:'#2B211C',hs:'slick',shirt:'#6FB6DE',x:[]}},
  lucia:{name:'Lucía Ferrer',short:'Lucía',age:31,from:'Madrid',role:'Titulista',mod:'Títulos de producto',color:'#C8243A',colorName:'Rojo carmín',
    perfil:'Ex creativa publicitaria. Escribe 200 titulares antes de comer.',
    gesto:'Escribe, arranca el post-it y lo pega en la pared. Con un título hermano, lo copia con un guiño.',frase:'Un título no es una descripción con prisa.',
    s:{skin:'#F0C8A8',hair:'#141414',hs:'fringe',shirt:'#F3F3F3',stripe:'#C8243A',pat:'stripes',x:['phones']}},
  valentina:{name:'Valentina Ríos',short:'Valentina',age:40,from:'Medellín',role:'Brand manager',mod:'Manual de voz de cada marca',color:'#D9A520',colorName:'Dorado',
    perfil:'Estratega de marca. Entrevista a cada marca nueva y escribe su manual de voz.',
    gesto:'Solo aparece al dar de alta una marca: escribe un manual y lo coloca en la estantería.',frase:'Cada marca tiene una voz. Mi trabajo es que no se nos olvide.',
    s:{skin:'#B87B55',hair:'#2A1B12',hs:'braid',shirt:'#D9A520',x:['earrings']}},
  sofia:{name:'Sofía Castelli',short:'Sofía',age:58,from:'Buenos Aires, abuelos genoveses',role:'Traductora jurada',mod:'Traducción',color:'#9C88C8',colorName:'Lavanda',
    perfil:'Traductora jurada en seis idiomas. Traduce lo que ya está redactado sin tocar la estructura.',
    gesto:'Pasa hojas del diccionario; aparta con la mano las filas vacías.',frase:'Yo traduzco lo que hay, querido. Lo que no hay no se traduce.',
    s:{skin:'#EBC4A6',hair:'#F0EEEA',hs:'shortside',shirt:'#9C88C8',x:['necklace']}},
  javi:{name:'Javier «Javi» Ruiz',short:'Javi',age:45,from:'Salamanca',role:'Redactor nativo · español',mod:'Descripciones · español',color:'#8A5A35',colorName:'Marrón',
    perfil:'Ex periodista de suplemento dominical. Adora la prosa limpia.',
    gesto:'Se ajusta el chaleco antes de escribir.',frase:'Primero el qué; luego el porqué.',
    s:{skin:'#E3B08C',hair:'#5C4632',hs:'bald',shirt:'#EFE8DC',vest:'#8A5A35',x:[]}},
  amelie:{name:'Amélie Durand',short:'Amélie',age:36,from:'Lyon',role:'Redactora nativa · francés',mod:'Descripciones · francés',color:'#2F5DA8',colorName:'Azul francés',
    perfil:'Copywriter de moda. Obsesionada con los apóstrofos de elisión.',
    gesto:'Un golpecito con la pluma al terminar cada descripción.',frase:'L’élision, ce n’est pas optionnel.',
    s:{skin:'#F3D0B5',hair:'#C1532B',hs:'wavy',shirt:'#D8C49A',x:['scarf:#2F5DA8']}},
  jordi:{name:'Jordi Puig',short:'Jordi',age:27,from:'Vic',role:'Redactor nativo · catalán',mod:'Descripciones · catalán (sin palabras clave)',color:'#8E1F3B',colorName:'Grana',
    perfil:'Filólogo catalán, el más joven de la mesa. Escribe sin keywords porque no hay datos de búsqueda en catalán.',
    gesto:'Hace girar la pluma entre los dedos.',frase:'Sense keywords, però amb estil.',
    s:{skin:'#F1C9A5',hair:'#D9B65A',hs:'cap',hat:'#1F2A55',shirt:'#8E1F3B',pat:'hoodie',x:[]}},
  katrin:{name:'Katrin Bauer',short:'Katrin',age:48,from:'Hamburgo',role:'Redactora nativa · alemán',mod:'Descripciones · alemán',color:'#5E6B78',colorName:'Gris acero',
    perfil:'Redactora técnica de ingeniería. Implacable con las medidas.',
    gesto:'Alinea los papeles con escuadra antes de entregar.',frase:'Maße zuerst. Immer.',
    s:{skin:'#F2CFB6',hair:'#E6DFC8',hs:'shortside',shirt:'#F6F6F6',x:['glasses:#8E98A3']}},
  oliver:{name:'Oliver Grant',short:'Oliver',age:33,from:'Manchester',role:'Redactor nativo · inglés',mod:'Descripciones · inglés',color:'#6B7A3A',colorName:'Verde oliva',
    perfil:'Ex redactor de e-commerce. Cercano y con humor británico.',
    gesto:'Sorbe té mientras escribe.',frase:'Lovely. Next one, please.',
    s:{skin:'#F4D2BC',hair:'#A0522D',hs:'short',shirt:'#6B7A3A',x:[]}},
  andreu:{name:'Andreu Soler',short:'Andreu',age:55,from:'Tarragona',role:'Revisor de coherencia',mod:'Revisión de coherencia',color:'#B5202A',colorName:'Rojo corrector',
    perfil:'Ex auditor contable. Ve un 30 cm contra un 35 cm en tres segundos.',
    gesto:'Recorre las hojas con la lupa; sello verde «CONFORME» o banderitas rojas.',frase:'No digo que esté mal. Digo que no cuadra.',
    s:{skin:'#E6B693',hair:'#6B5B4E',hs:'receding',shirt:'#DCD5C6',check:'#9AA7B8',pat:'checks',x:['pen']}},
  yuki:{name:'Yuki Morales Tanaka',short:'Yuki',age:26,from:'Barcelona, madre japonesa',role:'Retocadora de imagen',mod:'Retoque de imágenes',color:'#2D6BFF',colorName:'Azul eléctrico',
    perfil:'Diseñadora digital. Domina el recorte automático mejor que Photoshop.',
    gesto:'Tijeras digitales que recortan siluetas; las fotos salen con fondo blanco.',frase:'Ya está centrada. Es magia con píxeles.',
    s:{skin:'#F0CBA8',hair:'#151515',hair2:'#2D6BFF',hs:'twotone',shirt:'#2D6BFF',pat:'hoodie',x:[]}},
  ernesto:{name:'Ernesto Gil',short:'Ernesto',age:60,from:'Zaragoza',role:'Controller financiero',mod:'Control del gasto y tope diario',color:'#2E7D4F',colorName:'Verde billete',
    perfil:'Cuarenta años en contabilidad. Cuenta tokens como quien cuenta céntimos.',
    gesto:'La calculadora suelta papel; al llegar al tope, lleva el cartel «CERRADO» a recepción.',frase:'Esto son cuartos, ¿eh? Que no los regalan.',
    s:{skin:'#E8B898',hair:'#F2F2F2',hs:'parted',shirt:'#FAFAFA',x:['suspenders']}},
},

/* ---------- Puestos (posición física: no tocar x, y, dir) ---------- */
SEAT: {
  merce:  {x:52, y:22, dir:'down', chair:'#5A2E1E', seat:'Despacho acristalado de dirección, con alfombra, estantería y mesa de reuniones. Ve toda la planta desde su silla.'},
  tomi:   {x:46, y:200,dir:'down', seat:'Detrás del mostrador de recepción, de cara a la puerta, con la campanita y el monitor de la cola.'},
  rosa:   {x:34, y:113,dir:'up',   seat:'Rodeada de archivadores, con la trituradora al lado de la mesa y las carpetas atadas con cinta.'},
  nadia:  {x:78, y:113,dir:'up',   seat:'Mesa bajo el tablón de credenciales de las marcas. La mochila siempre en el suelo, lista para salir.'},
  iker:   {x:77, y:134,dir:'down', standing:true, seat:'De pie junto a la mesa de bodegón, entre dos focos, con la réflex en la mano.'},
  lucia:  {x:176,y:24, dir:'down', seat:'Isla de redacción, justo debajo de su pared de post-its.'},
  bruno:  {x:212,y:24, dir:'down', seat:'Puesto de visitante en la isla de redacción, con su portátil lleno de pegatinas.'},
  sofia:  {x:176,y:58, dir:'up',   seat:'Isla de redacción, detrás de su torre de diccionarios.'},
  valentina:{x:212,y:58,dir:'up',  seat:'Isla de redacción, al lado de la estantería de manuales de marca.'},
  javi:   {x:166,y:118,dir:'down', seat:'Mesa larga de redactores nativos, primera silla del lado de la ventana.'},
  amelie: {x:200,y:118,dir:'down', seat:'Mesa larga de redactores nativos, en el centro, frente al tintero de la pluma compartida.'},
  jordi:  {x:234,y:118,dir:'down', seat:'Mesa larga de redactores nativos, en la punta, girando un bolígrafo mientras espera la pluma.'},
  katrin: {x:183,y:146,dir:'up',   seat:'Mesa larga de redactores nativos, con la escuadra y los papeles alineados.'},
  oliver: {x:217,y:146,dir:'up',   seat:'Mesa larga de redactores nativos, con su taza de té siempre humeando.'},
  andreu: {x:318,y:122,dir:'up',   seat:'Puesto de calidad junto a la impresora y la pizarra, con la lupa y las banderitas rojas.'},
  yuki:   {x:326,y:48, dir:'up',   chair:'#1E2230', seat:'Estudio de imagen en penumbra, con dos pantallas, tableta gráfica y mesa de corte.'},
  ernesto:{x:326,y:224,dir:'up',   chair:'#5A2E1E', seat:'Despacho de administración, con caja fuerte, la calculadora de rollo y la hucha de cerdito.'},
},

/* ---------- Áreas: «name» es lo que se ve en el plano ---------- */
ZONES: [
  {sala:'despacho', name:'Dirección', x:15, y:6,   ids:['merce']},
  {sala:'recepcion', name:'Recepción', x:7,  y:178, ids:['tomi']},
  {sala:'izquierda', name:'Campo',     x:17, y:84,  ids:['nadia','iker','rosa']},
  {sala:'isla', name:'Redacción', x:127,y:6,   ids:['lucia','bruno','valentina','sofia']},
  {sala:'mesa-larga', name:'Redactores nativos', x:127,y:99, ids:['javi','amelie','jordi','katrin','oliver']},
  {sala:'arriba-derecha', name:'Estudio',   x:276,y:6,   ids:['yuki']},
  {sala:'derecha', name:'Calidad',   x:276,y:86,  ids:['andreu']},
  {sala:'abajo-derecha', name:'Administración', x:276,y:180, ids:['ernesto']},
  {sala:'office', name:'Office',    x:138,y:180, ids:[], empty:'Cocina, sofá y mesa redonda. Aquí se calienta el agua del té de Oliver.'},
],

/* ---------- Pasos del Job: [estados, 'texto del paso', milisegundos] ---------- */
STEPS: [
  [{tomi:'working'},'Recepción · Tomi toca la campanita: entra el Job «Primavera · 24 productos»',1600],
  [{tomi:'done',merce:'working'},'Dirección · Mercè revisa el encargo: modo «all», idiomas es, fr, ca',1700],
  [{nadia:'working',iker:'working'},'Campo · Nadia sale a la web del proveedor con su credencial; Iker la sigue con la cámara',2400],
  [{nadia:'blocked'},'Campo · Un producto no responde en 120 s: Nadia lo da por perdido y sigue',1500],
  [{nadia:'working',rosa:'working'},'Archivo · Rosa tritura el HTML y ata los expedientes limpios',2000],
  [{nadia:'done',iker:'done',rosa:'done',javi:'waiting',amelie:'waiting',jordi:'waiting',ernesto:'working'},'Recepción · Turno de la IA concedido. Ernesto abre la calculadora',1600],
  [{lucia:'working'},'Redacción (es) · Lucía escribe los 24 títulos',1600],
  [{lucia:'done',bruno:'working'},'Redacción (es) · Bruno consulta el mercado ES: «cuna de madera», 2.400 búsquedas al mes',1900],
  [{bruno:'done',javi:'working'},'Redacción (es) · Javi tiene la pluma y redacta las descripciones',2200],
  [{javi:'done',lucia:'working',bruno:'idle'},'Redacción (fr) · Lucía pasa los títulos al francés',1400],
  [{lucia:'done',bruno:'working'},'Redacción (fr) · Bruno consulta el mercado FR',1500],
  [{bruno:'done',amelie:'working'},'Redacción (fr) · Amélie recibe la pluma',1900],
  [{amelie:'blocked',ernesto:'blocked',tomi:'blocked'},'Pausa · Google limita las llamadas: la pluma se congela y Tomi cierra la puerta',2000],
  [{amelie:'working',ernesto:'working',tomi:'done'},'Cola reanudada · Amélie continúa donde lo dejó',1600],
  [{amelie:'done',lucia:'working'},'Redacción (ca) · Títulos en catalán',1300],
  [{lucia:'done',bruno:'blocked'},'Redacción (ca) · Bruno no tiene datos en catalán: se redacta sin keywords',1600],
  [{bruno:'idle',jordi:'working'},'Redacción (ca) · Jordi recibe la pluma',2000],
  [{jordi:'done',ernesto:'done',andreu:'working'},'Calidad · Andreu revisa con la lupa columnas, viñetas y títulos',2100],
  [{andreu:'done',yuki:'working'},'Estudio · Yuki recorta y centra las fotos descargadas',2100],
  [{yuki:'done',merce:'done'},'Dirección · Mercè cierra la tablet: ZIP listo (ejemplo)',2600],
],

/* ---------- Qué hace cada persona en cada paso ---------- */
ACT: {
  0:{tomi:'Toca la campanita: entra el Job «Primavera · 24 productos» y lo pone en la cola.'},
  1:{merce:'Revisa el encargo (modo «all», idiomas es, fr y ca) y reparte el trabajo.'},
  2:{nadia:'Entra en la web del proveedor y busca los 24 productos por código de barras.',iker:'Sigue a Nadia y descarga las fotos de cada producto.'},
  3:{nadia:'Un producto no responde en 120 segundos: lo da por perdido y sigue con el resto.'},
  4:{nadia:'Sigue trayendo productos de la web del proveedor.',rosa:'Tritura el HTML de las páginas y deja el texto limpio en expedientes atados.'},
  5:{ernesto:'Abre la calculadora: empieza a contar el gasto de la IA de este Job.'},
  6:{lucia:'Escribe los 24 títulos en español.'},
  7:{bruno:'Consulta el mercado español: «cuna de madera», 2.400 búsquedas al mes.'},
  8:{javi:'Tiene la pluma: redacta las descripciones en español.'},
  9:{lucia:'Pasa los títulos al francés.'},
  10:{bruno:'Consulta las búsquedas del mercado francés.'},
  11:{amelie:'Recibe la pluma: redacta las descripciones en francés.'},
  12:{amelie:'Google limita las llamadas: se queda a mitad de descripción sin poder escribir.',ernesto:'Para el contador: mientras dure la pausa no se gasta nada.',tomi:'Cierra la puerta y cuelga «VUELVO ENSEGUIDA»: la cola queda en pausa.'},
  13:{amelie:'Se reanuda la cola: sigue la descripción donde la dejó.',ernesto:'Vuelve a contar el gasto.'},
  14:{lucia:'Escribe los títulos en catalán.'},
  15:{bruno:'No hay datos de búsqueda en catalán: no puede entregar keywords.'},
  16:{jordi:'Recibe la pluma: redacta en catalán, sin keywords.'},
  17:{andreu:'Revisa con la lupa columnas, viñetas y títulos de los tres idiomas.'},
  18:{yuki:'Recorta las fotos descargadas y las centra sobre fondo blanco.'},
  19:{merce:'Cierra la tablet: el ZIP del Job está listo.'},
},

/* ---------- Lo que se pasan: [de, a, objeto, 'etiqueta'] ---------- */
HAND: {
  0:[['door','tomi','ticket','Job Primavera']],
  1:[['tomi','merce','ticket','Encargo del Job']],
  2:[['merce','nadia','ticket','Lista de 24 productos']],
  4:[['nadia','rosa','box','23 páginas de producto']],
  5:[['rosa','lucia','folder','Textos limpios']],
  8:[['bruno','javi','postit','Keywords ES'],['lucia','javi','postit','Títulos ES']],
  11:[['javi','amelie','pen','La pluma'],['bruno','amelie','postit','Keywords FR']],
  12:[['ernesto','tomi','sign','Cartel CERRADO']],
  16:[['amelie','jordi','pen','La pluma'],['lucia','jordi','postit','Títulos CA']],
  17:[['jordi','andreu','folder','Fichas en 3 idiomas']],
  18:[['iker','yuki','photos','Fotos descargadas']],
  19:[['andreu','merce','folder','Revisión conforme'],['yuki','merce','photos','Fotos recortadas']],
}

};
