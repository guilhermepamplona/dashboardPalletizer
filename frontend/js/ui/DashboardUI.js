import { JOINT_NAMES, PROGRAM_STATE_LABELS } from "../config.js";

export class DashboardUI {
  constructor(robotController, cellManager = null, gripController = null) {
    this.robotController = robotController;
    this.cellManager     = cellManager;
    this.gripController  = gripController;

    this.el = {
      connDot:          document.getElementById("connDot"),
      connText:         document.getElementById("connText"),
      programStatePill: document.getElementById("programStatePill"),
      runningPill:      document.getElementById("runningPill"),
      safetyPill:       document.getElementById("safetyPill"),
      palletCount:      document.getElementById("palletCount"),
      cycleCount:       document.getElementById("cycleCount"),
      cycleTime:        document.getElementById("cycleTime"),
      modeVal:          document.getElementById("modeVal"),
      flagRunning:      document.getElementById("flagRunning"),
      flagDrives:       document.getElementById("flagDrives"),
      flagHome:         document.getElementById("flagHome"),
      alarmBanner:      document.getElementById("alarmBanner"),
      alarmCode:        document.getElementById("alarmCode"),
      modelStatus:      document.getElementById("modelStatus"),
      jointsReadout:    document.getElementById("jointsReadout"),
    };
  }

  init() {
    JOINT_NAMES.forEach((name) => {
      const cell = document.createElement("div");
      cell.className = "joint-cell";
      cell.innerHTML = `<div class="jname">${name}</div><div class="jval" id="jval-${name}">0.0°</div>`;
      this.el.jointsReadout.appendChild(cell);
    });
  }

  setModelStatus(text) {
    if (this.el.modelStatus) this.el.modelStatus.textContent = text;
  }

  setConnectionLabel(text, online = false) {
    this.el.connDot.classList.toggle("online", online);
    this.el.connText.textContent = text;
  }

  setFlag(element, on, onText, offText) {
    element.classList.toggle("on", on);
    element.classList.toggle("off", !on);
    element.innerHTML = `<span class="led"></span>${on ? onText : offText}`;
  }

  applyState(state) {
    const joints = Array.isArray(state.joints) ? state.joints : [0, 0, 0, 0, 0, 0];

    // robô
    this.robotController.setJoints(joints);
    JOINT_NAMES.forEach((name, i) => {
      document.getElementById(`jval-${name}`).textContent =
        (joints[i] ?? 0).toFixed(1) + "°";
    });

    // conexão
    const online = state.connected ?? false;
    this.setConnectionLabel(
      online ? "Conectado ao CLP" : "Desconectado do CLP",
      online
    );

    // estado do programa
    const stateLabel = PROGRAM_STATE_LABELS[state.program_state ?? -1] ?? "—";
    this.el.programStatePill.textContent = stateLabel;
    this.el.modeVal.textContent          = stateLabel;

    const running = state.program_running ?? false;
    this.el.runningPill.textContent = running ? "Em execução" : "Parado";
    this.el.runningPill.classList.toggle("running", running);
    this.el.runningPill.classList.toggle("stopped", !running);

    const safety = state.in_safety_stop ?? false;
    this.el.safetyPill.style.display = safety ? "inline-block" : "none";
    this.el.safetyPill.classList.toggle("safety", safety);

    this.setFlag(this.el.flagRunning, running, "Em execução", "Parado");
    this.setFlag(this.el.flagDrives, state.drives_on ?? false, "Ligados", "Desligados");
    this.setFlag(this.el.flagHome, state.in_home_position ?? false, "Em home", "Fora");

    // produção
    this.el.palletCount.textContent = state.pallet_count ?? 0;
    this.el.cycleCount.textContent  = state.cycle_count  ?? 0;
    this.el.cycleTime.textContent   = (state.cycle_time_s ?? 0).toFixed(2) + " s";

    // alarmes
    if (state.alarm_active ?? false) {
      this.el.alarmBanner.className = "alarm-banner alarm";
      this.el.alarmBanner.innerHTML = `<span>⚠ Alarme ativo</span>`;
    } else if (state.warning_active ?? false) {
      this.el.alarmBanner.className = "alarm-banner warning";
      this.el.alarmBanner.innerHTML = `<span>Aviso ativo</span>`;
    } else {
      this.el.alarmBanner.className = "alarm-banner none";
      this.el.alarmBanner.innerHTML = `<span>Sem alarmes ativos</span>`;
    }
    this.el.alarmCode.textContent =
      (state.active_alarm_code ?? 0) ? "#" + state.active_alarm_code : "—";

    // caixas na esteira
    if (this.cellManager) this.cellManager.updateFromState(state);

    // grip: pegar/soltar caixas no TCP
    if (this.gripController) this.gripController.update(state);
  }
}
