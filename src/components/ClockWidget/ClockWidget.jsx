import { FaMinus, FaPlus, FaTrash, FaEyeSlash } from 'react-icons/fa';
import styles from './ClockWidget.module.css';

export default function ClockWidget({
  titulo,
  fatiasTotal,
  fatiasAtuais,
  visivel,
  isMestre,
  onUpdate,
  onDelete
}) {
  const total = Math.max(2, Number(fatiasTotal) || 4);
  const atuais = Math.max(0, Math.min(total, Number(fatiasAtuais) || 0));
  const radius = 40;
  const center = 50;
  const angleStep = 360 / total;

  const slices = Array.from({ length: total }, (_, i) => {
    const startAngle = (i * angleStep - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * angleStep - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const isFilled = i < atuais;
    const largeArcFlag = angleStep > 180 ? 1 : 0;
    const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return (
      <path
        key={i}
        d={pathData}
        data-clock-slice="true"
        className={`${styles.clockSlice} ${isFilled ? styles.filled : styles.empty} ${isMestre ? styles.clickable : ''}`}
        onClick={() => {
          if (!isMestre) return;
          const newCount = i + 1 === atuais ? i : i + 1;
          onUpdate(newCount);
        }}
      />
    );
  });

  return (
    <div className={`${styles.clockCard} ${!visivel ? styles.ocultoMestre : ''}`}>
      <div className={styles.clockHeader}>
        <h4 title={titulo}>{titulo}</h4>
        {!visivel && (
          <span className={styles.badgeOculto}>
            <FaEyeSlash /> Oculto
          </span>
        )}
      </div>

      <div className={styles.clockSvgWrapper}>
        <svg viewBox="0 0 100 100" className={styles.clockSvg}>
          <circle cx={center} cy={center} r={radius} className={styles.clockBorder} />
          {slices}
        </svg>
      </div>

      <div className={styles.clockFooter}>
        <span className={styles.clockCount}>{atuais} / {total} Fatias</span>
        {isMestre && (
          <div className={styles.clockControls}>
            <button
              type="button"
              onClick={() => onUpdate(Math.max(0, atuais - 1))}
              title="Decrementar fatia"
              aria-label="Decrementar fatia"
            >
              <FaMinus />
            </button>
            <button
              type="button"
              onClick={() => onUpdate(Math.min(total, atuais + 1))}
              title="Incrementar fatia"
              aria-label="Incrementar fatia"
            >
              <FaPlus />
            </button>
            {onDelete && (
              <button
                type="button"
                className={styles.btnDelete}
                onClick={onDelete}
                title="Excluir relógio"
                aria-label="Excluir relógio"
              >
                <FaTrash />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
