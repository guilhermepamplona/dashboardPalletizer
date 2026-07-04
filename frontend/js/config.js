export const WS_URL =
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";

export const PROGRAM_STATE_LABELS = {
  0: "Manual T1",
  1: "Manual T2",
  2: "Automático",
  3: "Externo",
};

export const JOINT_NAMES = ["A1", "A2", "A3", "A4", "A5", "A6"];

export const MODEL_URL = "/static/models/KR180_Std.glb?v=2";
export const CELL_URL = "/static/models/cell_layout.glb?v=18";

export const ROBOT_BASE_TRANSFORM = {
  x: 0,
  y: 1.5,
  z: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  scale: 1,
};

export const AXIS_CONFIG = {
  a1: { object: "axis1", axis: "y", sign: -1, offset: 0 },
  a2: { object: "axis2", axis: "z", sign: -1, offset: -90 },
  a3: { object: "axis3", axis: "z", sign: -1, offset: 90 },
  a5: { object: "axis5", axis: "z", sign: -1, offset: 90 },
  a6: { object: "axis6", axis: "y", sign: 1, offset: 90 },
};

export const TOOL_CONFIG = {
  x: 0,
  y: 0,
  z: 0,
  rx: 0,
  ry: 180,
  rz: 0,
};
