import * as THREE from "three";
import { GLTFLoader } from "three/addons/GLTFLoader.js";
import { scene, camera, controls } from "./scene.js";
import { MODEL_URL, AXIS_CONFIG, TOOL_CONFIG } from "./config.js";
import { getRequiredObject, prepareMesh } from "./mesh-utils.js";

export const robot = {
  root: null,
  axis1: null,
  axis2: null,
  axis3: null,
  axis5: null,
  axis6: null,
  tool: null,
  toolOffset: null,
  tcp: null,
  ready: false,
};

const REST_QUAT = {};

export function loadRobotModel(currentJoints, onStatusChange) {
  const loader = new GLTFLoader();

  loader.load(
    MODEL_URL,
    (gltf) => {
      const root = gltf.scene;
      root.name = root.name || "KR180_R3200_PA";

      prepareMesh(root);

      root.scale.setScalar(1);
      root.position.set(0, 1.5, 0);
      root.rotation.set(0, 0, 0);

      robot.root = root;
      robot.axis1 = getRequiredObject(root, "Axis1");
      robot.axis2 = getRequiredObject(root, "Axis2");
      robot.axis3 = getRequiredObject(root, "Axis3");
      robot.axis5 = getRequiredObject(root, "Axis5");
      robot.axis6 = getRequiredObject(root, "Axis6");

      robot.tool = getRequiredObject(root, "Tool");
      robot.toolOffset = getRequiredObject(root, "Tool_Offset");
      robot.tcp = getRequiredObject(root, "TCP");

      applyToolOffset();

      ["axis1", "axis2", "axis3", "axis5", "axis6"].forEach((k) => {
        if (robot[k]) {
          REST_QUAT[k] = robot[k].quaternion.clone();
        }
      });

      const missing = ["axis1", "axis2", "axis3", "axis5", "axis6"].filter(
        (k) => !robot[k]
      );
      robot.ready = missing.length === 0;

      if (onStatusChange) {
        onStatusChange(
          robot.ready
            ? "GLB carregado"
            : "GLB carregado, eixos faltando: " + missing.join(", ")
        );
      }

      scene.add(root);
      applyJointAngles(currentJoints);
      frameCameraToObject(root);
    },
    undefined,
    (err) => {
      console.error("Erro ao carregar GLB:", err);
      if (onStatusChange) onStatusChange("erro ao carregar GLB");
    }
  );
}

function applyToolOffset() {
  if (!robot.toolOffset) return;

  const basePos = robot.toolOffset.position.clone();
  const baseQuat = robot.toolOffset.quaternion.clone();

  const offsetQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(TOOL_CONFIG.rx),
      THREE.MathUtils.degToRad(TOOL_CONFIG.ry),
      THREE.MathUtils.degToRad(TOOL_CONFIG.rz),
      "XYZ"
    )
  );

  robot.toolOffset.position
    .copy(basePos)
    .add(new THREE.Vector3(TOOL_CONFIG.x, TOOL_CONFIG.y, TOOL_CONFIG.z));

  robot.toolOffset.quaternion.copy(baseQuat).multiply(offsetQuat);
}

function frameCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  controls.target.copy(center);
  controls.target.y += size.y * 0.15;

  camera.position.set(
    center.x + size.length() * 0.75,
    center.y + size.length() * 0.45,
    center.z + size.length() * 0.75
  );

  controls.update();
}

function setAxisRotation(axisObject, objectKey, axisName, angleDeg) {
  if (!axisObject || !REST_QUAT[objectKey]) return;

  const angleRad = THREE.MathUtils.degToRad(angleDeg);
  const axisVector = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1),
  }[axisName];

  const delta = new THREE.Quaternion().setFromAxisAngle(axisVector, angleRad);
  axisObject.quaternion.copy(REST_QUAT[objectKey]).multiply(delta);
}

export function applyJointAngles(deg) {
  if (!robot.ready) return;

  const values = {
    a1: deg[0] ?? 0,
    a2: deg[1] ?? 0,
    a3: deg[2] ?? 0,
    a4: deg[3] ?? 0,
    a5: deg[4] ?? 0,
    a6: deg[5] ?? 0,
  };

  for (const [joint, cfg] of Object.entries(AXIS_CONFIG)) {
    const obj = robot[cfg.object];
    const angle = values[joint] * cfg.sign + cfg.offset;
    setAxisRotation(obj, cfg.object, cfg.axis, angle);
  }
}
