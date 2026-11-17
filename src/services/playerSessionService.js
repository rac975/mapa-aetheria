/**
 * playerSessionService.js
 * Serviço responsável pelo ciclo de vida, persistência e expiração
 * da sessão local dos jogadores em AetheriaMap.
 *
 * Diretrizes GEMINI.md:
 * - Camada de Serviços (src/services/)
 * - Controle de inatividade e permanência máxima
 */

const STORAGE_KEY_TOKEN = 'aetheria_jogador_token';
const STORAGE_KEY_SESSION = 'aetheria_jogador_session';
const STORAGE_KEY_NOTICE = 'aetheria_session_expired_notice';

// 6 horas de permanência máxima e 2 horas de inatividade sem interação
export const TEMPO_MAXIMO_PERMANENCIA_MS = 6 * 60 * 60 * 1000;
export const TEMPO_MAXIMO_INATIVIDADE_MS = 2 * 60 * 60 * 1000;
const THROTTLE_ATIVIDADE_MS = 30 * 1000; // Grava no localStorage no máximo a cada 30 segundos

let ultimaGravacaoAtividade = 0;

export const playerSessionService = {
  /**
   * Inicia uma nova sessão para o jogador logado
   * @param {string} token
   * @param {string|number} [fichaId]
   * @param {string} [nomePersonagem]
   */
  iniciarSessao(token, fichaId = null, nomePersonagem = '') {
    if (!token) return;
    const agora = Date.now();
    const sessionData = {
      token,
      fichaId,
      nomePersonagem,
      loginTimestamp: agora,
      lastActiveTimestamp: agora
    };

    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));
    ultimaGravacaoAtividade = agora;
  },

  /**
   * Retorna os dados da sessão atual ou null se inexistente
   * @returns {Object|null}
   */
  obterSessao() {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) {
      // Se existir o token legado salvo mas não a sessão, cria uma sessão a partir do momento atual
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (token) {
        this.iniciarSessao(token);
        return this.obterSessao();
      }
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        this.encerrarSessao();
        return null;
      }
      if (!parsed.loginTimestamp || isNaN(Number(parsed.loginTimestamp))) {
        parsed.loginTimestamp = Date.now();
      }
      if (!parsed.lastActiveTimestamp || isNaN(Number(parsed.lastActiveTimestamp))) {
        parsed.lastActiveTimestamp = Date.now();
      }
      return parsed;
    } catch {
      this.encerrarSessao();
      return null;
    }
  },

  /**
   * Registra interação do usuário, renovando o timer de inatividade (com throttle)
   */
  registrarAtividade() {
    const agora = Date.now();
    if (agora - ultimaGravacaoAtividade < THROTTLE_ATIVIDADE_MS) {
      return;
    }

    const sessao = this.obterSessao();
    if (!sessao) return;

    sessao.lastActiveTimestamp = agora;
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessao));
    ultimaGravacaoAtividade = agora;
  },

  /**
   * Verifica se a sessão do jogador expirou por permanência máxima ou inatividade
   * @returns {{ expirada: boolean, motivo: string|null, mensagem: string|null }}
   */
  verificarExpiracao() {
    const sessao = this.obterSessao();
    if (!sessao) {
      return { expirada: false, motivo: null, mensagem: null };
    }

    const agora = Date.now();
    const tempoPermanencia = agora - (sessao.loginTimestamp || agora);
    const tempoInativo = agora - (sessao.lastActiveTimestamp || agora);

    if (tempoPermanencia > TEMPO_MAXIMO_PERMANENCIA_MS) {
      return {
        expirada: true,
        motivo: 'tempo_maximo',
        mensagem: 'Sua sessão atingiu o tempo máximo de permanência (6 horas). Por favor, reconecte seu crachá.'
      };
    }

    if (tempoInativo > TEMPO_MAXIMO_INATIVIDADE_MS) {
      return {
        expirada: true,
        motivo: 'inatividade',
        mensagem: 'Sua sessão expirou por inatividade (2 horas sem interação). Por favor, reconecte seu crachá.'
      };
    }

    return { expirada: false, motivo: null, mensagem: null };
  },

  /**
   * Encerra a sessão local do jogador e opcionalmente armazena mensagem de aviso
   * @param {string} [mensagemAviso]
   */
  encerrarSessao(mensagemAviso = null) {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_SESSION);

    if (mensagemAviso) {
      localStorage.setItem(STORAGE_KEY_NOTICE, mensagemAviso);
    }
  },

  /**
   * Retorna e consome (limpa) a mensagem de aviso de sessão expirada
   * @returns {string|null}
   */
  consumirAvisoExpiracao() {
    const aviso = localStorage.getItem(STORAGE_KEY_NOTICE);
    if (aviso) {
      localStorage.removeItem(STORAGE_KEY_NOTICE);
      return aviso;
    }
    return null;
  },

  /**
   * Verifica rapidamente se existe token/sessão ativo
   * @returns {boolean}
   */
  isSessaoAtiva() {
    const sessao = this.obterSessao();
    if (!sessao) return false;
    const { expirada } = this.verificarExpiracao();
    return !expirada;
  }
};
