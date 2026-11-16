import { Card } from '../../../components/ui';
import styles from './FichaFormAtributos.module.css';

export default function FichaFormAtributos({ formData, setFormData }) {
    // Progressão oficial de atributos em Fabula Ultima (d6 a d12)
    const progressao = [6, 8, 10, 12];

    const atributos = [
        { key: 'destreza', sigla: 'DES' },
        { key: 'astucia', sigla: 'AST' },
        { key: 'vigor', sigla: 'VIG' },
        { key: 'vontade', sigla: 'VON' }
    ];

    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.title}>Atributos, Limites e Combate</h3>
            
            {/* Atributos Principais em 4 colunas com o visual dos cards */}
            <div className={styles.gridAtributos}>
                {atributos.map(({ key, sigla }) => {
                    const valorAtual = formData[key] || 8;

                    return (
                        <div key={key} className={styles.atribCard}>
                            <span className={styles.sigla}>{sigla}</span>

                            <strong className={styles.valorDado}>
                                d{valorAtual}
                            </strong>

                            <select
                                value={valorAtual}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    [key]: parseInt(e.target.value) || 8 
                                })}
                                className={styles.selectDado}
                            >
                                {progressao.map((dado) => (
                                    <option key={dado} value={dado}>
                                        d{dado}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
