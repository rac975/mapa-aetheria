import { useState, useEffect } from 'react';
import { FaHammer, FaCheckCircle, FaShieldAlt, FaRing, FaCrosshairs, FaCoins, FaPrint } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Card, Badge, Input } from '../../../components/ui';
import styles from './CriadorItensRaros.module.css';

export default function CriadorItensRaros({ ficha, onCriado }) {
    const { showAlert } = useAlert();
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

    const ehDuasMaosFinal = baseEhDuasMaos ? (modMao !== '2_para_1') : (modMao === '1_para_2');
    const strMaos = ehDuasMaosFinal ? "Duas mãos" : "Uma mão";

    let stringPrecisao = statsBase.precisao || "(DES + AST)";
    if (atributoUnico) {
        const siglaAtrib = atributoEscolhido.substring(0, 3).toUpperCase();
        stringPrecisao = `(${siglaAtrib} + ${siglaAtrib})`;
    }
    const bonusPrecTotal = bonusPrecisaoArma ? 1 : 0;
    const precisaoFinalFormatada = bonusPrecTotal > 0 ? `${stringPrecisao} + ${bonusPrecTotal}` : stringPrecisao;

    const handleSalvarItemRaro = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return showAlert('Dê um nome para o seu item raro!');
        if (tipoCriacao !== 'acessorio' && !itemBaseSelecionado) return showAlert('Selecione um item base!');

        setSalvando(true);

        const efeitosAplicados = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];

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
            custo: precoTotal,
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
            const novoItemPersonagem = {
                ficha_id: ficha.id,
                nome: nomeFormatado,
                tipo: tipoCriacao,
                stats_personalizados: statsPersonalizados
            };
            const { error } = await supabase.from('itens_personagem').insert([novoItemPersonagem]);
            erroBanco = error;
        } else {
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
            showAlert('Erro ao forjar item: ' + erroBanco.message);
        } else {
            showAlert('✨ Item raro forjado e salvo com sucesso!');
            if (onCriado) onCriado();
            setNomeItem('');
            setCaracteristicaSelecionada(null);
        }
    };

    const nomeExibicao = nomeItem || 'Item Raro';

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.oficinaCard}>
                <h3 className={styles.titulo}>
                    <FaHammer /> Oficina de Itens Raros (Fabula Ultima)
                </h3>

                {/* Abas de Escolha */}
                <nav className={styles.abasTipo} aria-label="Tipo de equipamento raro">
                    <Button
                        variant={tipoCriacao === 'arma' ? 'primary' : 'ghost'}
                        size="sm"
                        className={styles.abaBtn}
                        onClick={() => setTipoCriacao('arma')}
                    >
                        <FaCrosshairs /> Arma Rara
                    </Button>
                    <Button
                        variant={tipoCriacao === 'armadura' ? 'primary' : 'ghost'}
                        size="sm"
                        className={styles.abaBtn}
                        onClick={() => setTipoCriacao('armadura')}
                    >
                        <FaShieldAlt /> Armadura / Escudo
                    </Button>
                    <Button
                        variant={tipoCriacao === 'acessorio' ? 'primary' : 'ghost'}
                        size="sm"
                        className={styles.abaBtn}
                        onClick={() => setTipoCriacao('acessorio')}
                    >
                        <FaRing /> Acessório
                    </Button>
                </nav>

                <form onSubmit={handleSalvarItemRaro} className={styles.formGrid}>
                    <Input
                        label="Nome do Item Raro"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Lâmina do Crepúsculo"
                    />

                    {tipoCriacao !== 'acessorio' && (
                        <div className={styles.gridDuasColunas}>
                            <div className={styles.campoGrupo}>
                                <label htmlFor="select-item-base-raro" className={styles.labelCampo}>
                                    Item Base Comum
                                </label>
                                <select
                                    id="select-item-base-raro"
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

                            {tipoCriacao === 'arma' && (
                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-tipo-dano-raro" className={styles.labelCampo}>
                                        Tipo de Dano (+100z se elemental)
                                    </label>
                                    <select
                                        id="select-tipo-dano-raro"
                                        value={tipoDano}
                                        onChange={e => setTipoDano(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        {['Físico', 'Ar', 'Fogo', 'Gelo', 'Luz', 'Raio', 'Terra', 'Trevas', 'Veneno'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Modificações e Alterações Oficiais de Armas */}
                    {tipoCriacao === 'arma' && (
                        <fieldset className={styles.fieldsetModificacoes}>
                            <legend className={styles.legendModificacoes}>Modificações e Alterações da Arma</legend>
                            <div className={styles.modificacoesLista}>
                                <div className={styles.campoGrupo}>
                                    <label htmlFor="select-mod-mao-raro" className={styles.labelCampo}>
                                        Ajuste de Empunhadura
                                    </label>
                                    {baseEhDuasMaos ? (
                                        <select
                                            id="select-mod-mao-raro"
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
                                            id="select-mod-mao-raro"
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
                                            <label htmlFor="select-atrib-raro" className={styles.labelCampo}>
                                                Selecione o Atributo:
                                            </label>
                                            <select
                                                id="select-atrib-raro"
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
                    )}

                    {/* Seletor Único de Característica Especial */}
                    <div className={styles.campoGrupo}>
                        <label htmlFor="select-caracteristica-raro" className={styles.labelCampo}>
                            Característica Especial (Máximo de 1)
                        </label>
                        <select
                            id="select-caracteristica-raro"
                            className={styles.selectCampo}
                            onChange={e => {
                                const idx = e.target.value;
                                if (idx === 'nenhuma') {
                                    setCaracteristicaSelecionada(null);
                                } else {
                                    setCaracteristicaSelecionada(caracteristicasDisponiveis[idx]);
                                }
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

                    {/* Resumo Dinâmico */}
                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            {tipoCriacao === 'arma' && (
                                <div className={styles.resumoDano}>
                                    Dano Final: <span className={styles.resumoDanoValor}>RA + {bonusDanoFinalNumerico}</span>
                                </div>
                            )}
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {precoTotal} zênites
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
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={salvando}
                            >
                                <FaCheckCircle /> {salvando ? 'Forjando...' : 'Forjar e Salvar'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            {/* Prévia da Carta de Equipamento para a Mesa */}
            <section className={styles.previewArea} aria-label="Prévia da Carta de Equipamento">
                <div className={styles.previewTitulo}>
                    <FaShieldAlt /> Prévia da Carta de Equipamento (Pronta para Impressão)
                </div>

                <div className={styles.physicalCard}>
                    <div className={styles.cardHeaderFisica}>
                        <div>
                            <h4 className={styles.cardNomeFisico}>{nomeExibicao}</h4>
                            <span className={styles.cardSubtituloFisico}>
                                {tipoCriacao.toUpperCase()} • {tipoCriacao === 'arma' ? strMaos : 'Equipamento Raro'}
                            </span>
                        </div>
                        <Badge variant="gold" size="sm">
                            <FaCoins /> {precoTotal}z
                        </Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant="ether" size="sm">Raro</Badge>
                        {tipoCriacao === 'arma' && (
                            <>
                                <Badge variant={ehMarcial ? 'crise' : 'default'} size="sm">
                                    {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                                </Badge>
                                <Badge variant="core" size="sm">
                                    {tipoDano}
                                </Badge>
                            </>
                        )}
                        {tipoCriacao === 'armadura' && (
                            <Badge variant={statsBase.marcial ? 'crise' : 'default'} size="sm">
                                {statsBase.marcial ? '⚔️ Marcial' : '🛡️ Simples'}
                            </Badge>
                        )}
                        {tipoCriacao === 'acessorio' && (
                            <Badge variant="default" size="sm">Acessório</Badge>
                        )}
                    </div>

                    {tipoCriacao === 'arma' && (
                        <div className={styles.cardStatsGrid}>
                            <div className={styles.cardStatItem}>
                                <span className={styles.cardStatLabel}>Precisão</span>
                                <span className={styles.cardStatValor}>{precisaoFinalFormatada}</span>
                            </div>
                            <div className={styles.cardStatItem}>
                                <span className={styles.cardStatLabel}>Dano</span>
                                <span className={styles.cardStatValor}>RA + {bonusDanoFinalNumerico}</span>
                            </div>
                        </div>
                    )}

                    {tipoCriacao === 'armadura' && (
                        <div className={styles.cardStatsGrid}>
                            <div className={styles.cardStatItem}>
                                <span className={styles.cardStatLabel}>Defesa</span>
                                <span className={styles.cardStatValor}>{statsBase.defesa || '0'}</span>
                            </div>
                            <div className={styles.cardStatItem}>
                                <span className={styles.cardStatLabel}>Def. Mágica</span>
                                <span className={styles.cardStatValor}>{statsBase.defesa_magica || statsBase['defesa magica'] || '0'}</span>
                            </div>
                        </div>
                    )}

                    {tipoCriacao === 'acessorio' && (
                        <div className={styles.cardStatsGrid}>
                            <div className={styles.cardStatItem}>
                                <span className={styles.cardStatLabel}>Slot</span>
                                <span className={styles.cardStatValor}>Acessório</span>
                            </div>
                            <div className={styles.cardStatItem}>
                                <span className={styles.cardStatLabel}>Capacidade</span>
                                <span className={styles.cardStatValor}>1 Vaga</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.cardEfeitosArea}>
                        <strong>Propriedades Mágicas & Efeitos:</strong>
                        <p className={styles.efeitoDescricao}>
                            {caracteristicaSelecionada?.efeito || 'Nenhuma propriedade adicional selecionada.'}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
