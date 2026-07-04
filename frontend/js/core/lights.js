import * as THREE from "three";

export function setupLights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 3.0));

  const key = new THREE.DirectionalLight(0xffffff, 4.0);
  key.position.set(5, 10, 6);
  key.castShadow = false;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 2.0);
  fill.position.set(-5, 5, -5);
  scene.add(fill);
}
