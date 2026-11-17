import { supabase } from './supabase';

export const cronicaService = {
  async getCronicas() {
    return await supabase
      .from('cronicas')
      .select('*')
      .order('data', { ascending: false });
  },

  subscribeCronicas(onUpdate) {
    return supabase
      .channel('cronicas_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cronicas' },
        () => onUpdate()
      )
      .subscribe();
  },

  removeChannel(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  async criarCronica(dados) {
    return await supabase.from('cronicas').insert([dados]);
  },

  async atualizarCronica(id, dados) {
    return await supabase.from('cronicas').update(dados).eq('id', id);
  },

  async excluirCronica(id) {
    return await supabase.from('cronicas').delete().eq('id', id);
  }
};
