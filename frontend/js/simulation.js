import { applyState, setConnectionLabel, setModelStatus } from "./ui.js";
import { robot } from "./robot.js";

let simulationTimer = null;

export function buildSimulatedState() {
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
      25 * Math.sin(t * 0.35), // A1
      -96 + 18 * Math.sin(t * 0.45), // A2
      74 + 20 * Math.sin(t * 0.5), // A3
      0, // A4
      112 + 25 * Math.sin(t * 0.5), // A5
      60 * Math.sin(t * 0.75), // A6
    ],
  };
}

export function startSimulation() {
  if (simulationTimer) return;

  if (!robot.ready) {
    setModelStatus("simulação aguardando GLB…");
  }

  simulationTimer = setInterval(() => {
    const simState = buildSimulatedState();
    applyState(simState);

    if (robot.ready) {
      setModelStatus("GLB carregado · modo simulação");
    }

    setConnectionLabel("modo simulação", false);
  }, 80);
}

export function stopSimulation() {
  if (!simulationTimer) return;

  clearInterval(simulationTimer);
  simulationTimer = null;
}
