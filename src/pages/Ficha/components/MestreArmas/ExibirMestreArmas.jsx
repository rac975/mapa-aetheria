import React from 'react';
import { FaFistRaised, FaBolt } from 'react-icons/fa';

export default function ExibirMestreArmas({ ficha, handleAjustarRecurso }) {
  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) => (item.nome || '').toLowerCase().includes(termo));
    return parseInt(h?.nivel) || 0;
  };

  const nvMaestria = getNivel('maestria com armas');
  const nvChuva = getNivel('chuva de lâminas');
  const nvQuebra = getNivel('quebra-ossos');
  const nvTrespassar = getNivel('trespassar');
  const nvContra = getNivel('contra-ataque');

  if (nvMaestria + nvChuva + nvQuebra + nvTrespassar + nvContra === 0) {
    return null;
  }

  const gastarPM = (custo, nomePoder) => {
    if (!handleAjustarRecurso) return;
    if (window.confirm(`Gastar ${custo} PM para ativar ${nomePoder}?`)) {
      handleAjustarRecurso('mp_atual', -custo);
    }
  };

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      <div style={{ fontSize: '0.75rem', color: '#f85149', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FaFistRaised /> Painel Marcial — Mestre de Armas
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', marginBottom: '8px' }}>
        {nvMaestria > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #3fb950', color: '#3fb950' }}>
            ⚔️ Precisão Corpo a Corpo: <strong>+{nvMaestria}</strong>
          </span>
        )}
        {nvQuebra > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            💥 Quebra-Ossos: Atordoado, Fraco ou <strong>-{nvQuebra * 10} PM</strong>
          </span>
        )}
        {nvTrespassar > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #58a6ff', color: '#58a6ff' }}>
            🛡️ Trespassar: Quebra Escudo/Armadura ou <strong>+{nvTrespassar * 2} Dano</strong>
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {nvChuva > 0 && (
          <button
            type="button"
            onClick={() => gastarPM(10, 'Chuva de Lâminas')}
            style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FaBolt /> Chuva de Lâminas (-10 PM)
          </button>
        )}

        {nvTrespassar > 0 && (
          <button
            type="button"
            onClick={() => gastarPM(5, 'Trespassar')}
            style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FaBolt /> Trespassar (-5 PM)
          </button>
        )}
      </div>
    </div>
  );
}