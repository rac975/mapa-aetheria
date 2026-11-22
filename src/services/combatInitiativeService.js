import { supabase } from './supabase.js';
import {
  sanitizarPayloadIniciativa,
  extrairIniciativaCombatente
} from '../domain/fabula/combatInitiativeRules.js';

/**
 * Service para operações de Iniciativa e Ordenação na Ordem de Combate.
 *
 * Regra Arquitetural (GEMINI.md):
 * É estritamente proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const combatInitiativeService = {
  /**
   * Atualiza a iniciativa de um participante de forma defensiva e resiliente.
   * Se a coluna 'iniciativa' não existir no banco remoto, persiste dentro do JSONB 'modificadores'.
   * @param {string|number} id
   * @param {number} valorIniciativa
   * @param {Object} modificadoresAtuais
   * @returns {Promise<{ data: any, error: any }>}
   */
  async atualizarIniciativa(id, valorIniciativa, modificadoresAtuais = {}) {
    const valNumerico = Math.floor(Number(valorIniciativa)) || 0;
    const modsAtualizados = {
      ...(modificadoresAtuais && typeof modificadoresAtuais === 'object' ? modificadoresAtuais : {}),
      iniciativa: valNumerico
    };

    const payload = sanitizarPayloadIniciativa({
      iniciativa: valNumerico,
      modificadores: modsAtualizados
    });

    const res = await supabase
      .from('iniciativa_combate')
      .update(payload)
      .eq('id', id);

    // Fallback: se a coluna 'iniciativa' não existir na tabela remota, persiste apenas modificadores
    if (res?.error && payload.iniciativa !== undefined) {
      console.warn('Fallback: coluna iniciativa ausente em iniciativa_combate; persistindo via modificadores.');
      return await supabase
        .from('iniciativa_combate')
        .update({ modificadores: modsAtualizados })
        .eq('id', id);
    }

    return res;
  },

  /**
   * Salva a nova ordem sequencial dos combatentes no banco após ordenação.
   * @param {Array<Object>} listaOrdenada
   */
  async salvarNovaOrdem(listaOrdenada = []) {
    for (let idx = 0; idx < listaOrdenada.length; idx++) {
      await supabase
        .from('iniciativa_combate')
        .update({ ordem: idx })
        .eq('id', listaOrdenada[idx].id);
    }
  },

  /**
   * Atualiza as multi-ações de um inimigo na rodada.
   * @param {string|number} id
   * @param {Object} updates
   */
  async atualizarAcoesInimigo(id, updates = {}) {
    const payload = sanitizarPayloadIniciativa(updates);
    return await supabase
      .from('iniciativa_combate')
      .update(payload)
      .eq('id', id);
  },

  /**
   * Helper para extrair iniciativa de combatente.
   */
  extrairIniciativa(combatente) {
    return extrairIniciativaCombatente(combatente);
  }
};
