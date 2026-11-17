import { Badge } from '../../../../components/ui';
import styles from '../FichaRituaisSecao.module.css';

export default function RitualParametrosGrid({
  potencias,
  potenciaKey,
  setPotenciaKey,
  areas,
  areaKey,
  setAreaKey
}) {
  return (
    <div className={styles.parametrosGrid}>
      <div className={styles.parametroColuna}>
        <span className={styles.sectionLabel}>Potência do Efeito:</span>
        <div className={styles.opcoesLista}>
          {potencias.map((pot) => (
            <button
              type="button"
              key={pot.key}
              onClick={() => setPotenciaKey(pot.key)}
              className={`${styles.opcaoCard} ${potenciaKey === pot.key ? styles.opcaoCardAtiva : ''}`}
            >
              <div className={styles.opcaoTopo}>
                <strong className={styles.opcaoNome}>{pot.nome}</strong>
                <div className={styles.opcaoBadges}>
                  <Badge variant="ether" size="sm">{pot.custoPm} PM</Badge>
                  <Badge variant="gold" size="sm">ND {pot.nd}</Badge>
                </div>
              </div>
              <span className={styles.opcaoExemplo}>{pot.exemplos}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.parametroColuna}>
        <span className={styles.sectionLabel}>Área / Alvos:</span>
        <div className={styles.opcoesLista}>
          {areas.map((ar) => (
            <button
              type="button"
              key={ar.key}
              onClick={() => setAreaKey(ar.key)}
              className={`${styles.opcaoCard} ${areaKey === ar.key ? styles.opcaoCardAtiva : ''}`}
            >
              <div className={styles.opcaoTopo}>
                <strong className={styles.opcaoNome}>{ar.nome}</strong>
                <Badge variant="core" size="sm">Multiplicador ×{ar.multiplicador}</Badge>
              </div>
              <span className={styles.opcaoExemplo}>{ar.descricao}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
