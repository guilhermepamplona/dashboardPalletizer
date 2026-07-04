import * as THREE from "three";

export class JointController {
  constructor(axisConfig) {
    this.axisConfig = axisConfig;
    this.restQuaternions = {};
  }

  captureRestPose(robotObjects) {
    ["axis1", "axis2", "axis3", "axis5", "axis6"].forEach((key) => {
      if (robotObjects[key]) {
        this.restQuaternions[key] = robotObjects[key].quaternion.clone();
      }
    });
  }

  applyJoints(robotObjects, deg) {
    const values = {
      a1: deg[0] ?? 0,
      a2: deg[1] ?? 0,
      a3: deg[2] ?? 0,
      a4: deg[3] ?? 0,
      a5: deg[4] ?? 0,
      a6: deg[5] ?? 0,
    };

    for (const [joint, cfg] of Object.entries(this.axisConfig)) {
      const obj = robotObjects[cfg.object];
      const angle = values[joint] * cfg.sign + cfg.offset;
      this.setAxisRotation(obj, cfg.object, cfg.axis, angle);
    }
  }

  setAxisRotation(axisObject, objectKey, axisName, angleDeg) {
    if (!axisObject || !this.restQuaternions[objectKey]) return;

    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    const axisVector = {
      x: new THREE.Vector3(1, 0, 0),
      y: new THREE.Vector3(0, 1, 0),
      z: new THREE.Vector3(0, 0, 1),
    }[axisName];

    const delta = new THREE.Quaternion().setFromAxisAngle(axisVector, angleRad);
    axisObject.quaternion.copy(this.restQuaternions[objectKey]).multiply(delta);
  }
}
