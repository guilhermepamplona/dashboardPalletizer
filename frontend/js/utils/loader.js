import { GLTFLoader } from "three/addons/GLTFLoader.js";

const loader = new GLTFLoader();

export function loadGltf(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}
