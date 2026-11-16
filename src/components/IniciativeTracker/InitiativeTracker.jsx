import { useState } from 'react';
import { FaUndoAlt } from 'react-icons/fa';
import UndoToast from '../UndoToast/UndoToast';
import CustomAlert from '../CustomAlert/CustomAlert';
import CombatantItem from './CombatantItem';
import AddParticipantForm from './AddParticipantForm';
import { useCombatTracker } from '../../hooks/useCombatTracker';
import './InitiativeTracker.css';

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
    <div className="combat-box">
      <div className="box-header">
        <h2>Ordem de Ação & Combate</h2>
        {isMestre && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-reset" onClick={restaurarTudoCena} title="Cura total e limpa turnos">
              <FaUndoAlt /> Restaurar Cena
            </button>
            <button className="btn-reset" onClick={resetRodada}>Nova Rodada</button>
          </div>
        )}
      </div>

      <p className="box-hint">
        {isMestre ? "Gerencie turnos, HP, MP, IP, Fábula, Condições e Estados." : "Acompanhe a ordem dos turnos, status e condições na cena."}
      </p>

      <div className="participantes-list">
        {participantes.length === 0 ? (
          <p className="empty-text">Nenhum combatente na cena.</p>
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
              // onIniciarEdicao={iniciarEdicao}
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

      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={fecharAlerta}
      />

      <UndoToast
        mostrar={mostrarToast}
        mensagem={<><strong>{itemParaExcluir?.nome}</strong> foi removido.</>}
        progressoKey={progressoKey}
        onUndo={desfazerExclusao}
      />
    </div>
  );
}
