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
    }
};
