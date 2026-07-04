// GLTFLoader local entry point.
// Este arquivo evita o erro 404 em /static/libs/GLTFLoader.js.
// Observação: ele reexporta o loader oficial via CDN porque o arquivo original
// não estava presente no projeto enviado. Para uso 100% offline, substitua este
// arquivo pelo GLTFLoader.js oficial da mesma versão do Three.js em:
// three/examples/jsm/loaders/GLTFLoader.js
export { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/loaders/GLTFLoader.js";
