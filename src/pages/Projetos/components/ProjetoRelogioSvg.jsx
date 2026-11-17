import styles from './ProjetoRelogioSvg.module.css';

/**
 * Renderiza um Relógio de Progresso SVG no padrão Fabula Ultima.
 * Suporta alto contraste em impressão A4 via @media print.
 */
export default function ProjetoRelogioSvg({
  fatiasTotal = 4,
  fatiasPreenchidas = 0,
  concluido = false,
  size = 'md'
}) {
  const total = Math.max(2, parseInt(fatiasTotal, 10) || 4);
  const preenchidas = Math.max(0, Math.min(total, parseInt(fatiasPreenchidas, 10) || 0));
  const radius = 42;
  const center = 50;
  const angleStep = 360 / total;

  const slices = Array.from({ length: total }, (_, idx) => {
    const startAngle = (idx * angleStep - 90) * (Math.PI / 180);
    const endAngle = ((idx + 1) * angleStep - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArc = angleStep > 180 ? 1 : 0;
    const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const filled = idx < preenchidas;

    return (
      <path
        key={idx}
        d={d}
        className={`${styles.slice} ${filled ? (concluido ? styles.sliceDone : styles.sliceFilled) : styles.sliceEmpty}`}
      />
    );
  });

  const sizeClass = styles[size] || styles.md;

  return (
    <div
      className={`${styles.wrapper} ${sizeClass}`}
      aria-label={`Relógio do projeto: ${preenchidas} de ${total} fatias preenchidas`}
    >
      <svg viewBox="0 0 100 100" className={styles.svg}>
        <circle cx={center} cy={center} r={radius} className={styles.outerRing} />
        {slices}
        <circle cx={center} cy={center} r={radius} className={styles.borderRing} />
      </svg>
    </div>
  );
}
