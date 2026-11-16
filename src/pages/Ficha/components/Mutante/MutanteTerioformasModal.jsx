import { FaDna, FaCheck } from 'react-icons/fa';
import { Modal, Button, Badge } from '../../../../components/ui';
import { THERIOFORMS_CATALOG } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirMutante.module.css';

export default function MutanteTerioformasModal({
  isOpen,
  onClose,
  terioformasAprendidas = [],
  maxTerioformas = 0,
  nvTeriomorfose = 0,
  onToggleTerioforma
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo Genético — Terioformas Aprendidas"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="primary" size="sm" onClick={onClose}>
            <FaCheck /> Concluir Seleção
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Escolha as mutações biológicas incorporadas ao seu código genético conforme o NP da habilidade <strong>Teriomorfose</strong>.
          </span>
          <Badge variant={terioformasAprendidas.length === maxTerioformas ? 'core' : 'gold'} size="md">
            {terioformasAprendidas.length} / {maxTerioformas} Terioformas Aprendidas (NP {nvTeriomorfose})
          </Badge>
        </div>

        <div className={styles.terioModalGrid}>
          {THERIOFORMS_CATALOG.map((tf) => {
            const isSelected = terioformasAprendidas.includes(tf.key);
            return (
              <div
                key={tf.key}
                onClick={() => onToggleTerioforma(tf.key)}
                className={`${styles.terioModalCard} ${isSelected ? styles.terioModalCardSelected : ''}`}
              >
                <div className={styles.terioModalCardHeader}>
                  <div className={styles.terioModalCardTitle}>
                    <FaDna /> {tf.nome}
                  </div>
                  {isSelected ? (
                    <Badge variant="core" size="sm">
                      <FaCheck /> Aprendida
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      Disponível
                    </Badge>
                  )}
                </div>
                {tf.inspiracao && (
                  <div className={styles.terioModalCardInspiracao}>
                    <strong>Inspiração:</strong> {tf.inspiracao}
                  </div>
                )}
                <div className={styles.terioModalCardDesc}>{tf.descricao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
