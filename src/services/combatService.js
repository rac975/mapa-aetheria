import { supabase } from './supabase.js';

/**
 * Service para persistência e tempo real de combate (Iniciativa, Participantes e Fichas)
 * 
 * Regra Arquitetural (GEMINI.md):
 * É estritamente proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const combatService = {
  /**
   * Busca todas as fichas de personagens para seleção no combate
   * @returns {Promise<{data: any, error: any}>}
   */
  async getFichasPersonagens() {
    return await supabase
      .from('fichas_personagens')
      .select('id, nome_personagem, hp_max, mp_max, pi_max, fabula, avatar_url, defesa, mdef');
  },

  /**
   * Busca a lista ordenada de participantes do combate atual
   * @returns {Promise<{data: any, error: any}>}
   */
  async getParticipantes() {
    return await supabase
      .from('iniciativa_combate')
      .select('*')
      .order('ordem', { ascending: true });
  },

  /**
   * Insere um novo combatente na tabela iniciativa_combate
   * @param {Object} combatente 
   * @returns {Promise<{data: any, error: any}>}
   */
  async addParticipante(combatente) {
    return await supabase
      .from('iniciativa_combate')
      .insert([combatente])
      .select();
  },

  /**
   * Atualiza campos de um combatente
   * @param {string|number} id 
   * @param {Object} updates 
   * @returns {Promise<{data: any, error: any}>}
   */
  async updateParticipante(id, updates) {
    return await supabase
      .from('iniciativa_combate')
      .update(updates)
      .eq('id', id);
  },

  /**
   * Remove um combatente da iniciativa
   * @param {string|number} id 
   * @returns {Promise<{data: any, error: any}>}
   */
  async deleteParticipante(id) {
    return await supabase
      .from('iniciativa_combate')
      .delete()
      .eq('id', id);
  },

  /**
   * Atualiza um campo de recurso da ficha do personagem sincronizada
   * @param {string|number} fichaId 
   * @param {string} campo 
   * @param {number} valor 
   * @returns {Promise<{data: any, error: any}>}
   */
  async updateRecursoFicha(fichaId, campo, valor) {
    let campoFicha = campo;
    if (campo === 'pontos_fabula') {
      campoFicha = 'fabula';
    }
    return await supabase
      .from('fichas_personagens')
      .update({ [campoFicha]: valor })
      .eq('id', fichaId);
  },

  /**
   * Reseta os turnos (agiu: false) para todos os IDs fornecidos
   * @param {Array<string|number>} ids 
   * @returns {Promise<void>}
   */
  async resetRodada(ids) {
    for (const id of ids) {
      await supabase
        .from('iniciativa_combate')
        .update({ agiu: false })
        .eq('id', id);
    }
  },

  /**
   * Restaura todos os participantes para HP/MP máximos e reseta turnos
   * @param {Array<Object>} participantes 
   * @returns {Promise<void>}
   */
  async restaurarCena(participantes) {
    for (const p of participantes) {
      await supabase
        .from('iniciativa_combate')
        .update({
          agiu: false,
          hp_atual: p.hp_max,
          mp_atual: p.mp_max
        })
        .eq('id', p.id);
    }
  },

  /**
   * Atualiza a ordem dos combatentes no banco
   * @param {Array<{id: string|number, ordem: number}>} listaOrdenada 
   * @returns {Promise<void>}
   */
  async salvarNovaOrdem(listaOrdenada) {
    for (let idx = 0; idx < listaOrdenada.length; idx++) {
      await supabase
        .from('iniciativa_combate')
        .update({ ordem: idx })
        .eq('id', listaOrdenada[idx].id);
    }
  },

  /**
   * Inscreve um callback para mudanças em tempo real na tabela iniciativa_combate
   * @param {() => void} onMudanca 
   * @returns {{unsubscribe: () => void}}
   */
  subscribeIniciativa(onMudanca) {
    const channelName = `realtime_iniciativa_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'iniciativa_combate' },
        () => {
          if (onMudanca) onMudanca();
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
