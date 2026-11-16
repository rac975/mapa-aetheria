import React, { useState } from 'react';
import { FaBookOpen, FaSearch, FaBrain } from 'react-icons/fa';

export default function ExibirErudito({ ficha, handleAjustarRecurso }) {
  const [qtdAnalises, setQtdAnalises] = useState(1);

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel) || 0;
  };

  const nvAnalise = getNivel('analise rapida');
  const nvConcentrado = getNivel('concentrado');
  const nvConhecimento = getNivel('conhecimento e poder');
  const nvLampejo = getNivel('lampejo de saber');

  if (nvAnalise + nvConcentrado + nvConhecimento + nvLampejo === 0) {
    return null;
  }

  const usarAnaliseRapida = () => {
    if (!handleAjustarRecurso) return;
    const custoTotal = qtdAnalises * 5;
    if (window.confirm(`Gastar ${custoTotal} PM para revelar ${qtdAnalises} Traço(s) ou Afinidade(s)?`)) {
      handleAjustarRecurso('mp_atual', -custoTotal);
    }
  };

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      <div style={{ fontSize: '0.75rem', color: '#58a6ff', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FaBookOpen /> Painel Tático — Erudito
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', marginBottom: nvAnalise > 0 ? '8px' : '0' }}>
        {nvConcentrado > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #58a6ff', color: '#58a6ff' }}>
            <FaBrain size={10} /> Concentrado: <strong>+{nvConcentrado * 3} PM</strong> | <strong>+{nvConcentrado}</strong> em (AST+AST) aberto
          </span>
        )}
        {nvLampejo > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            💡 Lampejo de Saber (13+): até <strong>{nvLampejo}</strong> pergunta(s)
          </span>
        )}
        {nvConhecimento > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #3fb950', color: '#3fb950' }}>
            🎯 Conhecimento é Poder: substitui 1 dado de Precisão por <strong>AST</strong>
          </span>
        )}
      </div>

      {nvAnalise > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={qtdAnalises}
            onChange={(e) => setQtdAnalises(Number(e.target.value))}
            style={{ background: '#0d1117', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '4px 6px', fontSize: '0.78rem' }}
          >
            {Array.from({ length: nvAnalise }, (_, idx) => idx + 1).map((n) => (
              <option key={n} value={n}>
                {n}x Análise ({n * 5} PM)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={usarAnaliseRapida}
            style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FaSearch /> Análise Rápida (-{qtdAnalises * 5} PM)
          </button>
        </div>
      )}
    </div>
  );
}