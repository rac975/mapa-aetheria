import React from 'react';
import { FaTrash, FaBolt } from 'react-icons/fa';

export default function ArcanosLista({
  arcanosVinculados,
  arcanoAtivoIdx,
  custoInvocacao,
  onInvocarArcano,
  onRemoverVinculo
}) {
  if (arcanosVinculados.length === 0) {
    return (
      <div style={{ fontSize: '0.78rem', color: '#8b949e' }}>
        Nenhum Arcano vinculado à alma ainda. Clique em <strong>+ Catálogo</strong> ou <strong>+ Custom</strong> para adicionar.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {arcanosVinculados.map((arc, idx) => (
        <div key={arc.id || idx} style={{ padding: '8px', background: '#0d1117', borderRadius: '4px', border: arcanoAtivoIdx === idx ? '1px solid #8957e5' : '1px solid #30363d', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
            <div>
              <strong style={{ color: '#f0f6fc' }}>{arc.nome}</strong>
              <span style={{ fontSize: '0.73rem', color: '#8b949e', marginLeft: '6px' }}>({arc.dominios})</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {arcanoAtivoIdx === null && (
                <button
                  type="button"
                  onClick={() => onInvocarArcano(idx)}
                  style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#d2a8ff', border: '1px solid #8957e5', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FaBolt size={10} /> Invocar (-{custoInvocacao} PM)
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemoverVinculo(idx)}
                style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer' }}
                title="Desvincular Arcano"
              >
                <FaTrash size={11} />
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.76rem', color: '#c9d1d9', marginTop: '4px' }}>
            <strong style={{ color: '#58a6ff' }}>Fundir:</strong> {arc.fundir}
          </div>
          {arc.dispensar_efeito && (
            <div style={{ fontSize: '0.76rem', color: '#9da3af', marginTop: '2px' }}>
              <strong style={{ color: '#d2a8ff' }}>Dispensar{arc.dispensar_nome ? ` (${arc.dispensar_nome})` : ''}:</strong> {arc.dispensar_efeito}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
