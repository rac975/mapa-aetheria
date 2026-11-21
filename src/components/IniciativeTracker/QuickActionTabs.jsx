import { FaCrosshairs, FaBolt, FaShieldAlt } from 'react-icons/fa';
import { CATEGORIAS_ACOES } from './quickActionConstants';
import styles from './QuickActionPanel.module.css';

export default function QuickActionTabs({
  abaAtiva,
  handleTrocarAba,
  categoriaAtual,
  acaoCodigo,
  setAcaoCodigo
}) {
  return (
    <>
      <div className={styles.categoryTabs} role="tablist">
        {CATEGORIAS_ACOES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={abaAtiva === cat.id}
            className={`${styles.categoryTabBtn} ${abaAtiva === cat.id ? styles.categoryTabActive : ''}`}
            onClick={() => handleTrocarAba(cat.id)}
          >
            {cat.id === 'principais' && <FaCrosshairs />}
            {cat.id === 'reacoes' && <FaBolt />}
            {cat.id === 'manobras' && <FaShieldAlt />}
            <span>{cat.label}</span>
            <span className={styles.categoryCount}>{cat.opcoes.length}</span>
          </button>
        ))}
      </div>

      <div className={styles.actionChipsRow}>
        {categoriaAtual.opcoes.map((op) => (
          <button
            key={op.codigo}
            type="button"
            className={`${styles.actionChip} ${acaoCodigo === op.codigo ? styles.actionChipActive : ''}`}
            onClick={() => setAcaoCodigo(op.codigo)}
          >
            {op.titulo}
          </button>
        ))}
      </div>
    </>
  );
}
