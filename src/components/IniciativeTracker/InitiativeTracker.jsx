import { useState } from 'react';
import { FaUndoAlt, FaRedo, FaBroadcastTower } from 'react-icons/fa';
import { Card, Button, Badge } from '../ui';
import CustomAlert from '../CustomAlert/CustomAlert';
import CombatantItem from './CombatantItem';
import QuickActionPanel from './QuickActionPanel';
import AddParticipantForm from './AddParticipantForm';
import { useCombatTracker } from '../../hooks/useCombatTracker';
import styles from './InitiativeTracker.module.css';

export default function InitiativeTracker({ isMestre }) {
  const {
    participantes,
    fichasDisponiveis,
    estadoCombate,
    relogios,
    acoesFeed,
    alerta,
    fecharAlerta,
    editandoId,
    editForm,
    setEditForm,
    toggleTurno,
    ativarTurnoParticipante,
    resetRodada,
    restaurarTudoCena,
    atualizarModificadorGlobal,
    executarAcaoRapida,
    limparHistoricoAcoes,
    addParticipante,
    iniciarExclusao,
    salvarEdicao,
    cancelarEdicao,
    alterarRecurso,
    toggleCondicao,
    moverItem
  } = useCombatTracker(isMestre);

  const [novoTipo, setNovoTipo] = useState('heroi');
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState('');
  const [nomeInimigo, setNomeInimigo] = useState('');
  const [hpMaxInput, setHpMaxInput] = useState(30);
  const [mpMaxInput, setMpMaxInput] = useState(20);
  const [npcCatalogoSelecionado, setNpcCatalogoSelecionado] = useState(null);

  const idFichaAtual = fichaSelecionadaId || (fichasDisponiveis.length > 0 ? fichasDisponiveis[0].id : '');
  const modsCena = estadoCombate?.modificadores_globais || {};

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const sucesso = await addParticipante({
      tipo: novoTipo,
      fichaSelecionadaId: idFichaAtual,
      nomeInimigo,
      hpMaxInput,
      mpMaxInput,
      npcCatalogoSelecionado
    });
    if (sucesso) setNomeInimigo('');
  };

  return (
    <Card variant="default" className={styles.combatBox}>
      <header className={styles.boxHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Ordem de Ação & Combate</h2>
            <Badge variant="gold" size="sm">Rodada {estadoCombate?.rodada || 1}</Badge>
            <Badge variant="core" size="sm"><FaBroadcastTower /> Realtime</Badge>
          </div>
          <p className={styles.boxHint}>
            {isMestre
              ? 'Gerencie turnos, posturas de Guarda, modificadores, relógios e ações sincronizadas ao vivo.'
              : 'Acompanhe turnos ao vivo, posturas, condições e dispare ações rápidas de conflito.'}
          </p>
        </div>

        {isMestre && (
          <div className={`${styles.headerActions} ${styles.noPrint}`}>
            <Button variant="secondary" size="sm" onClick={restaurarTudoCena} title="Cura total e limpa turnos">
              <FaUndoAlt className={styles.btnIcon} /> Restaurar Cena
            </Button>
            <Button variant="primary" size="sm" onClick={resetRodada} title="Avança rodada e limpa turnos">
              <FaRedo className={styles.btnIcon} /> Nova Rodada
            </Button>
          </div>
        )}
      </header>

      {(isMestre || modsCena.decretoDobrarPm || modsCena.roqueBloquearCura || (modsCena.decretoDanoExtra > 0)) && (
        <div className={`${styles.modifiersBar} ${styles.noPrint}`}>
          <span className={styles.modifiersLabel}>Modificadores da Cena:</span>
          {isMestre ? (
            <>
              <button
                type="button"
                className={`${styles.modifierBtn} ${modsCena.decretoDobrarPm ? styles.modifierBtnActive : ''}`}
                onClick={() => atualizarModificadorGlobal({ decretoDobrarPm: !modsCena.decretoDobrarPm })}
              >
                Decreto: Custo PM ×2
              </button>
              <button
                type="button"
                className={`${styles.modifierBtn} ${modsCena.roqueBloquearCura ? styles.modifierBtnActive : ''}`}
                onClick={() => atualizarModificadorGlobal({ roqueBloquearCura: !modsCena.roqueBloquearCura })}
              >
                Roque do Rei: Bloquear Curas
              </button>
              <button
                type="button"
                className={`${styles.modifierBtn} ${modsCena.decretoDanoExtra > 0 ? styles.modifierBtnActive : ''}`}
                onClick={() => atualizarModificadorGlobal({ decretoDanoExtra: modsCena.decretoDanoExtra > 0 ? 0 : 6 })}
              >
                Dano Global +6
              </button>
            </>
          ) : (
            <>
              {modsCena.decretoDobrarPm && <Badge variant="crise" size="sm">Custo PM ×2</Badge>}
              {modsCena.roqueBloquearCura && <Badge variant="crise" size="sm">Curas Bloqueadas</Badge>}
              {modsCena.decretoDanoExtra > 0 && <Badge variant="gold" size="sm">Dano Global +{modsCena.decretoDanoExtra}</Badge>}
            </>
          )}
        </div>
      )}

      <div className={styles.participantesList}>
        {participantes.length === 0 ? (
          <p className={styles.emptyText}>Nenhum combatente na cena.</p>
        ) : (
          participantes.map((p, index) => (
            <CombatantItem
              key={p.id}
              p={p}
              index={index}
              totalParticipantes={participantes.length}
              participantes={participantes}
              isMestre={isMestre}
              isEditando={editandoId === p.id}
              editForm={editForm}
              setEditForm={setEditForm}
              fichasDisponiveis={fichasDisponiveis}
              onToggleTurno={toggleTurno}
              onAtivarTurno={ativarTurnoParticipante}
              onSalvarEdicao={salvarEdicao}
              onCancelarEdicao={cancelarEdicao}
              onMoverItem={moverItem}
              onIniciarExclusao={iniciarExclusao}
              onAlterarRecurso={alterarRecurso}
              onToggleCondicao={toggleCondicao}
            />
          ))
        )}
      </div>

      <QuickActionPanel
        participantes={participantes}
        relogios={relogios}
        acoesFeed={acoesFeed}
        isMestre={isMestre}
        onExecutarAcao={executarAcaoRapida}
        onLimparHistorico={limparHistoricoAcoes}
      />

      {isMestre && (
        <AddParticipantForm
          novoTipo={novoTipo}
          setNovoTipo={setNovoTipo}
          fichaSelecionadaId={idFichaAtual}
          setFichaSelecionadaId={setFichaSelecionadaId}
          fichasDisponiveis={fichasDisponiveis}
          nomeInimigo={nomeInimigo}
          setNomeInimigo={setNomeInimigo}
          hpMaxInput={hpMaxInput}
          setHpMaxInput={setHpMaxInput}
          mpMaxInput={mpMaxInput}
          setMpMaxInput={setMpMaxInput}
          onAddParticipante={handleAddSubmit}
          onSelecionarNpcCatalogo={(npc) => {
            setNpcCatalogoSelecionado(npc);
            setNomeInimigo('');
          }}
        />
      )}

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