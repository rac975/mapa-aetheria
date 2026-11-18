import { useEffect, useRef } from 'react';

const MENSAGENS_AUSENCIA = [
  'Hey, o Mestre esta rolando os dados escondido...',
  'Aetheria aguarda seu retorno, Operador...',
  'Um Tita selvagem se aproxima no Mar de Nuvens...',
  'O Nucleo de Aether esta instavel sem voce...',
  'O combate ainda nao terminou, Heroi!',
  'Seus companheiros de grupo chamam por voce...',
  'Alguem acabou de gastar um Ponto de Fabula na mesa...',
  'Cuidado, o Vilao comecou a agir nas sombras...',
  'As correntes de Eter estao se dissipando...',
  'Um contrato de caca urgente aguarda em Fonsa Myma...',
  'Volte antes que a aeronave decole sem voce...',
  'Um teste oposto de iniciativa acabou de ser solicitado...',
  'Sua presenca e necessaria na ponte de comando...',
  'O bardo comecou a registrar sua lenda em Aetheria...',
  'Lembre-se: entrar em Crise dobra a sua determinacao...',
  'A mesa de jogo continua em andamento...',
  'O relogio de conflito avancou uma secao...',
  'A forja da oficina arcanotecnica terminou de resfriar...'
];

/**
 * Hook customizado para gerenciar a dinâmica do título da aba do navegador (Easter Egg).
 * Detecta quando o usuário sai da aba ou minimiza a janela (evento 'visibilitychange')
 * e altera ciclicamente o título da página de forma rica e sem emojis, restaurando o original no retorno.
 */
export function useDocumentTitleVisibility() {
  const originalTitleRef = useRef('');
  const timeoutIdRef = useRef(null);
  const intervalIdRef = useRef(null);
  const indexMsgRef = useRef(0);

  useEffect(() => {
    originalTitleRef.current = document.title || 'AetheriaMap';

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (
          !MENSAGENS_AUSENCIA.includes(document.title) &&
          document.title.trim().length > 0
        ) {
          originalTitleRef.current = document.title;
        }

        // Aguarda debounce de 2.2s para evitar disparos em trocas rápidas de janela
        timeoutIdRef.current = setTimeout(() => {
          if (!document.hidden) return;

          indexMsgRef.current = 0;
          document.title = MENSAGENS_AUSENCIA[0];

          intervalIdRef.current = setInterval(() => {
            if (!document.hidden) return;
            indexMsgRef.current = (indexMsgRef.current + 1) % MENSAGENS_AUSENCIA.length;
            document.title = MENSAGENS_AUSENCIA[indexMsgRef.current];
          }, 3500);
        }, 2200);
      } else {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        if (originalTitleRef.current) {
          document.title = originalTitleRef.current;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, []);
}
