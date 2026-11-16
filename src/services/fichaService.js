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
   * Busca as magias da ficha com os detalhes do catálogo oficial de feitiços
   * @param {string|number} fichaId
   * @returns {Promise<Array<any>>}
   */
  async getMagiasComCatalogoByFichaId(fichaId) {
    const { data, error } = await supabase
      .from('fichas_magias')
      .select(`
        id,
        customizacoes,
        catalogo_feiticos (
          id,
          nome,
          classe,
          uso,
          ofensivo,
          pm_custo,
          pm_por_alvo,
          max_alvos,
          alvo,
          duracao,
          descricao
        )
      `)
      .eq('ficha_id', fichaId);

    if (error) {
      console.error('Erro ao buscar magias com catálogo da ficha:', error);
      return [];
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
   * Inscreve um callback para atualizações em tempo real em todas as fichas de personagens.
   * Permite que a visão do Mestre (MestreFichasPage) atualize automaticamente PV, PM e PI
   * sempre que qualquer jogador modificar sua ficha.
   * @param {Function} onUpdate
   * @returns {Object} subscription channel
   */
  subscribeFichasPersonagens(onUpdate) {
    const sufixo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelName = `realtime_todas_fichas_${sufixo}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fichas_personagens' },
        (payload) => {
          if (onUpdate) onUpdate(payload);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Inscreve um callback para atualizações em tempo real nas classes da ficha (fichas_classes).
   * Mantém sincronizadas terioformas, módulos e habilidades especiais.
   * @param {string|number} fichaId
   * @param {Function} onUpdate
   * @returns {Object} subscription channel
   */
  subscribeClasses(fichaId, onUpdate) {
    if (!fichaId) return null;
    const sufixo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelName = `realtime_classes_${fichaId}_${sufixo}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fichas_classes', filter: `ficha_id=eq.${fichaId}` },
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
  },

  /**
   * Adiciona um item ao inventário do personagem (ex: Tesouro da Alma do Ladino)
   * @param {Object} itemData
   * @returns {Promise<{data: any, error: any}>}
   */
  async addItemPersonagem(itemData) {
    return await supabase
      .from('itens_personagem')
      .insert([itemData]);
  },

  /**
   * Atualiza as classes de um personagem na tabela fichas_classes
   * @param {string|number} fichaId
   * @param {Array} classes
   * @returns {Promise<{data: any, error: any}>}
   */
  async atualizarClassesPersonagem(fichaId, classes = []) {
    if (!fichaId || !Array.isArray(classes)) return { data: null, error: null };
    try {
      const updates = classes.map(async (c) => {
        if (c.id) {
          return await supabase
            .from('fichas_classes')
            .update({
              nome_classe: c.nome_classe,
              nivel: c.nivel,
              beneficios: c.beneficios,
              habilidades: c.habilidades || []
            })
            .eq('id', c.id);
        }
        return null;
      });
      await Promise.all(updates);
      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao atualizar classes em fichas_classes:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca o catálogo completo de arcanos ordenados por nome
   * @returns {Promise<{data: any, error: any}>}
   */
  async getCatalogoArcanos() {
    return await supabase
      .from('catalogo_arcanos')
      .select('*')
      .order('nome', { ascending: true });
  },

  /**
   * Deleta itens do personagem por lista de IDs
   * @param {Array<string|number>} ids
   * @returns {Promise<{data: any, error: any}>}
   */
  async deletarItensPersonagemPorIds(ids) {
    return await supabase
      .from('itens_personagem')
      .delete()
      .in('id', ids);
  },

  /**
   * Busca feitiços do catálogo filtrando pelo nome da classe
   * @param {string} nomeClasse
   * @returns {Promise<{data: any, error: any}>}
   */
  async getCatalogoFeiticosPorClasse(nomeClasse) {
    return await supabase
      .from('catalogo_feiticos')
      .select('*')
      .ilike('classe', nomeClasse);
  },

  /**
   * Salva a configuração do veículo pessoal da classe Piloto no Supabase.
   * Padrão oficial do projeto: Atualiza o nó da habilidade "Veículo Pessoal" na tabela fichas_classes
   * (idêntico ao padrão de Engenhocas do Inventor e poderes do Arcanista).
   * @param {string|number} fichaId
   * @param {Object} configuracaoVeiculo { nome, frameKey, modulosReserva, modulosAtivos, veiculoInvocado, customizacoes }
   * @param {Array} [classes=[]] Lista de classes da ficha para sincronização
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarConfiguracaoVeiculo(fichaId, configuracaoVeiculo, classes = []) {
    if (!fichaId) {
      return { sucesso: false, error: new Error('fichaId é obrigatório para salvar veículo.') };
    }

    try {
      // 1. Atualizar em fichas_classes (localiza a linha da classe Piloto)
      const { data: classesData, error: errBusca } = await supabase
        .from('fichas_classes')
        .select('*')
        .eq('ficha_id', fichaId);

      if (errBusca) {
        throw errBusca;
      }

      if (classesData && classesData.length > 0) {
        const pilotoClass = classesData.find(c =>
          (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('pilot')
        );

        if (pilotoClass) {
          const habilidadesAtualizadas = (pilotoClass.habilidades || []).map(h => {
            const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (nomeHab.includes('veiculo pessoal') || nomeHab.includes('veiculo')) {
              return { ...h, veiculo: configuracaoVeiculo };
            }
            return h;
          });

          const temHabVeiculo = habilidadesAtualizadas.some(h =>
            (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('veiculo')
          );
          if (!temHabVeiculo) {
            habilidadesAtualizadas.push({
              nome: 'Veículo Pessoal',
              nivel: 1,
              veiculo: configuracaoVeiculo
            });
          }

          const { error: errUpdate } = await supabase
            .from('fichas_classes')
            .update({ habilidades: habilidadesAtualizadas })
            .eq('id', pilotoClass.id);

          if (errUpdate) throw errUpdate;
        }
      }

      // 2. Sincroniza em memória no array de classes se fornecido
      if (classes && classes.length > 0) {
        classes.forEach(c => {
          const norm = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (norm.includes('pilot')) {
            c.veiculo = configuracaoVeiculo;
            if (Array.isArray(c.habilidades)) {
              c.habilidades.forEach(h => {
                const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (nomeHab.includes('veiculo pessoal') || nomeHab.includes('veiculo')) {
                  h.veiculo = configuracaoVeiculo;
                }
              });
            }
          }
        });
      }

      return { sucesso: true };
    } catch (err) {
      console.error('Erro ao salvar configuração do veículo:', err);
      return { sucesso: false, error: err };
    }
  },

  /**
   * Salva os dados específicos da classe Esper no Supabase
   * Atualiza a tabela fichas_classes (anexando às habilidades do Esper, especialmente Dons Psíquicos)
   * @param {string|number} fichaId
   * @param {Object} dadosEsper
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosEsper(fichaId, dadosEsper, classes = []) {
    if (!fichaId) {
      return { sucesso: false, error: new Error('fichaId é obrigatório para salvar Esper.') };
    }

    try {
      const { data: classesData, error: errBusca } = await supabase
        .from('fichas_classes')
        .select('*')
        .eq('ficha_id', fichaId);

      if (errBusca) throw errBusca;

      if (classesData && classesData.length > 0) {
        const esperClass = classesData.find(c =>
          (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('esper')
        );

        if (esperClass) {
          let encontrouHabDons = false;
          const habilidadesAtualizadas = (esperClass.habilidades || []).map(h => {
            const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (nomeHab.includes('don') || nomeHab.includes('dadiva')) {
              encontrouHabDons = true;
              return {
                ...h,
                dons_aprendidos: Array.isArray(dadosEsper.donsAprendidos) ? dadosEsper.donsAprendidos : (h.dons_aprendidos || []),
                dados_esper: dadosEsper
              };
            }
            if (nomeHab.includes('foco') || nomeHab.includes('psicocinese') || nomeHab.includes('hipercognicao') || nomeHab.includes('navegador')) {
              return { ...h, dados_esper: dadosEsper };
            }
            return h;
          });

          if (!encontrouHabDons && Array.isArray(dadosEsper.donsAprendidos) && dadosEsper.donsAprendidos.length > 0) {
            habilidadesAtualizadas.push({
              nome: 'Dons Psíquicos',
              nivel: dadosEsper.donsAprendidos.length || 1,
              dons_aprendidos: dadosEsper.donsAprendidos,
              dados_esper: dadosEsper
            });
          }

          const { error: errUpdate } = await supabase
            .from('fichas_classes')
            .update({ habilidades: habilidadesAtualizadas })
            .eq('id', esperClass.id);

          if (errUpdate) throw errUpdate;
        }
      }

      // Sincroniza em memória no array de classes se fornecido
      if (classes && classes.length > 0) {
        classes.forEach(c => {
          const norm = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (norm.includes('esper')) {
            c.dados_esper = dadosEsper;
            if (Array.isArray(c.habilidades)) {
              let encontrou = false;
              c.habilidades.forEach(h => {
                const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (nomeHab.includes('don') || nomeHab.includes('dadiva')) {
                  encontrou = true;
                  h.dons_aprendidos = Array.isArray(dadosEsper.donsAprendidos) ? dadosEsper.donsAprendidos : (h.dons_aprendidos || []);
                  h.dados_esper = dadosEsper;
                }
              });
              if (!encontrou && Array.isArray(dadosEsper.donsAprendidos) && dadosEsper.donsAprendidos.length > 0) {
                c.habilidades.push({
                  nome: 'Dons Psíquicos',
                  nivel: dadosEsper.donsAprendidos.length || 1,
                  dons_aprendidos: dadosEsper.donsAprendidos,
                  dados_esper: dadosEsper
                });
              }
            }
          }
        });
      }

      return { sucesso: true };
    } catch (err) {
      console.error('Erro ao salvar dados do Esper:', err);
      return { sucesso: false, error: err };
    }
  },

  /**
   * Salva os dados específicos da classe Mutante no Supabase
   * Atualiza a tabela fichas_classes (anexando às habilidades do Mutante, especialmente Teriomorfose)
   * @param {string|number} fichaId
   * @param {Object} dadosMutante
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosMutante(fichaId, dadosMutante, classes = []) {
    if (!fichaId) {
      return { sucesso: false, error: new Error('fichaId é obrigatório para salvar Mutante.') };
    }

    try {
      const { data: classesData, error: errBusca } = await supabase
        .from('fichas_classes')
        .select('*')
        .eq('ficha_id', fichaId);

      if (errBusca) throw errBusca;

      if (classesData && classesData.length > 0) {
        const mutanteClass = classesData.find(c =>
          (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('mutant')
        );

        if (mutanteClass) {
          let encontrouHabTerio = false;
          const habilidadesAtualizadas = (mutanteClass.habilidades || []).map(h => {
            const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (nomeHab.includes('teriomorfose')) {
              encontrouHabTerio = true;
              return {
                ...h,
                terioformas_aprendidas: dadosMutante.terioformasAprendidas || h.terioformas_aprendidas || [],
                dados_mutante: dadosMutante
              };
            }
            if (nomeHab.includes('terioforma') || nomeHab.includes('acromorfose') || nomeHab.includes('biofag')) {
              return { ...h, dados_mutante: dadosMutante };
            }
            return h;
          });

          if (!encontrouHabTerio && dadosMutante.terioformasAprendidas) {
            habilidadesAtualizadas.push({
              nome: 'Teriomorfose',
              nivel: dadosMutante.terioformasAprendidas.length || 1,
              terioformas_aprendidas: dadosMutante.terioformasAprendidas,
              dados_mutante: dadosMutante
            });
          }

          const { error: errUpdate } = await supabase
            .from('fichas_classes')
            .update({ habilidades: habilidadesAtualizadas })
            .eq('id', mutanteClass.id);

          if (errUpdate) throw errUpdate;
        }
      }

      // Sincroniza em memória no array de classes se fornecido
      if (classes && classes.length > 0) {
        classes.forEach(c => {
          const norm = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (norm.includes('mutant')) {
            c.dados_mutante = dadosMutante;
            if (Array.isArray(c.habilidades)) {
              let encontrou = false;
              c.habilidades.forEach(h => {
                const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (nomeHab.includes('teriomorfose')) {
                  encontrou = true;
                  h.terioformas_aprendidas = dadosMutante.terioformasAprendidas || h.terioformas_aprendidas || [];
                  h.dados_mutante = dadosMutante;
                }
              });
              if (!encontrou && dadosMutante.terioformasAprendidas) {
                c.habilidades.push({
                  nome: 'Teriomorfose',
                  nivel: dadosMutante.terioformasAprendidas.length || 1,
                  terioformas_aprendidas: dadosMutante.terioformasAprendidas,
                  dados_mutante: dadosMutante
                });
              }
            }
          }
        });
      }

      return { sucesso: true };
    } catch (err) {
      console.error('Erro ao salvar dados do Mutante:', err);
      return { sucesso: false, error: err };
    }
  }
};
