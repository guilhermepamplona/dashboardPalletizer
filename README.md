# Dashboard — Célula de Paletização · KR180 R2 PA

Dashboard web em tempo real para a célula de paletização com robô
**KUKA KR180 R2 PA**. Backend FastAPI lê o CLP Siemens S7 via
`python-snap7` e transmite o estado (ângulos de juntas, contadores,
alarmes) por WebSocket. O frontend renderiza o robô em 3D com
Three.js, animado em tempo real pelos dados do CLP.

---

## Estrutura do projeto

```
kr180_dashboard/
├── backend/
│   ├── main.py            # App FastAPI + WebSocket /ws
│   ├── config.py          # Lê variáveis de ambiente do .env
│   ├── plc_client.py      # Leitura da DB genérica via python-snap7
│   ├── simulation.py      # Modo simulação (sem CLP)
│   ├── .env               # ← suas configurações (NÃO commitar no git)
│   ├── .env.example       # Modelo comentado do .env
│   └── requirements.txt   # Dependências Python
└── frontend/
    └── index.html         # Cena 3D (Three.js) + painéis de dados
```

---

## Pré-requisitos

- **Python 3.11**
- **pip** atualizado: `python -m pip install --upgrade pip`
- Biblioteca nativa **libsnap7** (necessária mesmo no modo simulação
  porque o módulo é importado no startup):

  ```bash
  # Ubuntu / Debian
  sudo apt install libsnap7-1 libsnap7-dev

  # Windows — já vem bundled pelo python-snap7, nenhuma ação extra

  # macOS (Homebrew)
  brew install snap7
  ```

---

## Instalação

```bash
# 1. Clone / copie o projeto
cd kr180_dashboard/backend

# 2. Crie e ative um ambiente virtual (recomendado)
python3.11 -m venv .venv
source .venv/bin/activate       # Linux / macOS
.venv\Scripts\activate          # Windows

# 3. Instale as dependências
pip install -r requirements.txt
```

---

## Configuração (.env)

Copie o arquivo de exemplo e edite com seus valores:

```bash
cp .env.example .env
```

Abra `.env` em qualquer editor e ajuste os campos necessários.
Os campos mais importantes:

| Variável          | Padrão        | Descrição                                               |
|-------------------|---------------|---------------------------------------------------------|
| `SIMULATION_MODE` | `true`        | `true` = sem CLP; `false` = conecta no CLP real        |
| `PLC_IP`          | `192.168.0.1` | IP do CLP Siemens S7                                    |
| `PLC_RACK`        | `0`           | Rack da CPU (normalmente 0)                             |
| `PLC_SLOT`        | `1`           | Slot: 1 para S7-300/400 · 0 para S7-1200/1500          |
| `DB_NUMBER`       | `100`         | Número da DB da célula (ajustar após fechar no TIA)     |
| `POLL_INTERVAL_S` | `0.1`         | Intervalo de leitura do CLP em segundos (0.1 = 10 Hz)  |
| `SERVER_PORT`     | `8001`        | Porta do servidor web                                   |

> **Nota sobre a DB genérica:** os offsets de cada campo dentro da DB
> estão documentados no topo do arquivo `backend/plc_client.py`.
> Edite a função `parse_db()` assim que o layout final for fechado
> no TIA Portal.

---

## Rodando o servidor

```bash
# Dentro de backend/ com o .venv ativo:
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Abra no navegador: **http://localhost:8001**

Para rodar em produção (sem reload automático):

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

---

## Modo simulação

Com `SIMULATION_MODE=true` no `.env`, o backend **não tenta conectar
no CLP**. O robô se move automaticamente entre os waypoints definidos
em `backend/simulation.py`:

```
HOME → PRE-PICK → PICK → PRE-PICK → TRANSPORTE → PRE-PLACE → PLACE → HOME
```

Cada movimento é interpolado com ease-in/out. Os contadores de paletes
e ciclos incrementam automaticamente, e o tempo de ciclo é calculado e
exibido com uma pequena variação aleatória (para parecer real).

Para **adicionar ou ajustar waypoints**, edite a lista `WAYPOINTS` em
`simulation.py` — cada ponto é um dicionário com `name` e `joints`
(ângulos em graus de A1 a A6):

```python
WAYPOINTS = [
    {"name": "HOME",     "joints": [0, -90, 90, 0, 0, 0]},
    {"name": "PRE-PICK", "joints": [35, -55, 70, 0, -15, 0]},
    # ...
]
```

---

## Substituindo o modelo 3D placeholder

O robô na cena 3D é construído com primitivas geométricas (caixas e
cilindros) enquanto as malhas reais não chegam. Quando você tiver o
CAD do KR180 R2 PA:

1. Converta para `.glb` (Blender: File → Export → glTF 2.0) mantendo
   cada elo do robô como objeto separado (base, A1 … A6).
2. Em `frontend/index.html`, substitua o conteúdo da função
   `buildRobot()` pelo carregamento via `THREE.GLTFLoader`.
3. Anexe cada mesh no `THREE.Group` (pivot) correspondente —
   `robot.pivotA1` a `robot.pivotA6` — que já estão criados.
4. A função `applyJointAngles()` não precisa mudar.

---

## Próximos passos

- [ ] Fechar a DB real no TIA Portal e atualizar `plc_client.py`
- [ ] Substituir o modelo 3D placeholder pelas malhas reais do KR180
- [ ] Validar a convenção de sinal/zero de cada eixo (A2/A3 têm
      acoplamento mecânico em robôs KUKA — ver comentário em
      `applyJointAngles()` no `index.html`)
- [ ] Adicionar gráfico de histórico de tempo de ciclo (opcional)
- [ ] Adicionar log de alarmes com timestamp (opcional)
