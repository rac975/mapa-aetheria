import { useState, useEffect, useCallback } from 'react';
import { FaBoxOpen, FaPlus, FaCoins } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from '../components/comum/BarraBuscaFiltros';

export default function GerenciarEstoqueLoja({ lojas, itensCatalogo }) {
    const [lojaSelecionadaEstoqueId, setLojaSelecionadaEstoqueId] = useState(() => {
        return lojas[0]?.id ?? null;
    });

    const [itensDaLojaEstoque, setItensDaLojaEstoque] = useState([]);
    const [modalEstoqueAberto, setModalEstoqueAberto] = useState(false);

    // Hook de busca aplicado para o modal de estoque do Mestre
    const {
        busca,
        setBusca,
        categoriaFiltro,
        setCategoriaFiltro,
        ordenacao,
        setOrdenacao,
        itensFiltrados: itensFiltradosModal
    } = useBuscaItens(itensCatalogo);

    const carregarEstoqueLoja = useCallback(async (lojaId) => {
        if (!lojaId) {
            setItensDaLojaEstoque([]);
            return;
        }
        const { data } = await supabase
            .from('loja_itens')
            .select('item_id, itens_catalogo(*)')
            .eq('loja_id', lojaId);

        if (data) {
            setItensDaLojaEstoque(data.map(d => d.itens_catalogo).filter(Boolean));
        } else {
            setItensDaLojaEstoque([]);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchEstoque() {
            if (lojaSelecionadaEstoqueId) {
                const { data } = await supabase
                    .from('loja_itens')
                    .select('item_id, itens_catalogo(*)')
                    .eq('loja_id', lojaSelecionadaEstoqueId);

                if (isMounted) {
                    if (data) {
                        setItensDaLojaEstoque(data.map(d => d.itens_catalogo).filter(Boolean));
                    } else {
                        setItensDaLojaEstoque([]);
                    }
                }
            }
        }

        fetchEstoque();

        return () => {
            isMounted = false;
        };
    }, [lojaSelecionadaEstoqueId]);

    const lojaAtivaId = lojaSelecionadaEstoqueId || (lojas.length > 0 ? lojas[0]?.id : null);
    const lojaAtualObj = lojas.find(l => l.id === lojaAtivaId);

    const adicionarItemNaLoja = async (itemId) => {
        if (!lojaAtivaId) return;
        await supabase.from('loja_itens').insert([{ loja_id: lojaAtivaId, item_id: itemId }]);
        carregarEstoqueLoja(lojaAtivaId);
    };

    const removerItemDaLoja = async (itemId) => {
        if (!lojaAtivaId) return;
        await supabase.from('loja_itens').delete().match({ loja_id: lojaAtivaId, item_id: itemId });
        carregarEstoqueLoja(lojaAtivaId);
    };

    const adicionarItensEmLote = async (itensIds) => {
        if (!lojaAtivaId || itensIds.length === 0) return;
        const idsExistentes = new Set(itensDaLojaEstoque.map(i => i.id));
        const novosIds = itensIds.filter(id => !idsExistentes.has(id));

        if (novosIds.length === 0) return;

        const payload = novosIds.map(itemId => ({
            loja_id: lojaAtivaId,
            item_id: itemId
        }));

        await supabase.from('loja_itens').insert(payload);
        carregarEstoqueLoja(lojaAtivaId);
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #30363d', paddingBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#d4af37', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                        <FaBoxOpen /> Estoque da Loja: <span style={{ color: '#f0f6fc' }}>{lojaAtualObj ? lojaAtualObj.nome : 'Selecione'}</span>
                    </h3>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.85rem' }}>Adicione ou remova itens do catálogo global disponíveis neste estabelecimento.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={lojaAtivaId || ''}
                        onChange={e => setLojaSelecionadaEstoqueId(e.target.value)}
                        style={{ background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontWeight: 'bold' }}
                    >
                        {lojas.map(l => (
                            <option key={l.id} value={l.id}>{l.nome} ({l.cidade || 'Geral'})</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => setModalEstoqueAberto(true)}
                        disabled={!lojaAtivaId}
                        style={{ background: '#1f6feb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: lojaAtivaId ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: lojaAtivaId ? 1 : 0.6 }}
                    >
                        <FaPlus /> Adicionar ao Estoque
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {itensDaLojaEstoque.map(item => (
                    <div key={item.id} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', color: '#f0f6fc', display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>{item.nome}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', background: '#21262d', padding: '2px 6px', borderRadius: '4px', color: '#8b949e', textTransform: 'uppercase' }}>{item.tipo}</span>
                                <span style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FaCoins size={10} /> {item.custo}z
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removerItemDaLoja(item.id)}
                            className="btn-excluir"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                            Retirar
                        </button>
                    </div>
                ))}
                {itensDaLojaEstoque.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#8b949e', background: '#0d1117', borderRadius: '10px', border: '1px dashed #30363d' }}>
                        Esta loja ainda não possui itens cadastrados no estoque.
                    </div>
                )}
            </div>

            {modalEstoqueAberto && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 className="modal-titulo" style={{ margin: 0 }}>
                                <FaBoxOpen /> Estoque: {lojaAtualObj?.nome}
                            </h3>
                            <button
                                type="button"
                                onClick={() => adicionarItensEmLote(itensCatalogo.map(i => i.id))}
                                style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                ✨ Adicionar Todos do Catálogo
                            </button>
                        </div>

                        {/* Barra de Busca Modular Reutilizada no Modal */}
                        <BarraBuscaFiltros
                            busca={busca}
                            setBusca={setBusca}
                            categoriaFiltro={categoriaFiltro}
                            setCategoriaFiltro={setCategoriaFiltro}
                            ordenacao={ordenacao}
                            setOrdenacao={setOrdenacao}
                        />

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', borderTop: '1px solid #30363d', borderBottom: '1px solid #30363d', padding: '12px 0' }}>
                            {itensFiltradosModal.map(item => {
                                const jaTemNaLoja = itensDaLojaEstoque.some(i => i.id === item.id);
                                return (
                                    <div key={item.id} style={{ background: '#0d1117', border: '1px solid #30363d', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.9rem', display: 'block' }}>{item.nome}</span>
                                            <span style={{ fontSize: '0.78rem', color: '#8b949e' }}>{item.tipo} | <span style={{ color: '#d4af37' }}>{item.custo}z</span></span>
                                        </div>
                                        {jaTemNaLoja ? (
                                            <span style={{ fontSize: '0.75rem', color: '#2ecc71', fontWeight: 'bold', background: 'rgba(46, 204, 113, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>No Estoque ✓</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => adicionarItemNaLoja(item.id)}
                                                style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
                                            >
                                                Adicionar
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {itensFiltradosModal.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#8b949e', padding: '20px' }}>Nenhum item encontrado no catálogo.</p>
                            )}
                        </div>

                        <div className="modal-botoes" style={{ marginTop: '16px' }}>
                            <button type="button" className="btn-modal-salvar" onClick={() => setModalEstoqueAberto(false)}>Concluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}