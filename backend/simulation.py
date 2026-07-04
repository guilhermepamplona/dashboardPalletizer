"""
simulation.py
--------------
Modo de simulacao do dashboard: gera um CellState "falso", movendo o
robo entre pontos (waypoints) pre-definidos no espaco de juntas, sem
precisar de conexao com o CLP. Util para testar o dashboard sozinho,
sem rede/CLP disponivel.

Ativado via .env:
    SIMULATION_MODE=true

A interface (CellState, state_to_dict) e identica a do plc_client.py,
entao o resto do backend (main.py) nao sabe nem precisa saber se os
dados vem do CLP real ou da simulacao.
"""

import asyncio
import logging
import math
import random

from plc_client import CellState

logger = logging.getLogger("simulation")

# ----------------------------------------------------------------------
# Pontos (em graus, [A1, A2, A3, A4, A5, A6]) que o robô visita em
# sequência, simulando um ciclo de paletização: HOME -> pega peça ->
# move até o palete -> solta -> volta pro HOME.
#
# Ajuste/adicione pontos à vontade — o robô interpola suavemente entre
# eles.
# ----------------------------------------------------------------------
WAYPOINTS = [
    {"name": "HOME",        "joints": [0, -90, 90, 0, 0, 0]},
    {"name": "PRE-PICK",    "joints": [35, -55, 70, 0, -15, 0]},
    {"name": "PICK",        "joints": [35, -35, 55, 0, -20, 0]},
    {"name": "PRE-PICK",    "joints": [35, -55, 70, 0, -15, 0]},
    {"name": "TRANSPORTE",  "joints": [-40, -60, 65, 10, -10, 20]},
    {"name": "PRE-PLACE",   "joints": [-95, -50, 60, 0, -10, 0]},
    {"name": "PLACE",       "joints": [-95, -30, 45, 0, -15, 0]},
    {"name": "PRE-PLACE",   "joints": [-95, -50, 60, 0, -10, 0]},
    {"name": "HOME",        "joints": [0, -90, 90, 0, 0, 0]},
]

MOVE_DURATION_S = 1.8     # tempo pra ir de um waypoint a outro
PAUSE_AT_POINT_S = 0.4    # pausa em cada ponto (simula garra abrindo/fechando)


def _lerp(a, b, t):
    return a + (b - a) * t


def _ease(t):
    # ease-in-out simples, pra não parecer robótico/linear demais
    return t * t * (3 - 2 * t)


class Simulator:
    """Gera estados de célula simulados, sem nenhuma dependência do CLP."""

    def __init__(self):
        self._cycle_count = 0
        self._pallet_count = 0
        self._last_cycle_time = 0.0

    async def run(self, on_update):
        logger.info("Modo SIMULAÇÃO ativo — robô vai se mover sozinho, sem CLP.")
        idx = 0
        n = len(WAYPOINTS)

        while True:
            start = WAYPOINTS[idx]["joints"]
            end_idx = (idx + 1) % n
            end = WAYPOINTS[end_idx]["joints"]
            end_name = WAYPOINTS[end_idx]["name"]

            cycle_start = asyncio.get_event_loop().time()
            steps = max(int(MOVE_DURATION_S / 0.05), 1)

            for step in range(steps + 1):
                t = _ease(step / steps)
                joints = [_lerp(start[j], end[j], t) for j in range(6)]

                state = CellState(
                    joints=joints,
                    program_state=2,  # Automático
                    program_running=True,
                    drives_on=True,
                    in_home_position=(end_name == "HOME" and t > 0.98),
                    in_safety_stop=False,
                    pallet_count=self._pallet_count,
                    cycle_count=self._cycle_count,
                    active_alarm_code=0,
                    alarm_active=False,
                    warning_active=False,
                    cycle_time_s=self._last_cycle_time,
                    connected=True,
                )
                await on_update(state)
                await asyncio.sleep(0.05)

            # chegou no ponto -> pequena pausa (simula ação na garra)
            await asyncio.sleep(PAUSE_AT_POINT_S)

            if end_name == "PLACE":
                self._pallet_count += 1
            if end_name == "HOME":
                self._cycle_count += 1
                self._last_cycle_time = round(
                    asyncio.get_event_loop().time() - cycle_start
                    + (0 if idx == n - 1 else 0), 2
                )
                # variação pequena pra não ficar um número fixo no dashboard
                self._last_cycle_time = round(
                    self._last_cycle_time + random.uniform(-0.1, 0.1), 2
                )

            idx = end_idx
