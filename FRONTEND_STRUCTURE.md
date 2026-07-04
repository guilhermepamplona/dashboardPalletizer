# Estrutura modular do frontend

Ponto de entrada:

- `frontend/index.html`
- `frontend/js/app.js`

Módulos principais:

- `frontend/js/core/` — cena Three.js, renderer, câmera e luzes.
- `frontend/js/robot/` — controle do robô, juntas e offset da ferramenta.
- `frontend/js/cell/` — carregamento do layout da célula.
- `frontend/js/ui/` — atualização de cartões, alarmes e leituras.
- `frontend/js/communication/` — WebSocket e simulação local.
- `frontend/js/utils/` — loaders, matemática e helpers de malha.
- `frontend/js/config.js` — URLs dos GLBs, offsets e configurações gerais.

GLTFLoader:

Foi adicionado `frontend/libs/GLTFLoader.js` para evitar o 404. O arquivo enviado é um wrapper que reexporta o loader oficial via CDN, pois o loader original não estava presente no projeto enviado. Para uso offline, substitua esse arquivo pelo `GLTFLoader.js` oficial da mesma versão do Three.js.

Backend:

Não foi necessário alterar o backend. Ele continua servindo `/` e `/static` da mesma forma.
