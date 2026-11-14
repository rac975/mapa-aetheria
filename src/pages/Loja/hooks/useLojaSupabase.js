import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase';

export function useLojaSupabase(fichaProp, isMestre) {
    const [lojas, setLojas] = useState([]);
    const [lojaSelecionadaId, setLojaSelecionadaId] = useState(null);
    const [itensDaLoja, setItensDaLoja] = useState([]);
    const [todosItensCatalogo, setTodosItensCatalogo] = useState([]);
    
    // Estados para simulação de fichas (caso o Mestre esteja testando)
    const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
    const [fichaSelecionadaLocalId, setFichaSelecionadaLocalId] = useState(null);

    // Ref para manter o ID da loja atual acessível dentro do Realtime sem recriar o canal
    const lojaSelecionadaRef = useRef(lojaSelecionadaId);
    useEffect(() => {
        lojaSelecionadaRef.current = lojaSelecionadaId;
    }, [lojaSelecionadaId]);

    // Carregar itens da loja selecionada
    const carregarItensDaLoja = useCallback(async (lojaId) => {
        if (!lojaId) {
            setItensDaLoja([]);
            return;
        }

        const { data, error } = await supabase
            .from('loja_itens')
            .select('item_id, itens_catalogo(*)')
            .eq('loja_id', lojaId);

        if (!error && data) {
            const itensFormatados = data.map(rel => rel.itens_catalogo).filter(Boolean);
            setItensDaLoja(itensFormatados);
        } else {
            setItensDaLoja([]);
        }
    }, []);

    // Recarregar dados globais do catálogo, lojas e estoque atual
    const recarregarDadosGlobais = useCallback(async () => {
        const { data: dataLojas } = await supabase.from('lojas').select('*').order('nome');
        if (dataLojas) {
            setLojas(dataLojas);
            // Se a loja selecionada foi excluída, seleciona a primeira disponível
            if (lojaSelecionadaRef.current && !dataLojas.some(l => l.id === lojaSelecionadaRef.current)) {
                const novaLojaId = dataLojas.length > 0 ? dataLojas[0].id : null;
                setLojaSelecionadaId(novaLojaId);
                carregarItensDaLoja(novaLojaId);
            }
        }

        const { data: dataCat } = await supabase.from('itens_catalogo').select('*').order('nome');
        if (dataCat) setTodosItensCatalogo(dataCat);

        if (lojaSelecionadaRef.current) {
            carregarItensDaLoja(lojaSelecionadaRef.current);
        }
    }, [carregarItensDaLoja]);

    // Carregamento inicial
    useEffect(() => {
        let isMounted = true;

        async function carregarTudo() {
            const { data: dataLojas } = await supabase.from('lojas').select('*').order('nome');
            if (!isMounted) return;

            if (dataLojas && dataLojas.length > 0) {
                setLojas(dataLojas);
                const primeiraLojaId = dataLojas[0].id;
                setLojaSelecionadaId(primeiraLojaId);
                carregarItensDaLoja(primeiraLojaId);
            }

            const { data: dataCat } = await supabase.from('itens_catalogo').select('*').order('nome');
            if (isMounted && dataCat) {
                setTodosItensCatalogo(dataCat);
            }

            if (!fichaProp) {
                const tokenJogador = localStorage.getItem('aetheria_jogador_token');
                let query = supabase.from('fichas_personagens').select('*');

                if (!isMestre && tokenJogador) {
                    query = query.eq('id', tokenJogador);
                }

                const { data: dataFichas } = await query.order('nome_personagem');

                if (isMounted && dataFichas && dataFichas.length > 0) {
                    setFichasDisponiveis(dataFichas);
                    setFichaSelecionadaLocalId(dataFichas[0].id);
                }
            }
        }

        carregarTudo();

        return () => {
            isMounted = false;
        };
    }, [carregarItensDaLoja, fichaProp, isMestre]);

    // Sincronização em Tempo Real (Estável: conecta apenas 1 vez)
    useEffect(() => {
        const canalRealtime = supabase
            .channel('lojas-global-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'itens_catalogo' }, () => {
                recarregarDadosGlobais();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lojas' }, () => {
                recarregarDadosGlobais();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loja_itens' }, () => {
                if (lojaSelecionadaRef.current) {
                    carregarItensDaLoja(lojaSelecionadaRef.current);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(canalRealtime);
        };
    }, [recarregarDadosGlobais, carregarItensDaLoja]);

    const handleSelecionarLoja = (lojaId) => {
        setLojaSelecionadaId(lojaId);
        carregarItensDaLoja(lojaId);
    };

    const fichaAtiva = fichaProp || fichasDisponiveis.find(f => f.id === fichaSelecionadaLocalId);

    return {
        lojas,
        lojaSelecionadaId,
        handleSelecionarLoja,
        itensDaLoja,
        todosItensCatalogo,
        recarregarDadosGlobais,
        fichaAtiva,
        fichasDisponiveis,
        fichaSelecionadaLocalId,
        setFichaSelecionadaLocalId
    };
}