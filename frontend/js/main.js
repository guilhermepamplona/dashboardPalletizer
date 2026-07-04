import { setupLights, resize, startRenderLoop } from "./scene.js";
import { loadRobotModel } from "./robot.js";
import { loadCellModel } from "./cell.js";
import { initJointsReadout, setModelStatus } from "./ui.js";
import { startSimulation } from "./simulation.js";
import { connectWS } from "./websocket.js";

let currentJoints = [0, 0, 0, 0, 0, 0];

setupLights();
resize();
window.addEventListener("resize", resize);

initJointsReadout();

loadRobotModel(currentJoints, setModelStatus);
loadCellModel();

startRenderLoop();

// Inicia em simulação imediatamente.
// Se o WebSocket receber dados reais, a simulação é desligada automaticamente.
startSimulation();
connectWS();
