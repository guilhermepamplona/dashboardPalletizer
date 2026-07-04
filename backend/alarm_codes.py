"""
alarm_codes.py
--------------
Mapeamento de códigos de alarme para descrição textual.

Como usar:
  - Os códigos vêm do CLP como inteiros (INT) na DB601, após os BOOLs.
  - Cada campo INT representa uma "slot" de falha independente.
  - O frontend exibe a lista de falhas ativas com descrição, timestamp e severidade.

Estrutura de cada entrada:
  codigo_int: {
      "desc":       "Descrição curta da falha",
      "detalhe":    "Orientação de diagnóstico / ação corretiva",
      "severidade": "alarme" | "aviso" | "info",
  }

Como adicionar falhas reais:
  1. Identifique o código que o CLP envia para cada condição de falha.
  2. Adicione uma entrada no dicionário ALARM_CODES abaixo.
  3. Salve o arquivo — não é necessário reiniciar o servidor.
     (o backend relê o dict a cada mensagem WebSocket).

Códigos 1–99   → reservados para falhas do robô / KRC
Códigos 100–199 → falhas do CLP / célula (periféricos, sensores)
Códigos 200–299 → avisos / alertas operacionais
Códigos 0       → sem falha ativa
"""

ALARM_CODES: dict[int, dict] = {

    # ------------------------------------------------------------------
    # Sem falha
    # ------------------------------------------------------------------
    0: {
        "desc":       "Sem falha",
        "detalhe":    "",
        "severidade": "info",
    },

    # ------------------------------------------------------------------
    # Falhas do robô / KRC (1–99) — SUBSTITUIR com os códigos reais
    # ------------------------------------------------------------------
    1: {
        "desc":       "Falha de comunicação com o KRC",
        "detalhe":    "Verifique o cabo de rede entre o CLP e o KRC. "
                      "Confirme que o programa KRL está rodando e o servidor ProfiNet está ativo.",
        "severidade": "alarme",
    },
    2: {
        "desc":       "Robô em parada de emergência",
        "detalhe":    "Verifique se algum botão de emergência foi pressionado na célula. "
                      "Reponha o relé de segurança e reconecte o KRC.",
        "severidade": "alarme",
    },
    3: {
        "desc":       "Timeout na movimentação do robô",
        "detalhe":    "O robô não concluiu o movimento dentro do tempo esperado. "
                      "Verifique se há obstrução mecânica ou se a velocidade está reduzida.",
        "severidade": "alarme",
    },
    4: {
        "desc":       "Robô fora da área de trabalho permitida",
        "detalhe":    "A posição atual ultrapassa os limites de software configurados. "
                      "Retorne o robô para a posição HOME manualmente no KRC.",
        "severidade": "alarme",
    },
    5: {
        "desc":       "Falha nos acionamentos (drives) do robô",
        "detalhe":    "Os drives do KRC relataram uma falha. "
                      "Verifique o painel KRC para o código de erro específico.",
        "severidade": "alarme",
    },

    # ------------------------------------------------------------------
    # Falhas da célula / periféricos (100–199) — SUBSTITUIR
    # ------------------------------------------------------------------
    100: {
        "desc":       "Falha no sensor de presença da esteira de entrada",
        "detalhe":    "Sensor de presença na esteira de entrada não detectou caixa "
                      "dentro do tempo previsto. Verifique obstrução ou sensor defeituoso.",
        "severidade": "alarme",
    },
    101: {
        "desc":       "Falha na garra pneumática (abertura)",
        "detalhe":    "A garra não confirmou abertura completa no tempo esperado. "
                      "Verifique a pressão do circuito pneumático e os fins-de-curso.",
        "severidade": "alarme",
    },
    102: {
        "desc":       "Falha na garra pneumática (fechamento)",
        "detalhe":    "A garra não confirmou fechamento completo no tempo esperado. "
                      "Verifique pressão e fim-de-curso de fechamento.",
        "severidade": "alarme",
    },
    103: {
        "desc":       "Palete cheio — aguardando retirada",
        "detalhe":    "O palete de destino atingiu a capacidade máxima. "
                      "Retire o palete completo e posicione um palete vazio.",
        "severidade": "aviso",
    },
    104: {
        "desc":       "Falta de palete vazio na entrada",
        "detalhe":    "Não há palete vazio disponível na posição de entrada. "
                      "Reabasteça o pulmão de paletes.",
        "severidade": "aviso",
    },
    105: {
        "desc":       "Pressão pneumática baixa",
        "detalhe":    "A pressão do circuito pneumático está abaixo do mínimo configurado. "
                      "Verifique o compressor e as válvulas de regulagem.",
        "severidade": "alarme",
    },
    106: {
        "desc":       "Falha na esteira de saída (motor)",
        "detalhe":    "O inversor da esteira de saída sinalizou falha. "
                      "Verifique o painel do inversor e o cabeamento do motor.",
        "severidade": "alarme",
    },
    107: {
        "desc":       "Porta de acesso aberta durante operação automática",
        "detalhe":    "A porta de acesso à célula foi aberta com o modo automático ativo. "
                      "Feche a porta e reponha o intertravamento de segurança.",
        "severidade": "alarme",
    },

    # ------------------------------------------------------------------
    # Avisos operacionais (200–299) — SUBSTITUIR
    # ------------------------------------------------------------------
    200: {
        "desc":       "Tempo de ciclo acima do esperado",
        "detalhe":    "O tempo de ciclo atual excedeu em mais de 20 % o tempo de referência. "
                      "Monitore a tendência e verifique possíveis causas de lentidão.",
        "severidade": "aviso",
    },
    201: {
        "desc":       "Contagem de paletes próxima do limite do turno",
        "detalhe":    "A produção está chegando ao limite definido para o turno atual. "
                      "Avise o operador para programar a troca de turno.",
        "severidade": "info",
    },
    202: {
        "desc":       "Manutenção preventiva pendente",
        "detalhe":    "O robô atingiu o intervalo de manutenção programada. "
                      "Agende a verificação com a equipe de manutenção.",
        "severidade": "aviso",
    },
}


def get_alarm_info(code: int) -> dict:
    """Retorna as informações do alarme pelo código.
    Se o código não estiver mapeado, retorna uma entrada genérica."""
    if code in ALARM_CODES:
        return ALARM_CODES[code]
    return {
        "desc":       f"Falha desconhecida (código {code})",
        "detalhe":    "Código não mapeado em alarm_codes.py. "
                      "Adicione a descrição correspondente no arquivo.",
        "severidade": "alarme",
    }


def get_active_alarms(codes: list[int]) -> list[dict]:
    """Recebe uma lista de códigos INT da DB e retorna apenas os alarmes ativos
    (código != 0), com as informações completas de cada um."""
    return [
        {"codigo": c, **get_alarm_info(c)}
        for c in codes
        if c != 0
    ]
