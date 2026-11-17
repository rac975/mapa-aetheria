import { FaShieldAlt, FaCar, FaDna, FaBolt, FaMagic } from 'react-icons/fa';
import { Card, Badge } from '../../../components/ui';
import styles from './FichaEstatisticasSecao.module.css';

export default function FichaEstatisticasSecao({ statusFicha }) {
    if (!statusFicha) return null;

    const veiculoAtivo = !!statusFicha.veiculoAtivo;
    const dadosVeiculo = statusFicha.dadosVeiculo;

    const defFinal = Number(statusFicha.defesaTotal) || 0;
    const mdefFinal = Number(statusFicha.mdefTotal) || 0;
    const iniFinal = Number(statusFicha.iniciativaTotal) || 0;
    const precisaoFinal = Number(statusFicha.precisaoBonus) || 0;
    const reducaoDanoFinal = Number(statusFicha.reducaoDano) || 0;
    const sinergias = statusFicha.sinergias || null;

    const terioformas = statusFicha.terioformasAtivasDetalhes || [];
    const resistencias = statusFicha.resistenciasAtivas || [];
    const simbolosProprios = sinergias?.simbolista?.simbolosProprios || [];

    const temSinergiasAtivas = Boolean(
        simbolosProprios.length > 0 ||
        sinergias?.dancaAtivaTurno ||
        sinergias?.ordemAtivaCmd ||
        sinergias?.focoCognitivoAtivo ||
        sinergias?.bonusArtilharia > 0 ||
        sinergias?.bonusPoderCurativo > 0 ||
        sinergias?.bonusDanoDancarinoGuerra > 0 ||
        sinergias?.bonusDanoDecreto > 0 ||
        sinergias?.decretoDobrarPmAtivo ||
        sinergias?.bonusSapateadoOpostos > 0
    );

    const temEfeitosAtivos = terioformas.length > 0 || resistencias.length > 0 || temSinergiasAtivas;

    return (
        <Card variant="default" className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.sectionHeader}>
                    <FaShieldAlt /> Estatísticas de Combate (Calculadas)
                </h3>
                {veiculoAtivo && dadosVeiculo && (
                    <Badge variant="core" size="sm">
                        <FaCar /> Veículo Ativo: {dadosVeiculo.nome || 'Veículo Pessoal'}
                    </Badge>
                )}
            </div>
            <div className={styles.gridEstatisticas}>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>DEFESA (DEF)</span>
                    <strong className={`${styles.statValor} ${styles.valDefesa}`}>{defFinal}</strong>
                    {statusFicha.defesaPlacophoraAtiva && (
                        <span className={styles.statSub}>Placófora ({statusFicha.defesaPlacophoraAtiva})</span>
                    )}
                    {veiculoAtivo && dadosVeiculo?.armaduraAtiva && (
                        <span className={styles.statSub}>{dadosVeiculo.armaduraAtiva}</span>
                    )}
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>DEF. MÁGICA (MDEF)</span>
                    <strong className={`${styles.statValor} ${styles.valMdef}`}>{mdefFinal}</strong>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>INICIATIVA</span>
                    <strong className={`${styles.statValor} ${styles.valIniciativa}`}>
                        {iniFinal >= 0 ? `+${iniFinal}` : iniFinal}
                    </strong>
                </div>
                {precisaoFinal > 0 && (
                    <div className={styles.statBox}>
                        <span className={styles.statLabel}>BÔNUS PRECISÃO</span>
                        <strong className={`${styles.statValor} ${styles.valPrecisao}`}>
                            +{precisaoFinal}
                        </strong>
                        {veiculoAtivo && (
                            <span className={styles.statSub}>Módulo Mira</span>
                        )}
                    </div>
                )}
                {reducaoDanoFinal > 0 && (
                    <div className={styles.statBox}>
                        <span className={styles.statLabel}>REDUÇÃO DANO</span>
                        <strong className={`${styles.statValor} ${styles.valReducao}`}>
                            -{reducaoDanoFinal}
                        </strong>
                        <span className={styles.statSub}>Defesa / Barreira</span>
                    </div>
                )}
            </div>

            {temEfeitosAtivos && (
                <div className={styles.badgesEfeitosContainer}>
                    {terioformas.length > 0 && (
                        <div className={styles.grupoEfeitos}>
                            <span className={styles.badgesEfeitosLabel}>
                                <FaDna /> Mutações & Terioformas Ativas:
                            </span>
                            <div className={styles.badgesEfeitosGrid}>
                                {terioformas.map(tf => (
                                    <Badge key={tf.key} variant="core" size="sm" className={styles.terioBadge}>
                                        <FaDna /> {tf.nome} {tf.resumoEfeito ? `(${tf.resumoEfeito})` : ''}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {resistencias.length > 0 && (
                        <div className={styles.grupoEfeitos}>
                            <span className={styles.badgesEfeitosLabel}>
                                <FaShieldAlt /> Resistências Ativas:
                            </span>
                            <div className={styles.badgesEfeitosGrid}>
                                {resistencias.map((res, idx) => (
                                    <Badge key={`${res.tipo}-${idx}`} variant="gold" size="sm" className={styles.resistenciaBadge}>
                                        <FaShieldAlt /> {res.tipo.toUpperCase()} {res.fonte ? `(${res.fonte})` : ''}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {temSinergiasAtivas && (
                        <div className={styles.grupoEfeitos}>
                            <span className={styles.badgesEfeitosLabel}>
                                <FaBolt /> Sinergias, Ordens, Danças & Sigilos:
                            </span>
                            <div className={styles.badgesEfeitosGrid}>
                                {simbolosProprios.map((s, idx) => (
                                    <Badge key={`${s.key}-${idx}`} variant="pi" size="sm">
                                        Sigilo: {s.nome}{s.escolha ? ` (${s.escolha})` : ''}
                                    </Badge>
                                ))}
                                {sinergias?.simbolista?.travaAtributosBase && (
                                    <Badge variant="crise" size="sm">Amarras: Atributos Travados</Badge>
                                )}
                                {sinergias?.dancaAtivaTurno && (
                                    <Badge variant="pm" size="sm">Dança: {sinergias.dancaAtivaTurno.nome}</Badge>
                                )}
                                {sinergias?.bonusSapateadoOpostos > 0 && (
                                    <Badge variant="ether" size="sm">
                                        Sapateado: +{sinergias.bonusSapateadoOpostos} Opostos
                                    </Badge>
                                )}
                                {sinergias?.ordemAtivaCmd && (
                                    <Badge variant="gold" size="sm">
                                        Ordem: {sinergias.ordemAtivaCmd.titulo}
                                    </Badge>
                                )}
                                {sinergias?.focoCognitivoAtivo && (
                                    <Badge variant="ether" size="sm">
                                        <FaMagic /> Foco Cognitivo: +{sinergias.bonusFocoTeste} Teste / +{sinergias.bonusFocoCura} Cura
                                    </Badge>
                                )}
                                {sinergias?.bonusArtilharia > 0 && (
                                    <Badge variant="pv" size="sm">
                                        Artilharia Mágica: +{sinergias.bonusArtilharia} Teste Magia (O)
                                    </Badge>
                                )}
                                {sinergias?.bonusPoderCurativo > 0 && (
                                    <Badge variant="core" size="sm">
                                        Poder Curativo: +{sinergias.bonusPoderCurativo} Cura
                                    </Badge>
                                )}
                                {sinergias?.bonusDanoDancarinoGuerra > 0 && (
                                    <Badge variant="pv" size="sm">
                                        Dançarino de Guerra: +{sinergias.bonusDanoDancarinoGuerra} Dano
                                    </Badge>
                                )}
                                {sinergias?.bonusDanoDecreto > 0 && (
                                    <Badge variant="crise" size="sm">
                                        Decreto do Bispo: +{sinergias.bonusDanoDecreto} Dano
                                    </Badge>
                                )}
                                {sinergias?.decretoDobrarPmAtivo && (
                                    <Badge variant="pm" size="sm">
                                        Decreto do Bispo: Custos de PM x2
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
