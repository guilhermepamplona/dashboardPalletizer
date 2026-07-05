# Ajustes Unified Offline V2

Esta versão foi refeita a partir do ZIP enviado agora.

Correções aplicadas:

1. `frontend/libs/GLTFLoader.js` permanece local, sem CDN.
2. Adicionado `frontend/utils/BufferGeometryUtils.js`, dependência exigida pelo `GLTFLoader.js` oficial.
3. `frontend/js/app.js` está sem top-level await, usando `async function main()`.
4. `frontend/index.html` aponta para `/static/js/app.js?v=11` para reduzir problema de cache.

Arquivos importantes para conferir no servidor:

- `/static/libs/GLTFLoader.js` deve retornar 200.
- `/static/utils/BufferGeometryUtils.js` deve retornar 200.
- `/static/models/KR180_Std.glb?...` deve aparecer no log depois do JS iniciar.
- `/static/models/cell_layout.glb?...` deve aparecer no log depois do JS iniciar.

Se a Unified ainda tentar acessar `cdn.jsdelivr.net`, limpe cache/reinicie a tela ou aumente novamente a versão do `app.js` no `index.html`.
