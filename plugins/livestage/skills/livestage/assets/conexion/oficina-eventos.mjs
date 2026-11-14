/* oficina-eventos.mjs — versión ESM de la librería de LiveStage (envuelve oficina-eventos.cjs,
   que tiene que estar en la misma carpeta). Para proyectos con "type": "module".

     import oficina from './oficina-eventos.mjs';
     // o: import { canal, sse, sondeo, estatico, ensayo } from './oficina-eventos.mjs';

   La documentación de uso está al principio de oficina-eventos.cjs. */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const oficina = require('./oficina-eventos.cjs');

export const { canal, sse, sondeo, estatico, ensayo } = oficina;
export default oficina;
