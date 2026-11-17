import { useState, useEffect } from 'react';
import { FaShieldAlt, FaCoins, FaHammer, FaPrint } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Badge, Input, Card } from '../../../components/ui';
import styles from './CriadorItensRaros.module.css';

export default function CriadorArmadurasEscudos({ onSalvarItem }) {
    const { showAlert } = useAlert();
    const [itensBase, setItensBase] = useState([]);
    const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [nomeItem, setNomeItem] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function carregarDados() {
            const { data: bases } = await supabase
                .from('itens_catalogo')
                .select('*')
                .eq('tipo', 'armadura')
                .eq('stats->>raridade', 'comum');

            if (bases && bases.length > 0) {
                setItensBase(bases);
                setItemBaseSelecionado(bases[0]);
            }

            const { data: catalogo } = await supabase.from('catalogo_itens').select('*');
            if (catalogo) {
                const filtrados = catalogo.filter(i => i.tipo_item?.includes('armadura'));
                setCaracteristicas([{ id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' }, ...filtrados]);
            }
        }
        carregarDados();
    }, []);

    const statsBase = itemBaseSelecionado?.stats || {};
    const defesa = statsBase.defesa || 0;
    const defesaMagica = statsBase.defesa_magica || statsBase['defesa magica'] || 0;
    const iniciativa = statsBase.iniciativa || 0;
    const ehMarcial = statsBase.marcial === true;

    const custoBase = itemBaseSelecionado?.custo || 100;
    const custoCarac = caracteristicaSelecionada?.custo || 0;
    const precoTotal = custoBase + custoCarac;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return showAlert('Dê um nome para a armadura/escudo!');
        if (!itemBaseSelecionado) return showAlert('Selecione uma armadura base!');

        setSalvando(true);
        const efeitosList = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];

        try {
            await onSalvarItem({
                nome: nomeItem,
                tipo: 'armadura',
                custo: precoTotal,
                stats: {
                    slot: 'armadura',
                    raridade: 'raro',
                    defesa: defesa,
                    defesa_magica: defesaMagica,
                    iniciativa: iniciativa,
                    marcial: ehMarcial,
                    custo: precoTotal,
                    efeitos: efeitosList
                }
            });
            setNomeItem('');
            setCaracteristicaSelecionada(null);
        } finally {
            setSalvando(false);
        }
    };

    const nomeExibicao = nomeItem || itemBaseSelecionado?.nome || 'Armadura Rara';

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.oficinaCard}>
                <h3 className={styles.titulo}>
                    <FaShieldAlt /> Forja de Armaduras e Escudos Raros
                </h3>

                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <Input
                        label="Nome da Armadura / Escudo"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Armadura Aethelgard"
                        required
                    />

                    <div className={styles.gridDuasColunas}>
                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-armadura-base" className={styles.labelCampo}>
                                Item Base Comum
                            </label>
                            <select
                                id="select-armadura-base"
                                className={styles.selectCampo}
                                onChange={e => setItemBaseSelecionado(itensBase[e.target.value])}
                            >
                                {itensBase.map((i, idx) => (
                                    <option key={i.id || idx} value={idx}>
                                        {i.nome} ({i.custo}z)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-armadura-caracteristica" className={styles.labelCampo}>
                                Característica Especial
                            </label>
                            <select
                                id="select-armadura-caracteristica"
                                className={styles.selectCampo}
                                onChange={e => {
                                    const val = e.target.value;
                                    setCaracteristicaSelecionada(val === 'nenhuma' ? null : caracteristicas[val]);
                                }}
                            >
                                {caracteristicas.map((c, idx) => (
                                    <option key={c.id || idx} value={c.id === 'nenhuma' ? 'nenhuma' : idx}>
                                        {c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {caracteristicaSelecionada?.efeito && (
                        <p className={styles.efeitoDescricao}>
                            Efeito: {caracteristicaSelecionada.efeito}
                        </p>
                    )}

                    {/* Resumo Dinâmico e Ações */}
                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Defesa: <span className={styles.resumoDanoValor}>{defesa}</span> | Def. Mágica: <span className={styles.resumoDanoValor}>{defesaMagica}</span>
                            </div>
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
                                <FaHammer /> {salvando ? 'Forjando...' : 'Forjar Armadura'}
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
                                ARMADURA • {ehMarcial ? 'MARCIAL' : 'SIMPLES'}
                            </span>
                        </div>
                        <Badge variant="gold" size="sm">
                            <FaCoins /> {precoTotal}z
                        </Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant="ether" size="sm">Raro</Badge>
                        <Badge variant={ehMarcial ? 'crise' : 'default'} size="sm">
                            {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                        </Badge>
                        {iniciativa !== 0 && (
                            <Badge variant="core" size="sm">
                                {iniciativa > 0 ? `+${iniciativa}` : iniciativa} Iniciativa
                            </Badge>
                        )}
                    </div>

                    <div className={styles.cardStatsGrid}>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Defesa</span>
                            <span className={styles.cardStatValor}>{defesa}</span>
                        </div>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Def. Mágica</span>
                            <span className={styles.cardStatValor}>{defesaMagica}</span>
                        </div>
                    </div>

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
