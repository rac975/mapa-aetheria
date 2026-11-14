import { useState, useEffect } from 'react';
import { FaCoins, FaShoppingCart, FaShieldAlt, FaBoxOpen, FaStore, FaHandHoldingUsd } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from './comum/BarraBuscaFiltros';

export default function LojaClienteTab({ itensCatalogo, ficha, setFicha }) {
    const {
        busca,
        setBusca,
        categoriaFiltro,
        setCategoriaFiltro,
        ordenacao,
        setOrdenacao,
        apenasRaros,
        setApenasRaros,
        itensFiltrados
    } = useBuscaItens(itensCatalogo);

    const [abaAtiva, setAbaAtiva] = useState('comprar');
    const [itensInventario, setItensInventario] = useState([]);
    const [itemSelecionadoParaCompra, setItemSelecionadoParaCompra] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [destinoCompra, setDestinoCompra] = useState('mochila');
    const [slotEscolhido, setSlotEscolhido] = useState('mao_dominante');
    const [processando, setProcessando] = useState(false);

    useEffect(() => {
        if (!ficha?.id) return;
        async function carregarInventarioPersonagem() {
            const { data, error } = await supabase
                .from('itens_personagem')
                .select('*')
                .eq('ficha_id', ficha.id);
            if (!error && data) {
                setItensInventario(data);
            }
        }
        carregarInventarioPersonagem();
    }, [ficha?.id]);

    const abrirModalCompra = (item) => {
        if (!ficha) {
            alert("Selecione uma ficha de personagem ativa na sessão para comprar itens!");
            return;
        }

        const zenitAtual = ficha.zenit || 0;
        if (zenitAtual < item.custo) {
            alert(`Você precisa de ${item.custo}z, mas só tem ${zenitAtual}z!`);
            return;
        }

        setItemSelecionadoParaCompra(item);
        setDestinoCompra('mochila');

        const tipoLower = (item.tipo || '').toLowerCase();
        if (tipoLower.includes('arma') && !tipoLower.includes('armadura')) setSlotEscolhido('mao_dominante');
        if (tipoLower.includes('escudo')) setSlotEscolhido('mao_secundaria');

        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setItemSelecionadoParaCompra(null);
    };

    const confirmarCompra = async () => {
        if (!ficha || !ficha.id || !itemSelecionadoParaCompra) return;

        const custo = itemSelecionadoParaCompra.custo || 0;
        const zenitAtual = ficha.zenit || 0;

        if (zenitAtual < custo) {
            alert("Zênites insuficientes para realizar esta compra!");
            return;
        }

        setProcessando(true);
        const novoZenit = zenitAtual - custo;
        const deveEquipar = destinoCompra === 'equipar';
        const tipoItem = (itemSelecionadoParaCompra.tipo || '').toLowerCase();

        let slotFinal = null;
        if (deveEquipar) {
            if (tipoItem.includes('armadura')) {
                slotFinal = 'armadura';
            } else if (tipoItem.includes('acessorio') || tipoItem.includes('acessório')) {
                slotFinal = 'acessorio';
            } else if (tipoItem.includes('escudo')) {
                slotFinal = 'mao_secundaria';
            } else if (tipoItem.includes('2h') || tipoItem.includes('duas mãos')) {
                slotFinal = 'mao_dominante';
            } else if (tipoItem.includes('arma') && !tipoItem.includes('armadura')) {
                slotFinal = slotEscolhido; 
            }
        }

        const statsBase = itemSelecionadoParaCompra.stats || {};
        const statsPersonalizadosComSlot = {
            ...statsBase,
            ...(slotFinal ? { slot: slotFinal, equipado: true } : { equipado: false }),
            custo: custo
        };

        try {
            const { error: erroFicha } = await supabase
                .from('fichas_personagens')
                .update({ zenit: novoZenit })
                .eq('id', ficha.id);

            if (erroFicha) throw erroFicha;

            if (slotFinal) {
                const { data: itensExistentes } = await supabase
                    .from('itens_personagem')
                    .select('*')
                    .eq('ficha_id', ficha.id);

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

            const { data: novoItemInserido, error: erroItem } = await supabase
                .from('itens_personagem')
                .insert([{
                    ficha_id: ficha.id,
                    item_id: itemSelecionadoParaCompra.id,
                    nome: itemSelecionadoParaCompra.nome,
                    tipo: itemSelecionadoParaCompra.tipo,
                    quantidade: 1,
                    equipado: deveEquipar,
                    stats_personalizados: statsPersonalizadosComSlot
                }])
                .select()
                .single();

            if (erroItem) throw erroItem;

            setFicha(prev => ({
                ...prev,
                zenit: novoZenit
            }));

            setItensInventario(prev => [...prev, novoItemInserido]);

            alert(`✨ Compra realizada com sucesso! "${itemSelecionadoParaCompra.nome}" foi adquirido.`);
            fecharModal();
        } catch (err) {
            alert("Erro ao processar compra: " + err.message);
        } finally {
            setProcessando(false);
        }
    };

    const venderItem = async (itemInv) => {
        if (!ficha || !ficha.id) return;

        if (itemInv.stats_personalizados?.slot || itemInv.equipado) {
            alert("Você não pode vender um item que está equipado! Desequipe-o primeiro na sua aba de equipamentos.");
            return;
        }

        const custoOriginal = itemInv.stats_personalizados?.custo || 100;
        const valorVenda = Math.floor(custoOriginal / 2);
        const zenitAtual = ficha.zenit || 0;
        const novoZenit = zenitAtual + valorVenda;

        if (!window.confirm(`Deseja vender "${itemInv.nome}" por ${valorVenda} zênites (metade do valor)?`)) {
            return;
        }

        try {
            const { error: erroFicha } = await supabase
                .from('fichas_personagens')
                .update({ zenit: novoZenit })
                .eq('id', ficha.id);

            if (erroFicha) throw erroFicha;

            const { error: erroDel } = await supabase
                .from('itens_personagem')
                .delete()
                .eq('id', itemInv.id);

            if (erroDel) throw erroDel;

            setFicha(prev => ({ ...prev, zenit: novoZenit }));
            setItensInventario(prev => prev.filter(i => i.id !== itemInv.id));

            alert(`💰 Venda realizada com sucesso! Você recebeu ${valorVenda} zênites.`);
        } catch (err) {
            alert("Erro ao vender item: " + err.message);
        }
    };

    const getRaridadeStyle = (raridade) => {
        switch (raridade?.toLowerCase()) {
            case 'raro': return { bg: 'rgba(138, 43, 226, 0.2)', color: '#d8b4fe', border: 'rgba(138, 43, 226, 0.4)' };
            case 'epico': return { bg: 'rgba(255, 140, 0, 0.2)', color: '#fed7aa', border: 'rgba(255, 140, 0, 0.4)' };
            case 'lendario': return { bg: 'rgba(255, 215, 0, 0.2)', color: '#fef08a', border: 'rgba(255, 215, 0, 0.4)' };
            default: return { bg: 'rgba(128, 128, 128, 0.2)', color: '#c4c4c4', border: 'rgba(128,128,128,0.4)' };
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    type="button"
                    onClick={() => setAbaAtiva('comprar')}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${abaAtiva === 'comprar' ? '#238636' : '#30363d'}`, background: abaAtiva === 'comprar' ? 'rgba(35, 134, 54, 0.15)' : '#161b22', color: '#f0f6fc', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FaStore color="#238636" /> Comprar na Loja
                </button>
                <button
                    type="button"
                    onClick={() => setAbaAtiva('vender')}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${abaAtiva === 'vender' ? '#d4af37' : '#30363d'}`, background: abaAtiva === 'vender' ? 'rgba(212, 175, 55, 0.15)' : '#161b22', color: '#f0f6fc', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FaHandHoldingUsd color="#d4af37" /> Vender Seus Itens
                </button>
            </div>

            {abaAtiva === 'comprar' && (
                <>
                    <BarraBuscaFiltros
                        busca={busca}
                        setBusca={setBusca}
                        categoriaFiltro={categoriaFiltro}
                        setCategoriaFiltro={setCategoriaFiltro}
                        ordenacao={ordenacao}
                        setOrdenacao={setOrdenacao}
                        apenasRaros={apenasRaros}
                        setApenasRaros={setApenasRaros}
                        mostrarFiltroRaros={true}
                    />

                    <div className="loja-grid">
                        {itensFiltrados.map((item) => {
                            const ehMarcial = item.stats && item.stats.marcial === true;
                            const ehComum = item.stats && item.stats.raridade === 'comum';
                            const raridadeStyle = item.stats?.raridade ? getRaridadeStyle(item.stats.raridade) : null;
                            const raridadeTexto = item.stats?.raridade;

                            return (
                                <div key={item.id} className="loja-card">
                                    <div>
                                        <div className="loja-card-header">
                                            <h4 className="loja-card-titulo">{item.nome}</h4>
                                            <div className="loja-preco-badge">
                                                <FaCoins size={11} /> {item.custo}z
                                            </div>
                                        </div>

                                        <div className="loja-tags-row">
                                            <span className="tag-tipo">{item.tipo}</span>
                                            {item.stats && 'marcial' in item.stats && (
                                                <span className={`tag-marcial ${ehMarcial ? 'sim' : 'nao'}`}>
                                                    {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                                                </span>
                                            )}
                                            {raridadeStyle && (
                                                <span className="tag-raridade" style={{ background: raridadeStyle.bg, color: raridadeStyle.color, border: `1px solid ${raridadeStyle.border}` }}>
                                                    {ehComum ? `${raridadeTexto}` : `⭐ ${raridadeTexto}`}
                                                </span>
                                            )}
                                        </div>

                                        <p className="loja-descricao">
                                            {item.descricao || 'Sem descrição cadastrada.'}
                                        </p>

                                        {/* 🔹 CAIXINHA DE ESTATÍSTICAS "MASTIGADA" (Sem campos de controle) */}
                                        {item.stats && Object.keys(item.stats).length > 0 && (
                                            <div className="loja-stats-box">
                                                {Object.entries(item.stats)
                                                    .filter(([chave]) => {
                                                        // Oculta chaves de controle indesejadas (slot, equipado, custo, raridade, marcial)
                                                        const chaveLower = chave.toLowerCase();
                                                        if (['slot', 'equipado', 'custo', 'raridade', 'marcial'].includes(chaveLower)) return false;
                                                        
                                                        if (chaveLower === 'efeitos') {
                                                            const val = item.stats[chave];
                                                            return Array.isArray(val) ? val.length > 0 : Boolean(val);
                                                        }
                                                        const valor = item.stats[chave];
                                                        return valor !== null && valor !== undefined && valor !== '';
                                                    })
                                                    .map(([chave, valor]) => {
                                                        const nomesFormatados = {
                                                            dano: 'Dano',
                                                            maos: 'Mãos',
                                                            alcance: 'Alcance',
                                                            precisao: 'Precisão',
                                                            categoria: 'Categoria',
                                                            tipo_dano: 'Tipo de Dano',
                                                            defesa: 'Defesa',
                                                            defesa_magica: 'Defesa Mágica',
                                                            'defesa magica': 'Defesa Mágica',
                                                            iniciativa: 'Iniciativa',
                                                            efeitos: 'Efeitos'
                                                        };

                                                        const labelBonita = nomesFormatados[chave.toLowerCase()] || chave.replace('_', ' ');
                                                        const valorExibido = Array.isArray(valor) ? valor.join(', ') : valor;

                                                        return (
                                                            <div key={chave} className="stat-linha">
                                                                <span className="stat-chave">{labelBonita}:</span>
                                                                <span className="stat-valor">{valorExibido}</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-comprar"
                                        onClick={() => abrirModalCompra(item)}
                                    >
                                        <FaShoppingCart size={12} style={{ marginRight: '6px', display: 'inline-flex' }} /> Comprar Item
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {itensFiltrados.length === 0 && (
                        <div className="loja-vazio">
                            <p style={{ margin: 0 }}>Nenhum item encontrado com esses filtros ou termos de busca.</p>
                        </div>
                    )}
                </>
            )}

            {abaAtiva === 'vender' && (
                <div>
                    <div style={{ background: '#161b22', padding: '16px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '16px' }}>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem' }}>
                            💡 Você pode vender os itens guardados na sua mochila por **metade do preço original**. Itens equipados devem ser desequipados antes da venda.
                        </p>
                    </div>

                    <div className="loja-grid">
                        {itensInventario.map((itemInv) => {
                            const custoOriginal = itemInv.stats_personalizados?.custo || 100;
                            const valorVenda = Math.floor(custoOriginal / 2);
                            const estaEquipado = Boolean(itemInv.stats_personalizados?.slot || itemInv.equipado);

                            return (
                                <div key={itemInv.id} className="loja-card" style={{ opacity: estaEquipado ? 0.7 : 1 }}>
                                    <div>
                                        <div className="loja-card-header">
                                            <h4 className="loja-card-titulo">{itemInv.nome}</h4>
                                            <div className="loja-preco-badge" style={{ color: '#d4af37' }}>
                                                <FaCoins size={11} /> +{valorVenda}z (Venda)
                                            </div>
                                        </div>

                                        <div className="loja-tags-row">
                                            <span className="tag-tipo">{itemInv.tipo}</span>
                                            {estaEquipado && (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(210, 153, 34, 0.2)', color: '#f0883e', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(210, 153, 34, 0.4)' }}>
                                                    🔒 Equipado
                                                </span>
                                            )}
                                        </div>

                                        {/* 🔹 ESTATÍSTICAS TAMBÉM NO INVENTÁRIO (LIMPAS) */}
                                        {itemInv.stats_personalizados && Object.keys(itemInv.stats_personalizados).length > 0 && (
                                            <div className="loja-stats-box" style={{ marginTop: '10px' }}>
                                                {Object.entries(itemInv.stats_personalizados)
                                                    .filter(([chave]) => {
                                                        const chaveLower = chave.toLowerCase();
                                                        if (['slot', 'equipado', 'custo'].includes(chaveLower)) return false;
                                                        const valor = itemInv.stats_personalizados[chave];
                                                        return valor !== null && valor !== undefined && valor !== '';
                                                    })
                                                    .map(([chave, valor]) => (
                                                        <div key={chave} className="stat-linha">
                                                            <span className="stat-chave">{chave.replace('_', ' ')}:</span>
                                                            <span className="stat-valor">{String(valor)}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => venderItem(itemInv)}
                                        disabled={estaEquipado}
                                        style={{
                                            background: estaEquipado ? '#21262d' : '#9e6a03',
                                            border: 'none',
                                            color: estaEquipado ? '#8b949e' : '#fff',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            cursor: estaEquipado ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            marginTop: '12px'
                                        }}
                                    >
                                        <FaHandHoldingUsd size={12} /> {estaEquipado ? 'Desequipe para Vender' : `Vender por ${valorVenda}z`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {itensInventario.length === 0 && (
                        <div className="loja-vazio">
                            <p style={{ margin: 0 }}>Sua mochila está vazia. Não há itens para vender.</p>
                        </div>
                    )}
                </div>
            )}

            {modalAberto && itemSelecionadoParaCompra && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaShoppingCart color="#238636" /> Adquirir Item
                        </h3>

                        <div style={{ background: '#0d1117', padding: '12px', borderRadius: '8px', border: '1px solid #30363d' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#c9d1d9' }}>{itemSelecionadoParaCompra.nome}</p>
                            <p style={{ margin: 0, color: '#d4af37', fontSize: '0.9rem' }}>Preço: {itemSelecionadoParaCompra.custo || 0} zênites</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: 'bold' }}>O que deseja fazer com o item?</label>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setDestinoCompra('mochila')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: `1px solid ${destinoCompra === 'mochila' ? '#58a6ff' : '#30363d'}`, background: destinoCompra === 'mochila' ? 'rgba(88, 166, 255, 0.1)' : '#0d1117', color: '#c9d1d9', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                >
                                    <FaBoxOpen color="#58a6ff" /> Guardar na Mochila
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDestinoCompra('equipar')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: `1px solid ${destinoCompra === 'equipar' ? '#238636' : '#30363d'}`, background: destinoCompra === 'equipar' ? 'rgba(35, 134, 54, 0.1)' : '#0d1117', color: '#c9d1d9', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                >
                                    <FaShieldAlt color="#238636" /> Equipar Imediatamente
                                </button>
                            </div>
                        </div>

                        {destinoCompra === 'equipar' && (() => {
                            const tipo = (itemSelecionadoParaCompra.tipo || '').toLowerCase();
                            const ehArmaPura = tipo.includes('arma') && !tipo.includes('armadura');
                            const ehDuasMaos = tipo.includes('2h') || tipo.includes('duas mãos');
                            return ehArmaPura && !ehDuasMaos;
                        })() && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: 'bold' }}>Escolha o slot de mão:</label>
                                <select
                                    value={slotEscolhido}
                                    onChange={(e) => setSlotEscolhido(e.target.value)}
                                    style={{ background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px', outline: 'none' }}
                                >
                                    <option value="mao_dominante">Mão Dominante</option>
                                    <option value="mao_secundaria">Mão Não Dominante</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={processando}
                                style={{ background: 'transparent', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarCompra}
                                disabled={processando}
                                style={{ background: '238636', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {processando ? 'Processando...' : 'Confirmar Compra'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}