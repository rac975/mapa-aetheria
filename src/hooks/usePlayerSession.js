import { useEffect, useCallback, useRef } from 'react';
import {
  playerSessionService,
  STORAGE_KEY_TOKEN,
  STORAGE_KEY_SESSION,
  STORAGE_KEY_GOD_MODE
} from '../services/playerSessionService';

/**
 * Hook customizado para monitoramento, validação em tempo real e expiração da sessão do jogador.
 * Isola ciclo de vida, captura de eventos de atividade, reconexão pós-queda de rede e timers conforme GEMINI.md.
 *
 * Regra Item 6 (God Mode): Quando isMestre = true, a sessão é imune a timeouts, conflitos de ID e redirecionamentos.
 * Regra Item 7 (Realtime/Token): Monitora apenas o jogador afetado por expiração, rotação de token ou conflito de ID.
 *
 * @param {Object} options
 * @param {boolean} [options.isMestre=false] - Se for Mestre (God Mode), a sessão por token não é monitorada
 * @param {string|number|null} [options.fichaIdAtiva=null] - ID da ficha atualmente aberta/ativa
 * @param {Function} [options.onSessaoExpirada] - Callback disparado quando a sessão é invalidada/expirada
 * @param {Function} [options.onFichaRealtimeUpdate] - Callback opcional para sincronizar dados da ficha em tempo real
 */
export function usePlayerSession({
  isMestre = false,
  fichaIdAtiva = null,
  onSessaoExpirada,
  onFichaRealtimeUpdate
} = {}) {
  const sessaoExpiradaDisparada = useRef(false);
  const teveQuedaCanalRef = useRef(false);
  const onSessaoExpiradaRef = useRef(onSessaoExpirada);
  const onFichaRealtimeUpdateRef = useRef(onFichaRealtimeUpdate);

  useEffect(() => {
    onSessaoExpiradaRef.current = onSessaoExpirada;
  }, [onSessaoExpirada]);

  useEffect(() => {
    onFichaRealtimeUpdateRef.current = onFichaRealtimeUpdate;
  }, [onFichaRealtimeUpdate]);

  const isMestreEfetivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());

  const dispararInvalidez = useCallback(
    (aviso) => {
      if (isMestreEfetivo || playerSessionService.isGodModeAtivo() || sessaoExpiradaDisparada.current) {
        return;
      }

      sessaoExpiradaDisparada.current = true;
      playerSessionService.encerrarSessao(aviso);
      if (onSessaoExpiradaRef.current) {
        onSessaoExpiradaRef.current(typeof aviso === 'object' ? aviso?.mensagem : aviso);
      }
    },
    [isMestreEfetivo]
  );

  const checarExpiracao = useCallback(() => {
    if (isMestreEfetivo || playerSessionService.isGodModeAtivo() || sessaoExpiradaDisparada.current) {
      return;
    }

    const sessao = playerSessionService.obterSessao();
    if (!sessao || !sessao.token) return;

    // Verifica conflito de ID ou Crachá caso haja uma ficha ativa na tela divergente da sessão
    if (
      fichaIdAtiva !== null &&
      fichaIdAtiva !== undefined &&
      sessao.fichaId !== null &&
      sessao.fichaId !== undefined
    ) {
      const ativaStr = String(fichaIdAtiva);
      const isTokenAtivo = playerSessionService.validarFormatoToken(ativaStr);
      const emConflito = isTokenAtivo
        ? playerSessionService.normalizarToken(sessao.token) !== playerSessionService.normalizarToken(ativaStr)
        : String(sessao.fichaId) !== ativaStr;

      if (emConflito) {
        dispararInvalidez({
          titulo: 'Conflito de Personagem',
          mensagem: 'O ID ou código da ficha aberta entrou em conflito com a sessão ativa. Por favor, reconecte seu crachá.',
          motivo: 'conflito_id'
        });
        return;
      }
    }

    const status = playerSessionService.verificarExpiracao({ isMestre: false });
    if (status.expirada) {
      dispararInvalidez({
        titulo: status.titulo || 'Sessão Expirada',
        mensagem: status.mensagem,
        motivo: status.motivo
      });
    }
  }, [isMestreEfetivo, fichaIdAtiva, dispararInvalidez]);

  const validarReconexaoRemota = useCallback(async () => {
    if (isMestreEfetivo || playerSessionService.isGodModeAtivo() || sessaoExpiradaDisparada.current) {
      return;
    }

    const sessao = playerSessionService.obterSessao();
    if (!sessao || !sessao.token) return;

    const resultado = await playerSessionService.validarSessaoRemota({ isMestre: false });
    if (!resultado.valida && resultado.motivo !== 'sem_sessao') {
      dispararInvalidez({
        titulo: resultado.titulo || 'Reconexão Necessária',
        mensagem:
          resultado.mensagem ||
          'Sua sessão foi interrompida ou o crachá precisa ser revalidado. Por favor, reconecte seu personagem.',
        motivo: resultado.motivo
      });
    }
  }, [isMestreEfetivo, dispararInvalidez]);

  // 1. Garante ativação limpa do God Mode para o Mestre e reseta flags
  useEffect(() => {
    if (isMestreEfetivo) {
      sessaoExpiradaDisparada.current = false;
      playerSessionService.ativarGodMode();
    } else {
      sessaoExpiradaDisparada.current = false;
    }
  }, [isMestreEfetivo, fichaIdAtiva]);

  // 2. Monitoramento de atividade local, expiração por tempo, foco e sincronia entre abas
  useEffect(() => {
    if (isMestreEfetivo) return;

    const sessaoInicial = playerSessionService.obterSessao();
    if (sessaoInicial?.token) {
      playerSessionService.registrarAtividade({ isMestre: false });
    }

    const registrarInteracao = () => {
      if (!sessaoExpiradaDisparada.current && !playerSessionService.isGodModeAtivo()) {
        playerSessionService.registrarAtividade({ isMestre: false });
      }
    };

    const eventosAtividade = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    eventosAtividade.forEach((evento) => {
      window.addEventListener(evento, registrarInteracao, { passive: true });
    });

    const timerInterval = setInterval(checarExpiracao, 15 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checarExpiracao();
        validarReconexaoRemota();
      }
    };

    const handleFocus = () => {
      checarExpiracao();
    };

    const handleOnline = () => {
      checarExpiracao();
      validarReconexaoRemota();
    };

    const handleStorageChange = (event) => {
      if (playerSessionService.isGodModeAtivo()) return;
      if (event.key === STORAGE_KEY_GOD_MODE && event.newValue === 'true') return;

      if (event.key === STORAGE_KEY_TOKEN || event.key === STORAGE_KEY_SESSION) {
        if (!event.newValue) {
          if (!sessaoExpiradaDisparada.current && onSessaoExpiradaRef.current) {
            sessaoExpiradaDisparada.current = true;
            onSessaoExpiradaRef.current(null);
          }
          return;
        }

        if (event.key === STORAGE_KEY_SESSION && fichaIdAtiva) {
          try {
            const novaSessao = JSON.parse(event.newValue);
            if (novaSessao?.fichaId && String(novaSessao.fichaId) !== String(fichaIdAtiva)) {
              dispararInvalidez({
                titulo: 'Conflito de Personagem',
                mensagem: 'Outro personagem foi conectado neste navegador. Reconecte seu crachá caso deseje usar esta ficha.',
                motivo: 'conflito_id'
              });
            }
          } catch {
            // Ignora erro de parse
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timerInterval);
      eventosAtividade.forEach((evento) => {
        window.removeEventListener(evento, registrarInteracao);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isMestreEfetivo, fichaIdAtiva, checarExpiracao, validarReconexaoRemota, dispararInvalidez]);

  // 3. Assinatura Realtime exclusiva por fichaId do jogador para detectar rotação de token, exclusão ou conflito de sessão
  useEffect(() => {
    if (isMestreEfetivo) return;

    const sessao = playerSessionService.obterSessao();
    const idMonitorado = fichaIdAtiva || sessao?.fichaId;
    if (!idMonitorado || !sessao?.token) return;

    const sub = playerSessionService.subscribeSessaoJogadorRealtime({
      fichaId: idMonitorado,
      isMestre: false,
      onSessionInvalidated: (aviso) => {
        dispararInvalidez(aviso);
      },
      onFichaUpdated: (novosDados) => {
        if (onFichaRealtimeUpdateRef.current) {
          onFichaRealtimeUpdateRef.current(novosDados);
        }
      },
      onConnectionChange: (status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          teveQuedaCanalRef.current = true;
        } else if (status === 'SUBSCRIBED' && teveQuedaCanalRef.current) {
          teveQuedaCanalRef.current = false;
          validarReconexaoRemota();
        }
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [isMestreEfetivo, fichaIdAtiva, dispararInvalidez, validarReconexaoRemota]);

  const logout = useCallback(() => {
    playerSessionService.encerrarSessao();
  }, []);

  return {
    logout,
    checarExpiracao,
    validarReconexaoRemota
  };
}
