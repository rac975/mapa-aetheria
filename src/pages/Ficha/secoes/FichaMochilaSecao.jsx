import { FaBoxOpen, FaStickyNote } from 'react-icons/fa';
import { Card } from '../../../components/ui';
import styles from './FichaMochilaSecao.module.css';

export default function FichaMochilaSecao({ mochila, notas }) {
  if (!mochila && !notas) return null;

  return (
    <>
      {mochila && (
        <Card variant="default" className={styles.container}>
          <h3 className={styles.sectionHeader}>
            <FaBoxOpen /> Mochila
          </h3>
          <p className={styles.conteudoTexto}>{mochila}</p>
        </Card>
      )}
      {notas && (
        <Card variant="default" className={styles.container}>
          <h3 className={styles.sectionHeader}>
            <FaStickyNote /> Notas
          </h3>
          <p className={styles.conteudoTexto}>{notas}</p>
        </Card>
      )}
    </>
  );
}
