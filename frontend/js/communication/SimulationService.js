/**
 * SimulationService.js
 * --------------------
 * Simula um ciclo de paletização usando os mesmos sinais do CLP real.
 *
 * Ciclo: HOME → PRE_PICK → PICK (pulso pick_conv1) → TRANSPORT
 *             → PRE_PLACE → PLACE (pulso grip_release) → HOME
 *
 * Na simulação, sensor1_conv1 e sensor2_conv1 ficam ativos — o robô
 * pega as duas caixas da esteira 1 de uma vez ao receber pick_conv1.
 */

const MOVE_MS  = 1800;
const PAUSE_MS = 350;
const TICK_MS  = 50;

function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return t * t * (3 - 2 * t); }

// emit: sinal que dispara um pulso (1 tick) ao CHEGAR neste waypoint
const CYCLE = [
  { name: "HOME",      joints: [0,   -90, 90, 0,   0,  0], emit: null          },
  { name: "PRE_PICK",  joints: [35,  -55, 70, 0, -15,  0], emit: null          },
  { name: "PICK",      joints: [35,  -35, 55, 0, -20,  0], emit: "pick_conv1"  },
  { name: "PRE_PICK",  joints: [35,  -55, 70, 0, -15,  0], emit: null          },
  { name: "TRANSPORT", joints: [-40, -60, 65, 10, -10, 20], emit: null         },
  { name: "PRE_PLACE", joints: [-95, -50, 60, 0, -10,  0], emit: null          },
  { name: "PLACE",     joints: [-95, -30, 45, 0, -15,  0], emit: "grip_release"},
  { name: "PRE_PLACE", joints: [-95, -50, 60, 0, -10,  0], emit: null          },
];

export class SimulationService {
  constructor(ui, robotController) {
    this.ui              = ui;
    this.robotController = robotController;
    this.timer           = null;

    this._idx        = 0;
    this._elapsed    = 0;
    this._pausing    = false;
    this._pauseLeft  = 0;
    this._emitSignal = null;
    this._pallets    = 0;
    this._cycles     = 0;
    this._cycleStart = performance.now();
    this._cycleMs    = 0;
  }

  _next() { return (this._idx + 1) % CYCLE.length; }

  _state(joints) {
    return {
      connected: false, program_state: 2, program_running: true,
      drives_on: true, in_home_position: CYCLE[this._idx].name === "HOME",
      in_safety_stop: false, warning_active: false, alarm_active: false,
      active_alarm_code: 0, active_alarms: [],
      pallet_count: this._pallets,
      cycle_count:  this._cycles,
      cycle_time_s: parseFloat((this._cycleMs / 1000).toFixed(2)),
      joints,

      // sensores: esteira 1 com 2 caixas presentes
      sensor1_conv1: true,  sensor2_conv1: true,
      sensor1_conv2: false, sensor2_conv2: false,
      sensor1_conv3: false, sensor2_conv3: false, sensor3_conv3: false,
      sensor1_conv4: false, sensor2_conv4: false, sensor3_conv4: false,

      // sinais de pick/release — pulso ativo apenas no tick de chegada
      pick_conv1:   this._emitSignal === "pick_conv1",
      pick_conv2:   false,
      pick_conv3:   false,
      pick_conv4:   false,
      grip_release: this._emitSignal === "grip_release",

      // pallets: simulados como sempre presentes para testar a visibilidade
      pallet_conv1: true,
      pallet_conv2: false,
      pallet_conv3: false,
      pallet_conv4: false,
    };
  }

  _tick() {
    const cur  = CYCLE[this._idx];
    const next = CYCLE[this._next()];

    if (this._pausing) {
      this._pauseLeft -= TICK_MS;
      this.ui.applyState(this._state(cur.joints.slice()));
      this._emitSignal = null; // pulso dura apenas 1 tick

      if (this._pauseLeft <= 0) {
        this._pausing = false;
        this._elapsed = 0;

        if (next.name === "HOME") {
          this._cycles++;
          this._cycleMs    = performance.now() - this._cycleStart;
          this._cycleStart = performance.now();
        }
        if (cur.name === "PLACE") this._pallets++;

        this._idx = this._next();
      }
      return;
    }

    this._elapsed += TICK_MS;
    const t      = Math.min(this._elapsed / MOVE_MS, 1);
    const joints = cur.joints.map((a, i) => lerp(a, next.joints[i], ease(t)));

    this.ui.applyState(this._state(joints));

    if (t >= 1) {
      this._pausing    = true;
      this._pauseLeft  = PAUSE_MS;
      this._emitSignal = next.emit; // pulso ativo no primeiro tick da pausa
    }
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this._tick();
      if (this.robotController.ready)
        this.ui.setModelStatus("GLB carregado · modo simulação");
      this.ui.setConnectionLabel("modo simulação", false);
    }, TICK_MS);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}
