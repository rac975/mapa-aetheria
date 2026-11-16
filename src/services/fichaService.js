import { supabase } from './supabase.js';

/**
 * Service para operações com fichas de personagens e itens associados.
 * Centraliza queries, mutações e inscrições em tempo real no Supabase.
 * Regra Arquitetural: Proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const fichaService = {
  /**
   * Busca todas as fichas com classes e itens para exibição pelo Mestre
   * @returns {Promise<Array<any>>}
   */
  async getFichasCompletasMestre() {
    const { data: fichasData, error } = await supabase
      .from('fichas_personagens')
      .select(`
        *,
        fichas_classes (
          nome_classe,
          nivel,
          habilidades
        )
      `)
      .order('nome_personagem', { ascending: true });

    if (error || !fichasData) {
      if (error) console.error('Erro ao buscar fichas:', error);
      return [];
    }

    const fichasCompletas = await Promise.all(
      fichasData.map(async (ficha) => {
        const { data: itensData } = await supabase
          .from('itens_personagem')
          .select('*')
          .eq('ficha_id', ficha.id);

        return {
          ...ficha,
          itens: itensData || []
        };
      })
    );

    return fichasCompletas;
  },

  /**
   * Busca os dados completos de uma ficha pelo ID ou pelo Token do Jogador
   * @param {Object} params
   * @param {string|number} [params.id]
   * @param {string} [params.token]
   * @returns {Promise<any>}
   */
  async getFichaByIdOrToken({ id, token }) {
    let query = supabase.from('fichas_personagens').select('*');

    if (id) {
      query = query.eq('id', id).single();
    } else if (token) {
      query = query.eq('jogador_token', token).single();
    } else {
      return null;
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar ficha:', error);
      throw error;
    }
    return data;
  },

  /**
   * Busca as classes vinculadas a uma ficha
   * @param {string|number} fichaId
   * @returns {Promise<Array<any>>}
   */
  async getClassesByFichaId(fichaId) {
    const { data, error } = await supabase
      .from('fichas_classes')
      .select('*')
      .eq('ficha_id', fichaId);

    if (error) {
      console.error('Erro ao buscar classes da ficha:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca as magias vinculadas a uma ficha
   * @param {string|number} fichaId
   * @returns {Promise<Array<any>>}
   */
  async getMagiasByFichaId(fichaId) {
    const { data, error } = await supabase
      .from('fichas_magias')
      .select('*')
      .eq('ficha_id', fichaId);

    if (error) {
      console.error('Erro ao buscar magias da ficha:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca os itens do inventário de uma ficha
   * @param {string|number} fichaId
   * @returns {Promise<Array<any>>}
   */
  async getItensByFichaId(fichaId) {
    const { data, error } = await supabase
      .from('itens_personagem')
      .select('*')
      .eq('ficha_id', fichaId);

    if (error) {
      console.error('Erro ao buscar itens do personagem:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca as condições ativas na iniciativa de combate para uma ficha
   * @param {string|number} fichaId
   * @returns {Promise<Array<string>>}
   */
  async getCondicoesCombate(fichaId) {
    const { data, error } = await supabase
      .from('iniciativa_combate')
      .select('condicoes')
      .eq('ficha_id', fichaId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar condições de combate:', error);
      return [];
    }
    return data?.condicoes || [];
  },

  /**
   * Busca o catálogo oficial de classes do Fabula Ultima
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoClasses() {
    const { data, error } = await supabase
      .from('catalogo_classes')
      .select('*')
      .order('nome_classe', { ascending: true });

    if (error) {
      console.error('Erro ao carregar catálogo de classes:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Atualiza a quantidade de zênites de uma ficha de personagem
   * @param {string|number} fichaId
   * @param {number} novoZenit
   * @returns {Promise<any>}
   */
  async atualizarZenit(fichaId, novoZenit) {
    const { data, error } = await supabase
      .from('fichas_personagens')
      .update({ zenit: novoZenit })
      .eq('id', fichaId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar zênites da ficha:', error);
      throw error;
    }
    return data;
  },

  /**
   * Atualiza campos de uma ficha de personagem
   * @param {string|number} fichaId
   * @param {Object} dados
   * @returns {Promise<any>}
   */
  async atualizarFicha(fichaId, dados) {
    const { data, error } = await supabase
      .from('fichas_personagens')
      .update(dados)
      .eq('id', fichaId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ficha:', error);
      throw error;
    }
    return data;
  },

  /**
   * Atualiza o status e slot de um item de equipamento do personagem
   * @param {string|number} itemId
   * @param {Object} dados { equipado, stats_personalizados }
   * @returns {Promise<any>}
   */
  async atualizarItemPersonagem(itemId, dados) {
    const { data, error } = await supabase
      .from('itens_personagem')
      .update(dados)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar item de personagem:', error);
      throw error;
    }
    return data;
  },

  /**
   * Remove um item do inventário do personagem
   * @param {string|number} itemId
   * @returns {Promise<any>}
   */
  async deletarItemPersonagem(itemId) {
    const { data, error } = await supabase
      .from('itens_personagem')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao deletar item de personagem:', error);
      throw error;
    }
    return data;
  },

  /**
   * Salva todas as classes e magias de uma ficha em substituição às anteriores
   * @param {string|number} fichaId
   * @param {Array} classes
   * @param {Array} magias
   */
  async salvarClassesEMagias(fichaId, classes = [], magias = []) {
    await supabase.from('fichas_classes').delete().eq('ficha_id', fichaId);
    if (classes.length > 0) {
      const classesParaInserir = classes.map(c => ({
        ficha_id: fichaId,
        nome_classe: c.nome_classe,
        nivel: c.nivel,
        beneficios: c.beneficios,
        habilidades: c.habilidades || []
      }));
      const { error: errClasses } = await supabase.from('fichas_classes').insert(classesParaInserir);
      if (errClasses) throw errClasses;
    }

    await supabase.from('fichas_magias').delete().eq('ficha_id', fichaId);
    if (magias.length > 0) {
      const magiasParaInserir = magias.map(m => ({
        ficha_id: fichaId,
        nome: m.nome,
        custo_mp: m.custo_mp,
        alvos: m.alvos,
        duracao: m.duracao,
        descricao: m.descricao
      }));
      const { error: errMagias } = await supabase.from('fichas_magias').insert(magiasParaInserir);
      if (errMagias) throw errMagias;
    }
  },

  /**
   * Inscreve um callback para atualizações em tempo real nos itens do personagem.
   * Cria um canal com identificador único para evitar conflitos de re-inscrição do Supabase.
   * @param {string|number} fichaId
   * @param {Function} onUpdate
   * @returns {Object} subscription channel
   */
  subscribeItens(fichaId, onUpdate) {
    const sufixo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelName = `realtime_equip_${fichaId}_${sufixo}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itens_personagem', filter: `ficha_id=eq.${fichaId}` },
        () => {
          if (onUpdate) onUpdate();
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Inscreve um callback para atualizações em tempo real nas condições de combate da ficha.
   * Cria um canal com identificador único para evitar conflitos de re-inscrição do Supabase.
   * @param {string|number} fichaId
   * @param {Function} onUpdate
   * @returns {Object} subscription channel
   */
  subscribeCondicoesCombate(fichaId, onUpdate) {
    const sufixo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelName = `ficha_condicoes_${fichaId}_${sufixo}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'iniciativa_combate', filter: `ficha_id=eq.${fichaId}` },
        (payload) => {
          if (onUpdate) onUpdate(payload);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Remove com segurança uma inscrição de canal do Supabase
   * @param {Object} channel
   */
  removeChannel(channel) {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error('Erro ao remover canal:', err);
      }
    }
  },

  /**
   * Cria uma nova ficha de personagem / emite crachá
   * @param {Object} ficha
   * @returns {Promise<{data: any, error: any}>}
   */
  async criarFicha(ficha) {
    return await supabase
      .from('fichas_personagens')
      .insert([ficha]);
  },

  /**
   * Remove uma ficha pelo ID
   * @param {string|number} id
   * @returns {Promise<{data: any, error: any}>}
   */
  async deletarFicha(id) {
    return await supabase
      .from('fichas_personagens')
      .delete()
      .eq('id', id);
  }
};
