import { CellLoader } from "./CellLoader.js";
import { BoxLoader } from "./Box_Loader.js";
import { BOX_INSTANCES } from "../config.js";

/*
  CellManager centraliza os elementos dinâmicos da célula.

  Hoje ele gerencia:
  - layout fixo da célula: cell_layout.glb
  - caixas dinâmicas: modelos clonados a partir de BOX_MODELS/BOX_INSTANCES

  Futuro:
  - pallets dinâmicos
  - esteiras clonadas por software
  - sensores/luzes da célula
*/
export class CellManager {
  constructor(sceneController) {
    this.sceneController = sceneController;

    this.cellLoader = new CellLoader(sceneController);
    this.boxLoader = new BoxLoader(sceneController);
  }

  async load() {
    await this.cellLoader.load();

    await this.boxLoader.loadTemplates();
    this.boxLoader.createBoxesFromConfig(BOX_INSTANCES);
  }

  updateFromState(state) {
    this.boxLoader.updateFromState(state);
  }

  attachBoxToRobot(boxId, tcp) {
    this.boxLoader.attachToRobot(boxId, tcp);
  }

  placeBoxOnPallet(boxId, position, rotation = null) {
    this.boxLoader.placeOnPallet(boxId, position, rotation);
  }
}
