---
description: Crea la oficina virtual con el equipo que haría falta para una aplicación o una web, o cambia la que ya tiene el proyecto (áreas, personas, procesos).
argument-hint: "[opcional: qué quieres analizar, por ejemplo una dirección web]"
---

Usa la skill `livestage` en **modo guiado**.

- **Antes de preguntar nada**, busca si este proyecto ya tiene oficina con el
  script `buscar` de la skill. Si la tiene, no analices de nuevo ni hagas las
  preguntas de inicio: pregunta con el menú qué quiere cambiar (áreas,
  personas, procesos, conectarla con su aplicación o actualizar a la última
  versión) y hazlo en la oficina que ya usa, sin moverla de sitio.
- Mira también con el script `version` si hay una versión nueva del plugin y,
  si la hay, avísale en una línea de que escriba `/plugin update
  livestage@livestage` (tú no puedes ejecutarlo).
- Si es la **primera vez**, haz las cuatro preguntas de inicio y, antes de montar
  la oficina, enséñale las áreas propuestas con sus nombres para que las
  confirme o las cambie. Para lo demás, no pidas más datos técnicos.

**Pregunta siempre con el menú de selección (`AskUserQuestion`)**, nunca con
una lista de opciones escrita en texto, aunque en esta conversación ya se
mostrara un menú antes y se cancelara. Si la herramienta no está cargada,
cárgala con `ToolSearch` (`select:AskUserQuestion`).

Quien escribe este comando puede no saber nada de programación. Háblale en
lenguaje llano y al terminar dale el enlace con una explicación corta de cómo
usar lo que ha recibido.

Lo que ha escrito después del comando (puede estar vacío): $ARGUMENTS
