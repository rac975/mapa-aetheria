import { useState, useEffect } from 'react';
import { npcService } from '../../services/npcService';

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
  onAddParticipante,
  onSelecionarNpcCatalogo // Callback para lidar com a seleção do NPC pronto
}) {
  const [modoInimigo, setModoInimigo] = useState('manual'); // 'manual' ou 'catalogo'
  const [npcsSalvos, setNpcsSalvos] = useState([]);
  const [npcSelecionadoId, setNpcSelecionadoId] = useState('');

  useEffect(() => {
    async function carregarNpcsSalvos() {
      const { data } = await npcService.getNpcsMestre();
      if (data) {
        setNpcsSalvos(data);
        if (data.length > 0) {
          setNpcSelecionadoId(data[0].id);
          if (onSelecionarNpcCatalogo) {
            onSelecionarNpcCatalogo(data[0]);
          }
        }
      }
    }
    carregarNpcsSalvos();
  }, [onSelecionarNpcCatalogo]);

  const handleMudarNpcCatalogo = (e) => {
    const id = e.target.value;
    setNpcSelecionadoId(id);
    const npcEncontrado = npcsSalvos.find(n => n.id === id);
    if (npcEncontrado && onSelecionarNpcCatalogo) {
      onSelecionarNpcCatalogo(npcEncontrado);
    }
  };

  return (
    <form onSubmit={onAddParticipante} className="form-add-part">
      <div className="form-row-inline" style={{ flexWrap: 'wrap', gap: '10px' }}>
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
          <>
            <div style={{ display: 'flex', gap: '5px', flex: 2 }}>
              <select 
                value={modoInimigo} 
                onChange={(e) => setModoInimigo(e.target.value)}
                style={{ width: '130px' }}
              >
                <option value="manual">Digitar Rápido</option>
                <option value="catalogo">Dos Meus NPCs</option>
              </select>

              {modoInimigo === 'manual' ? (
                <input
                  type="text"
                  placeholder="Nome do Inimigo / NPC"
                  value={nomeInimigo}
                  onChange={(e) => setNomeInimigo(e.target.value)}
                  style={{ flex: 1 }}
                />
              ) : (
                <select
                  value={npcSelecionadoId}
                  onChange={handleMudarNpcCatalogo}
                  style={{ flex: 1 }}
                >
                  {npcsSalvos.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.nome} (Nível {n.nivel} - {n.rank || 'soldado'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {modoInimigo === 'manual' && (
              <>
                <input type="number" placeholder="HP Máx" value={hpMaxInput} onChange={(e) => setHpMaxInput(e.target.value)} style={{ width: '80px' }} />
                <input type="number" placeholder="MP Máx" value={mpMaxInput} onChange={(e) => setMpMaxInput(e.target.value)} style={{ width: '80px' }} />
              </>
            )}
          </>
        )}

        <button type="submit">Adicionar à Cena</button>
      </div>
    </form>
  );
}
