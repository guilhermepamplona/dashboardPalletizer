/**
 * GripController.js
 * -----------------
 * Pega e solta caixas no TCP do robô usando sinais booleanos do CLP.
 *
 * Sinais (DB601, offset 31.2 em diante):
 *   pick_conv1  (BOOL 31.2) → pega TODAS as caixas visíveis da esteira 1
 *   pick_conv2  (BOOL 31.3) → pega TODAS as caixas visíveis da esteira 2
 *   pick_conv3  (BOOL 31.4) → pega TODAS as caixas visíveis da esteira 3
 *   pick_conv4  (BOOL 31.5) → pega TODAS as caixas visíveis da esteira 4
 *   grip_release (BOOL 31.6) → solta TODAS as caixas no palete
 *
 * Detecção por borda de subida: a ação ocorre uma vez quando o sinal
 * vai de false → true, independente do tempo que fica ativo.
 *
 * Ao soltar, as caixas ficam na posição mundial do TCP no momento do
 * release — visualmente correto pois o robô estará sobre o palete.
 */

import { BOX_INSTANCES } from "../config.js";
import * as THREE from "three";

const PICK_SIGNALS = [
  { signal: "pick_conv1", prefix: "Caixa_Conv1_" },
  { signal: "pick_conv2", prefix: "Caixa_Conv2_" },
  { signal: "pick_conv3", prefix: "Caixa_Conv3_" },
  { signal: "pick_conv4", prefix: "Caixa_Conv4_" },
];

export class GripController {
  constructor(robotController, cellManager) {
    this.robot       = robotController;
    this.cellManager = cellManager;

    /** IDs de todas as caixas presas no TCP agora */
    this._grippedIds  = [];

    /** Estado anterior dos sinais para detectar borda de subida */
    this._prevPick    = {};
    this._prevRelease = false;
  }

  update(state) {
    // Pick: borda de subida em qualquer pick_convN
    for (const { signal, prefix } of PICK_SIGNALS) {
      const now  = Boolean(state[signal]);
      const prev = Boolean(this._prevPick[signal]);
      if (now && !prev) this._pickAll(prefix, state);
      this._prevPick[signal] = now;
    }

    // Release: borda de subida em grip_release
    const rel = Boolean(state.grip_release);
    if (rel && !this._prevRelease) this._releaseAll();
    this._prevRelease = rel;
  }

  /**
   * Pega TODAS as caixas visíveis do conveyor (prefix) e anexa ao TCP.
   * "Visível" = sensor correspondente está ativo no estado atual.
   */
  _pickAll(prefix, state) {
    const tcp = this.robot.tcp;
    if (!tcp) return;

    const targets = BOX_INSTANCES.filter(
      (b) => b.id.startsWith(prefix) && Boolean(state[b.sensor])
    );

    for (const cfg of targets) {
      if (this._grippedIds.includes(cfg.id)) continue;
      this.cellManager.attachBoxToRobot(cfg.id, tcp);
      this._grippedIds.push(cfg.id);
    }
  }

  /**
   * Solta TODAS as caixas presas, mantendo a posição mundial atual
   * (onde o TCP estiver no momento do release).
   */
  _releaseAll() {
    for (const id of this._grippedIds) {
      const box = this.cellManager.boxLoader?.getBox(id);
      if (!box) continue;

      const worldPos = new THREE.Vector3();
      box.getWorldPosition(worldPos);
      this.cellManager.placeBoxOnPallet(id, worldPos);
      // Avisa o BoxLoader que essa caixa saiu do TCP
      this.cellManager.boxLoader?.detachFromTcp(id);
    }
    this._grippedIds = [];
  }
}
