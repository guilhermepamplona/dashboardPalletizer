"""
main.py
-------
Backend FastAPI para o dashboard da celula de paletizacao (KR180 R2 PA).

Em modo SIMULACAO (SIMULATION_MODE=true no .env):
    O robo se move entre waypoints sozinho, sem conexao com CLP.

Em modo PRODUCAO (SIMULATION_MODE=false):
    Le periodicamente a DB generica do CLP via python-snap7 e transmite
    o estado por WebSocket para o frontend (Three.js).

Rodar com:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

import asyncio
import logging
from pathlib import Path
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import config
from plc_client import PLCClient, poll_loop, state_to_dict, CellState
from simulation import Simulator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("kr180_dashboard")

app = FastAPI(title="KR180 Palletizing Cell Dashboard")

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

clients: Set[WebSocket] = set()
plc_client = PLCClient() if not config.SIMULATION_MODE else None
simulator  = Simulator() if config.SIMULATION_MODE else None
latest_state: CellState = CellState.disconnected()


async def broadcast(state: CellState):
    global latest_state
    latest_state = state
    payload = state_to_dict(state)
    dead = set()
    for ws in clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


@app.on_event("startup")
async def startup():
    if config.SIMULATION_MODE:
        logger.info("==> MODO SIMULAÇÃO ativo (SIMULATION_MODE=true no .env)")
        asyncio.create_task(simulator.run(broadcast))
    else:
        logger.info(
            "==> Modo PRODUÇÃO — conectando ao CLP %s / DB%s ...",
            config.PLC_IP,
            config.DB_NUMBER,
        )
        asyncio.create_task(poll_loop(plc_client, broadcast))


@app.on_event("shutdown")
async def shutdown():
    if plc_client:
        await plc_client.disconnect()


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        # manda o ultimo estado conhecido assim que o browser conecta
        await websocket.send_json(state_to_dict(latest_state))
        while True:
            # mantém a conexão viva; não esperamos msgs do front por enquanto
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(websocket)


@app.get("/")
async def index():
    return FileResponse(FRONTEND_DIR / "index.html")


app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
