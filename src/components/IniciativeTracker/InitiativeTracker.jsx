import { useState, useMemo } from 'react';
import { Card } from '../ui';
import CustomAlert from '../CustomAlert/CustomAlert';
import CombatantItem from './CombatantItem';
import CombatRoundBanner from './CombatRoundBanner';
import ActionFeedPanel from './ActionFeedPanel';
import AddParticipantContainer from './AddParticipantContainer';
import CombatModifiersBar from './CombatModifiersBar';
import CombatTrackerHeader from './CombatTrackerHeader';
import { useCombatantDrag } from './useCombatantDrag';
import { useCombatTracker } from '../../hooks/useCombatTracker';
import styles from './InitiativeTracker.module.css';

export default function InitiativeTracker({ isMestre }) {
  const {
    participantes, fichasDisponiveis, npcsDisponiveis, estadoCombate,
    relogios, acoesFeed, alerta, fecharAlerta, jogadorFichaId, jogadorNome,
    editandoId, editForm, setEditForm,
    toggleTurno, ativarTurnoParticipante, resetRodada, restaurarTudoCena,
    atualizarModificadorGlobal, executarAcaoRapida, limparHistoricoAcoes,
    addParticipante, iniciarExclusao, salvarEdicao, cancelarEdicao,
    alterarRecurso, gastarPontoVilaoCombate, transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao, toggleCondicao, moverItem, obterPerfilRolagem,
    rolarDadosNoCombate
  } = useCombatTracker(isMestre);

  const [atorFocoId, setAtorFocoId] = useState('');
  const [alvoFocoId, setAlvoFocoId] = useState('');
  const [alvosIds, setAlvosIds] = useState([]);
  const [multiAlvoAtivo, setMultiAlvoAtivo] = useState(false);

  const [mostrarFormAdicao, setMostrarFormAdicao] = useState(false);
  const [mostrarModsCena, setMostrarModsCena] = useState(false);

  const modsCena = estadoCombate?.modificadores_globais || {};
  const temModGlobalAtivo = Boolean(
    modsCena.decretoDobrarPm || modsCena.roqueBloquearCura || (modsCena.decretoDanoExtra > 0)
  );

  const vivos = participantes.filter((p) => Number(p.hp_atual) > 0);
  const pendentesTurno = vivos.filter((p) => !p.agiu).length;

  const meuHeroi = useMemo(() => {
    if (isMestre) return null;
    return participantes.find(
      (p) =>
        p.tipo === 'heroi' &&
        ((jogadorFichaId && String(p.ficha_id) === String(jogadorFichaId)) ||
          (jogadorNome && p.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase()))
    ) || null;
  }, [isMestre, participantes, jogadorFichaId, jogadorNome]);

  const {
    draggedIndex,
    targetIndex,
    handlePointerDown: handleDragStart,
    handlePointerMove: handleDragMove,
    handlePointerUp: handleDragEnd,
    handlePointerCancel: handleDragCancel
  } = useCombatantDrag({ onReorder: moverItem, totalItems: participantes.length });

  const handleSelecionarCombatente = (combatente) => {
    if (isMestre) {
      if (!atorFocoId) {
        setAtorFocoId(combatente.id);
      } else if (String(atorFocoId) === String(combatente.id)) {
        // Ator já focado
      } else if (multiAlvoAtivo) {
        setAlvosIds((prev) =>
          prev.includes(String(combatente.id))
            ? prev.filter((id) => id !== String(combatente.id))
            : [...prev, String(combatente.id)]
        );
      } else {
        setAlvoFocoId(String(combatente.id));
      }
    } else {
      const ehMeu = Boolean(
        (jogadorFichaId && String(combatente.ficha_id) === String(jogadorFichaId)) ||
        (jogadorNome && combatente.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
      );
      if (ehMeu) {
        setAtorFocoId(combatente.id);
      } else if (multiAlvoAtivo) {
        setAlvosIds((prev) =>
          prev.includes(String(combatente.id))
            ? prev.filter((id) => id !== String(combatente.id))
            : [...prev, String(combatente.id)]
        );
      } else {
        setAlvoFocoId(String(combatente.id));
      }
    }
  };

  const exibirPainelAdicao = isMestre && (mostrarFormAdicao || participantes.length === 0);

  return (
    <Card variant="default" className={styles.combatBox}>
      <CombatTrackerHeader
        isMestre={isMestre}
        rodada={estadoCombate?.rodada || 1}
        jogadorNome={jogadorNome}
        pendentesTurno={pendentesTurno}
        totalVivos={vivos.length}
        mostrarModsCena={mostrarModsCena}
        temModGlobalAtivo={temModGlobalAtivo}
        setMostrarModsCena={setMostrarModsCena}
        exibirPainelAdicao={exibirPainelAdicao}
        setMostrarFormAdicao={setMostrarFormAdicao}
        restaurarTudoCena={restaurarTudoCena}
        resetRodada={resetRodada}
      />

      {(mostrarModsCena || temModGlobalAtivo) && (
        <CombatModifiersBar
          isMestre={isMestre}
          modsCena={modsCena}
          atualizarModificadorGlobal={atualizarModificadorGlobal}
        />
      )}

      <CombatRoundBanner
        rodada={estadoCombate?.rodada || 1}
        isMestre={isMestre}
        pendentesTurno={pendentesTurno}
        totalVivos={vivos.length}
        onResetRodada={resetRodada}
      />

      <AddParticipantContainer
        isMestre={isMestre}
        mostrarFormAdicao={mostrarFormAdicao}
        participantesLength={participantes.length}
        fichasDisponiveis={fichasDisponiveis}
        npcsDisponiveis={npcsDisponiveis}
        onAddParticipante={addParticipante}
      />

      <div className={styles.participantesList}>
        {participantes.length === 0 ? (
          <p className={styles.emptyText}>Nenhum combatente ativo na cena.</p>
        ) : (
          participantes.map((p, index) => {
            const isAtor = isMestre
              ? String(p.id) === String(atorFocoId)
              : Boolean(meuHeroi && String(p.id) === String(meuHeroi.id));

            const isAlvo = multiAlvoAtivo
              ? alvosIds.includes(String(p.id))
              : String(p.id) === String(alvoFocoId);

            return (
              <CombatantItem
                key={p.id}
                p={p}
                index={index}
                totalParticipantes={participantes.length}
                participantes={participantes}
                relogios={relogios}
                isMestre={isMestre}
                jogadorFichaId={jogadorFichaId}
                jogadorNome={jogadorNome}
                isAtorSelecionado={isAtor}
                isAlvoSelecionado={isAlvo}
                alvoId={alvoFocoId}
                alvosIds={alvosIds}
                multiAlvoAtivo={multiAlvoAtivo}
                onSelecionarCombatente={handleSelecionarCombatente}
                onSelecionarAlvo={setAlvoFocoId}
                onToggleMultiAlvo={() => setMultiAlvoAtivo((v) => !v)}
                onLimparAlvo={() => { setAlvoFocoId(''); setAlvosIds([]); }}
                onToggleAlvoMulti={(id) => setAlvosIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
                onExecutarAcao={executarAcaoRapida}
                isEditando={editandoId === p.id}
                editForm={editForm}
                setEditForm={setEditForm}
                fichasDisponiveis={fichasDisponiveis}
                perfilRolagem={obterPerfilRolagem(p)}
                onToggleTurno={toggleTurno}
                onAtivarTurno={(combatente) => {
                  ativarTurnoParticipante(combatente);
                  setAtorFocoId(combatente.id);
                }}
                onSalvarEdicao={salvarEdicao}
                onCancelarEdicao={cancelarEdicao}
                onIniciarExclusao={iniciarExclusao}
                onAlterarRecurso={alterarRecurso}
                onGastarPontoVilao={gastarPontoVilaoCombate}
                onTransicionarFase={transicionarFaseChefeCombate}
                onAjustarAcaoTurno={ajustarAcaoTurnoVilao}
                onToggleCondicao={toggleCondicao}
                onRolarDados={rolarDadosNoCombate}
                isDragging={draggedIndex === index}
                isDragOver={targetIndex === index && draggedIndex !== index}
                onDragHandleDown={handleDragStart}
                onDragHandleMove={handleDragMove}
                onDragHandleUp={handleDragEnd}
                onDragHandleCancel={handleDragCancel}
              />
            );
          })
        )}
      </div>

      <ActionFeedPanel
        acoesFeed={acoesFeed}
        isMestre={isMestre}
        onLimparHistorico={limparHistoricoAcoes}
      />

      <CustomAlert
        isOpen={alerta.isOpen}
        type={alerta.type || 'alert'}
        title={alerta.title || 'Aviso de Combate'}
        message={alerta.message}
        onClose={fecharAlerta}
      />
    </Card>
  );
}
