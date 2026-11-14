import React from 'react';

export default function AddParticipantForm({
  novoTipo,
  setNovoTipo,
  fichaSelecionadaId,
  setFichaSelecionadaId,
  fichasDisponiveis,
  nomeInimigo,
  setNomeInimigo,
  hpMaxInput,
  setHpMaxInput,
  mpMaxInput,
  setMpMaxInput,
  onAddParticipante
}) {
  return (
    <form onSubmit={onAddParticipante} className="form-add-part">
      <div className="form-row-inline">
        <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}>
          <option value="heroi">Herói (Selecionar Ficha)</option>
          <option value="inimigo">Inimigo / NPC</option>
        </select>

        {novoTipo === 'heroi' ? (
          <select
            value={fichaSelecionadaId}
            onChange={(e) => setFichaSelecionadaId(e.target.value)}
            style={{ flex: 2 }}
          >
            {fichasDisponiveis.map(f => (
              <option key={f.id} value={f.id}>{f.nome_personagem}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Nome do Inimigo / NPC"
            value={nomeInimigo}
            onChange={(e) => setNomeInimigo(e.target.value)}
          />
        )}

        {novoTipo === 'inimigo' && (
          <>
            <input type="number" placeholder="HP Máx" value={hpMaxInput} onChange={(e) => setHpMaxInput(e.target.value)} />
            <input type="number" placeholder="MP Máx" value={mpMaxInput} onChange={(e) => setMpMaxInput(e.target.value)} />
          </>
        )}

        <button type="submit">Adicionar à Cena</button>
      </div>
    </form>
  );
}