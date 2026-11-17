import { useState } from 'react';
import { FaUndoAlt, FaRedo } from 'react-icons/fa';
import { Card, Button, Modal, UndoToast } from '../ui';
import CombatantItem from './CombatantItem';
import AddParticipantForm from './AddParticipantForm';
import { useCombatTracker } from '../../hooks/useCombatTracker';
import styles from './InitiativeTracker.module.css';

export default function InitiativeTracker({ isMestre }) {
  const {
    participantes,
    fichasDisponiveis,
    alerta,
    fecharAlerta,
    itemParaExcluir,
    mostrarToast,
    progressoKey,
    editandoId,
    editForm,
    setEditForm,
    toggleTurno,
    resetRodada,
    restaurarTudoCena,
    addParticipante,
    iniciarExclusao,
    desfazerExclusao,
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

  // Inicializa o id da ficha se ainda não estiver selecionado
  const idFichaAtual = fichaSelecionadaId || (fichasDisponiveis.length > 0 ? fichasDisponiveis[0].id : '');

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

    if (sucesso) {
      setNomeInimigo('');
    }
  };

  return (
    <Card variant="default" className={styles.combatBox}>
      <header className={styles.boxHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Ordem de Ação & Combate</h2>
          <p className={styles.boxHint}>
            {isMestre
              ? 'Gerencie turnos, PV, PM, IP, Fábula, Condições e Estados.'
              : 'Acompanhe a ordem dos turnos, status e condições na cena.'}
          </p>
        </div>

        {isMestre && (
          <div className={`${styles.headerActions} ${styles.noPrint}`}>
            <Button
              variant="secondary"
              size="sm"
              onClick={restaurarTudoCena}
              title="Cura total e limpa turnos"
            >
              <FaUndoAlt className={styles.btnIcon} /> Restaurar Cena
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={resetRodada}
              title="Limpar turnos e iniciar nova rodada"
            >
              <FaRedo className={styles.btnIcon} /> Nova Rodada
            </Button>
          </div>
        )}
      </header>

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
              isMestre={isMestre}
              isEditando={editandoId === p.id}
              editForm={editForm}
              setEditForm={setEditForm}
              fichasDisponiveis={fichasDisponiveis}
              onToggleTurno={toggleTurno}
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

      <Modal
        isOpen={alerta.isOpen}
        onClose={fecharAlerta}
        title={alerta.title || 'Aviso de Combate'}
        size="sm"
        footer={
          <Button variant="primary" size="sm" onClick={fecharAlerta}>
            Entendi
          </Button>
        }
      >
        <p className={styles.modalMessage}>{alerta.message}</p>
      </Modal>
    </Card>
  );
}
