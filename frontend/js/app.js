import { SceneController }   from "./core/SceneController.js";
import { RobotController }   from "./robot/RobotController.js";
import { GripController }    from "./robot/GripController.js";
import { CellManager }       from "./cell/CellManager.js";
import { DashboardUI }       from "./ui/DashboardUI.js";
import { SimulationService } from "./communication/SimulationService.js";
import { WebSocketClient }   from "./communication/WebSocketClient.js";

window.addEventListener("error", (e) => alert("Erro JS: " + e.message));
window.addEventListener("unhandledrejection", (e) => alert("Erro Promise: " + e.reason));

async function main() {
  try {
    console.log("Iniciando aplicação...");

    const canvas = document.getElementById("viewport");
    const wrap   = document.getElementById("viewport-wrap");

    const sceneController = new SceneController(canvas, wrap);
    const robotController = new RobotController(sceneController);
    const cellManager     = new CellManager(sceneController);
    const gripController  = new GripController(robotController, cellManager);
    const ui              = new DashboardUI(robotController, cellManager, gripController);

    robotController.onStatusChange = (text) => ui.setModelStatus(text);
    ui.init();

    const simulationService = new SimulationService(ui, robotController);
    const webSocketClient   = new WebSocketClient(ui, simulationService);

    window.addEventListener("resize", () => sceneController.resize());

    await robotController.load([0, 0, 0, 0, 0, 0]);
    await cellManager.load();

    sceneController.start();
    simulationService.start();
    webSocketClient.connect();

  } catch (err) {
    console.error("ERRO NA INICIALIZAÇÃO:", err);
    const status = document.getElementById("modelStatus");
    if (status) status.textContent = "Erro JS: " + err.message;
    alert("Erro JS: " + err.message);
  }
}

main();
