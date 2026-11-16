import { supabase } from './supabase.js';

/**
 * Service para operações com fichas de personagens (fichas_personagens)
 * Centraliza queries e mutações relativas a personagens dos jogadores.
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

    // Busca itens de cada ficha para cálculo de peso/IP
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
