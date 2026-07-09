import { CellLoader }    from "./CellLoader.js";
import { BoxLoader }     from "./Box_Loader.js";
import { PalletLoader }  from "./PalletLoader.js";
import { BOX_INSTANCES, PALLET_INSTANCES } from "../config.js";

/**
 * CellManager centraliza os elementos dinâmicos da célula:
 *  - Layout fixo: cell_layout.glb
 *  - Caixas dinâmicas: clonadas por BOX_INSTANCES (visibilidade por sensor)
 *  - Pallets dinâmicos: clonados por PALLET_INSTANCES (visibilidade por sensor)
 */
export class CellManager {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.cellLoader   = new CellLoader(sceneController);
    this.boxLoader    = new BoxLoader(sceneController);
    this.palletLoader = new PalletLoader(sceneController);
  }

  async load() {
    await this.cellLoader.load();

    await this.boxLoader.loadTemplates();
    this.boxLoader.createBoxesFromConfig(BOX_INSTANCES);

    await this.palletLoader.loadTemplate();
    this.palletLoader.createPalletsFromConfig(PALLET_INSTANCES);
  }

  updateFromState(state) {
    this.boxLoader.updateFromState(state);
    this.palletLoader.updateFromState(state);
  }

  attachBoxToRobot(boxId, tcp) {
    this.boxLoader.attachToRobot(boxId, tcp);
  }

  placeBoxOnPallet(boxId, position, rotation = null) {
    this.boxLoader.placeOnPallet(boxId, position, rotation);
  }
}
