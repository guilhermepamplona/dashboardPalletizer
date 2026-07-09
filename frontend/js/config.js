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
export const CELL_URL = "/static/models/cell_layout.glb?v=19";

export const BOX_MODELS = {
  spgv1: "/static/models/caixa_SPGV1.glb?v=1",
  spgv2: "/static/models/caixa_SPGV2.glb?v=1",
  spgv3: "/static/models/caixa_SPGV3.glb?v=1",
  sppv: "/static/models/caixa_SPPV.glb?v=1",
};

export const BOX_TYPE = {
  SPGV1: "spgv1",
  SPGV2: "spgv2",
  SPGV3: "spgv3",
  SPPV: "sppv",
};

/*
  Caixas dinâmicas da célula.

  - id: nome único da caixa na cena
  - type: modelo usado, vindo de BOX_TYPE
  - sensor: nome do booleano recebido pelo WebSocket/CLP
  - position/rotation: ajuste visual na cena
*/
export const BOX_INSTANCES = [
  //Caixas SPGV2 - Conveyor 1
  {
    id: "Caixa_Conv1_01",
    type: BOX_TYPE.SPGV2,
    sensor: "sensor1_conv1",
    position: { x: 1.32, y: 2.8, z: 1.25 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: "Caixa_Conv1_02",
    type: BOX_TYPE.SPGV2,
    sensor: "sensor2_conv1",
    position: { x: 1.65, y: 2.8, z: 1.25 },
    rotation: { x: 0, y: 0, z: 0 },
  },

  //Caixas SPGV1 - Conveyor 2
  {
    id: "Caixa_Conv2_01",
    type: BOX_TYPE.SPGV1,
    sensor: "sensor1_conv2",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: "Caixa_Conv2_02",
    type: BOX_TYPE.SPGV1,
    sensor: "sensor2_conv2",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  },

  //Caixas SPPV - Conveyor 3
  {
    id: "Caixa_Conv3_01",
    type: BOX_TYPE.SPPV,
    sensor: "sensor1_conv3",
    position: { x: 1.26, y: 2.8, z: -0.3 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: "Caixa_Conv3_02",
    type: BOX_TYPE.SPPV,
    sensor: "sensor2_conv3",
    position: { x: 1.46, y: 2.8, z: -0.3 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: "Caixa_Conv3_03",
    type: BOX_TYPE.SPPV,
    sensor: "sensor3_conv3",
    position: { x: 1.66, y: 2.8, z: -0.3 },
    rotation: { x: 0, y: 0, z: 0 },
  },

  //Caixas SPGV3 - Conveyor 4
  {
    id: "Caixa_Conv4_01",
    type: BOX_TYPE.SPGV3,
    sensor: "sensor1_conv4",
    position: { x: 1.28, y: 2.8, z: -1.2 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: "Caixa_Conv4_02",
    type: BOX_TYPE.SPGV3,
    sensor: "sensor2_conv4",
    position: { x: 1.51, y: 2.8, z: -1.2 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: "Caixa_Conv4_03",
    type: BOX_TYPE.SPGV3,
    sensor: "sensor3_conv4",
    position: { x: 1.74, y: 2.8, z: -1.2 },
    rotation: { x: 0, y:0, z: 0 },
  },
];

/*
  Futuro: quando você separar as esteiras em GLBs individuais,
  crie URLs e listas aqui, e um loader específico poderá clonar por software.
*/
// export const CONVEYOR_MODELS = {
//   pallet: "/static/models/esteira_pallet.glb?v=1",
//   product: "/static/models/esteira_produto.glb?v=1",
// };


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
