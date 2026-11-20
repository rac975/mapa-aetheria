import { supabase } from './supabase.js';

/**
 * Service para operações da Loja e Catálogo/Itens
 */
export const lojaService = {
    /**
     * Adiciona um item personalizado à ficha do personagem
     * @param {Object} params
     * @param {string|number} params.fichaId
     * @param {string} params.nomeItem
     * @param {string} params.tipo
     * @param {Object} params.statsPersonalizados
     * @returns {Promise<{data: any, error: any}>}
     */
    async adicionarItemPersonagem({ fichaId, nomeItem, tipo = 'arma', statsPersonalizados }) {
        const { data, error } = await supabase.from('itens_personagem').insert([{
            ficha_id: fichaId,
            nome: nomeItem,
            nome_item: nomeItem,
            tipo,
            stats_personalizados: statsPersonalizados
        }]);

        return { data, error };
    },

    /**
     * Cadastra um item novo no catálogo geral
     * @param {Object} params
     * @param {string} params.nome
     * @param {string} params.tipo
     * @param {number} params.custo
     * @param {string} params.descricao
     * @param {Object} params.stats
     * @returns {Promise<{data: any, error: any}>}
     */
    async cadastrarItemCatalogo({ nome, tipo = 'arma', custo, descricao, stats }) {
        const { data, error } = await supabase.from('itens_catalogo').insert([{
            nome,
            tipo,
            custo,
            descricao,
            stats
        }]);

        return { data, error };
    },

    /**
     * Cria arma personalizada (direcionando para a ficha ou para o catálogo geral)
     * @param {Object} params
     * @param {Object|null} params.ficha
     * @param {string} params.nome
     * @param {number} params.custo
     * @param {Object} params.stats
     * @returns {Promise<{data: any, error: any}>}
     */
    async salvarArmaPersonalizada({ ficha, nome, custo, stats }) {
        if (ficha && ficha.id) {
            return this.adicionarItemPersonagem({
                fichaId: ficha.id,
                nomeItem: nome,
                tipo: 'arma',
                statsPersonalizados: stats
            });
        }

        return this.cadastrarItemCatalogo({
            nome,
            tipo: 'arma',
            custo,
            descricao: 'Arma personalizada criada sob medida.',
            stats
        });
    },

    /**
     * Exclui um item do catálogo geral
     * @param {string|number} itemId
     * @returns {Promise<{error: any}>}
     */
    async excluirItemCatalogo(itemId) {
        const { error } = await supabase.from('itens_catalogo').delete().eq('id', itemId);
        return { error };
    },

    /**
     * Exclui um estabelecimento de loja e seus vínculos
     * @param {string|number} lojaId
     * @returns {Promise<{error: any}>}
     */
    async excluirLoja(lojaId) {
        const { error } = await supabase.from('lojas').delete().eq('id', lojaId);
        return { error };
    },

    /**
     * Salva ou atualiza um estabelecimento de loja
     * @param {Object} params
     * @param {string|number} [params.id]
     * @param {string} params.nome
     * @param {string} [params.cidade]
     * @param {string} [params.descricao]
     * @param {string} [params.vendedor]
     * @returns {Promise<{data: any, error: any}>}
     */
    async salvarEstabelecimento({ id, nome, cidade = '', descricao = '', vendedor = '' }) {
        const dadosCompletos = {
            nome,
            cidade,
            descricao,
            vendedor: vendedor || null
        };

        try {
            if (id) {
                const { data, error } = await supabase.from('lojas').update(dadosCompletos).eq('id', id).select().single();
                if (error && (error.code === '42703' || String(error.message || '').includes('vendedor'))) {
                    const { data: d2, error: err2 } = await supabase.from('lojas').update({ nome, cidade, descricao }).eq('id', id).select().single();
                    return { data: d2, error: err2 };
                }
                return { data, error };
            } else {
                const { data, error } = await supabase.from('lojas').insert([dadosCompletos]).select().single();
                if (error && (error.code === '42703' || String(error.message || '').includes('vendedor'))) {
                    const { data: d2, error: err2 } = await supabase.from('lojas').insert([{ nome, cidade, descricao }]).select().single();
                    return { data: d2, error: err2 };
                }
                return { data, error };
            }
        } catch (err) {
            return { data: null, error: err };
        }
    },

    /**
     * Remove um item do estoque de uma loja específica
     * @param {string|number} lojaId
     * @param {string|number} itemId
     * @returns {Promise<{error: any}>}
     */
    async removerItemLoja(lojaId, itemId) {
        const { error } = await supabase
            .from('loja_itens')
            .delete()
            .match({ loja_id: lojaId, item_id: itemId });
        return { error };
    },

    /**
     * Vende item da ficha (remove do inventário e credita zênites)
     * @param {Object} params
     * @param {string|number} params.fichaId
     * @param {string|number} params.itemId
     * @param {number} params.novoZenit
     * @returns {Promise<{error: any}>}
     */
    async venderItemFicha({ fichaId, itemId, novoZenit }) {
        const { error: erroFicha } = await supabase
            .from('fichas_personagens')
            .update({ zenit: novoZenit })
            .eq('id', fichaId);
        if (erroFicha) return { error: erroFicha };

        const { error: erroDel } = await supabase
            .from('itens_personagem')
            .delete()
            .eq('id', itemId);
        return { error: erroDel };
    },

    /**
     * Busca o inventário atual de uma ficha
     * @param {string|number} fichaId
     * @returns {Promise<{data: any, error: any}>}
     */
    async getInventarioPersonagem(fichaId) {
        return await supabase
            .from('itens_personagem')
            .select('*')
            .eq('ficha_id', fichaId);
    },

    /**
     * Executa compra de item do catálogo na loja: debita zênites, desequipa slot anterior se necessário e insere item
     * @param {Object} params
     * @returns {Promise<{data: any, error: any}>}
     */
    async comprarItemLoja({ fichaId, novoZenit, slotFinal, itemCatalogo, deveEquipar, statsPersonalizados }) {
        const { error: erroFicha } = await supabase
            .from('fichas_personagens')
            .update({ zenit: novoZenit })
            .eq('id', fichaId);

        if (erroFicha) return { data: null, error: erroFicha };

        if (slotFinal) {
            const { data: itensExistentes } = await supabase
                .from('itens_personagem')
                .select('*')
                .eq('ficha_id', fichaId);

            if (itensExistentes) {
                for (const itemAntigo of itensExistentes) {
                    if (itemAntigo.stats_personalizados?.slot === slotFinal) {
                        const statsAntigoLimpo = { ...itemAntigo.stats_personalizados };
                        delete statsAntigoLimpo.slot;
                        statsAntigoLimpo.equipado = false;

                        await supabase
                            .from('itens_personagem')
                            .update({ equipado: false, stats_personalizados: statsAntigoLimpo })
                            .eq('id', itemAntigo.id);
                    }
                }
            }
        }

        const { data, error } = await supabase
            .from('itens_personagem')
            .insert([{
                ficha_id: fichaId,
                item_id: itemCatalogo.id,
                nome: itemCatalogo.nome,
                tipo: itemCatalogo.tipo,
                quantidade: 1,
                equipado: deveEquipar,
                stats_personalizados: statsPersonalizados
            }])
            .select()
            .single();

        return { data, error };
    },

    /**
     * Busca todas as lojas cadastradas ordenadas por nome
     * @returns {Promise<Array<any>>}
     */
    async getLojas() {
        const { data, error } = await supabase.from('lojas').select('*').order('nome');
        if (error) return [];
        return data || [];
    },

    /**
     * Busca todos os itens do catálogo geral ordenados por nome
     * @returns {Promise<Array<any>>}
     */
    async getItensCatalogo() {
        const { data, error } = await supabase.from('itens_catalogo').select('*').order('nome');
        if (error) return [];
        return data || [];
    },

    /**
     * Busca os itens vinculados a uma loja específica
     * @param {string|number} lojaId
     * @returns {Promise<Array<any>>}
     */
    async getItensDaLoja(lojaId) {
        if (!lojaId) return [];
        const { data, error } = await supabase
            .from('loja_itens')
            .select('item_id, itens_catalogo(*)')
            .eq('loja_id', lojaId);

        if (error || !data) return [];
        return data.map(rel => rel.itens_catalogo).filter(Boolean);
    },

    /**
     * Busca fichas disponíveis para a Loja respeitando o isolamento entre Mestre (todas) e Jogador (apenas sua sessão)
     * @param {Object} params
     * @param {boolean} [params.isMestre=false]
     * @param {string|null} [params.tokenJogador=null]
     * @param {string|number|null} [params.fichaIdSessao=null]
     * @returns {Promise<Array<any>>}
     */
    async getFichasParaLoja({ isMestre = false, tokenJogador = null, fichaIdSessao = null } = {}) {
        if (isMestre) {
            const { data } = await supabase.from('fichas_personagens').select('*').order('nome_personagem');
            return data || [];
        }

        if (!fichaIdSessao && !tokenJogador) {
            return [];
        }

        let query = supabase.from('fichas_personagens').select('*');
        if (fichaIdSessao) {
            query = query.eq('id', fichaIdSessao);
        } else if (tokenJogador) {
            query = query.ilike('jogador_token', String(tokenJogador).trim());
        }

        const { data } = await query.order('nome_personagem');
        return data || [];
    },

    /**
     * Inscreve em tempo real nas tabelas de lojas, catálogo e estoque
     * @param {Object} callbacks
     * @param {Function} callbacks.onCatalogoOuLojaChange
     * @param {Function} callbacks.onEstoqueLojaChange
     * @returns {{ unsubscribe: () => void }}
     */
    subscribeLojasRealtime({ onCatalogoOuLojaChange, onEstoqueLojaChange } = {}) {
        const sufixo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const canalRealtime = supabase
            .channel(`lojas_global_realtime_${sufixo}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'itens_catalogo' }, () => {
                if (onCatalogoOuLojaChange) onCatalogoOuLojaChange();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lojas' }, () => {
                if (onCatalogoOuLojaChange) onCatalogoOuLojaChange();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loja_itens' }, () => {
                if (onEstoqueLojaChange) onEstoqueLojaChange();
            })
            .subscribe();

        return {
            unsubscribe: () => {
                try {
                    supabase.removeChannel(canalRealtime);
                } catch {
                    // Ignora erro ao remover canal
                }
            }
        };
    },

    /**
     * Busca itens base comuns de armaduras e escudos no catálogo (filtrando itens impróprios como Sem Armadura)
     * @returns {Promise<Array<any>>}
     */
    async getBasesArmadurasEEscudos() {
        const { data, error } = await supabase
            .from('itens_catalogo')
            .select('*')
            .in('tipo', ['armadura', 'escudo'])
            .eq('stats->>raridade', 'comum');

        if (error) {
            console.error('Erro ao buscar bases de armaduras/escudos:', error);
            return [];
        }
        return (data || []).filter(item => {
            const nomeLower = (item.nome || '').toLowerCase();
            return !nomeLower.includes('sem armadura') && !nomeLower.includes('improvisad');
        });
    },

    /**
     * Busca características especiais disponíveis no catálogo para equipamentos
     * @returns {Promise<Array<any>>}
     */
    async getCaracteristicasArmadurasEEscudos() {
        const { data, error } = await supabase
            .from('catalogo_itens')
            .select('*');

        if (error) {
            console.error('Erro ao buscar características de armaduras/escudos:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Busca armas base comuns no catálogo (filtrando improvisadas)
     * @returns {Promise<Array<any>>}
     */
    async getBasesArmas() {
        const { data, error } = await supabase
            .from('itens_catalogo')
            .select('*')
            .eq('tipo', 'arma')
            .eq('stats->>raridade', 'comum');

        if (error) {
            console.error('Erro ao buscar bases de armas:', error);
            return [];
        }
        return (data || []).filter(item => {
            const nomeLower = (item.nome || '').toLowerCase();
            return !nomeLower.includes('improvisad') && !nomeLower.includes('desarmado');
        });
    },

    /**
     * Busca características de armas (ofensivas e defensivas)
     * @returns {Promise<Array<any>>}
     */
    async getCaracteristicasArmas() {
        const { data, error } = await supabase
            .from('catalogo_itens')
            .select('*');

        if (error) {
            console.error('Erro ao buscar características de armas:', error);
            return [];
        }
        return (data || []).filter(i =>
            i.tipo_item === 'caracteristica_arma_ofensiva' ||
            i.tipo_item === 'caracteristica_arma_defensiva'
        );
    },

    /**
     * Busca características de acessórios
     * @returns {Promise<Array<any>>}
     */
    async getCaracteristicasAcessorios() {
        const { data, error } = await supabase
            .from('catalogo_itens')
            .select('*');

        if (error) {
            console.error('Erro ao buscar características de acessórios:', error);
            return [];
        }
        return (data || []).filter(i =>
            (i.tipo_item || '').includes('acessorio')
        );
    }
};
