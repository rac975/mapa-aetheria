/**
 * playerSessionService.js
 * Serviço responsável pelo ciclo de vida, persistência, God Mode do Mestre,
 * validação de tokens/crachás e controle de sessões em tempo real em AetheriaMap.
 *
 * Diretrizes GEMINI.md:
 * - Camada de Serviços (src/services/)
 * - Isola comunicação com Supabase Auth, Realtime de Sessão e LocalStorage
 * - Consome regras puras de src/domain/fabula/sessionRules.js
 */

import { supabase } from './supabase.js';
import {
  TEMPO_MAXIMO_PERMANENCIA_MS,
  TEMPO_MAXIMO_INATIVIDADE_MS,
  THROTTLE_ATIVIDADE_MS,
  MOTIVOS_ENCERRAMENTO,
  normalizarTokenCracha,
  aplicarMascaraTokenCracha,
  validarFormatoTokenCracha,
  gerarTokenCrachaUnico,
  extrairCredencialCracha,
  avaliarExpiracaoSessao,
  validarIntegridadeSessaoJogador,
  avaliarEventoRealtimeSessao,
  avaliarConflitoBroadcastSessao
} from '../domain/fabula/sessionRules.js';

export {
  TEMPO_MAXIMO_PERMANENCIA_MS,
  TEMPO_MAXIMO_INATIVIDADE_MS,
  MOTIVOS_ENCERRAMENTO,
  normalizarTokenCracha,
  aplicarMascaraTokenCracha,
  validarFormatoTokenCracha,
  gerarTokenCrachaUnico,
  extrairCredencialCracha
};

export const STORAGE_KEY_TOKEN = 'aetheria_jogador_token';
export const STORAGE_KEY_SESSION = 'aetheria_jogador_session';
export const STORAGE_KEY_NOTICE = 'aetheria_session_expired_notice';
export const STORAGE_KEY_ULTIMA_FICHA = 'aetheria_ultima_ficha_id';
export const STORAGE_KEY_GOD_MODE = 'aetheria_mestre_god_mode';
export const STORAGE_KEY_MESTRE_FICHA = 'aetheria_mestre_ultima_ficha_id';

let ultimaGravacaoAtividade = 0;
let godModeEmMemoria = false;
let canalSessaoAtivo = null;
let fichaIdCanalAtivo = null;
let teardownTimer = null;
const listenersSessao = new Set();

function lerStorageSeguro(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarStorageSeguro(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Ignora falha de quota ou modo privado restrito
  }
}

function removerStorageSeguro(chave) {
  try {
    localStorage.removeItem(chave);
  } catch {
    // Ignora falha de storage
  }
}

export const playerSessionService = {
  // =========================================================================
  // 1. GOD MODE E PERSISTÊNCIA DE SESSÃO DO MESTRE (ITEM 6)
  // =========================================================================

  /**
   * Verifica se o Mestre está com God Mode ativo (em memória ou persistido).
   * @returns {boolean}
   */
  isGodModeAtivo() {
    if (godModeEmMemoria) return true;
    return lerStorageSeguro(STORAGE_KEY_GOD_MODE) === 'true';
  },

  /**
   * Ativa e persiste o God Mode do Mestre, limpando qualquer resquício de
   * sessão de jogador comum para evitar timeouts ou conflitos de ID.
   */
  ativarGodMode() {
    godModeEmMemoria = true;
    gravarStorageSeguro(STORAGE_KEY_GOD_MODE, 'true');
    this.limparCanalSessaoAtivo();

    // Garante que o Mestre nunca tenha um token de jogador preso no mesmo navegador
    removerStorageSeguro(STORAGE_KEY_TOKEN);
    removerStorageSeguro(STORAGE_KEY_SESSION);
    removerStorageSeguro(STORAGE_KEY_NOTICE);
  },

  /**
   * Desativa o God Mode apenas quando o Mestre encerra explicitamente sua sessão.
   */
  desativarGodMode() {
    godModeEmMemoria = false;
    removerStorageSeguro(STORAGE_KEY_GOD_MODE);
  },

  /**
   * Obtém a sessão autenticada do Mestre no Supabase com resiliência a falhas de rede.
   * @returns {Promise<Object|null>}
   */
  async getSessaoMestre() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        this.ativarGodMode();
        return data.session;
      }
      if (error && this.isGodModeAtivo()) {
        // Preserva estabilidade do Mestre em caso de oscilação momentânea de rede
        return { godModePersistido: true };
      }
      this.desativarGodMode();
      return null;
    } catch {
      if (this.isGodModeAtivo()) {
        return { godModePersistido: true };
      }
      return null;
    }
  },

  /**
   * Inscreve ouvinte para mudanças de estado de autenticação do Mestre.
   * @param {(session: Object|null, isMestre: boolean) => void} onAuthChange
   * @returns {() => void} Função de limpeza (unsubscribe)
   */
  subscribeAuthMestre(onAuthChange) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.ativarGodMode();
        if (onAuthChange) onAuthChange(session, true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        this.desativarGodMode();
        if (onAuthChange) onAuthChange(null, false);
        return;
      }

      if (event === 'INITIAL_SESSION' && !session) {
        this.desativarGodMode();
        if (onAuthChange) onAuthChange(null, false);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  },

  /**
   * Realiza o login do Mestre via Supabase Auth e ativa imediatamente o God Mode.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ session: Object|null, user: Object|null, error: any }>}
   */
  async loginMestre(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data?.session) {
      this.ativarGodMode();
    }

    return {
      session: data?.session || null,
      user: data?.user || null,
      error
    };
  },

  /**
   * Realiza logout explícito do Modo Mestre.
   */
  async logoutMestre() {
    this.desativarGodMode();
    await supabase.auth.signOut();
  },

  /**
   * Registra a última ficha inspecionada pelo Mestre sem criar sessão de jogador.
   * @param {string|number} fichaId
   */
  salvarUltimaFichaMestre(fichaId) {
    if (!fichaId) return;
    gravarStorageSeguro(STORAGE_KEY_MESTRE_FICHA, String(fichaId));
    gravarStorageSeguro(STORAGE_KEY_ULTIMA_FICHA, String(fichaId));
  },

  /**
   * Obtém o ID da última ficha inspecionada pelo Mestre.
   * @returns {string|null}
   */
  obterUltimaFichaMestre() {
    return lerStorageSeguro(STORAGE_KEY_MESTRE_FICHA) || lerStorageSeguro(STORAGE_KEY_ULTIMA_FICHA);
  },

  // =========================================================================
  // 2. GERADOR E VALIDADOR DE TOKENS / CRACHÁS (ITEM 7)
  // =========================================================================

  normalizarToken: normalizarTokenCracha,
  aplicarMascaraToken: aplicarMascaraTokenCracha,
  validarFormatoToken: validarFormatoTokenCracha,
  gerarTokenUnico: gerarTokenCrachaUnico,
  extrairCredencial: extrairCredencialCracha,

  /**
   * Gera um identificador único para a instância de sessão do jogador.
   * @returns {string}
   */
  gerarSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Busca e valida uma ficha diretamente pelo token de crachá do jogador (ex: PLY-001).
   * Retorna os dados da ficha, o status de validade e o ID real da ficha (UUID) para navegação interna,
   * além de configurar a sessão ativa no navegador para evitar erro de acesso inválido.
   *
   * @param {string} token - Token de crachá do jogador (ex: 'PLY-001')
   * @param {Object} [opcoes={}]
   * @param {boolean} [opcoes.iniciarSessao=true] - Se deve ativar e persistir a sessão do jogador
   * @returns {Promise<{ valido: boolean, ficha: Object|null, fichaId: string|null, token: string|null, nomePersonagem?: string, motivo?: string }>}
   */
  async buscarFichaPorToken(token, { iniciarSessao = true } = {}) {
    if (!token || typeof token !== 'string') {
      return { valido: false, ficha: null, fichaId: null, token: null, motivo: 'token_ausente' };
    }

    const tokenLimpo = normalizarTokenCracha(token);
    if (!validarFormatoTokenCracha(tokenLimpo)) {
      return { valido: false, ficha: null, fichaId: null, token: tokenLimpo, motivo: 'formato_invalido' };
    }

    try {
      const { data, error } = await supabase
        .from('fichas_personagens')
        .select('*')
        .ilike('jogador_token', tokenLimpo)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar ficha por token:', error);
        return { valido: false, ficha: null, fichaId: null, token: tokenLimpo, motivo: 'erro_banco' };
      }

      if (!data) {
        return { valido: false, ficha: null, fichaId: null, token: tokenLimpo, motivo: 'nao_encontrado' };
      }

      if (iniciarSessao && !this.isGodModeAtivo()) {
        this.iniciarSessao(data.jogador_token, data.id, data.nome_personagem);
      }

      return {
        valido: true,
        ficha: data,
        fichaId: String(data.id),
        token: data.jogador_token,
        nomePersonagem: data.nome_personagem
      };
    } catch (err) {
      console.error('Exceção ao buscar ficha por token:', err);
      return { valido: false, ficha: null, fichaId: null, token: tokenLimpo, motivo: 'excecao' };
    }
  },

  // =========================================================================
  // 3. CICLO DE VIDA DA SESSÃO DE JOGADOR (ITEM 7)
  // =========================================================================

  /**
   * Inicia uma nova sessão para o jogador autenticado por token ou QR Code.
   * Nunca cria sessão de jogador se o usuário estiver em God Mode (Mestre).
   *
   * @param {string} token
   * @param {string|number|null} [fichaId=null]
   * @param {string} [nomePersonagem='']
   * @param {Object} [opcoes={}]
   * @param {boolean} [opcoes.isMestre=false]
   * @returns {Object|null}
   */
  iniciarSessao(token, fichaId = null, nomePersonagem = '', { isMestre = false } = {}) {
    if (isMestre || this.isGodModeAtivo()) {
      if (fichaId) this.salvarUltimaFichaMestre(fichaId);
      return null;
    }

    const tokenNormalizado = normalizarTokenCracha(token);
    if (!tokenNormalizado) return null;

    const agora = Date.now();
    const sessionData = {
      sessionId: this.gerarSessionId(),
      token: tokenNormalizado,
      fichaId: fichaId !== null && fichaId !== undefined ? String(fichaId) : null,
      nomePersonagem: nomePersonagem || '',
      loginTimestamp: agora,
      lastActiveTimestamp: agora
    };

    gravarStorageSeguro(STORAGE_KEY_TOKEN, tokenNormalizado);
    gravarStorageSeguro(STORAGE_KEY_SESSION, JSON.stringify(sessionData));
    if (sessionData.fichaId) {
      gravarStorageSeguro(STORAGE_KEY_ULTIMA_FICHA, sessionData.fichaId);
    }
    removerStorageSeguro(STORAGE_KEY_NOTICE);
    ultimaGravacaoAtividade = agora;

    // Notifica em tempo real caso haja outra sessão antiga aberta para o mesmo personagem
    if (sessionData.fichaId) {
      this.notificarNovaSessaoRealtime(sessionData).catch(() => {});
    }

    return sessionData;
  },

  /**
   * Sincroniza os dados da ficha carregada com a sessão ativa sem resetar loginTimestamp
   * e sem contaminar o navegador do Mestre.
   *
   * @param {Object} fichaData
   * @param {Object} [opcoes={}]
   * @param {boolean} [opcoes.isMestre=false]
   * @returns {{ valida: boolean, modo: 'mestre'|'jogador', motivo?: string|null, titulo?: string|null, mensagem?: string|null, sessao?: Object }}
   */
  sincronizarSessaoAtiva(fichaData, { isMestre = false } = {}) {
    if (isMestre || this.isGodModeAtivo()) {
      if (fichaData?.id) {
        this.salvarUltimaFichaMestre(fichaData.id);
      }
      return { valida: true, modo: 'mestre', motivo: null, titulo: null, mensagem: null };
    }

    const sessaoAtual = this.obterSessao();
    const validacao = validarIntegridadeSessaoJogador({
      sessaoLocal: sessaoAtual,
      fichaBanco: fichaData,
      isMestre: false
    });

    if (!validacao.valida) {
      return validacao;
    }

    const agora = Date.now();
    const tokenNormalizado = normalizarTokenCracha(fichaData?.jogador_token || sessaoAtual.token);
    const sessaoAtualizada = {
      ...sessaoAtual,
      sessionId: sessaoAtual.sessionId || this.gerarSessionId(),
      token: tokenNormalizado,
      fichaId: fichaData?.id !== undefined && fichaData?.id !== null ? String(fichaData.id) : sessaoAtual.fichaId,
      nomePersonagem: fichaData?.nome_personagem || sessaoAtual.nomePersonagem || '',
      loginTimestamp: Number(sessaoAtual.loginTimestamp) || agora,
      lastActiveTimestamp: agora
    };

    gravarStorageSeguro(STORAGE_KEY_TOKEN, tokenNormalizado);
    gravarStorageSeguro(STORAGE_KEY_SESSION, JSON.stringify(sessaoAtualizada));
    if (sessaoAtualizada.fichaId) {
      gravarStorageSeguro(STORAGE_KEY_ULTIMA_FICHA, sessaoAtualizada.fichaId);
    }
    ultimaGravacaoAtividade = agora;

    return {
      valida: true,
      modo: 'jogador',
      sessao: sessaoAtualizada
    };
  },

  /**
   * Valida se o usuário atual (Mestre ou Jogador) pode acessar uma rota de ficha.
   * @param {Object} [params={}]
   * @param {string|number|null} [params.idRota=null]
   * @param {boolean} [params.isMestre=false]
   * @returns {{ permitido: boolean, modo: 'mestre'|'jogador', fichaIdAlvo: string|null, token: string|null, motivo?: string|null, titulo?: string|null, mensagem?: string|null }}
   */
  validarAcessoRotaFicha({ idRota = null, isMestre = false } = {}) {
    if (isMestre || this.isGodModeAtivo()) {
      return {
        permitido: true,
        modo: 'mestre',
        fichaIdAlvo: idRota ? String(idRota) : this.obterUltimaFichaMestre(),
        token: null
      };
    }

    const sessaoLocal = this.obterSessao();
    const validacao = validarIntegridadeSessaoJogador({
      sessaoLocal,
      idRota,
      isMestre: false
    });

    if (!validacao.valida) {
      return {
        permitido: false,
        modo: 'jogador',
        fichaIdAlvo: null,
        token: null,
        motivo: validacao.motivo,
        titulo: validacao.titulo,
        mensagem: validacao.mensagem
      };
    }

    const isToken = idRota && validarFormatoTokenCracha(String(idRota).trim());

    return {
      permitido: true,
      modo: 'jogador',
      fichaIdAlvo: isToken
        ? (sessaoLocal?.fichaId ? String(sessaoLocal.fichaId) : null)
        : (idRota ? String(idRota) : (sessaoLocal?.fichaId ? String(sessaoLocal.fichaId) : null)),
      token: isToken ? normalizarTokenCracha(idRota) : (sessaoLocal?.token || null),
      sessao: sessaoLocal
    };
  },

  /**
   * Retorna os dados da sessão atual do jogador ou null se inexistente ou em modo Mestre.
   * @returns {Object|null}
   */
  obterSessao() {
    if (this.isGodModeAtivo()) {
      return null;
    }

    const raw = lerStorageSeguro(STORAGE_KEY_SESSION);
    if (!raw) {
      const tokenLegado = lerStorageSeguro(STORAGE_KEY_TOKEN);
      if (tokenLegado) {
        const fichaLegada = lerStorageSeguro(STORAGE_KEY_ULTIMA_FICHA);
        return this.iniciarSessao(tokenLegado, fichaLegada);
      }
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.token) {
        this.encerrarSessao();
        return null;
      }
      const agora = Date.now();
      parsed.token = normalizarTokenCracha(parsed.token);
      if (!parsed.sessionId) {
        parsed.sessionId = this.gerarSessionId();
      }
      if (!parsed.loginTimestamp || isNaN(Number(parsed.loginTimestamp))) {
        parsed.loginTimestamp = agora;
      }
      if (!parsed.lastActiveTimestamp || isNaN(Number(parsed.lastActiveTimestamp))) {
        parsed.lastActiveTimestamp = agora;
      }
      return parsed;
    } catch {
      this.encerrarSessao();
      return null;
    }
  },

  /**
   * Registra interação do jogador, renovando o timer de inatividade (com throttle de 30s).
   * Ignora completamente se for Mestre.
   * @param {Object} [opcoes={}]
   * @param {boolean} [opcoes.isMestre=false]
   */
  registrarAtividade({ isMestre = false } = {}) {
    if (isMestre || this.isGodModeAtivo()) return;

    const agora = Date.now();
    if (agora - ultimaGravacaoAtividade < THROTTLE_ATIVIDADE_MS) {
      return;
    }

    const sessao = this.obterSessao();
    if (!sessao) return;

    sessao.lastActiveTimestamp = agora;
    gravarStorageSeguro(STORAGE_KEY_SESSION, JSON.stringify(sessao));
    ultimaGravacaoAtividade = agora;
  },

  /**
   * Verifica se a sessão do jogador expirou por permanência máxima ou inatividade.
   * O Mestre (God Mode) é sempre imune.
   * @param {Object} [opcoes={}]
   * @param {boolean} [opcoes.isMestre=false]
   * @returns {{ expirada: boolean, motivo: string|null, titulo: string|null, mensagem: string|null, isGodMode?: boolean }}
   */
  verificarExpiracao({ isMestre = false } = {}) {
    if (isMestre || this.isGodModeAtivo()) {
      return { expirada: false, motivo: null, titulo: null, mensagem: null, isGodMode: true };
    }

    const sessao = this.obterSessao();
    return avaliarExpiracaoSessao(sessao, Date.now(), { isMestre: false });
  },

  /**
   * Encerra a sessão local do jogador e opcionalmente armazena aviso contextual para a tela de reconexão.
   * @param {string|{titulo?: string, mensagem: string, motivo?: string}|null} [aviso=null]
   */
  encerrarSessao(aviso = null) {
    this.limparCanalSessaoAtivo();
    removerStorageSeguro(STORAGE_KEY_TOKEN);
    removerStorageSeguro(STORAGE_KEY_SESSION);
    removerStorageSeguro(STORAGE_KEY_ULTIMA_FICHA);

    if (aviso) {
      if (typeof aviso === 'string') {
        gravarStorageSeguro(
          STORAGE_KEY_NOTICE,
          JSON.stringify({
            titulo: 'Sessão Expirada',
            mensagem: aviso,
            motivo: 'expirada'
          })
        );
      } else if (typeof aviso === 'object' && aviso.mensagem) {
        gravarStorageSeguro(
          STORAGE_KEY_NOTICE,
          JSON.stringify({
            titulo: aviso.titulo || 'Reconexão Necessária',
            mensagem: aviso.mensagem,
            motivo: aviso.motivo || 'reconexao'
          })
        );
      }
    }
  },

  /**
   * Retorna e consome o objeto detalhado de aviso de reconexão ({ titulo, mensagem, motivo }).
   * @returns {{ titulo: string, mensagem: string, motivo: string }|null}
   */
  consumirAvisoReconexao() {
    const raw = lerStorageSeguro(STORAGE_KEY_NOTICE);
    if (!raw) return null;
    removerStorageSeguro(STORAGE_KEY_NOTICE);

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.mensagem) {
        return {
          titulo: parsed.titulo || 'Sessão Expirada',
          mensagem: parsed.mensagem,
          motivo: parsed.motivo || 'expirada'
        };
      }
    } catch {
      // Compatibilidade caso tenha sido salvo como string simples
    }

    return {
      titulo: 'Sessão Expirada',
      mensagem: raw,
      motivo: 'expirada'
    };
  },

  /**
   * Retorna e consome (limpa) a mensagem de aviso de sessão expirada (compatibilidade).
   * @returns {string|null}
   */
  consumirAvisoExpiracao() {
    const aviso = this.consumirAvisoReconexao();
    return aviso ? aviso.mensagem : null;
  },

  /**
   * Verifica rapidamente se existe sessão ativa e válida para o jogador.
   * @returns {boolean}
   */
  isSessaoAtiva() {
    if (this.isGodModeAtivo()) return true;
    const sessao = this.obterSessao();
    if (!sessao) return false;
    const { expirada } = this.verificarExpiracao();
    return !expirada;
  },

  // =========================================================================
  // 4. CONTROLE EM TEMPO REAL E RECONEXÃO POR JOGADOR (ITEM 7)
  // =========================================================================

  /**
   * Valida a sessão local do jogador contra o banco de dados (usado ao recuperar conexão ou focar aba).
   * @param {Object} [opcoes={}]
   * @param {boolean} [opcoes.isMestre=false]
   * @returns {Promise<{ valida: boolean, offline?: boolean, motivo?: string|null, titulo?: string|null, mensagem?: string|null, ficha?: Object|null }>}
   */
  async validarSessaoRemota({ isMestre = false } = {}) {
    if (isMestre || this.isGodModeAtivo()) {
      return { valida: true, ficha: null };
    }

    const sessao = this.obterSessao();
    if (!sessao || !sessao.token) {
      return { valida: false, motivo: MOTIVOS_ENCERRAMENTO.SEM_SESSAO, titulo: null, mensagem: null };
    }

    const statusLocal = this.verificarExpiracao({ isMestre: false });
    if (statusLocal.expirada) {
      return {
        valida: false,
        motivo: statusLocal.motivo,
        titulo: statusLocal.titulo,
        mensagem: statusLocal.mensagem
      };
    }

    try {
      let query = supabase
        .from('fichas_personagens')
        .select('id, jogador_token, nome_personagem');

      if (sessao.fichaId) {
        query = query.eq('id', sessao.fichaId);
      } else {
        query = query.eq('jogador_token', sessao.token);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        // Falha de rede/offline não deve derrubar prematuramente se o timer local estiver válido
        return { valida: true, offline: true };
      }

      if (!data) {
        return {
          valida: false,
          motivo: MOTIVOS_ENCERRAMENTO.FICHA_REMOVIDA,
          titulo: 'Personagem Não Encontrado',
          mensagem: 'A ficha associada à sua sessão não existe mais ou foi removida pelo Mestre.'
        };
      }

      const integridade = validarIntegridadeSessaoJogador({
        sessaoLocal: sessao,
        fichaBanco: data,
        isMestre: false
      });

      if (!integridade.valida) {
        return integridade;
      }

      return { valida: true, ficha: data };
    } catch {
      return { valida: true, offline: true };
    }
  },

  /**
   * Remove com segurança qualquer canal existente com o mesmo tópico registrado no Supabase client.
   * @param {string} topic
   */
  removerCanalExistente(topic) {
    if (!topic) return;
    try {
      const canais = supabase.getChannels();
      const prefixo = topic.startsWith('realtime:') ? topic : `realtime:${topic}`;
      const canaisAlvo = canais.filter(
        (ch) => ch.topic === topic || ch.topic === prefixo || ch.subTopic === topic
      );
      for (const ch of canaisAlvo) {
        try {
          ch.teardown();
        } catch {
          // Ignora
        }
        try {
          if (typeof supabase.realtime?._remove === 'function') {
            supabase.realtime._remove(ch);
          }
        } catch {
          // Ignora
        }
        try {
          supabase.removeChannel(ch);
        } catch {
          // Ignora
        }
      }
    } catch {
      // Ignora erro de remoção
    }
  },

  /**
   * Limpa o canal de sessão em tempo real ativo e todos os seus ouvintes.
   */
  limparCanalSessaoAtivo() {
    if (teardownTimer) {
      clearTimeout(teardownTimer);
      teardownTimer = null;
    }
    listenersSessao.clear();
    if (canalSessaoAtivo) {
      const canalParaRemover = canalSessaoAtivo;
      canalSessaoAtivo = null;
      fichaIdCanalAtivo = null;
      try {
        canalParaRemover.teardown();
      } catch {
        // Ignora
      }
      try {
        if (typeof supabase.realtime?._remove === 'function') {
          supabase.realtime._remove(canalParaRemover);
        }
      } catch {
        // Ignora
      }
      try {
        supabase.removeChannel(canalParaRemover);
      } catch {
        // Ignora erro
      }
    }
  },

  /**
   * Notifica o canal Realtime do personagem que uma nova sessão foi iniciada,
   * desconectando sessões antigas duplicadas apenas para este fichaId.
   * @param {Object} sessionData
   */
  async notificarNovaSessaoRealtime(sessionData) {
    if (!sessionData?.fichaId || !sessionData?.sessionId) return;
    const fichaIdStr = String(sessionData.fichaId);
    const payload = {
      acao: 'nova_sessao_ativa',
      fichaId: fichaIdStr,
      sessionId: sessionData.sessionId,
      token: sessionData.token,
      timestamp: sessionData.loginTimestamp || Date.now()
    };

    if (canalSessaoAtivo && fichaIdCanalAtivo === fichaIdStr && canalSessaoAtivo.state === 'joined') {
      try {
        await canalSessaoAtivo.send({
          type: 'broadcast',
          event: 'controle_sessao',
          payload
        });
        return;
      } catch {
        // Fallback para envio via canal efêmero
      }
    }

    const topic = `controle_sessao_ficha_${fichaIdStr}`;
    const channel = supabase.channel(topic);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'controle_sessao',
            payload
          });
        } finally {
          setTimeout(() => {
            if (canalSessaoAtivo !== channel) {
              try {
                channel.teardown();
                if (typeof supabase.realtime?._remove === 'function') {
                  supabase.realtime._remove(channel);
                }
                supabase.removeChannel(channel);
              } catch {
                // Ignora erro de remoção
              }
            }
          }, 1500);
        }
      }
    });
  },

  /**
   * Permite ao Mestre forçar a reconexão apenas do jogador vinculado a uma ficha específica.
   * @param {string|number} fichaId
   */
  async revogarSessaoJogadorRealtime(fichaId) {
    if (!fichaId) return;
    const fichaIdStr = String(fichaId);
    const payload = {
      acao: 'revogar_sessao',
      fichaId: fichaIdStr,
      timestamp: Date.now()
    };

    if (canalSessaoAtivo && fichaIdCanalAtivo === fichaIdStr && canalSessaoAtivo.state === 'joined') {
      try {
        await canalSessaoAtivo.send({
          type: 'broadcast',
          event: 'controle_sessao',
          payload
        });
        return;
      } catch {
        // Fallback
      }
    }

    const topic = `controle_sessao_ficha_${fichaIdStr}`;
    const channel = supabase.channel(topic);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'controle_sessao',
            payload
          });
        } finally {
          setTimeout(() => {
            if (canalSessaoAtivo !== channel) {
              try {
                channel.teardown();
                if (typeof supabase.realtime?._remove === 'function') {
                  supabase.realtime._remove(channel);
                }
                supabase.removeChannel(channel);
              } catch {
                // Ignora erro de remoção
              }
            }
          }, 1500);
        }
      }
    });
  },

  /**
   * Inscreve monitoramento em tempo real exclusivo para a ficha do jogador logado.
   * Garante que todos os ouvintes (.on) sejam encadeados estritamente ANTES de chamar .subscribe(),
   * reutiliza o canal subscrito caso já exista e remove canais órfãos com segurança.
   *
   * @param {Object} params
   * @param {string|number} params.fichaId
   * @param {boolean} [params.isMestre=false]
   * @param {Function} [params.onSessionInvalidated]
   * @param {Function} [params.onFichaUpdated]
   * @param {Function} [params.onConnectionChange]
   * @returns {{ unsubscribe: () => void }}
   */
  subscribeSessaoJogadorRealtime({
    fichaId,
    isMestre = false,
    onSessionInvalidated,
    onFichaUpdated,
    onConnectionChange
  }) {
    if (isMestre || this.isGodModeAtivo() || !fichaId) {
      return { unsubscribe: () => {} };
    }

    if (teardownTimer) {
      clearTimeout(teardownTimer);
      teardownTimer = null;
    }

    const fichaIdStr = String(fichaId);
    const topic = `controle_sessao_ficha_${fichaIdStr}`;

    const listener = {
      onSessionInvalidated,
      onFichaUpdated,
      onConnectionChange
    };

    // 1. Se já existir canal ativo para o mesmo fichaId que já chamou subscribe():
    // Adiciona o ouvinte sem tentar chamar .on() novamente no canal já subscrito!
    if (canalSessaoAtivo && fichaIdCanalAtivo === fichaIdStr) {
      listenersSessao.add(listener);

      if (onConnectionChange && canalSessaoAtivo.state === 'joined') {
        try {
          onConnectionChange('SUBSCRIBED');
        } catch {
          // Ignora
        }
      }

      return {
        unsubscribe: () => {
          listenersSessao.delete(listener);
          if (listenersSessao.size === 0) {
            if (teardownTimer) clearTimeout(teardownTimer);
            teardownTimer = setTimeout(() => {
              if (listenersSessao.size === 0) {
                this.limparCanalSessaoAtivo();
              }
              teardownTimer = null;
            }, 300);
          }
        }
      };
    }

    // 2. Se havia canal para outra ficha, limpa antes
    if (canalSessaoAtivo && fichaIdCanalAtivo !== fichaIdStr) {
      this.limparCanalSessaoAtivo();
    }

    // 3. Remove com segurança qualquer canal pré-existente ou órfão com o mesmo tópico
    this.removerCanalExistente(topic);

    // 4. Cria a nova instância virgem do canal e previne instâncias já subscritas
    let channel = supabase.channel(topic);
    const adapter = channel.channelAdapter;
    const jaSubscrito = Boolean(adapter?.isJoined?.() || adapter?.isJoining?.() || channel.joinedOnce);
    if (jaSubscrito) {
      try {
        channel.teardown();
        if (typeof supabase.realtime?._remove === 'function') {
          supabase.realtime._remove(channel);
        }
      } catch {
        // Ignora
      }
      channel = supabase.channel(topic);
    }

    // 5. Encadeia estritamente todos os listeners (.on) ANTES de chamar .subscribe()
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fichas_personagens',
          filter: `id=eq.${fichaIdStr}`
        },
        (payload) => {
          if (this.isGodModeAtivo()) return;
          const sessaoAtual = this.obterSessao();
          const resultado = avaliarEventoRealtimeSessao({
            eventType: payload.eventType,
            recordNew: payload.new || null,
            recordOld: payload.old || null,
            sessaoLocal: sessaoAtual,
            isMestre: false
          });

          if (resultado.ignorar) return;

          if (resultado.invalida) {
            listenersSessao.forEach((l) => {
              if (l.onSessionInvalidated) {
                l.onSessionInvalidated({
                  motivo: resultado.motivo,
                  titulo: resultado.titulo,
                  mensagem: resultado.mensagem
                });
              }
            });
            return;
          }

          if (resultado.dadosAtualizados) {
            listenersSessao.forEach((l) => {
              if (l.onFichaUpdated) {
                l.onFichaUpdated(resultado.dadosAtualizados);
              }
            });
          }
        }
      )
      .on('broadcast', { event: 'controle_sessao' }, ({ payload }) => {
        if (this.isGodModeAtivo()) return;
        const sessaoAtual = this.obterSessao();
        const conflito = avaliarConflitoBroadcastSessao({
          payloadBroadcast: payload,
          sessaoLocal: sessaoAtual,
          isMestre: false
        });

        if (conflito.conflito) {
          listenersSessao.forEach((l) => {
            if (l.onSessionInvalidated) {
              l.onSessionInvalidated({
                motivo: conflito.motivo,
                titulo: conflito.titulo,
                mensagem: conflito.mensagem
              });
            }
          });
        }
      });

    // 6. Chama .subscribe() estritamente APÓS a definição de todos os listeners
    channel.subscribe((status, err) => {
      listenersSessao.forEach((l) => {
        if (l.onConnectionChange) {
          l.onConnectionChange(status, err);
        }
      });
    });

    canalSessaoAtivo = channel;
    fichaIdCanalAtivo = fichaIdStr;
    listenersSessao.add(listener);

    return {
      unsubscribe: () => {
        listenersSessao.delete(listener);
        if (listenersSessao.size === 0) {
          if (teardownTimer) clearTimeout(teardownTimer);
          teardownTimer = setTimeout(() => {
            if (listenersSessao.size === 0) {
              this.limparCanalSessaoAtivo();
            }
            teardownTimer = null;
          }, 300);
        }
      }
    };
  }
};
