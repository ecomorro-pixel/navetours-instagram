# navetours-instagram

Render de las piezas de Instagram de @navetours (agente IG-NT de Shankar).

- `plantillas/` — plantillas HTML de la marca (1080×1350): portada, tip, cierre, resena, destino.
- `fotos/` — fotos permitidas; el nombre del archivo nombra el lugar.
- `lotes/<id>.json` — lo sube n8n. Al llegar, la Action `Render lotes` genera `img/<id>/*.jpg` y `img/<id>/manifest.json`.
- Las imágenes se sirven por `https://raw.githubusercontent.com/ecomorro-pixel/navetours-instagram/main/img/<id>/<archivo>` para la API de Instagram.

Nada se publica desde aquí: la publicación la hace n8n solo con aprobación de Rama por Telegram.
