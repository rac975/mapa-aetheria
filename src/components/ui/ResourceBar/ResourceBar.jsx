import styles from './ResourceBar.module.css';

/**
 * Componente ResourceBar para PV, PM, PI e XP (Fabula Ultima)
 * Ativa automaticamente destaque pulsante de Crise se type === 'pv' e current <= max / 2
 * ou se props.isCrise for explicitamente passado como true.
 * Suporta modo segmentado por pontos (ex: 10 pontos de XP) via prop `segments`.
 *
 * @param {Object} props
 * @param {'pv' | 'pm' | 'pi' | 'exp'} [props.type='pv']
 * @param {number} props.current
 * @param {number} props.max
 * @param {number} [props.segments]
 * @param {string} [props.label]
 * @param {boolean} [props.showValues=true]
 * @param {boolean} [props.isCrise]
 * @param {string} [props.className='']
 */
export default function ResourceBar({
  type = 'pv',
  current = 0,
  max = 1,
  segments,
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
    pi: styles.piTrack,
    exp: styles.expTrack
  }[type] || styles.pvTrack;

  const defaultLabels = {
    pv: 'PV',
    pm: 'PM',
    pi: 'PI',
    exp: 'EXP'
  };

  const displayLabel = label || defaultLabels[type] || type.toUpperCase();
  const numSegments = segments ? Math.max(1, Number(segments)) : null;

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

      {numSegments ? (
        <div
          className={styles.segmentsTrack}
          role="progressbar"
          aria-valuenow={safeCurrent}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-label={`${displayLabel}: ${safeCurrent} de ${safeMax}`}
        >
          {Array.from({ length: numSegments }, (_, i) => (
            <div
              key={i}
              className={`${styles.segment} ${i < safeCurrent ? styles.segmentFilled : ''}`}
              title={`${displayLabel} ${i + 1}/${numSegments}`}
            />
          ))}
        </div>
      ) : (
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
