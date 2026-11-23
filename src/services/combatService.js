import { supabase } from './supabase.js';
import { sanitizarPayloadIniciativa } from '../domain/fabula/combatRules.js';
import { sanitizarPayloadNpcMestre, normalizarNpcLeitura } from '../domain/fabula/npcRules.js';
import { calcularStatusPersonagem } from '../utils/calculosFicha.js';
import { sanitizarPayloadFicha } from '../domain/fabula/characterProgression.js';

export { sanitizarPayloadIniciativa };

/**
 * Service para persistência e tempo real de combate (Iniciativa, Estado da Cena, Ações Rápidas, Relógios e Fichas).
 *
 * Regra Arquitetural (GEMINI.md):
 * É estritamente proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const combatService = {
  /**
   * Busca todas as fichas de personagens completas (atributos, classes, itens e magias)
   * para seleção e rolagem de dados integrada no combate.
   */
  async getFichasPersonagens() {
    const [fichasRes, itensRes, magiasRes] = await Promise.all([
      supabase
        .from('fichas_personagens')
        .select(`
          *,
          fichas_classes (
            nome_classe,
            nivel,
            beneficios,
            habilidades,
            dados_floralista,
            dados_gourmet,
            dados_invocador,
            dados_mercador
          )
        `)
        .order('nome_personagem', { ascending: true }),
      supabase.from('itens_personagem').select('*'),
      supabase.from('fichas_magias').select('*')
    ]);

    if (fichasRes.error || !fichasRes.data) {
      return await supabase
        .from('fichas_personagens')
        .select('*')
        .order('nome_personagem', { ascending: true });
    }

    const todosItens = itensRes.data || [];
    const todasMagias = magiasRes.data || [];

    const dataEnriquecida = fichasRes.data.map((ficha) => {
      const itensFicha = todosItens.filter((i) => String(i.ficha_id) === String(ficha.id));
      const magiasFicha = todasMagias.filter((m) => String(m.ficha_id) === String(ficha.id));
      const classesFicha = ficha.fichas_classes || [];
      const itensEquipados = itensFicha.filter((i) => i.equipado || i.stats_personalizados?.slot);

      let statusCalc = null;
      try {
        statusCalc = calcularStatusPersonagem(
          {
            destreza: ficha.destreza,
            astucia: ficha.astucia,
            vigor: ficha.vigor || 8,
            vontade: ficha.vontade || 8,
            poderes_heroicos: ficha.poderes_heroicos
          },
          classesFicha,
          itensEquipados,
          ficha
        );
      } catch (err) {
        console.warn('Erro ao calcular status da ficha no combate:', err);
      }

      return {
        ...ficha,
        classes: classesFicha,
        itens: itensFicha,
        magias: magiasFicha,
        defesa: statusCalc?.defesaTotal ?? ficha.destreza ?? 10,
        mdef: statusCalc?.mdefTotal ?? ficha.astucia ?? 10,
        hp_max: statusCalc?.pvMax ?? ficha.hp_max ?? 40,
        mp_max: statusCalc?.mpMax ?? ficha.mp_max ?? 40,
        pi_max: statusCalc?.piMax ?? ficha.pi_max ?? 6,
        iniciativa: statusCalc?.iniciativaTotal ?? 0,
        statusCalculados: statusCalc
      };
    });

    return { data: dataEnriquecida, error: null };
  },

  /**
   * Busca todos os NPCs/adversários do catálogo do Mestre e companheiros fiéis para combate e rolagem de dados.
   */
  async getNpcsCombate() {
    const res = await supabase
      .from('npcs_mestre')
      .select('*')
      .in('tipo_registro', ['npc_mestre', 'companheiro'])
      .order('created_at', { ascending: false });

    if (res.data && Array.isArray(res.data)) {
      return { ...res, data: res.data.map(normalizarNpcLeitura) };
    }
    return res;
  },

  /**
   * Busca especificamente os NPCs do tipo Companheiro Fiel associados a heróis.
   */
  async getCompanheirosFieis() {
    const res = await supabase
      .from('npcs_mestre')
      .select('*')
      .eq('tipo_registro', 'companheiro');

    if (res.data && Array.isArray(res.data)) {
      return { ...res, data: res.data.map(normalizarNpcLeitura) };
    }
    return res;
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
    const payloadSanitizado = sanitizarPayloadIniciativa(combatente);
    return await supabase
      .from('iniciativa_combate')
      .insert([payloadSanitizado])
      .select();
  },

  /**
   * Atualiza campos de um combatente.
   */
  async updateParticipante(id, updates) {
    const payloadSanitizado = sanitizarPayloadIniciativa(updates);
    return await supabase
      .from('iniciativa_combate')
      .update(payloadSanitizado)
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
   * Se o campo for 'condicoes', sincroniza com a tabela iniciativa_combate.
   */
  async updateRecursoFicha(fichaId, campo, valor) {
    if (!fichaId) return { data: null, error: null };

    if (campo === 'condicoes') {
      return await this.updateIniciativaFromFicha(fichaId, { condicoes: valor });
    }

    const payloadBruto = { [campo]: valor };
    const payloadFicha = sanitizarPayloadFicha(payloadBruto, { incluirId: false });
    if (Object.keys(payloadFicha).length === 0) return { data: null, error: null };

    const { data, error } = await supabase
      .from('fichas_personagens')
      .update(payloadFicha)
      .eq('id', fichaId);

    if (error) {
      console.error('Erro ao atualizar recurso da ficha em combatService:', {
        code: error.code,
        message: error.message,
        details: error.details,
        fichaId,
        payloadFicha
      });
    }
    return { data, error };
  },

  /**
   * Sincroniza um conjunto de recursos (PV, PM, PI, Fábula) de um herói
   * de volta para sua ficha original na tabela fichas_personagens.
   * Se houver condições, sincroniza na tabela iniciativa_combate.
   */
  async updateFichaPersonagemFromCombat(fichaId, updates = {}) {
    if (!fichaId) return { data: null, error: null };

    if (updates.condicoes !== undefined) {
      await this.updateIniciativaFromFicha(fichaId, { condicoes: updates.condicoes });
    }

    const payloadFicha = sanitizarPayloadFicha(updates, { incluirId: false });
    if (Object.keys(payloadFicha).length === 0) return { data: null, error: null };

    const { data, error } = await supabase
      .from('fichas_personagens')
      .update(payloadFicha)
      .eq('id', fichaId);

    if (error) {
      console.error('Erro ao sincronizar combate com ficha em combatService:', {
        code: error.code,
        message: error.message,
        details: error.details,
        fichaId,
        payloadFicha
      });
    }
    return { data, error };
  },

  /**
   * Sincroniza dados atualizados da ficha (fichas_personagens) para a linha de iniciativa_combate.
   */
  async updateIniciativaFromFicha(fichaId, updates = {}) {
    if (!fichaId) return { data: null, error: null };
    const payloadIniciativa = {};

    if (updates.hp_atual !== undefined) {
      const n = Number(updates.hp_atual);
      if (Number.isFinite(n)) payloadIniciativa.hp_atual = Math.floor(n);
    }
    if (updates.hp_max !== undefined) {
      const n = Number(updates.hp_max);
      if (Number.isFinite(n)) payloadIniciativa.hp_max = Math.floor(n);
    }
    if (updates.mp_atual !== undefined) {
      const n = Number(updates.mp_atual);
      if (Number.isFinite(n)) payloadIniciativa.mp_atual = Math.floor(n);
    }
    if (updates.mp_max !== undefined) {
      const n = Number(updates.mp_max);
      if (Number.isFinite(n)) payloadIniciativa.mp_max = Math.floor(n);
    }
    if (updates.pi_atual !== undefined) {
      const n = Number(updates.pi_atual);
      if (Number.isFinite(n)) payloadIniciativa.ip = Math.floor(n);
    } else if (updates.ip !== undefined) {
      const n = Number(updates.ip);
      if (Number.isFinite(n)) payloadIniciativa.ip = Math.floor(n);
    }
    if (updates.fabula !== undefined) {
      const n = Number(updates.fabula);
      if (Number.isFinite(n)) payloadIniciativa.pontos_fabula = Math.floor(n);
    } else if (updates.pontos_fabula !== undefined) {
      const n = Number(updates.pontos_fabula);
      if (Number.isFinite(n)) payloadIniciativa.pontos_fabula = Math.floor(n);
    }
    if (updates.condicoes !== undefined) {
      payloadIniciativa.condicoes = Array.isArray(updates.condicoes) ? updates.condicoes : [];
    }

    if (Object.keys(payloadIniciativa).length === 0) return { data: null, error: null };

    const { data, error } = await supabase
      .from('iniciativa_combate')
      .update(payloadIniciativa)
      .eq('ficha_id', fichaId);

    if (error) {
      console.error('Erro ao sincronizar iniciativa_combate a partir da ficha:', {
        code: error.code,
        message: error.message,
        details: error.details,
        fichaId,
        payloadIniciativa
      });
    }
    return { data, error };
  },

  /**
   * Sincroniza atributos táticos (PV, PM, Pontos de Vilão, Fase Atual) de um NPC em combate
   * de volta para sua ficha original na tabela npcs_mestre.
   */
  async updateNpcMestreFromCombat(npcId, updates = {}) {
    if (!npcId) return { data: null, error: null };
    const payload = sanitizarPayloadNpcMestre(updates, { preservarId: false });

    if (Object.keys(payload).length === 0) return { data: null, error: null };

    return await supabase
      .from('npcs_mestre')
      .update(payload)
      .eq('id', npcId);
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
   * Reseta os turnos (agiu, guardando, protegendo_id, turno_atual e contador de multi-ações) para todos os combatentes e avança a rodada.
   */
  async resetRodada(participantesOuIds = [], novaRodada = null) {
    for (const item of participantesOuIds) {
      const id = typeof item === 'object' ? item.id : item;
      const modsBase = (typeof item === 'object' && item.modificadores && typeof item.modificadores === 'object')
        ? { ...item.modificadores, acoes_realizadas_rodada: 0 }
        : undefined;

      const updatePayload = {
        agiu: false,
        guardando: false,
        protegendo_id: null,
        turno_atual: false
      };
      if (modsBase) updatePayload.modificadores = modsBase;

      await supabase
        .from('iniciativa_combate')
        .update(updatePayload)
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
   * Busca todos os relógios de perigo/eventos ordenados por ID
   */
  async getRelogios() {
    return await supabase
      .from('relogios')
      .select('*')
      .order('id', { ascending: true });
  },

  /**
   * Cria um novo relógio na tabela relogios
   */
  async criarRelogio(dados) {
    return await supabase
      .from('relogios')
      .insert([{
        titulo: dados.titulo,
        fatias_total: Number(dados.fatias_total) || 4,
        fatias_atuais: Number(dados.fatias_atuais) || 0,
        visivel: dados.visivel !== false
      }])
      .select();
  },

  /**
   * Atualiza as fatias atuais ou visibilidade de um relógio
   */
  async atualizarRelogio(id, updates) {
    return await supabase
      .from('relogios')
      .update(updates)
      .eq('id', id);
  },

  /**
   * Remove um relógio pelo ID
   */
  async excluirRelogio(id) {
    return await supabase
      .from('relogios')
      .delete()
      .eq('id', id);
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
  },

  /**
   * Inscreve callback para alterações em tempo real na tabela relogios
   */
  subscribeRelogios(onMudanca) {
    const channelName = `realtime_relogios_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relogios' },
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
  },

  /**
   * Inscreve em tempo real para alterações na tabela fichas_personagens,
   * permitindo sincronização bidirecional entre fichas e iniciativa de combate.
   */
  subscribeFichasPersonagens(onMudanca) {
    const channelName = `realtime_combate_fichas_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fichas_personagens' }, (payload) => {
        if (onMudanca) onMudanca(payload);
      })
      .subscribe();

    return {
      unsubscribe: () => { supabase.removeChannel(channel); }
    };
  }
};