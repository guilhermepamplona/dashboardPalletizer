import * as THREE from "three";

export function degToRad(degrees) {
  return THREE.MathUtils.degToRad(degrees);
}

export function eulerDeg(rx = 0, ry = 0, rz = 0, order = "XYZ") {
  return new THREE.Euler(degToRad(rx), degToRad(ry), degToRad(rz), order);
}

export function quaternionFromEulerDeg(rx = 0, ry = 0, rz = 0, order = "XYZ") {
  return new THREE.Quaternion().setFromEuler(eulerDeg(rx, ry, rz, order));
}
