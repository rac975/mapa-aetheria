import React from 'react';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import './ClockWidget.css';

export default function ClockWidget({ titulo, fatiasTotal, fatiasAtuais, visivel, isMestre, onUpdate, onDelete }) {
  const radius = 40;
  const center = 50;
  
  const renderSlices = () => {
    const slices = [];
    const angleStep = 360 / fatiasTotal;

    for (let i = 0; i < fatiasTotal; i++) {
      const startAngle = (i * angleStep - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * angleStep - 90) * (Math.PI / 180);

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const isFilled = i < fatiasAtuais;

      const pathData = `
        M ${center} ${center}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 0 1 ${x2} ${y2}
        Z
      `;

      slices.push(
        <path
          key={i}
          d={pathData}
          className={`clock-slice ${isFilled ? 'filled' : 'empty'}`}
          onClick={() => {
            if (!isMestre) return;
            const newCount = i + 1 === fatiasAtuais ? i : i + 1;
            onUpdate(newCount);
          }}
        />
      );
    }
    return slices;
  };

  return (
    <div className={`clock-card ${!visivel ? 'oculto-mestre' : ''}`}>
      <div className="clock-header">
        <h4>{titulo}</h4>
        {!visivel && <span className="badge-oculto">🔒 Oculto</span>}
      </div>

      <div className="clock-svg-wrapper">
        <svg viewBox="0 0 100 100" className="clock-svg">
          <circle cx={center} cy={center} r={radius} className="clock-border" />
          {renderSlices()}
        </svg>
      </div>

      <div className="clock-footer">
        <span>{fatiasAtuais} / {fatiasTotal} Fatias</span>
        {isMestre && (
          <div className="clock-controls">
            <button onClick={() => onUpdate(Math.max(0, fatiasAtuais - 1))} title="Decrementar fatia">
              <FaMinus />
            </button>
            <button onClick={() => onUpdate(Math.min(fatiasTotal, fatiasAtuais + 1))} title="Incrementar fatia">
              <FaPlus />
            </button>
            {onDelete && (
              <button className="btn-delete" onClick={onDelete} title="Excluir relógio">
                <FaTrash />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}