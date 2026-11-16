import React from 'react';
import { FaTimesCircle } from 'react-icons/fa';

export default function ArcanoAtivoPainel({ arcanoAtivo, onDispensar }) {
  if (!arcanoAtivo) return null;

  return (
    <div style={{ padding: '10px', marginBottom: '10px', background: '#1f1635', border: '1px solid #8957e5', borderRadius: '6px', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
        <span style={{ color: '#d2a8ff', fontWeight: 'bold', fontSize: '0.88rem' }}>
          ✨ Fundido: {arcanoAtivo.nome}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onDispensar(true)}
            style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#8957e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Ativa o efeito de dispensa (se desejar) e Círculo Arcano"
          >
            <FaTimesCircle /> Dispensar (Voluntário)
          </button>
          <button
            type="button"
            onClick={() => onDispensar(false)}
            style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
            title="Fim de cena, inconsciência ou efeito automático (sem efeito de dispensa)"
          >
            Encerrar Cena
          </button>
        </div>
      </div>

      <div style={{ color: '#e6edf3', marginBottom: '4px' }}>
        <strong style={{ color: '#a5d6ff' }}>Benefício de Fundição:</strong> {arcanoAtivo.fundir}
      </div>

      {arcanoAtivo.dispensar_efeito && (
        <div style={{ color: '#c9d1d9', paddingTop: '4px', borderTop: '1px solid #30363d' }}>
          <strong style={{ color: '#d2a8ff' }}>
            Dispensa{arcanoAtivo.dispensar_nome ? ` (${arcanoAtivo.dispensar_nome})` : ''}:
          </strong>{' '}
          {arcanoAtivo.dispensar_efeito}
        </div>
      )}
    </div>
  );
}
