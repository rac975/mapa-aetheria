/**
 * sessionRules.js
 * Regras de negócio puras para controle de sessões da mesa, God Mode do Mestre,
 * validação/geração de tokens de crachá e detecção de conflitos em tempo real.
 *
 * Diretrizes GEMINI.md:
 * - Camada de Domínio (src/domain/fabula/)
 * - Funções 100% puras e determinísticas
 * - Zero dependências de React (UI) ou Supabase (Banco)
 */

// 6 horas de permanência máxima e 2 horas de inatividade sem interação para jogadores
export const TEMPO_MAXIMO_PERMANENCIA_MS = 6 * 60 * 60 * 1000;
export const TEMPO_MAXIMO_INATIVIDADE_MS = 2 * 60 * 60 * 1000;
export const THROTTLE_ATIVIDADE_MS = 30 * 1000;

export const MOTIVOS_ENCERRAMENTO = {
  TEMPO_MAXIMO: 'tempo_maximo',
  INATIVIDADE: 'inatividade',
  CONFLITO_ID: 'conflito_id',
  TOKEN_EXPIRADO: 'token_expirado',
  FICHA_REMOVIDA: 'ficha_removida',
  QUEDA_CONEXAO: 'queda_conexao',
  SEM_SESSAO: 'sem_sessao'
};

/**
 * Remove acentos e caracteres especiais, mantendo apenas letras ASCII maiúsculas e números.
 * @param {string} texto
 * @returns {string}
 */
export function limparAlfanumericoAscii(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Normaliza qualquer token de crachá para comparação e persistência consistente (ex: "ply-001" -> "PLY-001").
 * @param {string} valor
 * @returns {string}
 */
export function normalizarTokenCracha(valor) {
  if (!valor || typeof valor !== 'string') return '';
  const bruto = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  if (bruto.includes('-')) {
    const partes = bruto.split('-').map((p) => p.replace(/[^A-Z0-9]/g, '')).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0]}-${partes.slice(1).join('')}`;
    }
  }

  const limpo = bruto.replace(/[^A-Z0-9]/g, '');
  if (limpo.length > 3) {
    return `${limpo.slice(0, 3)}-${limpo.slice(3, 7)}`;
  }
  return limpo;
}

/**
 * Aplica máscara automática de digitação para campos de crachá (AAA-000).
 * Remove acentos antes de filtrar para permitir digitação fluida de nomes acentuados.
 * @param {string} valor
 * @returns {string}
 */
export function aplicarMascaraTokenCracha(valor) {
  const limpo = limparAlfanumericoAscii(valor);
  if (limpo.length > 3) {
    return `${limpo.slice(0, 3)}-${limpo.slice(3, 7)}`;
  }
  return limpo;
}

/**
 * Valida se o token possui formato válido de crachá (ex: PLY-001).
 * @param {string} token
 * @returns {boolean}
 */
export function validarFormatoTokenCracha(token) {
  const norm = normalizarTokenCracha(token);
  if (!norm || norm.length < 5) return false;
  return /^[A-Z0-9]{2,4}-[A-Z0-9]{2,5}$/.test(norm);
}

/**
 * Extrai prefixo de 3 letras ASCII maiúsculas a partir do nome do personagem.
 * Preenche com 'X' caso o nome possua menos de 3 caracteres alfanuméricos.
 * @param {string} nomePersonagem
 * @returns {string}
 */
export function gerarPrefixoToken(nomePersonagem) {
  const limpo = limparAlfanumericoAscii(nomePersonagem);
  if (!limpo) return 'HER';
  return limpo.padEnd(3, 'X').slice(0, 3);
}

/**
 * Gera um token de crachá único (AAA-000) garantindo ausência de colisão com tokens existentes na mesa.
 * @param {string} nomePersonagem
 * @param {Array<string>} [tokensExistentes=[]]
 * @param {Function} [randomFn=Math.random]
 * @returns {string}
 */
export function gerarTokenCrachaUnico(nomePersonagem, tokensExistentes = [], randomFn = Math.random) {
  if (!nomePersonagem || !String(nomePersonagem).trim()) return '';
  const prefixo = gerarPrefixoToken(nomePersonagem);
  const conjuntoExistentes = new Set(
    (tokensExistentes || []).map((t) => normalizarTokenCracha(String(t || ''))).filter(Boolean)
  );

  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const numero = Math.floor(100 + randomFn() * 900);
    const candidato = `${prefixo}-${numero}`;
    if (!conjuntoExistentes.has(candidato)) {
      return candidato;
    }
  }

  // Fallback de 4 dígitos caso a faixa de 3 dígitos para o prefixo esteja saturada
  const numero4 = Math.floor(1000 + randomFn() * 9000);
  return `${prefixo}-${numero4}`;
}

/**
 * Extrai credencial (ID de ficha ou Token de crachá) a partir de leitura de QR Code ou texto livre.
 * Suporta URLs completas com hash (#/ficha/:id), pathname (/ficha/:id), query params ou código direto.
 * @param {string} textoOuUrl
 * @returns {{ tipo: 'id'|'token'|'invalido', id: string|null, token: string|null }}
 */
export function extrairCredencialCracha(textoOuUrl) {
  if (!textoOuUrl || typeof textoOuUrl !== 'string') {
    return { tipo: 'invalido', id: null, token: null };
  }

  const texto = textoOuUrl.trim();
  if (!texto) {
    return { tipo: 'invalido', id: null, token: null };
  }

  // 1. Tentativa de parse como URL ou rota contendo /ficha/:id ou /editar/:id
  const matchRotaFicha = texto.match(/\/(?:ficha|editar)\/([A-Za-z0-9_-]+)\/?(?:\?.*)?$/i);
  if (matchRotaFicha && matchRotaFicha[1] && matchRotaFicha[1].toLowerCase() !== 'login') {
    const extraido = matchRotaFicha[1].trim();
    if (validarFormatoTokenCracha(extraido) && !/^\d+$/.test(extraido)) {
      return { tipo: 'token', id: null, token: normalizarTokenCracha(extraido) };
    }
    return { tipo: 'id', id: extraido, token: null };
  }

  // 2. Tentativa via objeto URL (query params ?token=... ou ?id=...)
  if (texto.startsWith('http://') || texto.startsWith('https://')) {
    try {
      const urlObj = new URL(texto);
      const tokenParam = urlObj.searchParams.get('token');
      if (tokenParam && validarFormatoTokenCracha(tokenParam)) {
        return { tipo: 'token', id: null, token: normalizarTokenCracha(tokenParam) };
      }
      const idParam = urlObj.searchParams.get('id') || urlObj.searchParams.get('fichaId');
      if (idParam) {
        return { tipo: 'id', id: idParam.trim(), token: null };
      }
      const hashParts = (urlObj.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
      const ultimoSegmento = hashParts[hashParts.length - 1];
      if (ultimoSegmento && ultimoSegmento.toLowerCase() !== 'ficha' && ultimoSegmento.toLowerCase() !== 'login') {
        return { tipo: 'id', id: ultimoSegmento, token: null };
      }
    } catch {
      // Continua para avaliação direta caso não seja uma URL válida
    }
  }

  // 3. Código direto no formato de Token (ex: PLY-001)
  if (validarFormatoTokenCracha(texto)) {
    return { tipo: 'token', id: null, token: normalizarTokenCracha(texto) };
  }

  // 4. ID numérico ou UUID direto
  if (/^\d+$/.test(texto) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(texto)) {
    return { tipo: 'id', id: texto, token: null };
  }

  return { tipo: 'invalido', id: null, token: null };
}

/**
 * Avalia se uma sessão expirou por tempo máximo de permanência ou inatividade.
 * Regra Item 6 (God Mode): O Mestre NUNCA expira por inatividade ou tempo de ficha.
 *
 * @param {Object|null} sessao
 * @param {number} [agora=Date.now()]
 * @param {Object} [opcoes]
 * @param {boolean} [opcoes.isMestre=false]
 * @returns {{ expirada: boolean, motivo: string|null, titulo: string|null, mensagem: string|null, isGodMode?: boolean }}
 */
export function avaliarExpiracaoSessao(sessao, agora = Date.now(), { isMestre = false } = {}) {
  if (isMestre || sessao?.isMestre) {
    return {
      expirada: false,
      motivo: null,
      titulo: null,
      mensagem: null,
      isGodMode: true
    };
  }

  if (!sessao || typeof sessao !== 'object' || !sessao.token) {
    return { expirada: false, motivo: null, titulo: null, mensagem: null };
  }

  const loginTs = Number(sessao.loginTimestamp) || agora;
  const activeTs = Number(sessao.lastActiveTimestamp) || agora;

  const tempoPermanencia = agora - loginTs;
  const tempoInativo = agora - activeTs;

  if (tempoPermanencia > TEMPO_MAXIMO_PERMANENCIA_MS) {
    return {
      expirada: true,
      motivo: MOTIVOS_ENCERRAMENTO.TEMPO_MAXIMO,
      titulo: 'Sessão Expirada',
      mensagem: 'Sua sessão atingiu o tempo máximo de permanência (6 horas). Por favor, reconecte seu crachá.'
    };
  }

  if (tempoInativo > TEMPO_MAXIMO_INATIVIDADE_MS) {
    return {
      expirada: true,
      motivo: MOTIVOS_ENCERRAMENTO.INATIVIDADE,
      titulo: 'Sessão Expirada por Inatividade',
      mensagem: 'Sua sessão expirou por inatividade (2 horas sem interação). Por favor, reconecte seu crachá.'
    };
  }

  return { expirada: false, motivo: null, titulo: null, mensagem: null };
}

/**
 * Valida a integridade da sessão do jogador contra a rota acessada e os dados reais do banco.
 * Regra Item 6: O Mestre (isMestre = true) possui acesso livre (God Mode) a qualquer ficha sem restrição de token/ID.
 * Regra Item 7: Jogadores comuns sofrem validação estrita de expiração, vínculo de token e conflito de ID.
 *
 * @param {Object} params
 * @param {Object|null} params.sessaoLocal
 * @param {Object|null} [params.fichaBanco=null]
 * @param {string|number|null} [params.idRota=null]
 * @param {boolean} [params.isMestre=false]
 * @param {number} [params.agora=Date.now()]
 * @returns {{ valida: boolean, modo: 'mestre'|'jogador', motivo: string|null, titulo: string|null, mensagem: string|null }}
 */
export function validarIntegridadeSessaoJogador({
  sessaoLocal,
  fichaBanco = null,
  idRota = null,
  isMestre = false,
  agora = Date.now()
}) {
  if (isMestre) {
    return {
      valida: true,
      modo: 'mestre',
      motivo: null,
      titulo: null,
      mensagem: null
    };
  }

  const statusExpiracao = avaliarExpiracaoSessao(sessaoLocal, agora, { isMestre: false });
  if (statusExpiracao.expirada) {
    return {
      valida: false,
      modo: 'jogador',
      motivo: statusExpiracao.motivo,
      titulo: statusExpiracao.titulo || 'Sessão Expirada',
      mensagem: statusExpiracao.mensagem
    };
  }

  if (!sessaoLocal || !sessaoLocal.token) {
    return {
      valida: false,
      modo: 'jogador',
      motivo: MOTIVOS_ENCERRAMENTO.SEM_SESSAO,
      titulo: 'Identificação Necessária',
      mensagem: null
    };
  }

  // Verifica conflito de ID entre a URL (:id) e a ficha vinculada à sessão do jogador
  if (
    idRota !== null &&
    idRota !== undefined &&
    String(idRota).trim() !== '' &&
    sessaoLocal.fichaId !== null &&
    sessaoLocal.fichaId !== undefined &&
    String(sessaoLocal.fichaId) !== String(idRota)
  ) {
    return {
      valida: false,
      modo: 'jogador',
      motivo: MOTIVOS_ENCERRAMENTO.CONFLITO_ID,
      titulo: 'Conflito de ID de Personagem',
      mensagem: 'Conflito de ID detectado: sua sessão está vinculada a outro personagem. Por favor, reconecte seu crachá.'
    };
  }

  // Se os dados do banco já foram carregados, valida correspondência exata de ID e Token
  if (fichaBanco) {
    if (
      sessaoLocal.fichaId !== null &&
      sessaoLocal.fichaId !== undefined &&
      String(fichaBanco.id) !== String(sessaoLocal.fichaId)
    ) {
      return {
        valida: false,
        modo: 'jogador',
        motivo: MOTIVOS_ENCERRAMENTO.CONFLITO_ID,
        titulo: 'Conflito de ID de Personagem',
        mensagem: 'O registro da ficha não corresponde ao ID autenticado na sua sessão. Por favor, reconecte seu crachá.'
      };
    }

    if (
      fichaBanco.jogador_token &&
      normalizarTokenCracha(fichaBanco.jogador_token) !== normalizarTokenCracha(sessaoLocal.token)
    ) {
      return {
        valida: false,
        modo: 'jogador',
        motivo: MOTIVOS_ENCERRAMENTO.TOKEN_EXPIRADO,
        titulo: 'Crachá Atualizado ou Expirado',
        mensagem: 'O token de acesso deste personagem foi alterado ou revogado. Por favor, reconecte utilizando o código atual.'
      };
    }
  }

  return {
    valida: true,
    modo: 'jogador',
    motivo: null,
    titulo: null,
    mensagem: null
  };
}

/**
 * Avalia um evento de alteração em tempo real (Postgres Changes na tabela fichas_personagens)
 * garantindo que apenas o jogador afetado seja desconectado caso seu token mude ou sua ficha seja excluída.
 *
 * @param {Object} params
 * @param {string} params.eventType - 'UPDATE' | 'DELETE' | 'INSERT'
 * @param {Object|null} [params.recordNew=null]
 * @param {Object|null} [params.recordOld=null]
 * @param {Object|null} params.sessaoLocal
 * @param {boolean} [params.isMestre=false]
 * @returns {{ invalida: boolean, ignorar: boolean, motivo?: string, titulo?: string, mensagem?: string, dadosAtualizados?: Object|null }}
 */
export function avaliarEventoRealtimeSessao({
  eventType,
  recordNew = null,
  recordOld = null,
  sessaoLocal,
  isMestre = false
}) {
  if (isMestre || !sessaoLocal || !sessaoLocal.token) {
    return { invalida: false, ignorar: true };
  }

  const targetId = recordNew?.id ?? recordOld?.id;
  if (
    sessaoLocal.fichaId !== null &&
    sessaoLocal.fichaId !== undefined &&
    targetId !== null &&
    targetId !== undefined &&
    String(targetId) !== String(sessaoLocal.fichaId)
  ) {
    // Evento pertence a outro personagem da mesa: ignora totalmente
    return { invalida: false, ignorar: true };
  }

  if (eventType === 'DELETE') {
    return {
      invalida: true,
      ignorar: false,
      motivo: MOTIVOS_ENCERRAMENTO.FICHA_REMOVIDA,
      titulo: 'Ficha Removida da Mesa',
      mensagem: 'A ficha do seu personagem foi removida pelo Mestre. Você foi direcionado para a tela de identificação.'
    };
  }

  if (eventType === 'UPDATE' && recordNew) {
    const tokenBanco = normalizarTokenCracha(recordNew.jogador_token || '');
    const tokenSessao = normalizarTokenCracha(sessaoLocal.token || '');

    if (tokenBanco && tokenSessao && tokenBanco !== tokenSessao) {
      return {
        invalida: true,
        ignorar: false,
        motivo: MOTIVOS_ENCERRAMENTO.TOKEN_EXPIRADO,
        titulo: 'Crachá Atualizado pelo Mestre',
        mensagem: 'O código do seu crachá foi reemitido ou alterado pelo Mestre. Por favor, reconecte com o novo código.'
      };
    }

    return {
      invalida: false,
      ignorar: false,
      dadosAtualizados: recordNew
    };
  }

  return { invalida: false, ignorar: true };
}

/**
 * Avalia eventos de Broadcast de controle de sessão (conflito de login simultâneo ou revogação direta pelo Mestre).
 * Garante isolamento por fichaId e imunidade total ao Mestre.
 *
 * @param {Object} params
 * @param {Object|null} params.payloadBroadcast
 * @param {Object|null} params.sessaoLocal
 * @param {boolean} [params.isMestre=false]
 * @returns {{ conflito: boolean, motivo?: string, titulo?: string, mensagem?: string }}
 */
export function avaliarConflitoBroadcastSessao({
  payloadBroadcast,
  sessaoLocal,
  isMestre = false
}) {
  if (isMestre || !sessaoLocal || !payloadBroadcast) {
    return { conflito: false };
  }

  if (
    sessaoLocal.fichaId &&
    payloadBroadcast.fichaId &&
    String(payloadBroadcast.fichaId) !== String(sessaoLocal.fichaId)
  ) {
    return { conflito: false };
  }

  if (payloadBroadcast.acao === 'revogar_sessao') {
    return {
      conflito: true,
      motivo: MOTIVOS_ENCERRAMENTO.TOKEN_EXPIRADO,
      titulo: 'Reconexão Solicitada pelo Mestre',
      mensagem: 'O Mestre reiniciou a sessão deste personagem. Por favor, reconecte seu crachá.'
    };
  }

  if (
    payloadBroadcast.acao === 'nova_sessao_ativa' &&
    payloadBroadcast.sessionId &&
    sessaoLocal.sessionId &&
    payloadBroadcast.sessionId !== sessaoLocal.sessionId
  ) {
    const tsNovo = Number(payloadBroadcast.timestamp || 0);
    const tsLocal = Number(sessaoLocal.loginTimestamp || 0);
    if (tsNovo >= tsLocal) {
      return {
        conflito: true,
        motivo: MOTIVOS_ENCERRAMENTO.CONFLITO_ID,
        titulo: 'Conflito de Sessão Detectado',
        mensagem: 'Este personagem foi conectado em outro dispositivo ou aba. Reconecte seu crachá caso deseje retomar o controle aqui.'
      };
    }
  }

  return { conflito: false };
}
