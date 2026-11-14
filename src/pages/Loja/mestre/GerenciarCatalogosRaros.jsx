import { FaTools, FaTrash } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from '../components/comum/BarraBuscaFiltros';

export default function GerenciarCatalogoRaros({ itensCatalogo, recarregarDados }) {
    // Filtra previamente apenas os itens que são raros ou armas customizadas/forjadas
    const itensRarosBase = itensCatalogo.filter(
        item => item.stats?.raridade === 'raro' || (item.tipo === 'arma' && item.stats?.dano)
    );

    // Aplicação do hook de busca modular
    const {
        busca,
        setBusca,
        categoriaFiltro,
        setCategoriaFiltro,
        ordenacao,
        setOrdenacao,
        itensFiltrados
    } = useBuscaItens(itensRarosBase);

    const deletarItemCatalogo = async (item) => {
        if (!confirm(`Deseja realmente excluir "${item.nome}" do catálogo?`)) return;
        
        const { error } = await supabase
            .from('itens_catalogo')
            .delete()
            .eq('id', item.id);

        if (error) {
            alert('Erro ao excluir item: ' + error.message);
        } else {
            if (recarregarDados) recarregarDados();
        }
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #30363d', paddingBottom: '12px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#d4af37', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                    <FaTools /> Itens Raros e Forjados no Catálogo
                </h3>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.85rem' }}>
                    Lista de todas as criações personalizadas salvas no mundo. Você pode buscá-las ou removê-las se necessário.
                </p>
            </div>

            {/* Barra de Busca e Filtros Modular Integrada */}
            <BarraBuscaFiltros
                busca={busca}
                setBusca={setBusca}
                categoriaFiltro={categoriaFiltro}
                setCategoriaFiltro={setCategoriaFiltro}
                ordenacao={ordenacao}
                setOrdenacao={setOrdenacao}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {itensFiltrados.map(item => (
                    <div key={item.id} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', color: '#f0f6fc', display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>{item.nome}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', background: '#21262d', padding: '2px 6px', borderRadius: '4px', color: '#8b949e', textTransform: 'uppercase' }}>{item.tipo}</span>
                                <span style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 'bold' }}>{item.custo}z</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className='btn-del'
                            onClick={() => deletarItemCatalogo(item)}
                            style={{ background: 'rgba(248, 81, 73, 0.2)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.4)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                            <FaTrash size={10} /> Deletar
                        </button>
                    </div>
                ))}
            </div>

            {itensFiltrados.length === 0 && (
                <div className="loja-vazio" style={{ marginTop: '16px' }}>
                    <p style={{ margin: 0 }}>Nenhum item raro encontrado com os filtros aplicados.</p>
                </div>
            )}
        </div>
    );
}