import { supabase } from './supabase.js';
import {
  sanitizarPayloadFicha,
  normalizarFichaPersonagem
} from '../domain/fabula/characterProgression.js';
import {
  extrairArcanosVinculados,
  sincronizarArcanosNaHabilidade,
  extrairMagiasQuimerista,
  extrairAtributoQuimerista,
  sincronizarQuimeristaNaHabilidade
} from '../domain/fabula/coreClassRules.js';

export { sanitizarPayloadFicha, normalizarFichaPersonagem };

/**
 * Service para operações com fichas de personagens e itens associados.
 * Centraliza queries, mutações e inscrições em tempo real no Supabase.
 * Regra Arquitetural: Proibido chamar supabase.from() ou supabase.channel() fora de src/services/.
 */
export const fichaService = {
  _catalogoPoderesCache: null,
  _catalogoPeculiaridadesCache: null,
  _catalogoDonsPsiquicosCache: null,
  _catalogoTerioformasCache: null,
  _catalogoVeiculosEstruturasCache: null,
  _catalogoVeiculosModulosCache: null,
  _catalogoVirtuosoEscalasCache: null,
  _catalogoVirtuosoTonsCache: null,
  _catalogoDancasCache: null,
  _catalogoSimbolosCache: null,
  _catalogoFloralistaMagiseedsCache: null,
  _catalogoGourmetCache: null,
  _catalogoInvocadorElementaisCache: null,
  _catalogoMercadorItensCache: null,

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

        return normalizarFichaPersonagem({
          ...ficha,
          itens: itensData || []
        });
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
      query = query.eq('id', id).maybeSingle();
    } else if (token) {
      const tokenLimpo = String(token).trim().toUpperCase();
      query = query.ilike('jogador_token', tokenLimpo).maybeSingle();
    } else {
      return null;
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar ficha:', error);
      throw error;
    }
    return data ? normalizarFichaPersonagem(data) : null;
  },

  /**
   * Busca o ID da primeira ficha disponível na mesa (auxiliar para o God Mode do Mestre)
   * @returns {Promise<string|number|null>}
   */
  async getPrimeiraFichaId() {
    const { data, error } = await supabase
      .from('fichas_personagens')
      .select('id')
      .order('nome_personagem', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  },

  /**
   * Valida e busca ficha para autenticação do jogador por Token ou ID (QR Code)
   * @param {Object} params
   * @param {string} [params.token]
   * @param {string|number} [params.id]
   * @returns {Promise<any>}
   */
  async getFichaParaIdentificacao({ token, id }) {
    let query = supabase
      .from('fichas_personagens')
      .select('id, jogador_token, nome_personagem');

    if (token) {
      const tokenLimpo = String(token).trim().toUpperCase();
      query = query.ilike('jogador_token', tokenLimpo);
    } else if (id) {
      query = query.eq('id', id);
    } else {
      return null;
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data || null;
  },

  /**
   * Atualiza/rotaciona o token de crachá de uma ficha específica
   * @param {string|number} fichaId
   * @param {string} novoToken
   * @returns {Promise<any>}
   */
  async rotacionarTokenFicha(fichaId, novoToken) {
    const tokenLimpo = String(novoToken || '').trim().toUpperCase();
    return await this.atualizarFicha(fichaId, { jogador_token: tokenLimpo });
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
    return (data || []).map((c) => {
      const normClasse = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (normClasse.includes('arcanista')) {
        const arcanos = extrairArcanosVinculados(c);
        const arcanoPrincipal = arcanos[0] || null;
        const habsSincronizadas = sincronizarArcanosNaHabilidade(c.habilidades, arcanos);
        return {
          ...c,
          habilidades: habsSincronizadas,
          arcanos_vinculados: arcanos,
          arcano_vinculado: arcanoPrincipal
        };
      }
      if (normClasse.includes('quimerista')) {
        const magias = extrairMagiasQuimerista(c);
        const attr = extrairAtributoQuimerista(c);
        const habsSincronizadas = sincronizarQuimeristaNaHabilidade(c.habilidades, {
          magias_imitadas: magias,
          atributo_quimerista: attr
        });
        return {
          ...c,
          habilidades: habsSincronizadas,
          magias_imitadas: magias,
          atributo_quimerista: attr,
          dados_quimerista: { magias_imitadas: magias, atributo_quimerista: attr }
        };
      }
      return c;
    });
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
    const payloadSanitizado = sanitizarPayloadFicha(dados);
    const { data, error } = await supabase
      .from('fichas_personagens')
      .update(payloadSanitizado)
      .eq('id', fichaId)
      .select()
      .single();

    if (error) {
      // Fallback caso alguma coluna opcional JSONB (ex: peculiaridade) ainda não exista no schema do banco
      if (error.code === 'PGRST204' && payloadSanitizado && typeof payloadSanitizado === 'object') {
        const dadosCompat = { ...payloadSanitizado };
        delete dadosCompat.peculiaridade;
        const retry = await supabase
          .from('fichas_personagens')
          .update(dadosCompat)
          .eq('id', fichaId)
          .select()
          .single();

        if (!retry.error) {
          return normalizarFichaPersonagem(retry.data);
        }
      }
      console.error('Erro ao atualizar ficha:', error);
      throw error;
    }
    return normalizarFichaPersonagem(data);
  },

  /**
   * Salva a lista de Poderes Heróicos adquiridos na tabela fichas_personagens
   * @param {string|number} fichaId
   * @param {Array} poderesHeroicos
   * @returns {Promise<any>}
   */
  async salvarPoderesHeroicos(fichaId, poderesHeroicos = []) {
    if (!fichaId) throw new Error('fichaId é obrigatório para salvar Poderes Heróicos.');
    const listaNormalizada = Array.isArray(poderesHeroicos) ? poderesHeroicos : [];
    return await this.atualizarFicha(fichaId, {
      poderes_heroicos: listaNormalizada
    });
  },

  /**
   * Salva os dados de Peculiaridade (Quirk) na tabela fichas_personagens
   * mantendo compatibilidade com titulo_pecularidade e descricao_pecularidade
   * @param {string|number} fichaId
   * @param {Object} dadosPeculiaridade
   * @returns {Promise<any>}
   */
  async salvarPeculiaridade(fichaId, dadosPeculiaridade = {}) {
    if (!fichaId) throw new Error('fichaId é obrigatório para salvar Peculiaridade.');
    const payload = {
      titulo_pecularidade: dadosPeculiaridade.titulo_pecularidade || '',
      descricao_pecularidade: dadosPeculiaridade.descricao_pecularidade || ''
    };
    if (dadosPeculiaridade.peculiaridade !== undefined) {
      payload.peculiaridade = dadosPeculiaridade.peculiaridade;
    }
    return await this.atualizarFicha(fichaId, payload);
  },

  /**
   * Busca o catálogo oficial de Poderes Heróicos diretamente da tabela catalogo_poderes_heroicos
   * @param {string} [fonte] Filtro opcional por manual/fonte
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoPoderesHeroicos(fonte = null) {
    if (!this._catalogoPoderesCache) {
      const { data, error } = await supabase
        .from('catalogo_poderes_heroicos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar catalogo_poderes_heroicos no Supabase:', error);
        throw error;
      }
      this._catalogoPoderesCache = data || [];
    }

    if (fonte) {
      return this._catalogoPoderesCache.filter((p) => p.fonte === fonte);
    }
    return this._catalogoPoderesCache;
  },

  /**
   * Busca o catálogo oficial de Peculiaridades diretamente da tabela catalogo_peculiaridades
   * @param {string} [categoria] Filtro opcional por categoria ou fonte
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoPeculiaridades(categoria = null) {
    if (!this._catalogoPeculiaridadesCache) {
      const { data, error } = await supabase
        .from('catalogo_peculiaridades')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar catalogo_peculiaridades no Supabase:', error);
        throw error;
      }
      this._catalogoPeculiaridadesCache = data || [];
    }

    if (categoria && categoria !== 'todas') {
      return this._catalogoPeculiaridadesCache.filter(
        (q) => q.categoria === categoria || q.fonte === categoria
      );
    }
    return this._catalogoPeculiaridadesCache;
  },

  /**
   * Busca o catálogo oficial de Dons Psíquicos (Esper) diretamente da tabela catalogo_dons_psiquicos
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoDonsPsiquicos() {
    if (!this._catalogoDonsPsiquicosCache) {
      const { data, error } = await supabase
        .from('catalogo_dons_psiquicos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar catalogo_dons_psiquicos no Supabase:', error);
        throw error;
      }
      this._catalogoDonsPsiquicosCache = data || [];
    }
    return this._catalogoDonsPsiquicosCache;
  },

  /**
   * Busca o catálogo oficial de Terioformas (Mutante) diretamente da tabela catalogo_terioformas
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoTerioformas() {
    if (!this._catalogoTerioformasCache) {
      const { data, error } = await supabase
        .from('catalogo_terioformas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar catalogo_terioformas no Supabase:', error);
        throw error;
      }
      this._catalogoTerioformasCache = data || [];
    }
    return this._catalogoTerioformasCache;
  },

  /**
   * Busca o catálogo oficial de Estruturas de Veículo (Piloto) diretamente da tabela catalogo_veiculos_estruturas
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoVeiculosEstruturas() {
    if (!this._catalogoVeiculosEstruturasCache) {
      const { data, error } = await supabase
        .from('catalogo_veiculos_estruturas')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Erro ao buscar catalogo_veiculos_estruturas no Supabase:', error);
        throw error;
      }
      this._catalogoVeiculosEstruturasCache = data || [];
    }
    return this._catalogoVeiculosEstruturasCache;
  },

  /**
   * Busca o catálogo oficial de Módulos de Veículo (Piloto) diretamente da tabela catalogo_veiculos_modulos
   * @param {string} [tipo] Filtro opcional por tipo ('armadura', 'arma', 'escudo', 'suporte')
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoVeiculosModulos(tipo = null) {
    if (!this._catalogoVeiculosModulosCache) {
      const { data, error } = await supabase
        .from('catalogo_veiculos_modulos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar catalogo_veiculos_modulos no Supabase:', error);
        throw error;
      }
      this._catalogoVeiculosModulosCache = data || [];
    }

    if (tipo && tipo !== 'todos') {
      return this._catalogoVeiculosModulosCache.filter((m) => m.tipo === tipo);
    }
    return this._catalogoVeiculosModulosCache;
  },

  /**
   * Auxiliar interno para carregar e armazenar em cache catálogos públicos do Supabase.
   * @param {string} cacheKey
   * @param {string} tabela
   * @param {string} [ordem='nome']
   * @returns {Promise<Array<any>>}
   */
  async _carregarCatalogoComCache(cacheKey, tabela, ordem = 'nome') {
    if (!this[cacheKey]) {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .order(ordem, { ascending: true });

      if (error) {
        console.error(`Erro ao buscar ${tabela} no Supabase:`, error);
        throw error;
      }
      this[cacheKey] = data || [];
    }
    return this[cacheKey];
  },

  /**
   * Busca o catálogo oficial de Escalas/Chaves (Virtuoso/Cantor) diretamente da tabela catalogo_virtuoso_escalas
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoVirtuosoEscalas() {
    return this._carregarCatalogoComCache('_catalogoVirtuosoEscalasCache', 'catalogo_virtuoso_escalas', 'id');
  },

  /**
   * Busca o catálogo oficial de Tons (Virtuoso/Cantor) diretamente da tabela catalogo_virtuoso_tons
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoVirtuosoTons() {
    return this._carregarCatalogoComCache('_catalogoVirtuosoTonsCache', 'catalogo_virtuoso_tons', 'id');
  },

  /**
   * Busca o catálogo oficial de Danças (Dançarino) diretamente da tabela catalogo_dancas
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoDancas() {
    return this._carregarCatalogoComCache('_catalogoDancasCache', 'catalogo_dancas', 'nome');
  },

  /**
   * Busca o catálogo oficial de Símbolos / Sigilos (Simbolista) diretamente da tabela catalogo_simbolista_simbolos
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoSimbolos() {
    return this._carregarCatalogoComCache('_catalogoSimbolosCache', 'catalogo_simbolista_simbolos', 'nome');
  },

  /**
   * Busca o catálogo oficial de Magissementes (Floralista) diretamente da tabela catalogo_floralista_magiseeds
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoFloralistaMagiseeds() {
    return this._carregarCatalogoComCache('_catalogoFloralistaMagiseedsCache', 'catalogo_floralista_magiseeds', 'nome');
  },

  /**
   * Busca o catálogo oficial de Sabores, Ingredientes e Efeitos de Iguaria (Gourmet) da tabela catalogo_gourmet_ingredientes_receitas
   * @param {string|null} [categoria=null] Filtro opcional ('sabor', 'efeito_iguaria', 'especialidade_casa', 'ingrediente_exemplo')
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoGourmetIngredientesReceitas(categoria = null) {
    const lista = await this._carregarCatalogoComCache(
      '_catalogoGourmetCache',
      'catalogo_gourmet_ingredientes_receitas',
      'id'
    );
    if (categoria && categoria !== 'todas') {
      return lista.filter((item) => item.categoria === categoria);
    }
    return lista;
  },

  /**
   * Busca o catálogo oficial de Mananciais e Invocações Elementais (Invocador) da tabela catalogo_invocador_elementais
   * @param {string|null} [manancialKey=null] Filtro opcional ('ar', 'terra', 'fogo', 'raio', 'agua')
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoInvocadorElementais(manancialKey = null) {
    const lista = await this._carregarCatalogoComCache(
      '_catalogoInvocadorElementaisCache',
      'catalogo_invocador_elementais',
      'id'
    );
    if (manancialKey && manancialKey !== 'todos') {
      return lista.filter((item) => item.manancial_key === manancialKey);
    }
    return lista;
  },

  /**
   * Busca o catálogo oficial de Usos de Pontos de Comércio, Prosperidade e Itens Raros (Mercador) da tabela catalogo_mercador_itens
   * @param {string|null} [categoria=null] Filtro opcional ('uso_comercio', 'prosperidade', 'equipamento_raro')
   * @returns {Promise<Array<any>>}
   */
  async getCatalogoMercadorItens(categoria = null) {
    const lista = await this._carregarCatalogoComCache(
      '_catalogoMercadorItensCache',
      'catalogo_mercador_itens',
      'id'
    );
    if (categoria && categoria !== 'todas') {
      return lista.filter((item) => item.categoria === categoria);
    }
    return lista;
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
      const classesParaInserir = classes.map((c) => {
        let habs = Array.isArray(c.habilidades) ? [...c.habilidades] : [];
        const normClasse = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normClasse.includes('arcanista')) {
          const arcanos = extrairArcanosVinculados(c);
          habs = sincronizarArcanosNaHabilidade(habs, arcanos);
        }
        if (normClasse.includes('quimerista')) {
          const magias = extrairMagiasQuimerista(c);
          const attr = extrairAtributoQuimerista(c);
          habs = sincronizarQuimeristaNaHabilidade(habs, {
            magias_imitadas: magias,
            atributo_quimerista: attr
          });
        }
        return {
          ficha_id: fichaId,
          nome_classe: c.nome_classe,
          nivel: c.nivel,
          beneficios: c.beneficios,
          habilidades: habs,
          dados_floralista: c.dados_floralista || {},
          dados_gourmet: c.dados_gourmet || {},
          dados_invocador: c.dados_invocador || {},
          dados_mercador: c.dados_mercador || {}
        };
      });
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
          if (payload?.new) {
            payload.new = normalizarFichaPersonagem(payload.new);
          }
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
          if (payload?.new) {
            payload.new = normalizarFichaPersonagem(payload.new);
          }
          if (onUpdate) onUpdate(payload);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Inscreve um callback para atualizações em tempo real de uma ficha específica (fichas_personagens).
   * @param {string|number} fichaId
   * @param {Function} onUpdate
   * @returns {Object|null} subscription channel
   */
  subscribeFichaById(fichaId, onUpdate) {
    if (!fichaId) return null;
    const sufixo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelName = `realtime_ficha_unica_${fichaId}_${sufixo}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fichas_personagens', filter: `id=eq.${fichaId}` },
        (payload) => {
          if (payload?.new) {
            payload.new = normalizarFichaPersonagem(payload.new);
          }
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
          if (payload?.new) {
            payload.new = normalizarFichaPersonagem(payload.new);
          }
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
    const payloadSanitizado = sanitizarPayloadFicha(ficha);
    return await supabase
      .from('fichas_personagens')
      .insert([payloadSanitizado]);
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
          let habs = Array.isArray(c.habilidades) ? [...c.habilidades] : [];
          const normClasse = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (normClasse.includes('arcanista')) {
            const arcanos = extrairArcanosVinculados(c);
            habs = sincronizarArcanosNaHabilidade(habs, arcanos);
          }
          if (normClasse.includes('quimerista')) {
            const magias = extrairMagiasQuimerista(c);
            const attr = extrairAtributoQuimerista(c);
            habs = sincronizarQuimeristaNaHabilidade(habs, {
              magias_imitadas: magias,
              atributo_quimerista: attr
            });
          }
          return await supabase
            .from('fichas_classes')
            .update({
              nome_classe: c.nome_classe,
              nivel: c.nivel,
              beneficios: c.beneficios,
              habilidades: habs,
              dados_floralista: c.dados_floralista || {},
              dados_gourmet: c.dados_gourmet || {},
              dados_invocador: c.dados_invocador || {},
              dados_mercador: c.dados_mercador || {}
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
  },

  /**
   * Auxiliar interno para persistir dados de classes suplementares em fichas_classes.
   * @param {string|number} fichaId
   * @param {Object} opcoes
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async _salvarDadosClasseEspecial(fichaId, {
    matchClass,
    matchSkill,
    defaultSkillName,
    dadosProp,
    dadosValor,
    colunaJsonb = false,
    classes = [],
    beneficiosTexto = null,
    erroLabel = 'classe'
  }) {
    if (!fichaId) {
      return { sucesso: false, error: new Error(`fichaId é obrigatório para salvar ${erroLabel}.`) };
    }

    try {
      const { data: classesData, error: errBusca } = await supabase
        .from('fichas_classes')
        .select('*')
        .eq('ficha_id', fichaId);

      if (errBusca) throw errBusca;

      const aplicarAtualizacaoClasse = (c) => {
        const habsBase = Array.isArray(c.habilidades) ? c.habilidades : [];
        let encontrou = false;
        const extraProp = {};
        if (dadosProp === 'arcanos_vinculados') {
          extraProp.arcano_vinculado = (Array.isArray(dadosValor) ? dadosValor[0] : dadosValor) || null;
        }
        if (dadosProp === 'dados_quimerista' && dadosValor) {
          extraProp.magias_imitadas = dadosValor.magias_imitadas || [];
          extraProp.atributo_quimerista = dadosValor.atributo_quimerista || 'AST + VON';
        }

        const habsAtualizadas = habsBase.map((h) => {
          if (matchSkill(h.nome || '')) {
            encontrou = true;
            return { ...h, [dadosProp]: dadosValor, ...extraProp };
          }
          return h;
        });

        if (!encontrou) {
          habsAtualizadas.push({
            nome: defaultSkillName,
            nivel: 1,
            [dadosProp]: dadosValor,
            ...extraProp
          });
        }

        const payload = { habilidades: habsAtualizadas };
        if (colunaJsonb && dadosProp) {
          payload[dadosProp] = dadosValor;
        }
        if (beneficiosTexto) {
          payload.beneficios = beneficiosTexto;
        }
        return payload;
      };

      const classeAlvo = (classesData || []).find((c) => matchClass(c.nome_classe || ''));
      if (classeAlvo) {
        const payload = aplicarAtualizacaoClasse(classeAlvo);
        const { error: errUpdate } = await supabase
          .from('fichas_classes')
          .update(payload)
          .eq('id', classeAlvo.id);

        if (errUpdate) throw errUpdate;
      }

      if (Array.isArray(classes) && classes.length > 0) {
        classes.forEach((c) => {
          if (matchClass(c.nome_classe || '')) {
            c[dadosProp] = dadosValor;
            if (dadosProp === 'arcanos_vinculados') {
              c.arcano_vinculado = (Array.isArray(dadosValor) ? dadosValor[0] : dadosValor) || null;
            }
            if (dadosProp === 'dados_quimerista' && dadosValor) {
              c.magias_imitadas = dadosValor.magias_imitadas || [];
              c.atributo_quimerista = dadosValor.atributo_quimerista || 'AST + VON';
            }
            if (beneficiosTexto) c.beneficios = beneficiosTexto;
            const payload = aplicarAtualizacaoClasse(c);
            c.habilidades = payload.habilidades;
          }
        });
      }

      return { sucesso: true };
    } catch (err) {
      console.error(`Erro ao salvar dados de ${erroLabel}:`, err);
      return { sucesso: false, error: err };
    }
  },

  /**
   * Salva os dados específicos da classe Virtuoso (Cantor) no Supabase (fichas_classes)
   * @param {string|number} fichaId
   * @param {Object} dadosVirtuoso
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosVirtuoso(fichaId, dadosVirtuoso, classes = []) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('virtuoso') || norm(n).includes('cantor'),
      matchSkill: (n) => norm(n).includes('magicanto') || norm(n).includes('verso'),
      defaultSkillName: 'Magicanto',
      dadosProp: 'dados_virtuoso',
      dadosValor: dadosVirtuoso,
      classes,
      erroLabel: 'Virtuoso'
    });
  },

  /**
   * Salva os dados específicos da classe Comandante no Supabase (fichas_classes)
   * @param {string|number} fichaId
   * @param {Object} dadosComandante
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosComandante(fichaId, dadosComandante, classes = []) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('comandante'),
      matchSkill: (n) =>
        norm(n).includes('decreto') ||
        norm(n).includes('roque') ||
        norm(n).includes('carga') ||
        norm(n).includes('gambito'),
      defaultSkillName: 'Carga de Cavalaria',
      dadosProp: 'dados_comandante',
      dadosValor: dadosComandante,
      classes,
      erroLabel: 'Comandante'
    });
  },

  /**
   * Salva os dados específicos da classe Dançarino no Supabase (fichas_classes)
   * incluindo escolha permanente de +5 PV ou +5 PM e lista de danças aprendidas.
   * @param {string|number} fichaId
   * @param {Object} dadosDancarino
   * @param {Array} [classes=[]]
   * @param {string|null} [beneficiosTexto=null]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosDancarino(fichaId, dadosDancarino, classes = [], beneficiosTexto = null) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('dancarino'),
      matchSkill: (n) => norm(n) === 'danca' || norm(n).startsWith('danca'),
      defaultSkillName: 'Dança',
      dadosProp: 'dados_dancarino',
      dadosValor: dadosDancarino,
      classes,
      beneficiosTexto,
      erroLabel: 'Dançarino'
    });
  },

  /**
   * Salva os dados específicos da classe Simbolista no Supabase (fichas_classes)
   * @param {string|number} fichaId
   * @param {Object} dadosSimbolista
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosSimbolista(fichaId, dadosSimbolista, classes = []) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('simbolista'),
      matchSkill: (n) => norm(n).includes('simbolismo'),
      defaultSkillName: 'Simbolismo',
      dadosProp: 'dados_simbolista',
      dadosValor: dadosSimbolista,
      classes,
      erroLabel: 'Simbolista'
    });
  },

  /**
   * Salva os dados específicos da classe Floralista no Supabase (fichas_classes via JSONB dados_floralista)
   * @param {string|number} fichaId
   * @param {Object} dadosFloralista
   * @param {Array} [classes=[]]
   * @param {string|null} [beneficiosTexto=null]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosFloralista(fichaId, dadosFloralista, classes = [], beneficiosTexto = null) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('floralista') || norm(n).includes('florista'),
      matchSkill: (n) => norm(n).includes('cloromancia'),
      defaultSkillName: 'Cloromancia',
      dadosProp: 'dados_floralista',
      dadosValor: dadosFloralista,
      colunaJsonb: true,
      classes,
      beneficiosTexto,
      erroLabel: 'Floralista'
    });
  },

  /**
   * Salva os dados específicos da classe Gourmet no Supabase (fichas_classes via JSONB dados_gourmet)
   * @param {string|number} fichaId
   * @param {Object} dadosGourmet
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosGourmet(fichaId, dadosGourmet, classes = []) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('gourmet'),
      matchSkill: (n) => norm(n).includes('culinaria'),
      defaultSkillName: 'Culinária',
      dadosProp: 'dados_gourmet',
      dadosValor: dadosGourmet,
      colunaJsonb: true,
      classes,
      erroLabel: 'Gourmet'
    });
  },

  /**
   * Salva os dados específicos da classe Invocador no Supabase (fichas_classes via JSONB dados_invocador)
   * @param {string|number} fichaId
   * @param {Object} dadosInvocador
   * @param {Array} [classes=[]]
   * @param {string|null} [beneficiosTexto=null]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosInvocador(fichaId, dadosInvocador, classes = [], beneficiosTexto = null) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('invocador'),
      matchSkill: (n) => norm(n).includes('invocac'),
      defaultSkillName: 'Invocação',
      dadosProp: 'dados_invocador',
      dadosValor: dadosInvocador,
      colunaJsonb: true,
      classes,
      beneficiosTexto,
      erroLabel: 'Invocador'
    });
  },

  /**
   * Salva os dados específicos da classe Mercador no Supabase (fichas_classes via JSONB dados_mercador)
   * @param {string|number} fichaId
   * @param {Object} dadosMercador
   * @param {Array} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosMercador(fichaId, dadosMercador, classes = []) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('mercador'),
      matchSkill: (n) =>
        norm(n).includes('ventos do comercio') ||
        norm(n).includes('estoque pessoal') ||
        norm(n).includes('data de validade') ||
        norm(n).includes('ja ouvi falar') ||
        norm(n).includes('verdadeiro tesouro'),
      defaultSkillName: 'Ventos do Comércio',
      dadosProp: 'dados_mercador',
      dadosValor: dadosMercador,
      colunaJsonb: true,
      classes,
      erroLabel: 'Mercador'
    });
  },

  /**
   * Salva os arcanos vinculados da classe Arcanista no Supabase (fichas_classes)
   * garantindo sincronização na habilidade "Vincular e Invocar".
   * @param {string|number} fichaId
   * @param {Object} params
   * @param {Array<Object>} [params.arcanosVinculados=[]]
   * @param {Object|null} [params.arcanoVinculado=null]
   * @param {Array<Object>} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosArcanista(fichaId, { arcanosVinculados = [], arcanoVinculado = null } = {}, classes = []) {
    const lista = Array.isArray(arcanosVinculados) && arcanosVinculados.length > 0
      ? arcanosVinculados
      : (arcanoVinculado ? [arcanoVinculado] : []);

    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('arcanista'),
      matchSkill: (n) => norm(n).includes('vincular') && norm(n).includes('invocar'),
      defaultSkillName: 'Vincular e Invocar',
      dadosProp: 'arcanos_vinculados',
      dadosValor: lista,
      classes,
      erroLabel: 'Arcanista'
    });
  },

  /**
   * Salva os dados específicos da classe Quimerista no Supabase (fichas_classes)
   * garantindo persistência na habilidade "Imitação Mágica" e sincronização em memória.
   * @param {string|number} fichaId
   * @param {Object} params
   * @param {Array<Object>} [params.magiasImitadas=[]]
   * @param {string} [params.atributoEscolhido='AST + VON']
   * @param {Array<Object>} [classes=[]]
   * @returns {Promise<{sucesso: boolean, error?: any}>}
   */
  async salvarDadosQuimerista(fichaId, { magiasImitadas = [], atributoEscolhido = 'AST + VON' } = {}, classes = []) {
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dados = {
      magias_imitadas: Array.isArray(magiasImitadas) ? magiasImitadas : [],
      atributo_quimerista: atributoEscolhido || 'AST + VON'
    };

    return this._salvarDadosClasseEspecial(fichaId, {
      matchClass: (n) => norm(n).includes('quimerista'),
      matchSkill: (n) => norm(n).includes('imitacao') && norm(n).includes('magica'),
      defaultSkillName: 'Imitação Mágica',
      dadosProp: 'dados_quimerista',
      dadosValor: dados,
      classes,
      erroLabel: 'Quimerista'
    });
  }
};
