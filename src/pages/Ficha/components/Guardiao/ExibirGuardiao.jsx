import React, { useState } from 'react';
import { FaShieldAlt, FaUserShield, FaHeart } from 'react-icons/fa';

export default function ExibirGuardiao({ ficha }) {
  const [protegerUsado, setProtegerUsado] = useState(false);

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) => (item.nome || '').toLowerCase().includes(termo));
    return parseInt(h?.nivel) || 0;
  };

  const nvMaestriaDef = getNivel('maestria defensiva');
  const nvFortaleza = getNivel('fortaleza');
  const nvDuploEscudeiro = getNivel('duplo escudeiro');
  const nvProteger = getNivel('proteger');
  const nvGuardaCostas = getNivel('guarda-costas');

  // Só exibe o painel se tiver alguma habilidade ativa
  if (nvMaestriaDef + nvFortaleza + nvDuploEscudeiro + nvProteger + nvGuardaCostas === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      <div style={{ fontSize: '0.75rem', color: '#58a6ff', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FaShieldAlt /> Painel Tático do Guardião
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
        {nvMaestriaDef > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #3fb950', color: '#3fb950' }}>
            🛡️ Redução de Dano: <strong>-{nvMaestriaDef}</strong> (c/ Escudo/Arm. Marcial)
          </span>
        )}

        {nvFortaleza > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #da3633', color: '#f85149' }}>
            <FaHeart size={10} /> Bônus Fortaleza: <strong>+{nvFortaleza * 3} PV</strong>
          </span>
        )}

        {nvDuploEscudeiro > 0 && (
          <span style={{ background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            ⚔️ Escudos Gêmeos: VIG+VIG | Dano RA + {5 + nvMaestriaDef}
          </span>
        )}
      </div>

      {(nvProteger > 0 || nvGuardaCostas > 0) && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
          {nvProteger > 0 && (
            <button
              type="button"
              onClick={() => setProtegerUsado(!protegerUsado)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #30363d',
                background: protegerUsado ? '#da3633' : '#21262d',
                color: '#f0f6fc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <FaUserShield /> {protegerUsado ? 'Proteger Usado (Resetar Turno)' : 'Usar Proteger (1x/turno)'}
            </button>
          )}
          {nvGuardaCostas > 0 && (
            <span style={{ color: '#8b949e' }}>
              • Guarda-Costas: Cobertura concede <strong>Resistência a todos os danos</strong>.
            </span>
          )}
        </div>
      )}
    </div>
  );
}