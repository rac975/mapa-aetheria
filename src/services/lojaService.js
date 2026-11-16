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
    }
};
