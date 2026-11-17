import { supabase } from './supabase.js';

/**
 * Service para persistência e tempo real de combate (Iniciativa, Estado da Cena, Ações Rápidas, Relógios e Fichas).
 *
 * Regra Arquitetural (GEMINI.md):
 * É estritamente proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const combatService = {
  /**
   * Busca todas as fichas de personagens para seleção no combate.
   */
  async getFichasPersonagens() {
    return await supabase
      .from('fichas_personagens')
      .select('id, nome_personagem, hp_max, mp_max, pi_max, fabula, avatar_url, defesa, mdef');
  },

  /**
   * Busca a lista ordenada de participantes do combate atual.
   */
  async getParticipantes() {
    return await supabase
      .from('iniciativa_combate')
      .select('*')
      .order('ordem', { ascending: true });
  },

  /**
   * Insere um novo combatente na tabela iniciativa_combate.
   */
  async addParticipante(combatente) {
    return await supabase
      .from('iniciativa_combate')
      .insert([combatente])
      .select();
  },

  /**
   * Atualiza campos de um combatente.
   */
  async updateParticipante(id, updates) {
    return await supabase
      .from('iniciativa_combate')
      .update(updates)
      .eq('id', id);
  },

  /**
   * Remove um combatente da iniciativa.
   */
  async deleteParticipante(id) {
    return await supabase
      .from('iniciativa_combate')
      .delete()
      .eq('id', id);
  },

  /**
   * Define um combatente como o turno ativo atual, limpando o destaque dos demais.
   */
  async definirTurnoAtivo(participanteId, idsTodos = []) {
    for (const id of idsTodos) {
      await supabase
        .from('iniciativa_combate')
        .update({ turno_atual: id === participanteId })
        .eq('id', id);
    }
  },

  /**
   * Sincroniza HP/MP/IP/PF de um participante para sua ficha ligada em fichas_personagens.
   */
  async updateRecursoFicha(fichaId, campo, valor) {
    if (!fichaId) return { data: null, error: null };
    let campoFicha = campo;
    if (campo === 'pontos_fabula') campoFicha = 'fabula';
    if (campo === 'ip') campoFicha = 'pi_atual';

    return await supabase
      .from('fichas_personagens')
      .update({ [campoFicha]: valor })
      .eq('id', fichaId);
  },

  /**
   * Busca o estado global da cena de combate (rodada atual e modificadores).
   */
  async getEstadoCombate() {
    const { data, error } = await supabase
      .from('combate_estado')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && !data) {
      return await supabase
        .from('combate_estado')
        .upsert({ id: 1, rodada: 1, em_combate: true, modificadores_globais: {} })
        .select()
        .single();
    }
    return { data, error };
  },

  /**
   * Atualiza o estado global da cena de combate (rodada, modificadores globais).
   */
  async updateEstadoCombate(updates) {
    return await supabase
      .from('combate_estado')
      .upsert({
        id: 1,
        ...updates,
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();
  },

  /**
   * Busca os relógios ativos da cena para vinculação rápida a ações Objetivo.
   */
  async getRelogiosCombate() {
    return await supabase
      .from('relogios')
      .select('*')
      .order('criado_em', { ascending: true });
  },

  /**
   * Atualiza as fatias de um relógio diretamente a partir de uma ação de conflito.
   */
  async avancarRelogioCombate(relogioId, novasFatias) {
    return await supabase
      .from('relogios')
      .update({ fatias_atuais: novasFatias })
      .eq('id', relogioId)
      .select()
      .single();
  },

  /**
   * Busca as ações recentes do feed de combate em tempo real.
   */
  async getAcoesCombate(limit = 30) {
    return await supabase
      .from('combate_acoes')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limit);
  },

  /**
   * Registra uma nova ação rápida ou evento no feed em tempo real.
   */
  async registrarAcaoCombate(acao) {
    return await supabase
      .from('combate_acoes')
      .insert([acao])
      .select()
      .single();
  },

  /**
   * Limpa o histórico de ações rápidas da cena atual.
   */
  async limparAcoesCombate() {
    return await supabase
      .from('combate_acoes')
      .delete()
      .gte('id', 0);
  },

  /**
   * Reseta os turnos (agiu, guardando, protegendo_id, turno_atual) para todos os IDs e avança a rodada.
   */
  async resetRodada(ids, novaRodada = null) {
    for (const id of ids) {
      await supabase
        .from('iniciativa_combate')
        .update({
          agiu: false,
          guardando: false,
          protegendo_id: null,
          turno_atual: false
        })
        .eq('id', id);
    }
    if (novaRodada !== null) {
      await this.updateEstadoCombate({ rodada: novaRodada });
    }
  },

  /**
   * Restaura todos os participantes para HP/MP máximos, limpa turnos/condições e reinicia rodada = 1.
   */
  async restaurarCena(participantes) {
    for (const p of participantes) {
      await supabase
        .from('iniciativa_combate')
        .update({
          agiu: false,
          guardando: false,
          protegendo_id: null,
          turno_atual: false,
          dano_acumulado: 0,
          hp_atual: p.hp_max,
          mp_atual: p.mp_max,
          condicoes: [],
          modificadores: {}
        })
        .eq('id', p.id);
    }
    await this.updateEstadoCombate({ rodada: 1, modificadores_globais: {} });
  },

  /**
   * Atualiza a ordem dos combatentes no banco.
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
   * Inscreve em tempo real na tabela iniciativa_combate.
   */
  subscribeIniciativa(onMudanca) {
    const channelName = `realtime_iniciativa_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iniciativa_combate' }, () => {
        if (onMudanca) onMudanca();
      })
      .subscribe();

    return {
      unsubscribe: () => { supabase.removeChannel(channel); }
    };
  },

  /**
   * Inscreve em tempo real no estado global da cena (combate_estado) e relógios (relogios).
   */
  subscribeEstadoCombate(onEstadoMudanca, onRelogiosMudanca) {
    const channelName = `realtime_combate_estado_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combate_estado' }, (payload) => {
        if (onEstadoMudanca) onEstadoMudanca(payload.new || null);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relogios' }, () => {
        if (onRelogiosMudanca) onRelogiosMudanca();
      })
      .subscribe();

    return {
      unsubscribe: () => { supabase.removeChannel(channel); }
    };
  },

  /**
   * Inscreve em tempo real no feed de ações rápidas (combate_acoes).
   */
  subscribeAcoesCombate(onMudanca) {
    const channelName = `realtime_combate_acoes_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combate_acoes' }, () => {
        if (onMudanca) onMudanca();
      })
      .subscribe();

    return {
      unsubscribe: () => { supabase.removeChannel(channel); }
    };
  }
};
