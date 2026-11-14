import { FaSearch, FaSortAmountDown, FaStar } from 'react-icons/fa';

export default function BarraBuscaFiltros({ 
    busca, 
    setBusca, 
    categoriaFiltro, 
    setCategoriaFiltro, 
    ordenacao, 
    setOrdenacao,
    apenasRaros,
    setApenasRaros,
    mostrarFiltroRaros = false 
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} size={14} />
                    <input
                        type="text"
                        className="loja-input-busca"
                        placeholder="Pesquisar por nome, bônus ou efeito..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#161b22', border: '1px solid #30363d', padding: '0 14px', borderRadius: '10px' }}>
                    <FaSortAmountDown color="#8b949e" size={14} />
                    <select
                        value={ordenacao}
                        onChange={e => setOrdenacao(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#c9d1d9', outline: 'none', fontSize: '0.88rem', cursor: 'pointer', padding: '10px 0' }}
                    >
                        <option value="nome_asc" style={{ background: '#161b22' }}>Nome (A - Z)</option>
                        <option value="preco_asc" style={{ background: '#161b22' }}>Menor Preço (Zênites)</option>
                        <option value="preco_desc" style={{ background: '#161b22' }}>Maior Preço (Zênites)</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="loja-categorias-chips" style={{ margin: 0 }}>
                    {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'arma', label: 'Armas' },
                        { id: 'armadura', label: 'Armaduras' },
                        { id: 'escudo', label: 'Escudos' },
                        { id: 'acessorio', label: 'Acessórios' },
                        { id: 'consumivel', label: 'Consumíveis' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoriaFiltro(cat.id)}
                            className={`chip-categoria ${categoriaFiltro === cat.id ? 'ativo' : ''}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {mostrarFiltroRaros && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#d8b4fe', background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)', padding: '6px 14px', borderRadius: '20px' }}>
                        <input
                            type="checkbox"
                            checked={apenasRaros}
                            onChange={e => setApenasRaros(e.target.checked)}
                            style={{ accentColor: '#8a2be2' }}
                        />
                        <FaStar size={12} /> Apenas Itens Raros
                    </label>
                )}
            </div>
        </div>
    );
}