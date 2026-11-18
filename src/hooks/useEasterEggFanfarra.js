import { useState, useRef, useCallback, useEffect } from 'react';
import { processarSequenciaCombo, DURACAO_FANFARRA_MS } from '../domain/map/easterEggRules';
import { audioService } from '../services/audioService';

/**
 * Hook customizado para gerenciar o Easter Egg da Fanfarra de Vitória no Mapa.
 * Monitora o combo de cliques nos controles de zoom (+ e - alternados) e reproduz
 * a fanfarra com Web Audio API / Audio Element e aciona feedback estético na tela.
 */
export function useEasterEggFanfarra() {
  const [fanfarraAtiva, setFanfarraAtiva] = useState(false);
  const historicoRef = useRef([]);
  const timerFeedbackRef = useRef(null);

  const dispararAcao = useCallback((acao) => {
    const agora = Date.now();
    const { ativado, novoHistorico } = processarSequenciaCombo(
      historicoRef.current,
      acao,
      agora
    );
    historicoRef.current = novoHistorico;

    if (ativado) {
      historicoRef.current = [];
      setFanfarraAtiva(true);

      try {
        audioService.playVictoryFanfare();
      } catch (err) {
        console.warn('Erro ao disparar áudio da fanfarra:', err);
      }

      if (timerFeedbackRef.current) {
        clearTimeout(timerFeedbackRef.current);
      }

      timerFeedbackRef.current = setTimeout(() => {
        setFanfarraAtiva(false);
      }, DURACAO_FANFARRA_MS);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerFeedbackRef.current) {
        clearTimeout(timerFeedbackRef.current);
      }
    };
  }, []);

  return {
    fanfarraAtiva,
    dispararAcao
  };
}
