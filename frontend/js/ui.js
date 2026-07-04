import { JOINT_NAMES, PROGRAM_STATE_LABELS } from "./config.js";
import { applyJointAngles } from "./robot.js";

export const el = {
  connDot: document.getElementById("connDot"),
  connText: document.getElementById("connText"),
  programStatePill: document.getElementById("programStatePill"),
  runningPill: document.getElementById("runningPill"),
  safetyPill: document.getElementById("safetyPill"),
  palletCount: document.getElementById("palletCount"),
  cycleCount: document.getElementById("cycleCount"),
  cycleTime: document.getElementById("cycleTime"),
  modeVal: document.getElementById("modeVal"),
  flagRunning: document.getElementById("flagRunning"),
  flagDrives: document.getElementById("flagDrives"),
  flagHome: document.getElementById("flagHome"),
  alarmBanner: document.getElementById("alarmBanner"),
  alarmCode: document.getElementById("alarmCode"),
  modelStatus: document.getElementById("modelStatus"),
  jointsReadout: document.getElementById("jointsReadout"),
};

export function initJointsReadout() {
  JOINT_NAMES.forEach((name) => {
    const cell = document.createElement("div");
    cell.className = "joint-cell";
    cell.innerHTML = `<div class="jname">${name}</div><div class="jval" id="jval-${name}">0.0°</div>`;
    el.jointsReadout.appendChild(cell);
  });
}

export function setModelStatus(text) {
  if (el.modelStatus) {
    el.modelStatus.textContent = text;
  }
}

export function setConnectionLabel(text, online = false) {
  el.connDot.classList.toggle("online", online);
  el.connText.textContent = text;
}

function setFlag(element, on, onText, offText) {
  element.classList.toggle("on", on);
  element.classList.toggle("off", !on);
  element.innerHTML = `<span class="led"></span>${on ? onText : offText}`;
}

export function applyState(state) {
  const joints = Array.isArray(state.joints) ? state.joints : [0, 0, 0, 0, 0, 0];

  applyJointAngles(joints);

  JOINT_NAMES.forEach((name, i) => {
    document.getElementById(`jval-${name}`).textContent =
      (joints[i] ?? 0).toFixed(1) + "°";
  });

  setConnectionLabel(
    state.connected ?? false ? "Conectado ao CLP" : "Desconectado do CLP",
    state.connected ?? false
  );

  const stateLabel = PROGRAM_STATE_LABELS[state.program_state ?? -1] ?? "—";
  el.programStatePill.textContent = stateLabel;
  el.modeVal.textContent = stateLabel;

  el.runningPill.textContent = state.program_running ?? false ? "Em execução" : "Parado";
  el.runningPill.classList.toggle("running", state.program_running ?? false);
  el.runningPill.classList.toggle("stopped", !(state.program_running ?? false));

  el.safetyPill.style.display = state.in_safety_stop ?? false ? "inline-block" : "none";
  el.safetyPill.classList.toggle("safety", state.in_safety_stop ?? false);

  setFlag(el.flagRunning, state.program_running ?? false, "Em execução", "Parado");
  setFlag(el.flagDrives, state.drives_on ?? false, "Ligados", "Desligados");
  setFlag(el.flagHome, state.in_home_position ?? false, "Em home", "Fora");

  el.palletCount.textContent = state.pallet_count ?? 0;
  el.cycleCount.textContent = state.cycle_count ?? 0;
  el.cycleTime.textContent = (state.cycle_time_s ?? 0).toFixed(2) + " s";

  if (state.alarm_active ?? false) {
    el.alarmBanner.className = "alarm-banner alarm";
    el.alarmBanner.innerHTML = `<span>⚠ Alarme ativo</span>`;
  } else if (state.warning_active ?? false) {
    el.alarmBanner.className = "alarm-banner warning";
    el.alarmBanner.innerHTML = `<span>Aviso ativo</span>`;
  } else {
    el.alarmBanner.className = "alarm-banner none";
    el.alarmBanner.innerHTML = `<span>Sem alarmes ativos</span>`;
  }

  el.alarmCode.textContent =
    state.active_alarm_code ?? 0 ? "#" + (state.active_alarm_code ?? 0) : "—";
}
