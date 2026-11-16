import { FaShieldAlt } from 'react-icons/fa';
import { Card } from '../../../components/ui';
import styles from './FichaEstatisticasSecao.module.css';

export default function FichaEstatisticasSecao({ statusFicha }) {
    if (!statusFicha) return null;

    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.sectionHeader}>
                <FaShieldAlt /> Estatísticas de Combate (Calculadas)
            </h3>
            <div className={styles.gridEstatisticas}>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>DEFESA (DEF)</span>
                    <strong className={`${styles.statValor} ${styles.valDefesa}`}>{statusFicha.defesaTotal}</strong>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>DEF. MÁGICA (MDEF)</span>
                    <strong className={`${styles.statValor} ${styles.valMdef}`}>{statusFicha.mdefTotal}</strong>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>INICIATIVA</span>
                    <strong className={`${styles.statValor} ${styles.valIniciativa}`}>{statusFicha.iniciativaTotal}</strong>
                </div>
            </div>
        </Card>
    );
}
