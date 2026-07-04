import { WS_URL } from "../config.js";

export class WebSocketClient {
  constructor(ui, simulationService) {
    this.ui = ui;
    this.simulationService = simulationService;
    this.ws = null;
    this.reconnectTimer = null;
  }

  connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      clearTimeout(this.reconnectTimer);
      this.ui.setConnectionLabel("aguardando dados…", false);
    };

    this.ws.onmessage = (event) => {
      try {
        const state = JSON.parse(event.data);
        this.simulationService.stop();
        this.ui.applyState(state);
      } catch (error) {
        console.error("payload inválido", error);
      }
    };

    this.ws.onclose = () => {
      this.ui.setConnectionLabel("modo simulação", false);
      this.simulationService.start();
      this.reconnectTimer = setTimeout(() => this.connect(), 1500);
    };

    this.ws.onerror = () => {
      try {
        this.ws.close();
      } catch {}
    };
  }
}
