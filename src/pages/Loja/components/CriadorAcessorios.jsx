import { useState, useEffect } from 'react';
import { FaRing, FaCoins, FaHammer, FaPrint, FaShieldAlt } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { Button, Badge, Input, Card } from '../../../components/ui';
import styles from './CriadorItensRaros.module.css';

export default function CriadorAcessorios({ onSalvarItem }) {
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [nomeItem, setNomeItem] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function carregarAcessorios() {
            const { data: catalogo } = await supabase.from('catalogo_itens').select('*');
            if (catalogo) {
                const filtrados = catalogo.filter(i => i.tipo_item?.includes('acessorio'));
                setCaracteristicas([{ id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' }, ...filtrados]);
            }
        }
        carregarAcessorios();
    }, []);

    const precoTotal = caracteristicaSelecionada?.custo || 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para o acessório!');

        setSalvando(true);
        const efeitosList = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];

        try {
            await onSalvarItem({
                nome: nomeItem,
                tipo: 'acessorio',
                custo: precoTotal,
                stats: {
                    slot: 'acessorio',
                    raridade: 'raro',
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

    const nomeExibicao = nomeItem || 'Acessório Raro';

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.oficinaCard}>
                <h3 className={styles.titulo}>
                    <FaRing /> Forja de Acessórios Raros
                </h3>

                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <Input
                        label="Nome do Acessório"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Anel do Vento Etéreo"
                        required
                    />

                    <div className={styles.campoGrupo}>
                        <label htmlFor="select-acessorio-caracteristica" className={styles.labelCampo}>
                            Característica Especial / Efeito Mágico
                        </label>
                        <select
                            id="select-acessorio-caracteristica"
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
                        {caracteristicaSelecionada?.efeito && (
                            <p className={styles.efeitoDescricao}>
                                Efeito: {caracteristicaSelecionada.efeito}
                            </p>
                        )}
                    </div>

                    {/* Resumo Dinâmico e Ações */}
                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Slot: <span className={styles.resumoDanoValor}>Acessório</span>
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {precoTotal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            <Button
                                variant="ghost"
                                size="md"
                                onClick={() => window.print()}
                                title="Imprimir Carta Física para Mesa"
                            >
                                <FaPrint /> Imprimir Carta
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={salvando}
                            >
                                <FaHammer /> {salvando ? 'Forjando...' : 'Forjar Acessório'}
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
                                ACESSÓRIO • RELÍQUIA
                            </span>
                        </div>
                        <Badge variant="gold" size="sm">
                            <FaCoins /> {precoTotal}z
                        </Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant="ether" size="sm">Raro</Badge>
                        <Badge variant="default" size="sm">Acessório</Badge>
                    </div>

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
