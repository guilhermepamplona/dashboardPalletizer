import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";

export class CameraController {
  constructor(canvas) {
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(4.2, 3.2, 4.6);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.2, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 14;
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }

  frameObject(object3d) {
    const box = new THREE.Box3().setFromObject(object3d);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    this.controls.target.copy(center);
    this.controls.target.y += size.y * 0.15;

    this.camera.position.set(
      center.x + size.length() * 0.75,
      center.y + size.length() * 0.45,
      center.z + size.length() * 0.75
    );

    this.controls.update();
  }
}
