import { useState } from 'react';
import { Card } from '../ui';
import CustomAlert from '../CustomAlert/CustomAlert';
import CombatantItem from './CombatantItem';
import QuickActionPanel from './QuickActionPanel';
import AddParticipantForm from './AddParticipantForm';
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

  const [novoTipo, setNovoTipo] = useState('heroi');
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState('');
  const [nomeInimigo, setNomeInimigo] = useState('');
  const [hpMaxInput, setHpMaxInput] = useState(30);
  const [mpMaxInput, setMpMaxInput] = useState(20);
  const [tipoVilaoInput, setTipoVilaoInput] = useState('padrao');
  const [voadorInput, setVoadorInput] = useState(false);
  const [npcCatalogoSelecionado, setNpcCatalogoSelecionado] = useState(null);

  const [mostrarFormAdicao, setMostrarFormAdicao] = useState(false);
  const [mostrarModsCena, setMostrarModsCena] = useState(false);

  const idFichaAtual = fichaSelecionadaId || (fichasDisponiveis.length > 0 ? fichasDisponiveis[0].id : '');
  const modsCena = estadoCombate?.modificadores_globais || {};
  const temModGlobalAtivo = Boolean(
    modsCena.decretoDobrarPm || modsCena.roqueBloquearCura || (modsCena.decretoDanoExtra > 0)
  );

  const vivos = participantes.filter((p) => Number(p.hp_atual) > 0);
  const pendentesTurno = vivos.filter((p) => !p.agiu).length;

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
      setAtorFocoId(combatente.id);
    } else {
      const ehMeu = Boolean(
        (jogadorFichaId && String(combatente.ficha_id) === jogadorFichaId) ||
        (jogadorNome && combatente.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
      );
      if (ehMeu) {
        setAtorFocoId(combatente.id);
      } else {
        setAlvoFocoId(combatente.id);
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const acoesDefault = tipoVilaoInput === 'soberano' ? 3 : (tipoVilaoInput === 'elite' || tipoVilaoInput === 'campeao') ? 2 : 1;
    const sucesso = await addParticipante({
      tipo: novoTipo,
      fichaSelecionadaId: idFichaAtual,
      nomeInimigo,
      hpMaxInput,
      mpMaxInput,
      tipoVilaoInput,
      acoesPorTurnoInput: acoesDefault,
      voadorInput,
      npcCatalogoSelecionado
    });
    if (sucesso) {
      setNomeInimigo('');
      setVoadorInput(false);
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

      {exibirPainelAdicao && (
        <AddParticipantForm
          novoTipo={novoTipo}
          setNovoTipo={setNovoTipo}
          fichaSelecionadaId={idFichaAtual}
          setFichaSelecionadaId={setFichaSelecionadaId}
          fichasDisponiveis={fichasDisponiveis}
          npcsDisponiveis={npcsDisponiveis}
          nomeInimigo={nomeInimigo}
          setNomeInimigo={setNomeInimigo}
          hpMaxInput={hpMaxInput}
          setHpMaxInput={setHpMaxInput}
          mpMaxInput={mpMaxInput}
          setMpMaxInput={setMpMaxInput}
          tipoVilaoInput={tipoVilaoInput}
          setTipoVilaoInput={setTipoVilaoInput}
          voadorInput={voadorInput}
          setVoadorInput={setVoadorInput}
          onAddParticipante={handleAddSubmit}
          onSelecionarNpcCatalogo={(npc) => {
            setNpcCatalogoSelecionado(npc);
            setNomeInimigo('');
          }}
        />
      )}

      <div className={styles.participantesList}>
        {participantes.length === 0 ? (
          <p className={styles.emptyText}>Nenhum combatente ativo na cena.</p>
        ) : (
          participantes.map((p, index) => (
            <CombatantItem
              key={p.id}
              p={p}
              index={index}
              totalParticipantes={participantes.length}
              participantes={participantes}
              isMestre={isMestre}
              jogadorFichaId={jogadorFichaId}
              jogadorNome={jogadorNome}
              isAtorSelecionado={String(p.id) === String(atorFocoId)}
              isAlvoSelecionado={String(p.id) === String(alvoFocoId)}
              onSelecionarCombatente={handleSelecionarCombatente}
              isEditando={editandoId === p.id}
              editForm={editForm}
              setEditForm={setEditForm}
              fichasDisponiveis={fichasDisponiveis}
              perfilRolagem={obterPerfilRolagem(p)}
              onToggleTurno={toggleTurno}
              onAtivarTurno={ativarTurnoParticipante}
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
          ))
        )}
      </div>

      <QuickActionPanel
        participantes={participantes}
        relogios={relogios}
        acoesFeed={acoesFeed}
        isMestre={isMestre}
        jogadorFichaId={jogadorFichaId}
        jogadorNome={jogadorNome}
        atorFocoId={atorFocoId}
        setAtorFocoId={setAtorFocoId}
        alvoFocoId={alvoFocoId}
        setAlvoFocoId={setAlvoFocoId}
        obterPerfilRolagem={obterPerfilRolagem}
        onRolarDados={rolarDadosNoCombate}
        onExecutarAcao={executarAcaoRapida}
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
