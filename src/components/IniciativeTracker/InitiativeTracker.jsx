import { useState } from 'react';
import {
  FaUndoAlt, FaRedo, FaBroadcastTower, FaUserPlus, FaSlidersH
} from 'react-icons/fa';
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
    npcsDisponiveis,
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
    gastarPontoVilaoCombate,
    transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao,
    toggleCondicao,
    moverItem,
    obterPerfilRolagem,
    rolarDadosNoCombate
  } = useCombatTracker(isMestre);

  const [novoTipo, setNovoTipo] = useState('heroi');
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState('');
  const [nomeInimigo, setNomeInimigo] = useState('');
  const [hpMaxInput, setHpMaxInput] = useState(30);
  const [mpMaxInput, setMpMaxInput] = useState(20);
  const [tipoVilaoInput, setTipoVilaoInput] = useState('padrao');
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
      npcCatalogoSelecionado
    });
    if (sucesso) setNomeInimigo('');
  };

  const exibirPainelAdicao = isMestre && (mostrarFormAdicao || participantes.length === 0);

  return (
    <Card variant="default" className={styles.combatBox}>
      <header className={styles.boxHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Ordem de Combate</h2>
            <Badge variant="gold" size="sm">Rodada {estadoCombate?.rodada || 1}</Badge>
            <Badge variant="core" size="sm"><FaBroadcastTower /> Ao Vivo</Badge>
            {vivos.length > 0 && (
              <Badge variant="default" size="sm">
                {pendentesTurno}/{vivos.length} Turnos Pendentes
              </Badge>
            )}
          </div>
          <p className={styles.boxHint}>
            {isMestre
              ? 'Clique em um card para marcar o turno ou use Dados, PV/PM e Status para rolagens e ajustes.'
              : 'Acompanhe a ordem de turnos, role dados da sua ficha e dispare ações rápidas sincronizadas.'}
          </p>
        </div>

        {isMestre && (
          <div className={`${styles.headerActions} ${styles.noPrint}`}>
            <Button
              variant={mostrarModsCena || temModGlobalAtivo ? 'core' : 'ghost'}
              size="sm"
              onClick={() => setMostrarModsCena((v) => !v)}
              title="Alternar modificadores globais da cena"
            >
              <FaSlidersH className={styles.btnIcon} /> Efeitos de Cena
            </Button>
            <Button
              variant={exibirPainelAdicao ? 'core' : 'ghost'}
              size="sm"
              onClick={() => setMostrarFormAdicao((v) => !v)}
              title="Adicionar herói ou inimigo ao combate"
            >
              <FaUserPlus className={styles.btnIcon} /> Combatente
            </Button>
            <Button variant="secondary" size="sm" onClick={restaurarTudoCena} title="Cura total e limpa turnos">
              <FaUndoAlt className={styles.btnIcon} /> Restaurar
            </Button>
            <Button variant="primary" size="sm" onClick={resetRodada} title="Avança rodada e limpa turnos">
              <FaRedo className={styles.btnIcon} /> Nova Rodada
            </Button>
          </div>
        )}
      </header>

      {(mostrarModsCena || temModGlobalAtivo) && (
        <div className={`${styles.modifiersBar} ${styles.noPrint}`}>
          <span className={styles.modifiersLabel}>Modificadores da Cena:</span>
          {isMestre ? (
            <div className={styles.modifiersControls}>
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
            </div>
          ) : (
            <div className={styles.modifiersControls}>
              {modsCena.decretoDobrarPm && <Badge variant="crise" size="sm">Custo PM ×2</Badge>}
              {modsCena.roqueBloquearCura && <Badge variant="crise" size="sm">Curas Bloqueadas</Badge>}
              {modsCena.decretoDanoExtra > 0 && <Badge variant="gold" size="sm">Dano Global +{modsCena.decretoDanoExtra}</Badge>}
            </div>
          )}
        </div>
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
              isEditando={editandoId === p.id}
              editForm={editForm}
              setEditForm={setEditForm}
              fichasDisponiveis={fichasDisponiveis}
              perfilRolagem={obterPerfilRolagem(p)}
              onToggleTurno={toggleTurno}
              onAtivarTurno={ativarTurnoParticipante}
              onSalvarEdicao={salvarEdicao}
              onCancelarEdicao={cancelarEdicao}
              onMoverItem={moverItem}
              onIniciarExclusao={iniciarExclusao}
              onAlterarRecurso={alterarRecurso}
              onGastarPontoVilao={gastarPontoVilaoCombate}
              onTransicionarFase={transicionarFaseChefeCombate}
              onAjustarAcaoTurno={ajustarAcaoTurnoVilao}
              onToggleCondicao={toggleCondicao}
              onRolarDados={rolarDadosNoCombate}
            />
          ))
        )}
      </div>

      <QuickActionPanel
        participantes={participantes}
        relogios={relogios}
        acoesFeed={acoesFeed}
        isMestre={isMestre}
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
