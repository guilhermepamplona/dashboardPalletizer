import { CELL_URL } from "../config.js";
import { loadGltf } from "../utils/loader.js";
import { prepareMesh } from "../utils/mesh.js";

export class CellLoader {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.root = null;
  }

  async load() {
    try {
      const gltf = await loadGltf(CELL_URL);
      const cell = gltf.scene;
      cell.name = "CellLayout";

      prepareMesh(cell);
      cell.position.set(0, 0, 0);
      cell.rotation.set(0, 0, 0);
      cell.scale.setScalar(1);

      this.root = cell;
      this.sceneController.add(cell);
      console.log("CellLayout carregado:", cell);
    } catch (error) {
      console.error("Erro ao carregar CellLayout:", error);
    }
  }
}
