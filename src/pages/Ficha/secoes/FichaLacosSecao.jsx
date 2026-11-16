import { FaLink } from 'react-icons/fa';
import { Card, Badge } from '../../../components/ui';
import styles from './FichaLacosSecao.module.css';

export default function FichaLacosSecao({ lacos }) {
  const listaLacos = lacos || [];

  return (
    <Card variant="default" className={styles.container}>
      <h3 className={styles.sectionHeader}>
        <FaLink /> Laços ({listaLacos.length}/6)
      </h3>
      {listaLacos.length === 0 ? (
        <p className={styles.emptyText}>Nenhum laço registrado.</p>
      ) : (
        <div className={styles.lacosList}>
          {listaLacos.map((l, i) => {
            const emocoes = l.emocoes || [];
            const forca = emocoes.length;
            return (
              <div key={i} className={styles.lacoCard}>
                <div className={styles.lacoTopRow}>
                  <strong className={styles.lacoNome}>{l.nome || 'Laço sem nome'}</strong>
                  <Badge variant="gold" size="sm">Força: {forca}</Badge>
                </div>
                <div className={styles.lacoEmocoes}>
                  {emocoes.length > 0 ? emocoes.join(', ') : 'Nenhuma emoção definida'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
