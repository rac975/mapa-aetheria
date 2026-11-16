import { supabase } from './supabase.js';

/**
 * Service para operações com NPCs e Adversários (npcs_mestre)
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
  }
};
