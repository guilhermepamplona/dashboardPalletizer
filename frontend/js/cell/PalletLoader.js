/**
 * PalletLoader.js
 * ---------------
 * Carrega o modelo pallet.glb como template e cria um clone por esteira.
 * Cada pallet aparece/desaparece conforme o sinal booleano vindo do CLP
 * (pallet_conv1 … pallet_conv4).
 *
 * Funciona exatamente como BoxLoader, mas sem lógica de pick/place —
 * os pallets ficam fixos na cena, só mudam de visibilidade.
 *
 * Para posicionar cada pallet individualmente, edite o campo `position`
 * e `rotation` de cada entrada em PALLET_INSTANCES (config.js).
 */

import { loadGltf }   from "../utils/loader.js";
import { prepareMesh } from "../utils/mesh.js";
import { PALLET_URL }  from "../config.js";

export class PalletLoader {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this._template  = null;
    this._pallets   = new Map();   // id → Object3D
    this._instances = [];
  }

  async loadTemplate() {
    const gltf = await loadGltf(PALLET_URL);
    this._template = gltf.scene;
    this._template.name = "PalletTemplate";
    prepareMesh(this._template);
  }

  createPalletsFromConfig(instances) {
    this._instances = instances;
    for (const cfg of instances) {
      this._createPallet(cfg);
    }
  }

  _createPallet(cfg) {
    if (!this._template) {
      console.warn("PalletLoader: template não carregado.");
      return;
    }

    const pallet = this._template.clone(true);
    pallet.name  = cfg.id;

    pallet.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
    pallet.rotation.set(
      cfg.rotation?.x ?? 0,
      cfg.rotation?.y ?? 0,
      cfg.rotation?.z ?? 0
    );

    pallet.visible = false;
    this.sceneController.scene.add(pallet);
    this._pallets.set(cfg.id, pallet);
  }

  /** Atualiza visibilidade de todos os pallets conforme o estado recebido. */
  updateFromState(state) {
    for (const cfg of this._instances) {
      const pallet = this._pallets.get(cfg.id);
      if (pallet) pallet.visible = Boolean(state[cfg.sensor]);
    }
  }
}
