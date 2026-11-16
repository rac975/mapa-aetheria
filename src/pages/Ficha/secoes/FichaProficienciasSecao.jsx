import { FaShieldAlt, FaCheckCircle, FaCompass } from 'react-icons/fa';
import { Card, Badge } from '../../../components/ui';
import styles from './FichaProficienciasSecao.module.css';

export default function FichaProficienciasSecao({ classes }) {
  if (!classes || classes.length === 0) return null;

  // Extrai e consolida todas as proficiências listadas nos benefícios das classes
  const proficienciasList = classes
    .map(c => c.beneficios)
    .filter(Boolean);

  // Verifica se o personagem adquiriu a habilidade Navegador (classe Esper)
  const temNavegador = classes.some(c =>
    (c.habilidades || []).some(h => {
      const nomeNorm = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const nv = parseInt(h.nivel, 10) || 0;
      return nomeNorm.includes('navegador') && nv > 0;
    })
  );

  if (proficienciasList.length === 0 && !temNavegador) return null;

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

        {temNavegador && (
          <div className={styles.navegadorItem}>
            <Badge variant="ether" size="md" className={styles.navegadorBadge}>
              <FaCompass /> <strong className={styles.navegadorTitulo}>Navegador:</strong> Você pode fazer rituais da disciplina Ritualismo
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
