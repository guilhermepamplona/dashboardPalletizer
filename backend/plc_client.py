"""
plc_client.py
--------------
Cliente S7 (ISO-TSAP) para leitura de uma DB GENERICA do CLP que alimenta
o dashboard da celula de paletizacao (KR180 R2 PA).

IMPORTANTE: os valores de DB_NUMBER, IP, RACK, SLOT e os OFFSETS abaixo
sao PLACEHOLDERS. Ajuste para a DB real assim que ela estiver definida
no TIA Portal / Step7. Procure por "AJUSTAR" neste arquivo.

Layout assumido da DB (tudo Big-Endian, como o S7 trabalha nativamente):

  Offset  Tipo     Campo
  ------  -------  ------------------------------------------------
  0.0     REAL     joint_1 (A1)            [graus]
  4.0     REAL     joint_2 (A2)            [graus]
  8.0     REAL     joint_3 (A3)            [graus]
  12.0    REAL     joint_4 (A4)            [graus]
  16.0    REAL     joint_5 (A5)            [graus]
  20.0    REAL     joint_6 (A6)            [graus]
  24.0    INT      program_state           0=Manual T1, 1=Manual T2,
                                            2=Auto, 3=Externo
  26.0    BOOL     program_running         X26.0
  26.1    BOOL     drives_on               X26.1
  26.2    BOOL     in_home_position        X26.2
  26.3    BOOL     in_safety_stop          X26.3
  28.0    DINT     pallet_count            contagem de paletes
  32.0    DINT     cycle_count             contagem de ciclos
  36.0    INT      active_alarm_code       0 = sem alarme
  38.0    BOOL     alarm_active            X38.0
  38.1    BOOL     warning_active          X38.1
  40.0    REAL     cycle_time_s            tempo do ultimo ciclo [s]

Ajuste os offsets conforme o "User Defined Type" / struct real assim
que voce tiver a DB definitiva. O resto do backend (websocket, API)
nao precisa mudar - so essa camada de parsing.
"""

import asyncio
import logging
from dataclasses import dataclass, asdict
from typing import Optional

import snap7
from snap7.util import get_real, get_int, get_dint, get_bool

import config

logger = logging.getLogger("plc_client")

# ----------------------------------------------------------------------
# Conexao e numero da DB — vem do .env (veja config.py / .env.example).
# Os valores abaixo so sao usados como fallback se a variavel nao
# estiver definida no .env.
# ----------------------------------------------------------------------
PLC_IP = config.PLC_IP
PLC_RACK = config.PLC_RACK
PLC_SLOT = config.PLC_SLOT
DB_NUMBER = config.DB_NUMBER       # AJUSTAR no .env quando a DB final existir
DB_SIZE = config.DB_SIZE           # bytes a ler — DB601 ocupa 21 bytes (offset 20 + 1 byte bools)

POLL_INTERVAL_S = config.POLL_INTERVAL_S   # 10 Hz por padrao


@dataclass
class CellState:
    joints: list  # [j1..j6] em graus
    program_state: int
    program_running: bool
    drives_on: bool
    in_home_position: bool
    in_safety_stop: bool
    pallet_count: int
    cycle_count: int
    active_alarm_code: int
    alarm_active: bool
    warning_active: bool
    cycle_time_s: float
    connected: bool

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
        )


def parse_db(raw: bytes) -> CellState:
    """Converte os bytes brutos da DB601_DashBoard no CellState.

    Layout real (DB601_DashBoard — TIA Portal):
      Offset  Tipo   Campo
      0       INT    A1  (valor * 100)
      2       INT    A2  (valor * 100)
      4       INT    A3  (valor * 100)
      6       INT    A4  (valor * 100)
      8       INT    A5  (valor * 100)
      10      INT    A6  (valor * 100)
      12      INT    Robot_State   0=Manual T1, 1=Manual T2, 2=Auto, 3=Externo
      14      INT    Pallet_Count
      16      INT    Active_Alarm_Code
      18      INT    Cycle_Time_S
      20.0    BOOL   Program_Running
      20.1    BOOL   Drives_On
      20.2    BOOL   In_Home_Position
      20.3    BOOL   Alarm_Active
      20.4    BOOL   Warning_Active
    """
    joints = [get_int(raw, off) / 100.0 for off in (0, 2, 4, 6, 8, 10)]
    return CellState(
        joints=joints,
        program_state=get_int(raw, 12),
        program_running=get_bool(raw, 20, 0),
        drives_on=get_bool(raw, 20, 1),
        in_home_position=get_bool(raw, 20, 2),
        in_safety_stop=False,               # não existe na DB601, sempre False
        pallet_count=get_int(raw, 14),
        cycle_count=0,                      # não existe na DB601
        active_alarm_code=get_int(raw, 16),
        alarm_active=get_bool(raw, 20, 3),
        warning_active=get_bool(raw, 20, 4),
        cycle_time_s=float(get_int(raw, 18)),
        connected=True,
    )


class PLCClient:
    """Wrapper assincrono em torno do client sincrono do python-snap7."""

    RECONNECT_INTERVAL_S = 3.0   # aguarda 3s entre tentativas de reconexão

    def __init__(self):
        self._client = None
        self._connected = False
        self._lock = asyncio.Lock()
        self._last_connect_attempt = 0.0

    def _new_client(self):
        """Cria um client snap7 limpo. Necessario recriar a cada tentativa
        para evitar o erro 'Cannot change this param now'."""
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

    def _read_db_sync(self) -> Optional[bytes]:
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
    """Loop continuo de leitura. on_update(CellState) é chamado a cada ciclo."""
    while True:
        state = await client.read_state()
        await on_update(state)
        await asyncio.sleep(POLL_INTERVAL_S)


def state_to_dict(state: CellState) -> dict:
    return asdict(state)