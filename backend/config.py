"""
config.py
---------
Centraliza toda a configuracao do backend, lida de variaveis de
ambiente (arquivo .env na pasta backend/). Veja .env.example para
todos os campos disponiveis e seus valores padrao.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # carrega o .env se existir (não falha se não existir)


def _bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _int(name: str, default: int) -> int:
    val = os.getenv(name)
    return int(val) if val not in (None, "") else default


def _float(name: str, default: float) -> float:
    val = os.getenv(name)
    return float(val) if val not in (None, "") else default


# ----------------------------------------------------------------------
# Modo de operação
# ----------------------------------------------------------------------
# SIMULATION_MODE=true  -> não conecta no CLP; o robô se move sozinho
#                          entre pontos pré-definidos (útil pra testar
#                          o dashboard sem depender do CLP/rede).
# SIMULATION_MODE=false -> conecta de verdade via python-snap7.
SIMULATION_MODE = _bool("SIMULATION_MODE", True)

# ----------------------------------------------------------------------
# Conexão S7 / CLP (só usado quando SIMULATION_MODE=false)
# ----------------------------------------------------------------------
PLC_IP = os.getenv("PLC_IP", "192.168.0.1")
PLC_RACK = _int("PLC_RACK", 0)
PLC_SLOT = _int("PLC_SLOT", 1)
DB_NUMBER = _int("DB_NUMBER", 100)
DB_SIZE = _int("DB_SIZE", 44)

# ----------------------------------------------------------------------
# Polling
# ----------------------------------------------------------------------
POLL_INTERVAL_S = _float("POLL_INTERVAL_S", 0.1)

# ----------------------------------------------------------------------
# Servidor
# ----------------------------------------------------------------------
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = _int("SERVER_PORT", 8001)
