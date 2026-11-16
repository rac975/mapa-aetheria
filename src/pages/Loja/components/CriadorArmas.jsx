import { useState, useEffect } from 'react';
import { FaCoins, FaHammer, FaPrint, FaStar, FaShieldAlt } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { Button, Badge, Input, Card } from '../../../components/ui';
import styles from './CriadorArmas.module.css';

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

    // Lista oficial de personalizações do Atlas
    const listaPersonalizacoesAtlas = [
        { id: 'defesa', nome: 'Aumento na Defesa (+2 Defesa, conta como escudo)', custoExtra: 0, marcial: false },
        { id: 'defesa_magica', nome: 'Aumento na Defesa Mágica (+2 Def. Mágica)', custoExtra: 0, marcial: true },
        { id: 'certeira', nome: 'Certeira (+2 Precisão)', custoExtra: 0, marcial: false },
        { id: 'elemental', nome: 'Elemental (Dano Elemental + 2 dano extra)', custoExtra: 0, marcial: false },
        { id: 'mutavel', nome: 'Mutável (Adiciona uma 2ª forma)', custoExtra: 100, marcial: false, especial: 'mutavel' },
        { id: 'poderosa', nome: 'Poderosa (+5 ou +7 dano se Pesada)', custoExtra: 0, marcial: true },
        { id: 'rapida', nome: 'Rápida (Dois ataques - Conta por 2 vagas)', custoExtra: 0, marcial: true, vagas: 2 }
    ];

    // Carregar dados base do Supabase
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
    const custoBaseItem = itemBaseSelecionado?.preco || itemBaseSelecionado?.custo_base || itemBaseSelecionado?.custo || 100;

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
    const vagasOcupadasAtlas = personalizacoesAtlas.reduce((acc, p) => acc + (p.vagas || 1), 0);

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

    const ehDuasMaosFinal = baseEhDuasMaos ? (modMao !== '2_para_1') : (modMao === '1_para_2');
    const strMaosFinal = subMetodo === 'padrao_raro' ? (ehDuasMaosFinal ? "Duas mãos" : "Uma mão") : "Duas mãos";

    let stringPrecisao = statsBase.precisao || "(DES + AST)";
    if (atributoUnico) {
        const siglaAtrib = atributoEscolhido.substring(0, 3).toUpperCase();
        stringPrecisao = `(${siglaAtrib} + ${siglaAtrib})`;
    }
    const bonusPrecTotal = bonusPrecisaoArma ? 1 : 0;
    const precisaoFinalFormatada = bonusPrecTotal > 0 ? `${stringPrecisao} + ${bonusPrecTotal}` : stringPrecisao;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para a arma!');
        if (subMetodo === 'padrao_raro' && !itemBaseSelecionado) return alert('Selecione um item base!');

        const efeitosAplicados = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];
        if (subMetodo === 'personalizada_atlas') {
            personalizacoesAtlas.forEach(p => efeitosAplicados.push(p.nome));
        }

        const stats = subMetodo === 'padrao_raro' ? {
            dano: danoFinalStr,
            maos: strMaosFinal,
            alcance: statsBase.alcance || "Corpo a corpo",
            marcial: ehMarcialFinal,
            precisao: precisaoFinalFormatada,
            raridade: "raro",
            categoria: statsBase.categoria || itemBaseSelecionado?.tipo || "Arma",
            tipo_dano: tipoDano.toLowerCase(),
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

    const nomeExibicao = nomeItem || 'Arma Forjada';

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.forjaCard}>
                <nav className={styles.subMetodoNav} aria-label="Modo de Criação">
                    <Button
                        variant={subMetodo === 'padrao_raro' ? 'primary' : 'ghost'}
                        size="sm"
                        fullWidth
                        onClick={() => setSubMetodo('padrao_raro')}
                    >
                        Arma Rara (Livro Básico)
                    </Button>
                    <Button
                        variant={subMetodo === 'personalizada_atlas' ? 'primary' : 'ghost'}
                        size="sm"
                        fullWidth
                        onClick={() => setSubMetodo('personalizada_atlas')}
                    >
                        Arma Personalizada (Atlas)
                    </Button>
                </nav>

                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <Input
                        label="Nome da Arma"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Lâmina do Crepúsculo"
                    />

                    {subMetodo === 'padrao_raro' ? (
                        <>
                            <div className={styles.gridDuasColunas}>
                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-item-base" className={styles.labelCampo}>
                                        Item Base Comum
                                    </label>
                                    <select
                                        id="select-item-base"
                                        className={styles.selectCampo}
                                        onChange={e => {
                                            const idx = e.target.value;
                                            setItemBaseSelecionado(itensBaseFiltrados[idx]);
                                            setModMao('normal');
                                        }}
                                    >
                                        {itensBaseFiltrados.map((item, idx) => (
                                            <option key={item.id || idx} value={idx}>
                                                {item.nome_item || item.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-tipo-dano" className={styles.labelCampo}>
                                        Tipo de Dano (+100z se elemental)
                                    </label>
                                    <select
                                        id="select-tipo-dano"
                                        value={tipoDano}
                                        onChange={e => setTipoDano(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        {['Físico', 'Ar', 'Fogo', 'Gelo', 'Luz', 'Raio', 'Terra', 'Trevas', 'Veneno'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <fieldset className={styles.fieldsetModificacoes}>
                                <legend className={styles.legendModificacoes}>Modificações e Alterações da Arma</legend>
                                <div className={styles.modificacoesLista}>
                                    <div className={styles.campoGrupo}>
                                        <label htmlFor="select-ajuste-mao" className={styles.labelCampo}>
                                            Ajuste de Empunhadura
                                        </label>
                                        {baseEhDuasMaos ? (
                                            <select
                                                id="select-ajuste-mao"
                                                value={modMao}
                                                onChange={e => setModMao(e.target.value)}
                                                className={styles.selectCampo}
                                            >
                                                <option value="normal">Manter Duas Mãos (Sem alteração)</option>
                                                <option value="2_para_1">Transformar em Uma Mão: Reduz o dano em -4</option>
                                            </select>
                                        ) : categoriaProibida ? (
                                            <p className={styles.textoAviso}>
                                                Armas das categorias Adaga, Arremessável ou Luta não podem ser alteradas para duas mãos.
                                            </p>
                                        ) : (
                                            <select
                                                id="select-ajuste-mao"
                                                value={modMao}
                                                onChange={e => setModMao(e.target.value)}
                                                className={styles.selectCampo}
                                            >
                                                <option value="normal">Manter Uma Mão (Sem alteração)</option>
                                                <option value="1_para_2">Transformar em Duas Mãos: Aumenta o dano em +4</option>
                                            </select>
                                        )}
                                    </div>

                                    <label className={styles.checkboxItem}>
                                        <input
                                            type="checkbox"
                                            checked={bonusPrecisaoArma}
                                            onChange={e => setBonusPrecisaoArma(e.target.checked)}
                                        />
                                        <span>+1 no Teste de Precisão <strong className={styles.textoDestaqueOuro}>(+100z)</strong></span>
                                    </label>

                                    <label className={styles.checkboxItem}>
                                        <input
                                            type="checkbox"
                                            checked={bonusDanoExtraArma}
                                            onChange={e => setBonusDanoExtraArma(e.target.checked)}
                                        />
                                        <span>+4 no Dano da Arma <strong className={styles.textoDestaqueOuro}>(+200z)</strong></span>
                                    </label>

                                    <div>
                                        <label className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                checked={atributoUnico}
                                                onChange={e => setAtributoUnico(e.target.checked)}
                                            />
                                            <span>Precisão baseada em 1 Único Atributo <strong className={styles.textoDestaqueOuro}>(+50z)</strong></span>
                                        </label>

                                        {atributoUnico && (
                                            <div className={styles.campoGrupo}>
                                                <label htmlFor="select-atrib-unico" className={styles.labelCampo}>
                                                    Selecione o Atributo:
                                                </label>
                                                <select
                                                    id="select-atrib-unico"
                                                    value={atributoEscolhido}
                                                    onChange={e => setAtributoEscolhido(e.target.value)}
                                                    className={styles.selectCampo}
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
                            </fieldset>

                            <div className={styles.campoGrupo}>
                                <label htmlFor="select-caracteristica" className={styles.labelCampo}>
                                    Característica Especial (Máximo de 1)
                                </label>
                                <select
                                    id="select-caracteristica"
                                    className={styles.selectCampo}
                                    onChange={e => {
                                        const idx = e.target.value;
                                        if (idx === 'nenhuma') setCaracteristicaSelecionada(null);
                                        else setCaracteristicaSelecionada(caracteristicasDisponiveis[idx]);
                                    }}
                                >
                                    {caracteristicasDisponiveis.map((c, idx) => (
                                        <option key={c.id || idx} value={c.id === 'nenhuma' ? 'nenhuma' : idx}>
                                            {c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}
                                        </option>
                                    ))}
                                </select>
                                {caracteristicaSelecionada?.efeito && (
                                    <p className={styles.efeitoDescricao}>
                                        Efeito: {caracteristicaSelecionada.efeito}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.gridQuatroColunas}>
                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-raridade-atlas" className={styles.labelCampo}>Versão</label>
                                    <select
                                        id="select-raridade-atlas"
                                        value={raridadePers}
                                        onChange={e => setRaridadePers(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        <option value="padrao">Padrão (300z)</option>
                                        <option value="rara">Rara / Aprimorada (+200z)</option>
                                    </select>
                                </div>

                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-categoria-atlas" className={styles.labelCampo}>Categoria</label>
                                    <select
                                        id="select-categoria-atlas"
                                        value={categoriaPers}
                                        onChange={e => setCategoriaPers(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        {['adaga', 'arcana', 'arco', 'arremessável', 'arma de fogo', 'espada', 'lança', 'luta', 'malho', 'pesada'].map(c => (
                                            <option key={c} value={c}>{c.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-alcance-atlas" className={styles.labelCampo}>Alcance</label>
                                    <select
                                        id="select-alcance-atlas"
                                        value={alcancePers}
                                        onChange={e => setAlcancePers(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        <option value="Corpo a corpo">Corpo a corpo</option>
                                        <option value="À distância">À distância</option>
                                    </select>
                                </div>

                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-precisao-atlas" className={styles.labelCampo}>Precisão</label>
                                    <select
                                        id="select-precisao-atlas"
                                        value={precisaoPers}
                                        onChange={e => setPrecisaoPers(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        <option value="(DES + AST)">(DES + AST)</option>
                                        <option value="(DES + VIG)">(DES + VIG)</option>
                                    </select>
                                </div>
                            </div>

                            <fieldset className={styles.fieldsetModificacoes}>
                                <legend className={styles.legendModificacoes}>
                                    Personalizações (Até 3 vagas)
                                </legend>
                                <div className={styles.modificacoesLista}>
                                    {listaPersonalizacoesAtlas.map(p => (
                                        <label key={p.id} className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                checked={personalizacoesAtlas.some(item => item.id === p.id)}
                                                onChange={() => togglePersAtlas(p)}
                                            />
                                            <span>
                                                {p.nome} {p.custoExtra > 0 ? `(+${p.custoExtra}z)` : ''}
                                                {p.marcial ? ' ⚔️' : ''}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            {temMutavel && (
                                <div className={styles.mutavelContainer}>
                                    <h4 className={styles.mutavelTitulo}>Configuração da 2ª Forma (Mutável)</h4>
                                    <Input
                                        placeholder="Nome da 2ª forma (Mutável)"
                                        value={nomeSegundaForma}
                                        onChange={e => setNomeSegundaForma(e.target.value)}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Dano: <span className={styles.resumoDanoValor}>{danoFinalStr}</span>
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {precoFinal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            {/* <Button
                                variant="ghost"
                                size="md"
                                onClick={() => window.print()}
                                title="Imprimir Carta Física para Mesa"
                            >
                                <FaPrint /> Imprimir Carta
                            </Button> */}
                            <Button type="submit" variant="primary" size="md">
                                <FaHammer /> Forjar Arma
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            {/* Visualização de Carta Física de Equipamento para a Mesa */}
            <section className={styles.previewArea} aria-label="Prévia da Carta de Equipamento">
                <div className={styles.previewTitulo}>
                    <FaShieldAlt /> Prévia da Carta de Equipamento (Pronta para Impressão)
                </div>

                <div className={styles.physicalCard}>
                    <div className={styles.cardHeaderFisica}>
                        <div>
                            <h4 className={styles.cardNomeFisico}>{nomeExibicao}</h4>
                            <span className={styles.cardSubtituloFisico}>
                                {subMetodo === 'padrao_raro'
                                    ? `${statsBase.categoria || 'Arma'} • ${strMaosFinal}`
                                    : `${categoriaPers.toUpperCase()} • ${alcancePers}`}
                            </span>
                        </div>
                        <Badge variant="gold" size="sm">
                            <FaCoins /> {precoFinal}z
                        </Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant={ehMarcialFinal ? 'crise' : 'default'} size="sm">
                            {ehMarcialFinal ? '⚔️ Marcial' : '🛡️ Simples'}
                        </Badge>
                        <Badge variant="core" size="sm">
                            {subMetodo === 'padrao_raro' ? tipoDano : 'Físico'}
                        </Badge>
                        <Badge variant="ether" size="sm">
                            {subMetodo === 'padrao_raro' ? 'Raro' : `${vagasOcupadasAtlas}/3 Vagas`}
                        </Badge>
                    </div>

                    <div className={styles.cardStatsGrid}>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Precisão</span>
                            <span className={styles.cardStatValor}>
                                {subMetodo === 'padrao_raro' ? precisaoFinalFormatada : precisaoPers}
                            </span>
                        </div>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Dano</span>
                            <span className={styles.cardStatValor}>{danoFinalStr}</span>
                        </div>
                    </div>

                    <div className={styles.cardEfeitosArea}>
                        <strong>Qualidades & Efeitos:</strong>
                        {subMetodo === 'padrao_raro' ? (
                            caracteristicaSelecionada?.efeito ? (
                                <p className={styles.efeitoDescricao}>{caracteristicaSelecionada.efeito}</p>
                            ) : (
                                <p className={styles.efeitoDescricao}>Nenhuma propriedade mágica adicional.</p>
                            )
                        ) : (
                            <ul className={styles.cardEfeitosLista}>
                                {personalizacoesAtlas.length > 0 ? (
                                    personalizacoesAtlas.map(p => <li key={p.id}>{p.nome}</li>)
                                ) : (
                                    <li>Sem personalizações adicionadas.</li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
