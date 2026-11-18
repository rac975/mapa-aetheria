import { useState, useRef, useCallback, useEffect } from 'react';
import { audioService } from '../services/audioService';

const JANELA_CLIQUES_MS = 750;
const DURACAO_MODO_MS = 5500;
const CLASSE_NUCLEO = 'modo-nucleo-ativo';

/**
 * Hook para gerenciar o Easter Egg de cliques triplos rápidos no Logo da Central.
 * Ativa temporariamente o "Modo Núcleo de Aether" com efeitos visuais neon.
 */
export function useEasterEggNucleo() {
  const [nucleoAtivo, setNucleoAtivo] = useState(false);
  const cliquesRef = useRef([]);
  const timerDesativarRef = useRef(null);

  const desativar = useCallback(() => {
    setNucleoAtivo(false);
    if (typeof document !== 'undefined') {
      document.body.classList.remove(CLASSE_NUCLEO);
    }
    if (timerDesativarRef.current) {
      clearTimeout(timerDesativarRef.current);
      timerDesativarRef.current = null;
    }
  }, []);

  const registrarClique = useCallback(
    (e) => {
      const agora = Date.now();
      // Mantém apenas cliques dentro da janela de tempo permitida
      cliquesRef.current = [...cliquesRef.current.filter((t) => agora - t < JANELA_CLIQUES_MS), agora];

      if (cliquesRef.current.length >= 3) {
        if (e && typeof e.preventDefault === 'function') {
          // Previne navegação indesejada no clique triplo que ativa o segredo
          e.preventDefault();
        }
        cliquesRef.current = [];

        // Ativa o Modo Núcleo de Aether
        setNucleoAtivo(true);
        if (typeof document !== 'undefined') {
          document.body.classList.add(CLASSE_NUCLEO);
        }

        // Feedback sonoro sutil
        try {
          audioService.playClick();
        } catch {
          // Ignora indisponibilidade de áudio
        }

        if (timerDesativarRef.current) {
          clearTimeout(timerDesativarRef.current);
        }

        // Desativa automaticamente após a duração
        timerDesativarRef.current = setTimeout(() => {
          desativar();
        }, DURACAO_MODO_MS);
      }
    },
    [desativar]
  );

  useEffect(() => {
    return () => {
      if (timerDesativarRef.current) clearTimeout(timerDesativarRef.current);
      if (typeof document !== 'undefined') {
        document.body.classList.remove(CLASSE_NUCLEO);
      }
    };
  }, []);

  return {
    nucleoAtivo,
    registrarClique,
    desativar
  };
}
