import { loadGltf } from "../utils/loader.js";
import { BOX_MODELS } from "../config.js";
import { prepareMesh } from "../utils/mesh.js";

export class BoxLoader {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.templates = new Map();
    this.boxes = new Map();
    this.instances = [];
  }

  async loadTemplates() {
    for (const [type, url] of Object.entries(BOX_MODELS)) {
      const gltf = await loadGltf(url);
      const model = gltf.scene;

      model.name = `BoxTemplate_${type}`;
      prepareMesh(model);

      this.templates.set(type, model);
    }
  }

  createBoxesFromConfig(instances) {
    this.instances = instances;

    for (const cfg of instances) {
      this.createBox(cfg.type, cfg.id, cfg.position, cfg.rotation);
    }
  }

  createBox(type, name, position, rotation = { x: 0, y: 0, z: 0 }) {
    const template = this.templates.get(type);

    if (!template) {
      console.warn(`Modelo de caixa não carregado: ${type}`);
      return null;
    }

    const box = template.clone(true);
    box.name = name;

    box.position.set(position.x, position.y, position.z);
    box.rotation.set(rotation.x, rotation.y, rotation.z);
    box.visible = false;

    this.sceneController.scene.add(box);
    this.boxes.set(name, box);

    return box;
  }

  getBox(name) {
    return this.boxes.get(name) ?? null;
  }

  setVisible(name, visible) {
    const box = this.getBox(name);

    if (box) {
      box.visible = Boolean(visible);
    }
  }

  updateFromState(state) {
    for (const cfg of this.instances) {
      // Não altera visibilidade de caixas no TCP ou já depositadas no palete
      if (this._grippedIds.has(cfg.id)) continue;
      if (this._placedIds.has(cfg.id)) continue;
      this.setVisible(cfg.id, Boolean(state[cfg.sensor]));
    }
  }

  /** IDs das caixas presas no TCP — não alterar visibilidade delas. */
  _grippedIds = new Set();

  /** IDs das caixas já depositadas no palete — permanecem visíveis. */
  _placedIds = new Set();

  attachToRobot(name, tcp) {
    const box = this.getBox(name);
    if (!box || !tcp) return;

    box.visible = true;
    tcp.attach(box);
    this._grippedIds.add(name);
  }

  detachFromTcp(name) {
    this._grippedIds.delete(name);
  }

  placeOnPallet(name, position, rotation = null) {
    const box = this.getBox(name);
    if (!box) return;

    this.sceneController.scene.attach(box);
    box.position.set(position.x, position.y, position.z);
    if (rotation) box.rotation.set(rotation.x, rotation.y, rotation.z);

    box.visible = true;
    this._placedIds.add(name); // mantém visível mesmo com sensor = false
  }
}
