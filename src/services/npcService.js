import { supabase } from './supabase.js';
import { sanitizarPayloadNpcMestre, normalizarNpcLeitura } from '../domain/fabula/npcRules.js';

/**
 * Service para operações com NPCs e Adversários (npcs_mestre)
 * e catálogos de criação de NPCs (catalogo_especies, catalogo_feiticos, catalogo_poderes_npc).
 * Regra: Chamadas ao supabase devem residir exclusivamente nesta camada.
 */
export const npcService = {
  /**
   * Busca todos os NPCs salvos no catálogo do mestre
   * @returns {Promise<{data: any, error: any}>}
   */
  async getNpcsMestre() {
    const res = await supabase
      .from('npcs_mestre')
      .select('*')
      .eq('tipo_registro', 'npc_mestre')
      .order('created_at', { ascending: false });

    if (res.data && Array.isArray(res.data)) {
      return { ...res, data: res.data.map(normalizarNpcLeitura) };
    }
    return res;
  },

  /**
   * Busca um NPC por ID
   * @param {string|number} id 
   * @returns {Promise<{data: any, error: any}>}
   */
  async getNpcPorId(id) {
    const res = await supabase
      .from('npcs_mestre')
      .select('*')
      .eq('id', id)
      .single();

    if (res.data) {
      return { ...res, data: normalizarNpcLeitura(res.data) };
    }
    return res;
  },

  /**
   * Atualiza os dados de um NPC
   * @param {string|number} id 
   * @param {Object} npcData 
   * @returns {Promise<{data: any, error: any}>}
   */
  async updateNpc(id, npcData) {
    const payload = sanitizarPayloadNpcMestre(npcData, { preservarId: false });
    return await supabase
      .from('npcs_mestre')
      .update(payload)
      .eq('id', id);
  },

  /**
   * Deleta um NPC por ID
   * @param {string|number} id 
   * @returns {Promise<{data: any, error: any}>}
   */
  async deleteNpc(id) {
    return await supabase
      .from('npcs_mestre')
      .delete()
      .eq('id', id);
  },

  /**
   * Cria um novo NPC
   * @param {Object} npcData 
   * @returns {Promise<{data: any, error: any}>}
   */
  async createNpc(npcData) {
    const payload = sanitizarPayloadNpcMestre(npcData);
    const res = await supabase
      .from('npcs_mestre')
      .insert([payload])
      .select()
      .single();

    if (res.data) {
      return { ...res, data: normalizarNpcLeitura(res.data) };
    }
    return res;
  },

  /**
   * Busca o catálogo completo de espécies de criaturas
   * @returns {Promise<{data: any, error: any}>}
   */
  async getCatalogoEspecies() {
    return await supabase
      .from('catalogo_especies')
      .select('*');
  },

  /**
   * Busca o catálogo de feitiços/magias
   * @returns {Promise<{data: any, error: any}>}
   */
  async getCatalogoFeiticos() {
    return await supabase
      .from('catalogo_feiticos')
      .select('*');
  },

  /**
   * Busca o catálogo de poderes de NPCs
   * @returns {Promise<{data: any, error: any}>}
   */
  async getCatalogoPoderesNpc() {
    return await supabase
      .from('catalogo_poderes_npc')
      .select('*');
  },

  /**
   * Busca o companheiro fiel associado a um personagem
   * @param {string|number} personagemId
   * @returns {Promise<{data: any, error: any}>}
   */
  async getCompanheiroFielPorPersonagemId(personagemId) {
    const res = await supabase
      .from('npcs_mestre')
      .select('*')
      .eq('personagem_id', personagemId)
      .eq('tipo_registro', 'companheiro')
      .maybeSingle();

    if (res.data) {
      return { ...res, data: normalizarNpcLeitura(res.data) };
    }
    return res;
  },

  /**
   * Cria um registro de companheiro fiel
   * @param {Object} companheiroData
   * @returns {Promise<{data: any, error: any}>}
   */
  async createCompanheiroFiel(companheiroData) {
    const payload = sanitizarPayloadNpcMestre(companheiroData);
    const res = await supabase
      .from('npcs_mestre')
      .insert([payload])
      .select()
      .single();

    if (res.data) {
      return { ...res, data: normalizarNpcLeitura(res.data) };
    }
    return res;
  },

  /**
   * Obtém os dados de autenticação do usuário atual
   * @returns {Promise<any>}
   */
  async getAuthUser() {
    return await supabase.auth.getUser();
  }
};
