/**
 * Regras puras e constantes do Easter Egg da Fanfarra de Vitória no Mapa.
 * Segue estritamente os princípios de Clean Architecture (sem efeitos colaterais).
 */

export const SEQUENCIA_FANFARRA = ['in', 'out', 'in', 'out', 'in'];
export const JANELA_COMBO_MS = 2500;
export const DURACAO_FANFARRA_MS = 7000;

/**
 * Processa uma ação na sequência de combo do mapa e avalia se o easter egg foi ativado.
 *
 * @param {Array<{ acao: string, timestamp: number }>} historico - Cliques anteriores registrados
 * @param {string} novaAcao - Ação atual ('in' ou 'out')
 * @param {number} timestamp - Timestamp em milissegundos
 * @param {string[]} [sequenciaEsperada=SEQUENCIA_FANFARRA] - Sequência esperada para o combo
 * @param {number} [janelaMs=JANELA_COMBO_MS] - Janela de tempo limite para completar o combo
 * @returns {{ ativado: boolean, novoHistorico: Array<{ acao: string, timestamp: number }> }}
 */
export function processarSequenciaCombo(
  historico = [],
  novaAcao,
  timestamp = Date.now(),
  sequenciaEsperada = SEQUENCIA_FANFARRA,
  janelaMs = JANELA_COMBO_MS
) {
  if (!novaAcao) {
    return { ativado: false, novoHistorico: historico };
  }

  // Filtra apenas cliques ocorridos dentro da janela de tempo permitida
  const historicoRecente = historico.filter((item) => timestamp - item.timestamp <= janelaMs);

  const novoHistorico = [...historicoRecente, { acao: novaAcao, timestamp }];

  // Extrai apenas as ações
  const acoes = novoHistorico.map((item) => item.acao);

  // Verifica se o final do histórico corresponde exatamente à sequência esperada
  if (acoes.length >= sequenciaEsperada.length) {
    const calda = acoes.slice(-sequenciaEsperada.length);
    const bateu = calda.every((val, idx) => val === sequenciaEsperada[idx]);

    if (bateu) {
      return {
        ativado: true,
        novoHistorico: []
      };
    }
  }

  return {
    ativado: false,
    novoHistorico
  };
}
