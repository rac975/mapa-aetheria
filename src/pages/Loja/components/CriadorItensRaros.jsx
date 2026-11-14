import React, { useState, useEffect } from 'react';
import { FaHammer, FaCheckCircle, FaShieldAlt, FaRing, FaCrosshairs } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';

export default function CriadorItensRaros({ ficha, onCriado }) {
    // Abas: 'arma', 'armadura', 'acessorio'
    const [tipoCriacao, setTipoCriacao] = useState('arma');
    const [nomeItem, setNomeItem] = useState('');

    // Dados vindos do banco
    const [itensBaseComuns, setItensBaseComuns] = useState([]);
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);

    // Seleções do usuário
    const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
    const [tipoDano, setTipoDano] = useState('Físico');

    // Modificações exclusivas de armas
    const [modMao, setModMao] = useState('normal'); // 'normal', '1_para_2', '2_para_1'
    const [bonusPrecisaoArma, setBonusPrecisaoArma] = useState(false); // +100z
    const [bonusDanoExtraArma, setBonusDanoExtraArma] = useState(false); // +200z (+4 dano)
    const [atributoUnico, setAtributoUnico] = useState(false); // +50z
    const [atributoEscolhido, setAtributoEscolhido] = useState('Destreza');

    // Característica única selecionada
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);

    const [salvando, setSalvando] = useState(false);

    // Carregar itens base (comuns) e características do Supabase
    useEffect(() => {
        async function carregarDadosForja() {
            const { data: dadosComuns } = await supabase
                .from('itens_catalogo')
                .select('*')
                .eq('stats->>raridade', 'comum')
                .not('nome', 'ilike', '%improvisada%')
                .not('nome', 'ilike', '%sem armadura%');

            const { data: dadosCatalogo } = await supabase
                .from('catalogo_itens')
                .select('*');

            if (dadosComuns) {
                setItensBaseComuns(dadosComuns);
                const filtrados = dadosComuns.filter(i => i.tipo === tipoCriacao);
                if (filtrados.length > 0) setItemBaseSelecionado(filtrados[0]);
                else setItemBaseSelecionado(null);
            }

            if (dadosCatalogo) {
                const nenhuma = { id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' };
                let permitidas = [nenhuma];

                if (tipoCriacao === 'arma') {
                    permitidas = [
                        ...permitidas,
                        ...dadosCatalogo.filter(i => i.tipo_item === 'caracteristica_arma_ofensiva' || i.tipo_item === 'caracteristica_arma_defensiva')
                    ];
                } else if (tipoCriacao === 'armadura') {
                    permitidas = [
                        ...permitidas,
                        ...dadosCatalogo.filter(i => i.tipo_item === 'caracteristica_armadura_defensiva' || i.tipo_item === 'caracteristica_armadura_melhoria')
                    ];
                } else if (tipoCriacao === 'acessorio') {
                    permitidas = [
                        ...permitidas,
                        ...dadosCatalogo.filter(i => i.tipo_item === 'caracteristica_acessorio_defensiva' || i.tipo_item === 'caracteristica_acessorio_melhoria')
                    ];
                }

                setCaracteristicasDisponiveis(permitidas);
            }

            setCaracteristicaSelecionada(null);
            setModMao('normal');
            setBonusPrecisaoArma(false);
            setBonusDanoExtraArma(false);
            setAtributoUnico(false);
            setAtributoEscolhido('Destreza');
        }

        carregarDadosForja();
    }, [tipoCriacao]);

    const itensBaseFiltrados = itensBaseComuns.filter(i => i.tipo === tipoCriacao);

    // --- ANÁLISE DA ARMA BASE ---
    const statsBase = itemBaseSelecionado?.stats || itemBaseSelecionado?.stats_personalizados || {};

    const baseEhDuasMaos = statsBase.maos === 2 || statsBase.mao === 'duas' || String(statsBase.maos || '').toLowerCase().includes('duas') || (itemBaseSelecionado?.nome || '').toLowerCase().includes('duas mãos');

    const nomeBaseLower = (itemBaseSelecionado?.nome || '').toLowerCase();
    const categoriaProibida = nomeBaseLower.includes('adaga') || nomeBaseLower.includes('arremessável') || nomeBaseLower.includes('luta') || nomeBaseLower.includes('brawling');

    // --- CÁLCULOS DE CUSTO E STATUS ---
    let custoBaseItem = itemBaseSelecionado?.preco || itemBaseSelecionado?.custo_base || itemBaseSelecionado?.custo || 100;

    let modDanoFinal = 0;
    if (modMao === '1_para_2') modDanoFinal += 4;
    if (modMao === '2_para_1') modDanoFinal -= 4;
    if (bonusDanoExtraArma) modDanoFinal += 4;

    // Extrai o valor numérico do dano base com segurança
    const extrairNumeroDano = (val) => {
        if (!val) return 6;
        if (typeof val === 'number') return val;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : 6;
    };

    const danoBaseOriginal = extrairNumeroDano(statsBase.dano || itemBaseSelecionado?.dano || itemBaseSelecionado?.dano_base || 6);
    const bonusDanoFinalNumerico = danoBaseOriginal + modDanoFinal;

    // Regra: Se o bônus de dano final for >= +10, torna-se arma marcial automaticamente
    const ehMarcial = bonusDanoFinalNumerico >= 10;

    const custoTipoDano = (tipoCriacao === 'arma' && tipoDano !== 'Físico') ? 100 : 0;
    const custoBonusPrecisao = bonusPrecisaoArma ? 100 : 0;
    const custoBonusDano = bonusDanoExtraArma ? 200 : 0;
    const custoAtribUnico = atributoUnico ? 50 : 0;
    const custoCaracteristica = caracteristicaSelecionada?.custo || 0;

    const precoTotal =
        custoBaseItem +
        custoTipoDano +
        custoBonusPrecisao +
        custoBonusDano +
        custoAtribUnico +
        custoCaracteristica;

    // --- SALVAR NO SUPABASE ---
    const handleSalvarItemRaro = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para o seu item raro!');
        if (tipoCriacao !== 'acessorio' && !itemBaseSelecionado) return alert('Selecione um item base!');

        setSalvando(true);

        const efeitosAplicados = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];

        // Tratativa limpa para empunhadura e mãos
        const ehDuasMaosFinal = baseEhDuasMaos ? (modMao !== '2_para_1') : (modMao === '1_para_2');
        const strMaos = ehDuasMaosFinal ? "Duas mãos" : "Uma mão";

        // Formatação limpa de precisão no padrão do sistema
        let stringPrecisao = statsBase.precisao || "(DES + AST)";
        if (atributoUnico) {
            const siglaAtrib = atributoEscolhido.substring(0, 3).toUpperCase();
            stringPrecisao = `(${siglaAtrib} + ${siglaAtrib})`;
        }
        const bonusPrecTotal = bonusPrecisaoArma ? 1 : 0;
        const precisaoFinalFormatada = bonusPrecTotal > 0 ? `${stringPrecisao} + ${bonusPrecTotal}` : stringPrecisao;

        const statsPersonalizados = tipoCriacao === 'arma' ? {
            dano: `RA + ${bonusDanoFinalNumerico}`,
            maos: strMaos,
            alcance: statsBase.alcance || "Corpo a corpo",
            marcial: ehMarcial,
            precisao: precisaoFinalFormatada,
            raridade: "raro",
            categoria: statsBase.categoria || itemBaseSelecionado?.tipo || "Arma",
            tipo_dano: tipoDano.toLowerCase(),
            slot: ehDuasMaosFinal ? 'duas_maos' : 'mao_dominante',
            custo: precoTotal, // Guarda o custo total embutido para futuros cálculos de venda/revenda
            efeitos: efeitosAplicados
        } : {
            slot: tipoCriacao === 'armadura' ? 'armadura' : 'acessorio',
            raridade: "raro",
            custo: precoTotal,
            efeitos: efeitosAplicados
        };

        const nomeFormatado = tipoCriacao === 'arma' ? `${nomeItem} (${tipoDano})` : nomeItem;

        let erroBanco = null;

        if (ficha && ficha.id) {
            // Salvar na ficha do personagem (sem violar colunas ausentes na tabela)
            const novoItemPersonagem = {
                ficha_id: ficha.id,
                nome: nomeFormatado,
                tipo: tipoCriacao,
                stats_personalizados: statsPersonalizados
            };
            const { error } = await supabase.from('itens_personagem').insert([novoItemPersonagem]);
            erroBanco = error;
        } else {
            // Salvar no catálogo global de itens (Lojas / Mestre)
            const novoItemCatalogo = {
                nome: nomeFormatado,
                tipo: tipoCriacao,
                custo: precoTotal,
                descricao: caracteristicaSelecionada?.efeito || 'Item raro forjado.',
                stats: statsPersonalizados
            };
            const { error } = await supabase.from('itens_catalogo').insert([novoItemCatalogo]);
            erroBanco = error;
        }

        setSalvando(false);

        if (erroBanco) {
            alert('Erro ao forjar item: ' + erroBanco.message);
        } else {
            alert('Item raro forjado e salvo com sucesso!');
            if (onCriado) onCriado();
            setNomeItem('');
            setCaracteristicaSelecionada(null);
        }
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', color: '#c9d1d9', maxWidth: '650px', margin: '20px auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d4af37', fontSize: '1.2rem', marginBottom: '15px' }}>
                <FaHammer /> Oficina de Itens Raros (Fabula Ultima)
            </h2>

            {/* Abas de Escolha */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    type="button"
                    className='btn-itens-raros'
                    onClick={() => setTipoCriacao('arma')}
                    style={{ flex: 1, padding: '8px', background: tipoCriacao === 'arma' ? '#238636' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <FaCrosshairs /> Arma Rara
                </button>
                <button
                    type="button"
                    className='btn-itens-raros'
                    onClick={() => setTipoCriacao('armadura')}
                    style={{ flex: 1, padding: '8px', background: tipoCriacao === 'armadura' ? '#238636' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <FaShieldAlt /> Armadura / Escudo
                </button>
                <button
                    type="button"
                    className='btn-itens-raros'
                    onClick={() => setTipoCriacao('acessorio')}
                    style={{ flex: 1, padding: '8px', background: tipoCriacao === 'acessorio' ? '#238636' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <FaRing /> Acessório
                </button>
            </div>

            <form onSubmit={handleSalvarItemRaro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Nome do Item Raro</label>
                    <input
                        type="text"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Lâmina do Crepúsculo"
                        style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                    />
                </div>

                {tipoCriacao !== 'acessorio' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Item Base Comum</label>
                            <select
                                onChange={e => {
                                    const idx = e.target.value;
                                    setItemBaseSelecionado(itensBaseFiltrados[idx]);
                                    setModMao('normal');
                                }}
                                style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                            >
                                {itensBaseFiltrados.map((item, idx) => (
                                    <option key={item.id || idx} value={idx}>{item.nome_item || item.nome}</option>
                                ))}
                            </select>
                        </div>

                        {tipoCriacao === 'arma' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Tipo de Dano (+100z se elemental)</label>
                                <select
                                    value={tipoDano}
                                    onChange={e => setTipoDano(e.target.value)}
                                    style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                                >
                                    {['Físico', 'Ar', 'Fogo', 'Gelo', 'Luz', 'Raio', 'Terra', 'Trevas', 'Veneno'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Modificações e Alterações Oficiais de Armas */}
                {tipoCriacao === 'arma' && (
                    <fieldset style={{ border: '1px solid #30363d', padding: '12px', borderRadius: '6px' }}>
                        <legend style={{ fontSize: '0.8rem', color: '#d4af37', padding: '0 5px', fontWeight: 'bold' }}>Modificações e Alterações da Arma</legend>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                            
                            {/* Ajuste de Empunhadura Condicional */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: '#8b949e', marginBottom: '4px' }}>Ajuste de Empunhadura</label>
                                {baseEhDuasMaos ? (
                                    <select
                                        value={modMao}
                                        onChange={e => setModMao(e.target.value)}
                                        style={{ width: '100%', padding: '6px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}
                                    >
                                        <option value="normal">Manter Duas Mãos (Sem alteração)</option>
                                        <option value="2_para_1">Transformar em Uma Mão: Reduz o dano em -4</option>
                                    </select>
                                ) : categoriaProibida ? (
                                    <p style={{ fontSize: '0.78rem', color: '#f85149', fontStyle: 'italic' }}>Armas das categorias Adaga, Arremessável ou Luta não podem ser alteradas para duas mãos.</p>
                                ) : (
                                    <select
                                        value={modMao}
                                        onChange={e => setModMao(e.target.value)}
                                        style={{ width: '100%', padding: '6px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}
                                    >
                                        <option value="normal">Manter Uma Mão (Sem alteração)</option>
                                        <option value="1_para_2">Transformar em Duas Mãos: Aumenta o dano em +4</option>
                                    </select>
                                )}
                            </div>

                            {/* Checkboxes de Bônus Oficiais */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={bonusPrecisaoArma} onChange={e => setBonusPrecisaoArma(e.target.checked)} />
                                    <span>+1 no Teste de Precisão <strong style={{ color: '#d4af37' }}>(+100z)</strong></span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={bonusDanoExtraArma} onChange={e => setBonusDanoExtraArma(e.target.checked)} />
                                    <span>+4 no Dano da Arma <strong style={{ color: '#d4af37' }}>(+200z)</strong></span>
                                </label>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={atributoUnico} onChange={e => setAtributoUnico(e.target.checked)} />
                                        <span>Precisão baseada em 1 Único Atributo <strong style={{ color: '#d4af37' }}>(+50z)</strong></span>
                                    </label>

                                    {atributoUnico && (
                                        <div style={{ marginTop: '8px', marginLeft: '24px' }}>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: '#8b949e', marginBottom: '3px' }}>Selecione o Atributo:</label>
                                            <select
                                                value={atributoEscolhido}
                                                onChange={e => setAtributoEscolhido(e.target.value)}
                                                style={{ width: '100%', padding: '6px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}
                                            >
                                                <option value="Destreza">Destreza + Destreza (Des + Des)</option>
                                                <option value="Astucia">Astúcia + Astúcia (Ast + Ast)</option>
                                                <option value="Vigor">Vigor + Vigor (Vig + Vig)</option>
                                                <option value="Vontade">Vontade + Vontade (Von + Von)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </fieldset>
                )}

                {/* Seletor Único de Característica Especial */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Característica Especial (Máximo de 1)</label>
                    <select
                        onChange={e => {
                            const idx = e.target.value;
                            if (idx === 'nenhuma') {
                                setCaracteristicaSelecionada(null);
                            } else {
                                setCaracteristicaSelecionada(caracteristicasDisponiveis[idx]);
                            }
                        }}
                        style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                    >
                        {caracteristicasDisponiveis.map((c, idx) => (
                            <option key={c.id || idx} value={c.id === 'nenhuma' ? 'nenhuma' : idx}>
                                {c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}
                            </option>
                        ))}
                    </select>
                    {caracteristicaSelecionada?.efeito && (
                        <p style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: '4px', fontStyle: 'italic' }}>
                            Efeito: {caracteristicaSelecionada.efeito}
                        </p>
                    )}
                </div>

                {/* Resumo Dinâmico de Custo e Stats */}
                <div style={{ background: '#0d0f18', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div>
                        {tipoCriacao === 'arma' && (
                            <div style={{ fontSize: '0.85rem', color: '#8b949e' }}>
                                Dano Final: <strong style={{ color: '#58a6ff' }}>RA + {bonusDanoFinalNumerico}</strong> {ehMarcial && <span style={{ color: '#f85149' }}>(Arma Marcial)</span>}
                                {atributoUnico && <div style={{ fontSize: '0.78rem', color: '#d4af37' }}>Precisão: {atributoEscolhido} + {atributoEscolhido}</div>}
                            </div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#8b949e', marginTop: '2px' }}>
                            Custo Total: <strong style={{ color: '#2ecc71', fontSize: '1.1rem' }}>{precoTotal} zênites</strong>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={salvando}
                        style={{ background: '#238636', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        <FaCheckCircle /> {salvando ? 'Forjando...' : 'Forjar e Salvar'}
                    </button>
                </div>
            </form>
        </div>
    );
}