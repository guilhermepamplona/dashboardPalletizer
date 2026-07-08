import { loadGltf } from "../utils/loader.js";
import { BOX_SPGV2_URL } from "../config.js";
import { prepareMesh } from "../utils/mesh.js";

export class BoxLoader {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.template = null;
    this.boxes = [];
  }

  async loadTemplate() {
    const gltf = await loadGltf(BOX_SPGV2_URL);
    this.template = gltf.scene;
    this.template.name = "Caixa_SPGV2_Template";
    prepareMesh(this.template);
  }

  createBox(name, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
    if (!this.template) return null;

    const box = this.template.clone(true);
    box.name = name;

    box.position.set(position.x, position.y, position.z);
    box.rotation.set(rotation.x, rotation.y, rotation.z);

    this.sceneController.scene.add(box);
    this.boxes.push(box);

    return box;
  }
}