import { FaMagic } from 'react-icons/fa';
import { Card, Badge } from '../../../components/ui';
import styles from './FichaMagiasSecao.module.css';

export default function FichaMagiasSecao({ magias }) {
  if (!magias || magias.length === 0) return null;

  return (
    <Card variant="default" className={styles.container}>
      <h3 className={styles.sectionHeader}>
        <FaMagic /> Magias/Arcanas
      </h3>
      <div className={styles.magiasList}>
        {magias.map((m, i) => (
          <div key={i} className={styles.magiaCard}>
            <div className={styles.magiaHeader}>
              <strong className={styles.magiaNome}>{m.nome}</strong>
              <div className={styles.magiaMeta}>
                <Badge variant="ether" size="sm">MP: {m.custo_mp}</Badge>
                {m.alvos && <span>Alvos: {m.alvos}</span>}
                {m.duracao && <span>Duração: {m.duracao}</span>}
              </div>
            </div>
            {m.descricao && <p className={styles.magiaDescricao}>{m.descricao}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
