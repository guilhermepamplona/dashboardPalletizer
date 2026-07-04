import { loadGltf } from "../utils/loader.js";
import { prepareMesh, getRequiredObject } from "../utils/mesh.js";
import { AXIS_CONFIG, TOOL_CONFIG, MODEL_URL, ROBOT_BASE_TRANSFORM } from "../config.js";
import { JointController } from "./JointController.js";
import { ToolController } from "./ToolController.js";
import { degToRad } from "../utils/math.js";

export class RobotController {
  constructor(sceneController, onStatusChange = null) {
    this.sceneController = sceneController;
    this.onStatusChange = onStatusChange;

    this.root = null;
    this.axis1 = null;
    this.axis2 = null;
    this.axis3 = null;
    this.axis5 = null;
    this.axis6 = null;
    this.tool = null;
    this.toolOffset = null;
    this.tcp = null;
    this.ready = false;

    this.joints = new JointController(AXIS_CONFIG);
    this.toolController = null;
  }

  async load(initialJoints = [0, 0, 0, 0, 0, 0]) {
    try {
      const gltf = await loadGltf(MODEL_URL);
      const root = gltf.scene;
      root.name = root.name || "KR180_R3200_PA";

      prepareMesh(root);
      this.applyBaseTransform(root);

      this.root = root;
      this.axis1 = getRequiredObject(root, "Axis1");
      this.axis2 = getRequiredObject(root, "Axis2");
      this.axis3 = getRequiredObject(root, "Axis3");
      this.axis5 = getRequiredObject(root, "Axis5");
      this.axis6 = getRequiredObject(root, "Axis6");
      this.tool = getRequiredObject(root, "Tool");
      this.toolOffset = getRequiredObject(root, "Tool_Offset");
      this.tcp = getRequiredObject(root, "TCP");

      this.toolController = new ToolController(this.toolOffset, TOOL_CONFIG);
      this.toolController.applyOffset();

      this.joints.captureRestPose(this);

      const missing = ["axis1", "axis2", "axis3", "axis5", "axis6"].filter(
        (key) => !this[key]
      );
      this.ready = missing.length === 0;

      this.setStatus(
        this.ready
          ? "GLB carregado"
          : "GLB carregado, eixos faltando: " + missing.join(", ")
      );

      this.sceneController.add(root);
      this.setJoints(initialJoints);
      this.sceneController.cameraController.frameObject(root);
    } catch (error) {
      console.error("Erro ao carregar GLB do robô:", error);
      this.setStatus("erro ao carregar GLB");
    }
  }

  applyBaseTransform(root) {
    const t = ROBOT_BASE_TRANSFORM;
    root.scale.setScalar(t.scale ?? 1);
    root.position.set(t.x ?? 0, t.y ?? 0, t.z ?? 0);
    root.rotation.set(
      degToRad(t.rx ?? 0),
      degToRad(t.ry ?? 0),
      degToRad(t.rz ?? 0)
    );
  }

  setJoints(joints) {
    if (!this.ready) return;
    this.joints.applyJoints(this, joints);
  }

  setStatus(text) {
    if (this.onStatusChange) {
      this.onStatusChange(text);
    }
  }
}
