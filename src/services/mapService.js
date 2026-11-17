import { supabase } from './supabase.js';

const MAP_CACHE_TTL_MS = 60_000;

/**
 * Service para dados do Mapa Mundi (Titãs e Rotas Aéreas) com cache em memória.
 */
export const mapService = {
  _titansCache: null,
  _rotasCache: null,
  _cacheAt: 0,

  invalidarCache() {
    this._titansCache = null;
    this._rotasCache = null;
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
  }
};
