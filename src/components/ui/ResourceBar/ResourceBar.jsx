import styles from './ResourceBar.module.css';

/**
 * Componente ResourceBar para PV, PM e PI (Fabula Ultima)
 * Ativa automaticamente destaque pulsante de Crise se type === 'pv' e current <= max / 2
 * ou se props.isCrise for explicitamente passado como true.
 *
 * @param {Object} props
 * @param {'pv' | 'pm' | 'pi'} [props.type='pv']
 * @param {number} props.current
 * @param {number} props.max
 * @param {string} [props.label]
 * @param {boolean} [props.showValues=true]
 * @param {boolean} [props.isCrise]
 * @param {string} [props.className='']
 */
export default function ResourceBar({
  type = 'pv',
  current = 0,
  max = 1,
  label,
  showValues = true,
  isCrise,
  className = '',
  ...rest
}) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeCurrent = Math.max(0, Number(current) || 0);
  const percentage = Math.min(100, Math.max(0, (safeCurrent / safeMax) * 100));

  // Regra de Fabula Ultima: Crise ocorre quando PV atual <= metade do PV Máximo
  const emCrise = isCrise !== undefined ? isCrise : (type === 'pv' && safeCurrent <= Math.floor(safeMax / 2));

  const typeTrackClass = {
    pv: styles.pvTrack,
    pm: styles.pmTrack,
    pi: styles.piTrack
  }[type] || styles.pvTrack;

  const defaultLabels = {
    pv: 'PV',
    pm: 'PM',
    pi: 'PI'
  };

  const displayLabel = label || defaultLabels[type] || type.toUpperCase();

  return (
    <div
      className={`${styles.container} ${typeTrackClass} ${emCrise ? styles.criseActive : ''} ${className}`}
      {...rest}
    >
      <div className={styles.header}>
        <div className={styles.labelGroup}>
          <span className={styles.label}>{displayLabel}</span>
          {emCrise && <span className={styles.criseBadge}>CRISE</span>}
        </div>
        {showValues && (
          <div className={styles.values}>
            <span className={styles.currentValue}>{safeCurrent}</span>
            <span className={styles.separator}>/</span>
            <span className={styles.maxValue}>{safeMax}</span>
          </div>
        )}
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
