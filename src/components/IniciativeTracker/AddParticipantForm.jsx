import { useState, useEffect } from 'react';
import { FaUserPlus } from 'react-icons/fa';
import { Button, Input } from '../ui';
import styles from './AddParticipantForm.module.css';

export default function AddParticipantForm({
  novoTipo,
  setNovoTipo,
  fichaSelecionadaId,
  setFichaSelecionadaId,
  fichasDisponiveis,
  npcsDisponiveis = [],
  nomeInimigo,
  setNomeInimigo,
  hpMaxInput,
  setHpMaxInput,
  mpMaxInput,
  setMpMaxInput,
  tipoVilaoInput = 'padrao',
  setTipoVilaoInput,
  voadorInput = false,
  setVoadorInput,
  onAddParticipante,
  onSelecionarNpcCatalogo
}) {
  const [modoInimigo, setModoInimigo] = useState('manual');
  const [npcSelecionadoId, setNpcSelecionadoId] = useState('');

  const idNpcAtual = npcSelecionadoId || (npcsDisponiveis.length > 0 ? npcsDisponiveis[0].id : '');

  useEffect(() => {
    if (modoInimigo === 'catalogo' && npcsDisponiveis.length > 0 && onSelecionarNpcCatalogo) {
      const encontrado = npcsDisponiveis.find((n) => String(n.id) === String(idNpcAtual)) || npcsDisponiveis[0];
      if (encontrado) onSelecionarNpcCatalogo(encontrado);
    }
  }, [modoInimigo, idNpcAtual, npcsDisponiveis, onSelecionarNpcCatalogo]);

  const handleMudarNpcCatalogo = (e) => {
    const id = e.target.value;
    setNpcSelecionadoId(id);
    const npcEncontrado = npcsDisponiveis.find((n) => String(n.id) === String(id));
    if (npcEncontrado && onSelecionarNpcCatalogo) {
      onSelecionarNpcCatalogo(npcEncontrado);
    }
  };

  return (
    <form onSubmit={onAddParticipante} className={styles.formCard}>
      <header className={styles.formHeader}>
        <span className={styles.formTitle}>
          <FaUserPlus className={styles.titleIcon} /> Adicionar Combatente à Cena
        </span>
      </header>

      <div className={styles.formRow}>
        <div className={styles.selectWrapper}>
          <select
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            className={styles.select}
            aria-label="Tipo de combatente"
          >
            <option value="heroi">Herói (Selecionar Ficha)</option>
            <option value="inimigo">Inimigo / NPC</option>
          </select>
        </div>

        {novoTipo === 'heroi' ? (
          <div className={styles.fieldGrow}>
            <select
              value={fichaSelecionadaId}
              onChange={(e) => setFichaSelecionadaId(e.target.value)}
              className={styles.select}
              aria-label="Selecionar Ficha do Personagem"
            >
              {fichasDisponiveis.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome_personagem}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.inimigoControls}>
            <select
              value={modoInimigo}
              onChange={(e) => setModoInimigo(e.target.value)}
              className={styles.selectSmall}
              aria-label="Modo de adição do inimigo"
            >
              <option value="manual">Digitar Rápido</option>
              <option value="catalogo">Dos Meus NPCs</option>
            </select>

            {modoInimigo === 'manual' ? (
              <>
                <div className={styles.fieldGrow}>
                  <Input
                    type="text"
                    placeholder="Nome do Inimigo / NPC"
                    value={nomeInimigo}
                    onChange={(e) => setNomeInimigo(e.target.value)}
                  />
                </div>
                <div className={styles.inputNumberWrapper}>
                  <Input
                    type="number"
                    placeholder="HP Máx"
                    value={hpMaxInput}
                    onChange={(e) => setHpMaxInput(e.target.value)}
                  />
                </div>
                <div className={styles.inputNumberWrapper}>
                  <Input
                    type="number"
                    placeholder="MP Máx"
                    value={mpMaxInput}
                    onChange={(e) => setMpMaxInput(e.target.value)}
                  />
                </div>
                {setTipoVilaoInput && (
                  <select
                    value={tipoVilaoInput}
                    onChange={(e) => setTipoVilaoInput(e.target.value)}
                    className={styles.selectSmall}
                    aria-label="Escala de Vilão do inimigo"
                    title="Escala de Vilania (define Pontos de Vilão e Multi-Ações)"
                  >
                    <option value="padrao">NPC Padrão (0 PVilão)</option>
                    <option value="elite">Vilão Elite (5 PVilão)</option>
                    <option value="campeao">Vilão Campeão (10 PVilão)</option>
                    <option value="soberano">Vilão Soberano (15 PVilão)</option>
                  </select>
                )}
                {setVoadorInput && (
                  <label className={styles.checkboxLabel} title="Marcar inimigo como voador">
                    <input
                      type="checkbox"
                      checked={Boolean(voadorInput)}
                      onChange={(e) => setVoadorInput(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>🦅 Voador</span>
                  </label>
                )}
              </>
            ) : (
              <div className={styles.fieldGrow}>
                <select
                  value={idNpcAtual}
                  onChange={handleMudarNpcCatalogo}
                  className={styles.select}
                  aria-label="Selecionar NPC do catálogo"
                >
                  {npcsDisponiveis.map((n) => {
                    const tagVilao = n.tipo_vilao && n.tipo_vilao !== 'padrao'
                      ? ` • Vilão ${n.tipo_vilao.toUpperCase()}`
                      : '';
                    const tagFases = Array.isArray(n.fases_chefao) && n.fases_chefao.length > 0
                      ? ` • ${n.fases_chefao.length} Fases`
                      : '';
                    const tagVoador = n.voador ? ' • 🦅 Voador' : '';
                    return (
                      <option key={n.id} value={n.id}>
                        {n.nome} (Nível {n.nivel} - {n.rank || 'soldado'}{tagVilao}{tagFases}{tagVoador})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" className={styles.submitBtn}>
          <FaUserPlus /> Adicionar
        </Button>
      </div>
    </form>
  );
}
