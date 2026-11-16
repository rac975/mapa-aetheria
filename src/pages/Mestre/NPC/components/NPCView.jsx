import React from 'react';

export default function NPCView({ npc, onUpdate }) {
  // Bônus de dano por nível oficial do Fabula Ultima
  const bonusDanoNivel = npc.nivel >= 60 ? 15 : npc.nivel >= 40 ? 10 : npc.nivel >= 20 ? 5 : 0;
  const bonusPrecisaoMagia = Math.floor(npc.nivel / 10);

  function ajustarStat(campo, valor) {
    const novo = Math.max(0, npc[campo] + valor);
    onUpdate({ ...npc, [campo]: novo });
  }

  return (
    <div className="npc-view-container">
      {/* Cabeçalho do Bestiário */}
      <div className="npc-view-header">
        <div>
          <h1 className="npc-title">{npc.nome}</h1>
          <p className="npc-subtitle">
            Espécie: <strong className="highlight-text">{npc.especie}</strong> | Rank: 
            <strong className="highlight-text uppercase">{npc.rank}</strong> | Nível {npc.nivel}
          </p>
        </div>
        <div className="npc-bonus-box">
          <p>Bônus Testes: <span className="bonus-value">+{bonusPrecisaoMagia}</span></p>
          <p>Bônus Dano: <span className="bonus-value">+{bonusDanoNivel}</span></p>
        </div>
      </div>

      {/* Traços */}
      <div className="tracos-container">
        {npc.tracos?.map((traco, i) => (
          <div key={i} className="traco-card">
            <span className="traco-label">Traço {i + 1}</span>
            <p className="traco-text">{traco || '—'}</p>
          </div>
        ))}
      </div>

      {/* Atributos & Combate */}
      <div className="atributos-container">
        {['des', 'ast', 'vig', 'von'].map((attr) => (
          <div key={attr} className="atributo-card">
            <span className="atributo-label">{attr}</span>
            <p className="atributo-value">{npc.atributos?.[attr] || 'd8'}</p>
          </div>
        ))}
      </div>

      {/* PV, PM e Defesas */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title pv-color">PONTOS DE VIDA (PV)</span>
            <span className="stat-aux">Crise: {Math.floor(npc.pv_max / 2)}</span>
          </div>
          <div className="stat-controls">
            <button onClick={() => ajustarStat('pv_atual', -5)} className="stat-btn">-5</button>
            <span className="stat-numbers">{npc.pv_atual} / {npc.pv_max}</span>
            <button onClick={() => ajustarStat('pv_atual', 5)} className="stat-btn">+5</button>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title pm-color">PONTOS DE MANA (PM)</span>
          </div>
          <div className="stat-controls">
            <button onClick={() => ajustarStat('pm_atual', -5)} className="stat-btn">-5</button>
            <span className="stat-numbers">{npc.pm_atual} / {npc.pm_max}</span>
            <button onClick={() => ajustarStat('pm_atual', 5)} className="stat-btn">+5</button>
          </div>
        </div>

        <div className="stat-card center">
          <span className="stat-title">DEFESA</span>
          <p className="stat-numbers large">{npc.defesa}</p>
        </div>

        <div className="stat-card center">
          <span className="stat-title">DEFESA MÁGICA</span>
          <p className="stat-numbers large">{npc.defesa_magica}</p>
        </div>
      </div>

      {/* Ataques Básicos */}
      <div className="ataques-view-container">
        <h3>Ataques Básicos</h3>
        {(!npc.ataques_basicos || npc.ataques_basicos.length === 0) ? (
          <p className="empty-text">Nenhum ataque cadastrado.</p>
        ) : (
          <div className="ataques-view-list">
            {npc.ataques_basicos.map((atk, i) => (
              <div key={i} className="ataque-view-item">
                <div>
                  <span className="ataque-name">{atk.nome}</span>
                  <span className="ataque-dado">({atk.atributo_dado1} + {atk.atributo_dado2})</span>
                </div>
                <div className="ataque-dano-info">
                  Dano: RA {atk.bonus_dano ? `+ ${atk.bonus_dano}` : ''} ({atk.tipo_dano})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Poderes e Feitiços */}
      <div className="poderes-feiticos-view-grid">
        <div className="view-card-secao">
          <h3>Poderes</h3>
          {(!npc.poderes || npc.poderes.length === 0) ? (
            <p className="empty-text">Nenhum poder adquirido.</p>
          ) : (
            <ul className="view-list">
              {npc.poderes.map((p, i) => (
                <li key={i} className="view-item">
                  <strong className="poder-name">{p.nome}:</strong> {p.descricao}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="view-card-secao">
          <h3>Feitiços</h3>
          {(!npc.feiticos || npc.feiticos.length === 0) ? (
            <p className="empty-text">Nenhum feitiço conhecido.</p>
          ) : (
            <ul className="view-list">
              {npc.feiticos.map((f, i) => (
                <li key={i} className="view-item">
                  <strong className="feitico-name">{f.nome}</strong> ({f.pm_custo} PM) - {f.descricao}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}