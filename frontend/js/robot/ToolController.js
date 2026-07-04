import * as THREE from "three";
import { quaternionFromEulerDeg } from "../utils/math.js";

export class ToolController {
  constructor(toolOffset, config) {
    this.toolOffset = toolOffset;
    this.config = config;
    this.basePosition = toolOffset ? toolOffset.position.clone() : new THREE.Vector3();
    this.baseQuaternion = toolOffset ? toolOffset.quaternion.clone() : new THREE.Quaternion();
  }

  applyOffset() {
    if (!this.toolOffset) return;

    const { x, y, z, rx, ry, rz } = this.config;
    const offsetQuat = quaternionFromEulerDeg(rx, ry, rz, "XYZ");

    this.toolOffset.position
      .copy(this.basePosition)
      .add(new THREE.Vector3(x, y, z));

    this.toolOffset.quaternion.copy(this.baseQuaternion).multiply(offsetQuat);
  }
}
