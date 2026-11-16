import { FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import { Card } from '../../../components/ui';
import styles from './FichaProficienciasSecao.module.css';

export default function FichaProficienciasSecao({ classes }) {
  if (!classes || classes.length === 0) return null;

  // Extrai e consolida todas as proficiências listadas nos benefícios das classes
  const proficienciasList = classes
    .map(c => c.beneficios)
    .filter(Boolean);

  if (proficienciasList.length === 0) return null;

  return (
    <Card variant="default" className={styles.container}>
      <h3 className={styles.sectionHeader}>
        <FaShieldAlt /> Proficiências & Equipamentos Permitidos
      </h3>
      
      <div className={styles.proficienciasGrid}>
        {proficienciasList.map((beneficio, index) => (
          <div key={index} className={styles.proficienciaItem}>
            <FaCheckCircle size={14} className={styles.checkIcon} />
            <span>{beneficio}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
