import { supabase } from './supabase.js';

const MAP_CACHE_TTL_MS = 60_000;
const TOKENS_STORAGE_KEY = 'aetheria_map_tokens_v1';

export const DEFAULT_MAP_TOKENS = [
  {
    id: 'token-airship-1',
    nome: 'Aeronave Vento de Aetheria',
    tipo: 'navio',
    x: 48.5,
    y: 42.0,
    icone: 'ship',
    descricao: 'Nau capitânia do grupo de aventureiros'
  },
  {
    id: 'token-party-1',
    nome: 'Comitiva dos Heróis',
    tipo: 'party',
    x: 52.0,
    y: 46.5,
    icone: 'users',
    descricao: 'Posição terrestre do grupo de heróis'
  }
];

/**
 * Service para dados do Mapa Mundi (Titãs, Rotas Aéreas e Tokens) com cache em memória.
 */
export const mapService = {
  _titansCache: null,
  _rotasCache: null,
  _tokensCache: null,
  _cacheAt: 0,

  invalidarCache() {
    this._titansCache = null;
    this._rotasCache = null;
    this._tokensCache = null;
    this._cacheAt = 0;
  },

  /**
   * Carrega Titãs e Rotas em paralelo com cache de 60s.
   * @param {{ forceRefresh?: boolean }} [opcoes]
   * @returns {Promise<{ titans: Array<any>, rotas: Array<any>, error: any }>}
   */
  async getDadosMapa({ forceRefresh = false } = {}) {
    const agora = Date.now();
    if (
      !forceRefresh &&
      Array.isArray(this._titansCache) &&
      Array.isArray(this._rotasCache) &&
      agora - this._cacheAt < MAP_CACHE_TTL_MS
    ) {
      return {
        titans: this._titansCache,
        rotas: this._rotasCache,
        error: null
      };
    }

    const [resTitans, resRotas] = await Promise.all([
      supabase.from('titans').select('*').order('id', { ascending: true }),
      supabase.from('rotas_titas').select('*')
    ]);

    if (resTitans.error) {
      return { titans: [], rotas: [], error: resTitans.error };
    }

    this._titansCache = resTitans.data || [];
    this._rotasCache = resRotas.data || [];
    this._cacheAt = agora;

    return {
      titans: this._titansCache,
      rotas: this._rotasCache,
      error: resRotas.error || null
    };
  },

  /**
   * Atualiza o status geopolítico de um Titã e sincroniza o cache local.
   * @param {number|string} id
   * @param {string} novoStatus
   * @returns {Promise<{ error: any }>}
   */
  async atualizarStatusTitan(id, novoStatus) {
    const { error } = await supabase
      .from('titans')
      .update({ status: novoStatus })
      .eq('id', id);

    if (!error && Array.isArray(this._titansCache)) {
      this._titansCache = this._titansCache.map((t) =>
        t.id === id ? { ...t, status: novoStatus } : t
      );
    }

    return { error };
  },

  /**
   * Obtém a lista de tokens posicionados no mapa.
   * @returns {Promise<{ tokens: Array<any>, error: any }>}
   */
  async getTokensMapa() {
    if (Array.isArray(this._tokensCache)) {
      return { tokens: this._tokensCache, error: null };
    }

    try {
      const salvo = typeof window !== 'undefined' ? window.localStorage.getItem(TOKENS_STORAGE_KEY) : null;
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this._tokensCache = parsed;
          return { tokens: parsed, error: null };
        }
      }
    } catch {
      // Ignora erro de parse e carrega padrão
    }

    this._tokensCache = DEFAULT_MAP_TOKENS;
    return { tokens: DEFAULT_MAP_TOKENS, error: null };
  },

  /**
   * Salva os tokens do mapa.
   * @param {Array<any>} tokens
   * @returns {Promise<{ error: any }>}
   */
  async salvarTokensMapa(tokens) {
    this._tokensCache = tokens;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
      }
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },

  /**
   * Atualiza rapidamente a posição de um token específico.
   * @param {string} id
   * @param {number} x - Percentual 0 a 100
   * @param {number} y - Percentual 0 a 100
   * @returns {Promise<{ tokens: Array<any>, error: any }>}
   */
  async atualizarPosicaoToken(id, x, y) {
    const { tokens } = await this.getTokensMapa();
    const atualizados = tokens.map((tk) =>
      tk.id === id ? { ...tk, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) } : tk
    );
    await this.salvarTokensMapa(atualizados);
    return { tokens: atualizados, error: null };
  }
};
