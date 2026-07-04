import { SceneController } from "./core/SceneController.js";
import { RobotController } from "./robot/RobotController.js";
import { CellLoader } from "./cell/CellLoader.js";
import { DashboardUI } from "./ui/DashboardUI.js";
import { SimulationService } from "./communication/SimulationService.js";
import { WebSocketClient } from "./communication/WebSocketClient.js";

const canvas = document.getElementById("viewport");
const wrap = document.getElementById("viewport-wrap");
const initialJoints = [0, 0, 0, 0, 0, 0];

const sceneController = new SceneController(canvas, wrap);
const robotController = new RobotController(sceneController);
const ui = new DashboardUI(robotController);

robotController.onStatusChange = (text) => ui.setModelStatus(text);
ui.init();

const cellLoader = new CellLoader(sceneController);
const simulationService = new SimulationService(ui, robotController);
const webSocketClient = new WebSocketClient(ui, simulationService);

window.addEventListener("resize", () => sceneController.resize());

await robotController.load(initialJoints);
await cellLoader.load();

sceneController.start();
simulationService.start();
webSocketClient.connect();
