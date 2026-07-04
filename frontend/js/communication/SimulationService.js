export class SimulationService {
  constructor(ui, robotController) {
    this.ui = ui;
    this.robotController = robotController;
    this.timer = null;
  }

  buildState() {
    const t = performance.now() / 1000;

    return {
      connected: false,
      program_state: 2,
      program_running: true,
      drives_on: true,
      in_home_position: false,
      in_safety_stop: false,
      warning_active: false,
      alarm_active: false,
      active_alarm_code: 0,
      pallet_count: 0,
      cycle_count: Math.floor(t / 5),
      cycle_time_s: 5.2,
      joints: [
        25 * Math.sin(t * 0.35),
        -96 + 18 * Math.sin(t * 0.45),
        74 + 20 * Math.sin(t * 0.5),
        0,
        112 + 25 * Math.sin(t * 0.5),
        60 * Math.sin(t * 0.75),
      ],
    };
  }

  start() {
    if (this.timer) return;

    if (!this.robotController.ready) {
      this.ui.setModelStatus("simulação aguardando GLB…");
    }

    this.timer = setInterval(() => {
      const state = this.buildState();
      this.ui.applyState(state);

      if (this.robotController.ready) {
        this.ui.setModelStatus("GLB carregado · modo simulação");
      }

      this.ui.setConnectionLabel("modo simulação", false);
    }, 80);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}
