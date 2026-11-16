import { FaShieldAlt, FaCar } from 'react-icons/fa';
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
            </div>
        </Card>
    );
}
