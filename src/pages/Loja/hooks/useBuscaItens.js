import { useState, useMemo } from 'react';

export function useBuscaItens(itensIniciais = []) {
    const [busca, setBusca] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
    const [ordenacao, setOrdenacao] = useState('nome_asc'); 
    const [apenasRaros, setApenasRaros] = useState(false);

    const itensFiltrados = useMemo(() => {
        if (!Array.isArray(itensIniciais)) return [];

        return itensIniciais.filter(item => {
            const nome = (item.nome || '').toLowerCase();
            const descricao = (item.descricao || '').toLowerCase();
            const tipo = (item.tipo || '').toLowerCase();
            const termoBusca = busca.toLowerCase();

            const matchBusca = nome.includes(termoBusca) || descricao.includes(termoBusca);

            let matchCategoria = true;
            if (categoriaFiltro !== 'todos') {
                if (categoriaFiltro === 'arma') {
                    matchCategoria = tipo.includes('arma');
                } else if (categoriaFiltro === 'armadura') {
                    matchCategoria = tipo.includes('armadura');
                } else {
                    matchCategoria = tipo === categoriaFiltro;
                }
            }

            let matchRaros = true;
            if (apenasRaros) {
                const raridade = (item.stats?.raridade || '').toLowerCase();
                matchRaros = raridade === 'raro' || raridade === 'épico' || raridade === 'lendario';
            }

            return matchBusca && matchCategoria && matchRaros;
        }).sort((a, b) => {
            if (ordenacao === 'nome_asc') {
                return a.nome.localeCompare(b.nome);
            }
            if (ordenacao === 'preco_asc') {
                return (a.custo || 0) - (b.custo || 0);
            }
            if (ordenacao === 'preco_desc') {
                return (b.custo || 0) - (a.custo || 0);
            }
            return 0;
        });
    }, [itensIniciais, busca, categoriaFiltro, apenasRaros, ordenacao]);

    return {
        busca,
        setBusca,
        categoriaFiltro,
        setCategoriaFiltro,
        ordenacao,
        setOrdenacao,
        apenasRaros,
        setApenasRaros,
        itensFiltrados
    };
}