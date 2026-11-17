import { supabase } from './supabase.js';

const CACHE_TTL_MS = 30_000;

/**
 * Service para persistência, cache e tempo real do Sistema de Projetos.
 *
 * Regra Arquitetural (GEMINI.md):
 * É estritamente proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const projetoService = {
  _projetosCache: null,
  _projetosCacheAt: 0,
  _personagensCache: null,
  _personagensCacheAt: 0,

  /**
   * Invalida o cache local de projetos (e opcionalmente de personagens).
   * @param {{ incluirPersonagens?: boolean }} [opcoes]
   */
  invalidarCache({ incluirPersonagens = false } = {}) {
    this._projetosCache = null;
    this._projetosCacheAt = 0;
    if (incluirPersonagens) {
      this._personagensCache = null;
      this._personagensCacheAt = 0;
    }
  },

  /**
   * Busca todos os projetos visíveis (jogadores) ou todos (Mestre autenticado).
   * @param {{ forceRefresh?: boolean }} [opcoes]
   * @returns {Promise<{data: Array<any>, error: any, fromCache?: boolean}>}
   */
  async getProjetos({ forceRefresh = false } = {}) {
    const agora = Date.now();
    if (
      !forceRefresh &&
      Array.isArray(this._projetosCache) &&
      agora - this._projetosCacheAt < CACHE_TTL_MS
    ) {
      return { data: this._projetosCache, error: null, fromCache: true };
    }

    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      this._projetosCache = data || [];
      this._projetosCacheAt = agora;
    }

    return { data: data || [], error, fromCache: false };
  },

  /**
   * Busca um projeto específico por ID.
   * @param {string} id
   * @returns {Promise<{data: any, error: any}>}
   */
  async getProjetoPorId(id) {
    return await supabase
      .from('projetos')
      .select('*')
      .eq('id', id)
      .single();
  },

  /**
   * Busca resumo dos personagens e suas classes para cálculo de Visionário e vínculo.
   * @param {{ forceRefresh?: boolean }} [opcoes]
   * @returns {Promise<{data: Array<any>, error: any}>}
   */
  async getPersonagensResumo({ forceRefresh = false } = {}) {
    const agora = Date.now();
    if (
      !forceRefresh &&
      Array.isArray(this._personagensCache) &&
      agora - this._personagensCacheAt < CACHE_TTL_MS
    ) {
      return { data: this._personagensCache, error: null };
    }

    const { data, error } = await supabase
      .from('fichas_personagens')
      .select(`
        id,
        nome_personagem,
        zenit,
        destreza,
        astucia,
        vigor,
        vontade,
        fichas_classes (
          nome_classe,
          nivel,
          habilidades
        )
      `)
      .order('nome_personagem', { ascending: true });

    if (!error) {
      this._personagensCache = data || [];
      this._personagensCacheAt = agora;
    }

    return { data: data || [], error };
  },

  /**
   * Cria um novo projeto (somente Mestre via RLS).
   * @param {Object} dados
   * @returns {Promise<{data: any, error: any}>}
   */
  async criarProjeto(dados) {
    const { data, error } = await supabase
      .from('projetos')
      .insert([dados])
      .select()
      .single();

    if (!error) {
      this.invalidarCache();
    }

    return { data, error };
  },

  /**
   * Atualiza os campos de um projeto existente (somente Mestre via RLS).
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<{data: any, error: any}>}
   */
  async atualizarProjeto(id, updates) {
    const { data, error } = await supabase
      .from('projetos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      this.invalidarCache();
    }

    return { data, error };
  },

  /**
   * Exclui um projeto pelo ID (somente Mestre via RLS).
   * @param {string} id
   * @returns {Promise<{error: any}>}
   */
  async excluirProjeto(id) {
    const { error } = await supabase
      .from('projetos')
      .delete()
      .eq('id', id);

    if (!error) {
      this.invalidarCache();
    }

    return { error };
  },

  /**
   * Inscreve callback para alterações em tempo real na tabela projetos.
   * Invalida o cache automaticamente ao receber eventos do Postgres.
   * @param {(payload?: any) => void} onMudanca
   * @returns {{ unsubscribe: () => void }}
   */
  subscribeProjetos(onMudanca) {
    const channelName = `realtime_projetos_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projetos' },
        (payload) => {
          this.invalidarCache();
          if (onMudanca) onMudanca(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};
