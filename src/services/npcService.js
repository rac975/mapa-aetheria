import { supabase } from './supabase.js';

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
    return await supabase
      .from('npcs_mestre')
      .select('*');
  },

  /**
   * Busca um NPC por ID
   * @param {string|number} id 
   * @returns {Promise<{data: any, error: any}>}
   */
  async getNpcPorId(id) {
    return await supabase
      .from('npcs_mestre')
      .select('*')
      .eq('id', id)
      .single();
  },

  /**
   * Atualiza os dados de um NPC
   * @param {string|number} id 
   * @param {Object} npcData 
   * @returns {Promise<{data: any, error: any}>}
   */
  async updateNpc(id, npcData) {
    return await supabase
      .from('npcs_mestre')
      .update(npcData)
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
    return await supabase
      .from('npcs_mestre')
      .insert([npcData]);
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
    return await supabase
      .from('npcs_mestre')
      .select('*')
      .eq('personagem_id', personagemId)
      .eq('tipo_registro', 'companheiro')
      .maybeSingle();
  },

  /**
   * Cria um registro de companheiro fiel
   * @param {Object} companheiroData
   * @returns {Promise<{data: any, error: any}>}
   */
  async createCompanheiroFiel(companheiroData) {
    return await supabase
      .from('npcs_mestre')
      .insert([companheiroData])
      .select()
      .single();
  },

  /**
   * Obtém os dados de autenticação do usuário atual
   * @returns {Promise<any>}
   */
  async getAuthUser() {
    return await supabase.auth.getUser();
  }
};
