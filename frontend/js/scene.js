import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";

export const canvas = document.getElementById("viewport");

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = false;

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(4.2, 3.2, 4.6);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 14;

export function setupLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 3.0));

  const key = new THREE.DirectionalLight(0xffffff, 4.0);
  key.position.set(5, 10, 6);
  key.castShadow = false;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 2.0);
  fill.position.set(-5, 5, -5);
  scene.add(fill);
}

export function resize() {
  const wrap = document.getElementById("viewport-wrap");
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

export function startRenderLoop() {
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
