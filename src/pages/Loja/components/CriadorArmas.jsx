import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export default function CriadorArmas({ onSalvarItem }) {
    const [subMetodo, setSubMetodo] = useState('padrao_raro'); // 'padrao_raro' ou 'personalizada_atlas'

    // --- ESTADOS: ARMA RARA (LIVRO BÁSICO) ---
    const [itensBaseComuns, setItensBaseComuns] = useState([]);
    const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
    const [tipoDano, setTipoDano] = useState('Físico');
    const [modMao, setModMao] = useState('normal');
    const [bonusPrecisaoArma, setBonusPrecisaoArma] = useState(false);
    const [bonusDanoExtraArma, setBonusDanoExtraArma] = useState(false);
    const [atributoUnico, setAtributoUnico] = useState(false);
    const [atributoEscolhido, setAtributoEscolhido] = useState('Destreza');
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);

    // --- ESTADOS: ARMA PERSONALIZADA (ATLAS) ---
    const [raridadePers, setRaridadePers] = useState('padrao'); // 'padrao' ou 'rara'
    const [categoriaPers, setCategoriaPers] = useState('espada');
    const [alcancePers, setAlcancePers] = useState('Corpo a corpo');
    const [precisaoPers, setPrecisaoPers] = useState('(DES + AST)');
    const [personalizacoesAtlas, setPersonalizacoesAtlas] = useState([]);
    const [temMutavel, setTemMutavel] = useState(false);
    const [nomeSegundaForma, setNomeSegundaForma] = useState('');

    const [nomeItem, setNomeItem] = useState('');

    // Lista oficial de personalizações do Atlas (segura e sem depender de tabela nova no banco)
    const listaPersonalizacoesAtlas = [
        { id: 'defesa', nome: 'Aumento na Defesa (+2 Defesa, conta como escudo)', custoExtra: 0, marcial: false },
        { id: 'defesa_magica', nome: 'Aumento na Defesa Mágica (+2 Def. Mágica)', custoExtra: 0, marcial: true },
        { id: 'certeira', nome: 'Certeira (+2 Precisão)', custoExtra: 0, marcial: false },
        { id: 'elemental', nome: 'Elemental (Dano Elemental + 2 dano extra)', custoExtra: 0, marcial: false },
        { id: 'mutavel', nome: 'Mutável (Adiciona uma 2ª forma)', custoExtra: 100, marcial: false, especial: 'mutavel' },
        { id: 'poderosa', nome: 'Poderosa (+5 ou +7 dano se Pesada)', custoExtra: 0, marcial: true },
        { id: 'rapida', nome: 'Rápida (Dois ataques - Conta por 2 vagas)', custoExtra: 0, marcial: true, vagas: 2 }
    ];

    // Carregar dados base do Supabase com segurança contra erros 500
    useEffect(() => {
        async function carregarDadosForja() {
            try {
                if (subMetodo === 'padrao_raro') {
                    const { data: dadosComuns } = await supabase
                        .from('itens_catalogo')
                        .select('*')
                        .eq('stats->>raridade', 'comum');

                    const { data: dadosCatalogo } = await supabase
                        .from('catalogo_itens')
                        .select('*');

                    if (dadosComuns) {
                        const filtradas = dadosComuns.filter(i => i.tipo === 'arma');
                        setItensBaseComuns(filtradas);
                        if (filtradas.length > 0) setItemBaseSelecionado(filtradas[0]);
                    }

                    if (dadosCatalogo) {
                        const nenhuma = { id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' };
                        const permitidas = [
                            nenhuma,
                            ...dadosCatalogo.filter(i => i.tipo_item === 'caracteristica_arma_ofensiva' || i.tipo_item === 'caracteristica_arma_defensiva')
                        ];
                        setCaracteristicasDisponiveis(permitidas);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar dados da forja:", err);
            }

            setCaracteristicaSelecionada(null);
            setModMao('normal');
            setBonusPrecisaoArma(false);
            setBonusDanoExtraArma(false);
            setAtributoUnico(false);
        }

        carregarDadosForja();
    }, [subMetodo]);

    const itensBaseFiltrados = itensBaseComuns;

    // --- ANÁLISE DA ARMA BASE (RARA) ---
    const statsBase = itemBaseSelecionado?.stats || itemBaseSelecionado?.stats_personalizados || {};
    const baseEhDuasMaos = statsBase.maos === 2 || statsBase.mao === 'duas' || String(statsBase.maos || '').toLowerCase().includes('duas') || (itemBaseSelecionado?.nome || '').toLowerCase().includes('duas mãos');
    const nomeBaseLower = (itemBaseSelecionado?.nome || '').toLowerCase();
    const categoriaProibida = nomeBaseLower.includes('adaga') || nomeBaseLower.includes('arremessável') || nomeBaseLower.includes('luta') || nomeBaseLower.includes('brawling');

    // --- CÁLCULOS DE CUSTO E STATUS (RARA) ---
    let custoBaseItem = itemBaseSelecionado?.preco || itemBaseSelecionado?.custo_base || itemBaseSelecionado?.custo || 100;

    let modDanoFinal = 0;
    if (modMao === '1_para_2') modDanoFinal += 4;
    if (modMao === '2_para_1') modDanoFinal -= 4;
    if (bonusDanoExtraArma) modDanoFinal += 4;

    const extrairNumeroDano = (val) => {
        if (!val) return 6;
        if (typeof val === 'number') return val;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : 6;
    };

    const danoBaseOriginal = extrairNumeroDano(statsBase.dano || itemBaseSelecionado?.dano || itemBaseSelecionado?.dano_base || 6);
    const bonusDanoFinalNumerico = danoBaseOriginal + modDanoFinal;
    const ehMarcialRaro = bonusDanoFinalNumerico >= 10;

    const custoTipoDano = tipoDano !== 'Físico' ? 100 : 0;
    const custoBonusPrecisao = bonusPrecisaoArma ? 100 : 0;
    const custoBonusDano = bonusDanoExtraArma ? 200 : 0;
    const custoAtribUnico = atributoUnico ? 50 : 0;
    const custoCaracteristica = caracteristicaSelecionada?.custo || 0;

    const precoTotalRaro = custoBaseItem + custoTipoDano + custoBonusPrecisao + custoBonusDano + custoAtribUnico + custoCaracteristica;

    // --- CÁLCULOS: ATLAS ---
    const custoBaseAtlas = 300;
    const custoPersAtlas = personalizacoesAtlas.reduce((acc, p) => acc + p.custoExtra, 0);
    const adicionalRaro = raridadePers === 'rara' ? 200 : 0;
    const precoAtlasFinal = custoBaseAtlas + custoPersAtlas + adicionalRaro;

    const bonusDanoAtlas = (personalizacoesAtlas.some(p => p.id === 'elemental') ? 2 : 0) + (personalizacoesAtlas.some(p => p.id === 'poderosa') ? (categoriaPers === 'pesada' ? 7 : 5) : 0);
    const danoAtlasNum = 5 + bonusDanoAtlas;
    const ehMarcialAtlas = personalizacoesAtlas.some(p => p.marcial) || danoAtlasNum >= 10;

    const precoFinal = subMetodo === 'padrao_raro' ? precoTotalRaro : precoAtlasFinal;
    const danoFinalStr = subMetodo === 'padrao_raro' ? `RA + ${bonusDanoFinalNumerico}` : `RA + ${danoAtlasNum}`;
    const ehMarcialFinal = subMetodo === 'padrao_raro' ? ehMarcialRaro : ehMarcialAtlas;

    const togglePersAtlas = (item) => {
        if (personalizacoesAtlas.some(p => p.id === item.id)) {
            setPersonalizacoesAtlas(personalizacoesAtlas.filter(p => p.id !== item.id));
            if (item.id === 'mutavel') setTemMutavel(false);
        } else {
            const vagasOcupadas = personalizacoesAtlas.reduce((acc, p) => acc + (p.vagas || 1), 0);
            if (vagasOcupadas + (item.vagas || 1) > 3) {
                alert('Limite de 3 personalizações atingido!');
                return;
            }
            setPersonalizacoesAtlas([...personalizacoesAtlas, item]);
            if (item.id === 'mutavel') setTemMutavel(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para a arma!');
        if (subMetodo === 'padrao_raro' && !itemBaseSelecionado) return alert('Selecione um item base!');

        const efeitosAplicados = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];
        if (subMetodo === 'personalizada_atlas') {
            personalizacoesAtlas.forEach(p => efeitosAplicados.push(p.nome));
        }

        const ehDuasMaosFinal = baseEhDuasMaos ? (modMao !== '2_para_1') : (modMao === '1_para_2');
        const strMaos = ehDuasMaosFinal ? "Duas mãos" : "Uma mão";

        let stringPrecisao = statsBase.precisao || "(DES + AST)";
        if (atributoUnico) {
            const siglaAtrib = atributoEscolhido.substring(0, 3).toUpperCase();
            stringPrecisao = `(${siglaAtrib} + ${siglaAtrib})`;
        }
        const bonusPrecTotal = bonusPrecisaoArma ? 1 : 0;
        const precisaoFinalFormatada = bonusPrecTotal > 0 ? `${stringPrecisao} + ${bonusPrecTotal}` : stringPrecisao;

        const stats = subMetodo === 'padrao_raro' ? {
            dano: danoFinalStr,
            maos: strMaos,
            alcance: statsBase.alcance || "Corpo a corpo",
            marcial: ehMarcialFinal,
            precisao: precisaoFinalFormatada,
            raridade: "raro",
            categoria: statsBase.categoria || itemBaseSelecionado?.tipo || "Arma",
            tipo_dano: tipoDano.toLowerCase(),
            // slot: ehDuasMaosFinal ? 'duas_maos' : 'mao_dominante',
            equipado: false,
            custo: precoFinal,
            efeitos: efeitosAplicados
        } : {
            dano: danoFinalStr,
            maos: 'Duas mãos',
            alcance: alcancePers,
            marcial: ehMarcialFinal,
            precisao: precisaoPers,
            categoria: categoriaPers,
            raridade: raridadePers === 'rara' ? 'personalizada_rara' : 'personalizada',
            custo: precoFinal,
            efeitos: efeitosAplicados,
            ...(temMutavel ? {
                mutavel: true,
                segunda_forma: { nome: nomeSegundaForma, categoria: categoriaPers, alcance: alcancePers }
            } : {})
        };

        const nomeFormatado = subMetodo === 'padrao_raro' ? `${nomeItem} (${tipoDano})` : nomeItem;

        onSalvarItem({
            nome: nomeFormatado,
            tipo: 'arma',
            custo: precoFinal,
            stats
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                <button
                    type="button"
                    onClick={() => setSubMetodo('padrao_raro')}
                    style={{ flex: 1, padding: '6px', background: subMetodo === 'padrao_raro' ? '#1f6feb' : '#161b22', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Arma Rara (Livro Básico)
                </button>
                <button
                    type="button"
                    onClick={() => setSubMetodo('personalizada_atlas')}
                    style={{ flex: 1, padding: '6px', background: subMetodo === 'personalizada_atlas' ? '#1f6feb' : '#161b22', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Arma Personalizada (Atlas)
                </button>
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Nome da Arma</label>
                <input
                    type="text"
                    value={nomeItem}
                    onChange={e => setNomeItem(e.target.value)}
                    placeholder="Ex: Lâmina do Crepúsculo"
                    style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                />
            </div>

            {subMetodo === 'padrao_raro' ? (
                <>
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
                    </div>

                    <fieldset style={{ border: '1px solid #30363d', padding: '12px', borderRadius: '6px' }}>
                        <legend style={{ fontSize: '0.8rem', color: '#d4af37', padding: '0 5px', fontWeight: 'bold' }}>Modificações e Alterações da Arma</legend>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Característica Especial (Máximo de 1)</label>
                        <select
                            onChange={e => {
                                const idx = e.target.value;
                                if (idx === 'nenhuma') setCaracteristicaSelecionada(null);
                                else setCaracteristicaSelecionada(caracteristicasDisponiveis[idx]);
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
                </>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '3px' }}>Versão</label>
                            <select value={raridadePers} onChange={e => setRaridadePers(e.target.value)} style={{ width: '100%', padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <option value="padrao">Padrão (300z)</option>
                                <option value="rara">Rara / Aprimorada</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '3px' }}>Categoria</label>
                            <select value={categoriaPers} onChange={e => setCategoriaPers(e.target.value)} style={{ width: '100%', padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}>
                                {['adaga', 'arcana', 'arco', 'arremessável', 'arma de fogo', 'espada', 'lança', 'luta', 'malho', 'pesada'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '3px' }}>Alcance</label>
                            <select value={alcancePers} onChange={e => setAlcancePers(e.target.value)} style={{ width: '100%', padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <option value="Corpo a corpo">Corpo a corpo</option>
                                <option value="À distância">À distância</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '3px' }}>Precisão</label>
                            <select value={precisaoPers} onChange={e => setPrecisaoPers(e.target.value)} style={{ width: '100%', padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <option value="(DES + AST)">(DES + AST)</option>
                                <option value="(DES + VIG)">(DES + VIG)</option>
                            </select>
                        </div>
                    </div>

                    <fieldset style={{ border: '1px solid #30363d', padding: '10px', borderRadius: '6px' }}>
                        <legend style={{ fontSize: '0.78rem', color: '#d4af37', padding: '0 4px', fontWeight: 'bold' }}>Personalizações (Até 3 vagas)</legend>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                            {listaPersonalizacoesAtlas.map(p => (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={personalizacoesAtlas.some(item => item.id === p.id)} onChange={() => togglePersAtlas(p)} />
                                    <span>{p.nome} {p.custoExtra > 0 ? `(+${p.custoExtra}z)` : ''} {p.marcial ? <PiStarFourFill style={{ color: '#bc3025', stroke: 'black', strokeWidth: '10px', display: 'inline-flex' }} /> : ''}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {temMutavel && (
                        <input type="text" value={nomeSegundaForma} onChange={e => setNomeSegundaForma(e.target.value)} placeholder="Nome da 2ª forma (Mutável)" style={{ width: '100%', padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }} />
                    )}
                </>
            )}

            <div style={{ background: '#0d0f18', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '0.85rem', color: '#8b949e' }}>
                        Dano: <strong style={{ color: '#58a6ff' }}>{danoFinalStr}</strong> {ehMarcialFinal && <span style={{ color: '#f85149' }}>(Arma Marcial ⚔️)</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#8b949e', marginTop: '2px' }}>
                        Custo Total: <strong style={{ color: '#2ecc71', fontSize: '1.1rem' }}>{precoFinal} zênites</strong>
                    </div>
                </div>
                <button type="submit" style={{ background: '#238636', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Forjar Arma
                </button>
            </div>
        </form>
    );
}