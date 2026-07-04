import { GLTFLoader } from "three/addons/GLTFLoader.js";
import { scene } from "./scene.js";
import { CELL_URL } from "./config.js";
import { prepareMesh } from "./mesh-utils.js";

export function loadCellModel() {
  const loader = new GLTFLoader();

  loader.load(
    CELL_URL,
    (gltf) => {
      const cell = gltf.scene;
      cell.name = "CellLayout";

      prepareMesh(cell);

      cell.position.set(0, 0, 0);
      cell.rotation.set(0, 0, 0);
      cell.scale.setScalar(1);

      scene.add(cell);
      console.log("CellLayout carregado:", cell);
    },
    undefined,
    (err) => {
      console.error("Erro ao carregar CellLayout:", err);
    }
  );
}
