"""
plc_client.py
--------------
Cliente S7 (ISO-TSAP) para leitura da DB601_DashBoard do CLP que alimenta
o dashboard da célula de paletização (KR180 R2 PA).

Layout da DB601_DashBoard (TIA Portal, todos os campos Big-Endian):

  Offset  Tipo   Campo
  ------  -----  -------------------------------------------------------
  0       INT    A1  (valor * 100)
  2       INT    A2  (valor * 100)
  4       INT    A3  (valor * 100)
  6       INT    A4  (valor * 100)
  8       INT    A5  (valor * 100)
  10      INT    A6  (valor * 100)
  12      INT    Robot_State      0=Manual T1, 1=Manual T2, 2=Auto, 3=Externo
  14      INT    Pallet_Count
  16      INT    Active_Alarm_Code   (slot 1 — primeiro alarme ativo)
  18      INT    Cycle_Time_S
  20.0    BOOL   Program_Running
  20.1    BOOL   Drives_On
  20.2    BOOL   In_Home_Position
  20.3    BOOL   Alarm_Active
  20.4    BOOL   Warning_Active
  22      INT    Fault_Slot_2        (segundo alarme ativo, 0 = sem falha)
  24      INT    Fault_Slot_3
  26      INT    Fault_Slot_4
  28      INT    Fault_Slot_5
  30.0    BOOL   Sensor_1_Conv_1 
  30.1    BOOL   Sensor_2_Conv_1
  30.2    BOOL   Sensor_1_Conv_2
  30.3    BOOL   Sensor_2_Conv_2
  30.4    BOOL   Sensor_1_Conv_3
  30.5    BOOL   Sensor_2_Conv_3
  30.6    BOOL   Sensor_3_Conv_3
  30.7    BOOL   Sensor_1_Conv_4
  31.0    BOOL   Sensor_2_Conv_4
  31.1    BOOL   Sensor_3_Conv_4

  *** Adicione os slots de falha conforme fechar a DB no TIA Portal. ***
  *** Atualize NUM_FAULT_SLOTS e DB_SIZE abaixo. ***

Tamanho atual: 30 bytes (offsets 0–28, 5 slots de falha)
"""

import asyncio
import logging
from dataclasses import dataclass, asdict, field
from typing import Optional

import snap7
from snap7.util import get_int, get_bool

import config
from alarm_codes import get_active_alarms

logger = logging.getLogger("plc_client")

PLC_IP            = config.PLC_IP
PLC_RACK          = config.PLC_RACK
PLC_SLOT          = config.PLC_SLOT
DB_NUMBER         = config.DB_NUMBER       # 601 para a DB601_DashBoard
DB_SIZE           = config.DB_SIZE         # 30 bytes com 5 slots de falha
POLL_INTERVAL_S   = config.POLL_INTERVAL_S

# Número de slots de falha INT na DB (após os BOOLs no offset 20).
# Cada slot ocupa 2 bytes; o primeiro está no offset 16 (Active_Alarm_Code),
# os demais começam em 22, 24, 26, ...
# Ajuste conforme fechar a DB no TIA Portal.
NUM_FAULT_SLOTS = 5


@dataclass
class CellState:
    joints: list                   # [A1..A6] em graus (float)
    program_state: int             # 0=Manual T1, 1=Manual T2, 2=Auto, 3=Externo
    program_running: bool
    drives_on: bool
    in_home_position: bool
    in_safety_stop: bool           # não existe na DB601; sempre False
    pallet_count: int
    cycle_count: int               # não existe na DB601; sempre 0
    active_alarm_code: int         # código do alarme principal (slot 1)
    alarm_active: bool
    warning_active: bool
    cycle_time_s: float
    connected: bool
    sensor1_conv1: bool
    sensor2_conv1: bool
    sensor1_conv2: bool
    sensor2_conv2: bool
    sensor1_conv3: bool
    sensor2_conv3: bool
    sensor3_conv3: bool
    sensor1_conv4: bool
    sensor2_conv4: bool
    sensor3_conv4: bool
    # Lista de alarmes ativos (todos os slots != 0), com descrição textual
    active_alarms: list = field(default_factory=list)

    @staticmethod
    def disconnected() -> "CellState":
        return CellState(
            joints=[0.0] * 6,
            program_state=0,
            program_running=False,
            drives_on=False,
            in_home_position=False,
            in_safety_stop=False,
            pallet_count=0,
            cycle_count=0,
            active_alarm_code=0,
            alarm_active=False,
            warning_active=False,
            cycle_time_s=0.0,
            connected=False,
            active_alarms=[],
            sensor1_conv1=False,
            sensor2_conv1=False,
            sensor1_conv2=False,
            sensor2_conv2=False,
            sensor1_conv3=False,
            sensor2_conv3=False,
            sensor3_conv3=False,
            sensor1_conv4=False,
            sensor2_conv4=False,
            sensor3_conv4=False
        )


def parse_db(raw: bytes) -> CellState:
    """Converte os bytes brutos da DB601_DashBoard no CellState.

    Se você adicionar mais slots de falha na DB, ajuste NUM_FAULT_SLOTS
    e DB_SIZE (em config.py / .env) — o resto do parsing é automático.
    """
    # Juntas: INT * 100 → graus
    joints = [get_int(raw, off) / 100.0 for off in (0, 2, 4, 6, 8, 10)]

    # Slot 1 de falha está no offset 16 (Active_Alarm_Code)
    # Slots 2..N estão em 22, 24, 26, 28, ...
    fault_codes = [get_int(raw, 16)]
    for i in range(1, NUM_FAULT_SLOTS):
        offset = 22 + (i - 1) * 2
        if offset + 2 <= len(raw):
            fault_codes.append(get_int(raw, offset))

    active_alarms = get_active_alarms(fault_codes)

    return CellState(
        joints=joints,
        program_state=get_int(raw, 12),
        program_running=get_bool(raw, 20, 0),
        drives_on=get_bool(raw, 20, 1),
        in_home_position=get_bool(raw, 20, 2),
        in_safety_stop=False,
        pallet_count=get_int(raw, 14),
        cycle_count=0,
        active_alarm_code=fault_codes[0],
        alarm_active=get_bool(raw, 20, 3),
        warning_active=get_bool(raw, 20, 4),
        cycle_time_s=float(get_int(raw, 18)),
        connected=True,
        active_alarms=active_alarms,
        sensor1_conv1=get_bool(raw, 30,0),
        sensor2_conv1=get_bool(raw, 30,1),
        sensor1_conv2=get_bool(raw, 30,2),
        sensor2_conv2=get_bool(raw, 30,3),
        sensor1_conv3=get_bool(raw, 30,4),
        sensor2_conv3=get_bool(raw, 30,5),
        sensor3_conv3=get_bool(raw, 30,6),
        sensor1_conv4=get_bool(raw, 30,7),
        sensor2_conv4=get_bool(raw, 31,0),
        sensor3_conv4=get_bool(raw, 31,1),
    )


class PLCClient:
    """Wrapper assíncrono em torno do client síncrono do python-snap7.

    Reconecta automaticamente com backoff de RECONNECT_INTERVAL_S segundos
    entre tentativas, recriando o objeto Client() a cada tentativa para
    evitar o erro 'Cannot change this param now'.
    """

    RECONNECT_INTERVAL_S = 3.0

    def __init__(self):
        self._client: Optional[snap7.client.Client] = None
        self._connected = False
        self._lock = asyncio.Lock()
        self._last_connect_attempt = 0.0

    def _new_client(self):
        try:
            if self._client:
                self._client.disconnect()
        except Exception:
            pass
        self._client = snap7.client.Client()

    def _connect_sync(self):
        self._new_client()
        self._client.connect(PLC_IP, PLC_RACK, PLC_SLOT)
        self._connected = self._client.get_connected()

    def _disconnect_sync(self):
        try:
            if self._client:
                self._client.disconnect()
        except Exception:
            pass
        self._connected = False

    def _read_db_sync(self) -> bytes:
        return self._client.db_read(DB_NUMBER, 0, DB_SIZE)

    async def connect(self):
        async with self._lock:
            if self._connected:
                return
            now = asyncio.get_event_loop().time()
            if now - self._last_connect_attempt < self.RECONNECT_INTERVAL_S:
                raise ConnectionError("Aguardando intervalo de reconexão")
            self._last_connect_attempt = now
            await asyncio.get_event_loop().run_in_executor(None, self._connect_sync)

    async def disconnect(self):
        async with self._lock:
            await asyncio.get_event_loop().run_in_executor(None, self._disconnect_sync)

    async def read_state(self) -> CellState:
        if not self._connected:
            try:
                await self.connect()
            except Exception as exc:
                logger.warning("Falha ao conectar no CLP: %s", exc)
                return CellState.disconnected()

        try:
            raw = await asyncio.get_event_loop().run_in_executor(None, self._read_db_sync)
            return parse_db(raw)
        except Exception as exc:
            logger.warning("Falha ao ler DB%s: %s", DB_NUMBER, exc)
            self._connected = False
            return CellState.disconnected()


async def poll_loop(client: PLCClient, on_update):
    """Loop contínuo de leitura a POLL_INTERVAL_S segundos."""
    while True:
        state = await client.read_state()
        await on_update(state)
        await asyncio.sleep(POLL_INTERVAL_S)


def state_to_dict(state: CellState) -> dict:
    return asdict(state)
