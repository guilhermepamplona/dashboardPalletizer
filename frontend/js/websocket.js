import { WS_URL } from "./config.js";
import { applyState, setConnectionLabel } from "./ui.js";
import { startSimulation, stopSimulation } from "./simulation.js";

let ws;
let reconnectTimer;

export function connectWS() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    clearTimeout(reconnectTimer);
    setConnectionLabel("aguardando dados…", false);
  };

  ws.onmessage = (event) => {
    try {
      const state = JSON.parse(event.data);
      stopSimulation();
      applyState(state);
    } catch (error) {
      console.error("payload inválido", error);
    }
  };

  ws.onclose = () => {
    setConnectionLabel("modo simulação", false);
    startSimulation();
    reconnectTimer = setTimeout(connectWS, 1500);
  };

  ws.onerror = () => {
    try {
      ws.close();
    } catch {}
  };
}
