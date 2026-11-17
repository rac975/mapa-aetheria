import { useEffect, useCallback, useRef } from 'react';
import { playerSessionService } from '../services/playerSessionService';

/**
 * Hook customizado para monitoramento e expiração da sessão do jogador.
 * Isola ciclo de vida, captura de eventos de atividade e timers conforme o GEMINI.md.
 *
 * @param {Object} options
 * @param {boolean} [options.isMestre=false] - Se for Mestre (Supabase Auth), a sessão por token não é monitorada
 * @param {Function} [options.onSessaoExpirada] - Callback disparado quando a sessão é considerada expirada
 */
export function usePlayerSession({ isMestre = false, onSessaoExpirada } = {}) {
  const sessaoExpiradaDisparada = useRef(false);

  const checarExpiracao = useCallback(() => {
    if (isMestre || sessaoExpiradaDisparada.current) return;

    const token = localStorage.getItem('aetheria_jogador_token');
    if (!token) return;

    const status = playerSessionService.verificarExpiracao();
    if (status.expirada) {
      sessaoExpiradaDisparada.current = true;
      playerSessionService.encerrarSessao(status.mensagem);
      if (onSessaoExpirada) {
        onSessaoExpirada(status.mensagem);
      }
    }
  }, [isMestre, onSessaoExpirada]);

  useEffect(() => {
    if (isMestre) return;

    // Registra atividade ao carregar/interagir com a ficha
    const token = localStorage.getItem('aetheria_jogador_token');
    if (token) {
      playerSessionService.registrarAtividade();
    }

    // 2. Ouvintes de eventos para capturar atividade do jogador
    const registrarInteracao = () => {
      if (!sessaoExpiradaDisparada.current) {
        playerSessionService.registrarAtividade();
      }
    };

    const eventosAtividade = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    eventosAtividade.forEach((evento) => {
      window.addEventListener(evento, registrarInteracao, { passive: true });
    });

    // 3. Checagem periódica a cada 30 segundos
    const timerInterval = setInterval(checarExpiracao, 30 * 1000);

    // 4. Checagem ao alternar abas ou focar na janela
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checarExpiracao();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checarExpiracao);

    return () => {
      clearInterval(timerInterval);
      eventosAtividade.forEach((evento) => {
        window.removeEventListener(evento, registrarInteracao);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checarExpiracao);
    };
  }, [isMestre, checarExpiracao]);

  const logout = useCallback(() => {
    playerSessionService.encerrarSessao();
  }, []);

  return {
    logout,
    checarExpiracao
  };
}
