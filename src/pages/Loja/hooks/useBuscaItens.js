import { useState, useMemo } from 'react';

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function ehTipoArma(tipo) {
  const t = normalizar(tipo);
  return t === 'arma' || (t.includes('arma') && !t.includes('armadura'));
}

export function useBuscaItens(itensIniciais = []) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltroState] = useState('todos');
  const [categoriaArmaFiltro, setCategoriaArmaFiltro] = useState('todas');
  const [ordenacao, setOrdenacao] = useState('nome_asc');
  const [apenasRaros, setApenasRaros] = useState(false);

  const setCategoriaFiltro = (novaCategoria) => {
    setCategoriaFiltroState(novaCategoria);
    if (novaCategoria !== 'arma') {
      setCategoriaArmaFiltro('todas');
    }
  };

  const categoriasArmasDisponiveis = useMemo(() => {
    if (!Array.isArray(itensIniciais)) return [];
    const set = new Set();
    itensIniciais.forEach((item) => {
      if (ehTipoArma(item?.tipo) && item?.stats?.categoria) {
        set.add(String(item.stats.categoria).trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itensIniciais]);

  const itensFiltrados = useMemo(() => {
    if (!Array.isArray(itensIniciais)) return [];

    const termoBusca = normalizar(busca);
    const catArmaAlvo = normalizar(categoriaArmaFiltro);

    return itensIniciais
      .filter((item) => {
        const nome = normalizar(item.nome);
        const descricao = normalizar(item.descricao);
        const tipo = normalizar(item.tipo);
        const subCatArma = normalizar(item.stats?.categoria);
        const tipoDano = normalizar(item.stats?.tipo_dano);

        const matchBusca =
          !termoBusca ||
          nome.includes(termoBusca) ||
          descricao.includes(termoBusca) ||
          subCatArma.includes(termoBusca) ||
          tipoDano.includes(termoBusca);

        let matchCategoria = true;
        if (categoriaFiltro !== 'todos') {
          if (categoriaFiltro === 'arma') {
            matchCategoria = ehTipoArma(tipo);
          } else if (categoriaFiltro === 'armadura') {
            matchCategoria = tipo.includes('armadura');
          } else if (categoriaFiltro === 'acessorio') {
            matchCategoria = tipo.includes('acessorio');
          } else if (categoriaFiltro === 'consumivel') {
            matchCategoria = tipo.includes('consumivel');
          } else {
            matchCategoria = tipo === normalizar(categoriaFiltro);
          }
        }

        let matchCategoriaArma = true;
        if (catArmaAlvo && catArmaAlvo !== 'todas') {
          matchCategoriaArma = ehTipoArma(tipo) && subCatArma === catArmaAlvo;
        }

        let matchRaros = true;
        if (apenasRaros) {
          const raridade = normalizar(item.stats?.raridade);
          matchRaros = raridade === 'raro' || raridade === 'epico' || raridade === 'lendario';
        }

        return matchBusca && matchCategoria && matchCategoriaArma && matchRaros;
      })
      .sort((a, b) => {
        if (ordenacao === 'nome_asc') {
          return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
        }
        if (ordenacao === 'preco_asc') {
          return (a.custo || 0) - (b.custo || 0);
        }
        if (ordenacao === 'preco_desc') {
          return (b.custo || 0) - (a.custo || 0);
        }
        return 0;
      });
  }, [itensIniciais, busca, categoriaFiltro, categoriaArmaFiltro, apenasRaros, ordenacao]);

  return {
    busca,
    setBusca,
    categoriaFiltro,
    setCategoriaFiltro,
    categoriaArmaFiltro,
    setCategoriaArmaFiltro,
    categoriasArmasDisponiveis,
    ordenacao,
    setOrdenacao,
    apenasRaros,
    setApenasRaros,
    itensFiltrados
  };
}
