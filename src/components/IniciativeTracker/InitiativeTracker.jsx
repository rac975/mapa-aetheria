import { useState, useMemo } from 'react';
import { Card } from '../ui';
import CustomAlert from '../CustomAlert/CustomAlert';
import CombatantItem from './CombatantItem';
import CombatantActionTokenMarker from './CombatantActionTokenMarker';
import CombatRoundBanner from './CombatRoundBanner';
import ActionFeedPanel from './ActionFeedPanel';
import AddParticipantContainer from './AddParticipantContainer';
import CombatModifiersBar from './CombatModifiersBar';
import CombatTrackerHeader from './CombatTrackerHeader';
import PreConflictActionsBar from './PreConflictActionsBar';
import GroupInitiativeModal from './GroupInitiativeModal';
import CombatOpportunityModal from './CombatOpportunityModal';
import { useCombatantDrag } from './useCombatantDrag';
import { useCombatTracker } from '../../hooks/useCombatTracker';
import styles from './InitiativeTracker.module.css';

export default function InitiativeTracker({ isMestre }) {
  const {
    participantes, filaUnificada, fichasDisponiveis, npcsDisponiveis, estadoCombate,
    relogios, acoesFeed, alerta, fecharAlerta, jogadorFichaId, jogadorNome,
    editandoId, editForm, setEditForm,
    toggleTurno, ativarTurnoParticipante, resetRodada, restaurarTudoCena,
    atualizarModificadorGlobal, executarAcaoRapida, limparHistoricoAcoes,
    addParticipante, iniciarExclusao, salvarEdicao, cancelarEdicao,
    alterarRecurso, gastarPontoVilaoCombate, transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao, ajustarAcaoSlotInimigo, toggleCondicao, moverItemFila,
    obterPerfilRolagem, rolarDadosNoCombate, atualizarIniciativa,
    rolarIniciativaCombatente, ordenarPorIniciativa, contadoresAcoes,
    modalGrupoIniAberto, fecharModalGrupoIniciativa, aplicarResultadoTesteGrupoIniciativa,
    executarAcaoPreRodada, oportunidadeAtiva, votarOportunidadeCombate,
    confirmarOportunidadeCombate, descartarOportunidadeCombate
  } = useCombatTracker(isMestre);

  const lista = useMemo(() => participantes || [], [participantes]);
  const fila = useMemo(() => filaUnificada || [], [filaUnificada]);

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

  const meuHeroi = useMemo(() => {
    if (isMestre) return null;
    return lista.find(
      (p) => p.tipo === 'heroi' && (
        (jogadorFichaId && String(p.ficha_id) === String(jogadorFichaId)) ||
        (jogadorNome && p.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
      )
    ) || null;
  }, [isMestre, lista, jogadorFichaId, jogadorNome]);

  const {
    draggedIndex, targetIndex,
    handlePointerDown: handleDragStart, handlePointerMove: handleDragMove,
    handlePointerUp: handleDragEnd, handlePointerCancel: handleDragCancel
  } = useCombatantDrag({ onReorder: moverItemFila, totalItems: fila.length });

  const toggleAlvoId = (idStr) => {
    setAlvosIds((prev) => (prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]));
  };

  const handleSelecionarCombatente = (combatente) => {
    const idStr = String(combatente.id);
    if (isMestre) {
      if (!atorFocoId) setAtorFocoId(combatente.id);
      else if (String(atorFocoId) === idStr) return;
      else if (multiAlvoAtivo) toggleAlvoId(idStr);
      else setAlvoFocoId(idStr);
    } else {
      const ehMeu = Boolean(
        (jogadorFichaId && String(combatente.ficha_id) === String(jogadorFichaId)) ||
        (jogadorNome && combatente.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
      );
      if (ehMeu) setAtorFocoId(combatente.id);
      else if (multiAlvoAtivo) toggleAlvoId(idStr);
      else setAlvoFocoId(idStr);
    }
  };

  const exibirPainelAdicao = isMestre && (mostrarFormAdicao || lista.length === 0);

  return (
    <Card variant="default" className={styles.combatBox}>
      <CombatTrackerHeader
        isMestre={isMestre} rodada={estadoCombate?.rodada || 1} jogadorNome={jogadorNome}
        pendentesTurno={contadoresAcoes?.acoesPendentesRodada ?? 0}
        totalVivos={contadoresAcoes?.totalVivos ?? 0}
        totalAcoesRodada={contadoresAcoes?.totalAcoesRodada ?? 0}
        mostrarModsCena={mostrarModsCena} temModGlobalAtivo={temModGlobalAtivo}
        setMostrarModsCena={setMostrarModsCena} exibirPainelAdicao={exibirPainelAdicao}
        setMostrarFormAdicao={setMostrarFormAdicao} restaurarTudoCena={restaurarTudoCena}
        resetRodada={resetRodada} onOrdenarPorIniciativa={ordenarPorIniciativa}
      />

      {(mostrarModsCena || temModGlobalAtivo) && (
        <CombatModifiersBar
          isMestre={isMestre} modsCena={modsCena} atualizarModificadorGlobal={atualizarModificadorGlobal}
        />
      )}

      <CombatRoundBanner
        rodada={estadoCombate?.rodada || 1} isMestre={isMestre}
        pendentesTurno={contadoresAcoes?.acoesPendentesRodada ?? 0}
        totalVivos={contadoresAcoes?.totalVivos ?? 0} onResetRodada={resetRodada}
      />

      <PreConflictActionsBar
        isMestre={isMestre} rodada={estadoCombate?.rodada || 1} participantes={lista}
        relogios={relogios} meuHeroi={meuHeroi} obterPerfilRolagem={obterPerfilRolagem}
        onExecutarAcaoPreRodada={executarAcaoPreRodada}
      />

      <AddParticipantContainer
        isMestre={isMestre} mostrarFormAdicao={mostrarFormAdicao} participantesLength={lista.length}
        fichasDisponiveis={fichasDisponiveis} npcsDisponiveis={npcsDisponiveis} onAddParticipante={addParticipante}
      />

      <div className={styles.participantesList}>
        {fila.length === 0 ? (
          <p className={styles.emptyText}>Nenhum combatente ativo na cena.</p>
        ) : (
          fila.map((itemFila, idxFila) => {
            const p = itemFila.participante;
            const isAtor = isMestre
              ? String(p.id) === String(atorFocoId)
              : Boolean(meuHeroi && String(p.id) === String(meuHeroi.id));
            const isOver = targetIndex === idxFila && draggedIndex !== null && draggedIndex !== idxFila;
            const dropPos = isOver ? (draggedIndex < idxFila ? 'bottom' : 'top') : null;

            if (itemFila.tipoItem === 'token_acao') {
              return (
                <CombatantActionTokenMarker
                  key={itemFila.chaveFila} p={p} slot={itemFila.slot} totalAcoes={itemFila.totalAcoes}
                  indexFila={idxFila} isMestre={isMestre} isAtorSelecionado={isAtor}
                  isDragging={draggedIndex === idxFila} isDragOver={isOver} dragDropPos={dropPos}
                  onSelecionarCombatente={handleSelecionarCombatente}
                  onAtivarTurno={(c) => { ativarTurnoParticipante(c); setAtorFocoId(c.id); }}
                  onAjustarAcaoSlot={ajustarAcaoSlotInimigo}
                  onDragHandleDown={handleDragStart} onDragHandleMove={handleDragMove}
                  onDragHandleUp={handleDragEnd} onDragHandleCancel={handleDragCancel}
                />
              );
            }

            const isAlvo = multiAlvoAtivo ? alvosIds.includes(String(p.id)) : String(p.id) === String(alvoFocoId);

            return (
              <CombatantItem
                key={itemFila.chaveFila} p={p} index={idxFila} totalParticipantes={fila.length}
                participantes={lista} relogios={relogios} isMestre={isMestre}
                jogadorFichaId={jogadorFichaId} jogadorNome={jogadorNome}
                isAtorSelecionado={isAtor} isAlvoSelecionado={isAlvo}
                alvoId={alvoFocoId} alvosIds={alvosIds} multiAlvoAtivo={multiAlvoAtivo}
                onSelecionarCombatente={handleSelecionarCombatente} onSelecionarAlvo={setAlvoFocoId}
                onToggleMultiAlvo={() => setMultiAlvoAtivo((v) => !v)}
                onLimparAlvo={() => { setAlvoFocoId(''); setAlvosIds([]); }}
                onToggleAlvoMulti={toggleAlvoId} onExecutarAcao={executarAcaoRapida}
                isEditando={editandoId === p.id} editForm={editForm} setEditForm={setEditForm}
                fichasDisponiveis={fichasDisponiveis} perfilRolagem={obterPerfilRolagem(p)}
                onToggleTurno={toggleTurno}
                onAtivarTurno={(c) => { ativarTurnoParticipante(c); setAtorFocoId(c.id); }}
                onSalvarEdicao={salvarEdicao} onCancelarEdicao={cancelarEdicao}
                onIniciarExclusao={iniciarExclusao} onAlterarRecurso={alterarRecurso}
                onGastarPontoVilao={gastarPontoVilaoCombate} onTransicionarFase={transicionarFaseChefeCombate}
                onAjustarAcaoTurno={ajustarAcaoTurnoVilao} onAjustarAcaoSlot={ajustarAcaoSlotInimigo}
                onAtualizarIniciativa={atualizarIniciativa} onRolarIniciativa={rolarIniciativaCombatente}
                onToggleCondicao={toggleCondicao} onRolarDados={rolarDadosNoCombate}
                isDragging={draggedIndex === idxFila} isDragOver={isOver} dragDropPos={dropPos}
                onDragHandleDown={handleDragStart} onDragHandleMove={handleDragMove}
                onDragHandleUp={handleDragEnd} onDragHandleCancel={handleDragCancel}
              />
            );
          })
        )}
      </div>

      <ActionFeedPanel acoesFeed={acoesFeed} isMestre={isMestre} onLimparHistorico={limparHistoricoAcoes} />

      <GroupInitiativeModal
        isOpen={modalGrupoIniAberto} onClose={fecharModalGrupoIniciativa}
        participantes={lista} npcsDisponiveis={npcsDisponiveis}
        obterPerfilRolagem={obterPerfilRolagem} onAplicarResultado={aplicarResultadoTesteGrupoIniciativa}
      />

      <CombatOpportunityModal
        oportunidadeAtiva={oportunidadeAtiva} isMestre={isMestre}
        jogadorNome={jogadorNome} jogadorFichaId={jogadorFichaId}
        onVotarOportunidade={votarOportunidadeCombate}
        onConfirmarOportunidade={confirmarOportunidadeCombate}
        onDescartarOportunidade={descartarOportunidadeCombate}
      />

      <CustomAlert
        isOpen={Boolean(alerta?.isOpen)} type={alerta?.type || 'alert'}
        title={alerta?.title || 'Aviso de Combate'} message={alerta?.message} onClose={fecharAlerta}
      />
    </Card>
  );
}
