import * as THREE from "three";
import { RendererController } from "./RendererController.js";
import { CameraController } from "./CameraController.js";
import { setupLights } from "./lights.js";

export class SceneController {
  constructor(canvas, wrap) {
    this.canvas = canvas;
    this.wrap = wrap;
    this.scene = new THREE.Scene();
    this.rendererController = new RendererController(canvas);
    this.cameraController = new CameraController(canvas);

    setupLights(this.scene);
    this.resize();
  }

  get camera() {
    return this.cameraController.camera;
  }

  get controls() {
    return this.cameraController.controls;
  }

  add(object3d) {
    this.scene.add(object3d);
  }

  resize() {
    const width = this.wrap.clientWidth;
    const height = this.wrap.clientHeight;
    this.rendererController.resize(width, height);
    this.cameraController.resize(width, height);
  }

  start() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.cameraController.update();
      this.rendererController.render(this.scene, this.camera);
    };

    animate();
  }
}
