import { useCombatRealtimeState } from './combat/useCombatRealtimeState';
import { useCombatOpportunities } from './combat/useCombatOpportunities';
import { useCombatRolls } from './combat/useCombatRolls';
import { useCombatInitiative } from './combat/useCombatInitiative';
import { useCombatGroupAndPreActions } from './combat/useCombatGroupAndPreActions';
import { useCombatTurnManagement } from './combat/useCombatTurnManagement';
import { useCombatParticipantCrud } from './combat/useCombatParticipantCrud';
import { useCombatQuickActions } from './combat/useCombatQuickActions';
import { useCombatBossAndVillain } from './combat/useCombatBossAndVillain';
import { useToast } from '../contexts/ToastContext';

/**
 * useCombatTracker
 * Hook orquestrador do combate. Coordena estado em tempo real, turnos, ações rápidas,
 * rolagens, iniciativa, teste em grupo, ações pré-1ª rodada, oportunidades e vilões.
 */
export function useCombatTracker(isMestre) {
  const { coldDelete } = useToast();

  const {
    participantes, setParticipantes, fichasDisponiveis, npcsDisponiveis,
    setNpcsDisponiveis, catalogoModulos, estadoCombate, setEstadoCombate,
    relogios, setRelogios, acoesFeed, setAcoesFeed, isLoading, alerta,
    setAlerta, fecharAlerta, sessaoJogador, jogadorFichaId, jogadorNome,
    recarregarFichas, recarregarParticipantes
  } = useCombatRealtimeState();

  const {
    oportunidadeAtiva,
    dispararOportunidadeCombate,
    votarOportunidadeCombate,
    confirmarOportunidadeCombate,
    descartarOportunidadeCombate
  } = useCombatOpportunities({
    isMestre,
    estadoCombate,
    setEstadoCombate,
    setAcoesFeed,
    jogadorFichaId,
    jogadorNome,
    participantes,
    setParticipantes,
    relogios,
    setRelogios
  });

  const {
    obterPerfilRolagem,
    rolarDadosNoCombate
  } = useCombatRolls({
    isMestre,
    participantes,
    fichasDisponiveis,
    npcsDisponiveis,
    setNpcsDisponiveis,
    catalogoModulos,
    estadoCombate,
    setAcoesFeed,
    setAlerta,
    jogadorFichaId,
    jogadorNome,
    onDispararOportunidade: dispararOportunidadeCombate
  });

  const {
    contadoresAcoes,
    filaUnificada,
    moverItemFila,
    atualizarIniciativa,
    rolarIniciativaCombatente,
    ajustarAcaoSlotInimigo
  } = useCombatInitiative({
    isMestre,
    participantes,
    setParticipantes,
    estadoCombate,
    setEstadoCombate,
    setAcoesFeed,
    setAlerta,
    obterPerfilRolagem,
    jogadorFichaId,
    jogadorNome,
    onDispararOportunidade: dispararOportunidadeCombate
  });

  const {
    modalGrupoIniAberto,
    abrirModalGrupoIniciativa,
    fecharModalGrupoIniciativa,
    aplicarResultadoTesteGrupoIniciativa,
    executarAcaoPreRodada
  } = useCombatGroupAndPreActions({
    isMestre,
    participantes,
    setParticipantes,
    npcsDisponiveis,
    estadoCombate,
    setEstadoCombate,
    relogios,
    setRelogios,
    setAcoesFeed,
    setAlerta,
    obterPerfilRolagem,
    jogadorFichaId,
    jogadorNome,
    dispararOportunidadeCombate
  });

  const {
    toggleTurno,
    ativarTurnoParticipante,
    resetRodada,
    restaurarTudoCena,
    toggleCondicao
  } = useCombatTurnManagement({
    isMestre,
    participantes,
    setParticipantes,
    estadoCombate,
    setEstadoCombate,
    jogadorFichaId,
    jogadorNome
  });

  const {
    editandoId,
    setEditandoId,
    editForm,
    setEditForm,
    addParticipante,
    iniciarExclusao,
    salvarEdicao,
    cancelarEdicao,
    alterarRecurso,
    alterarRecursoCompanheiro
  } = useCombatParticipantCrud({
    isMestre,
    participantes,
    setParticipantes,
    fichasDisponiveis,
    setAlerta,
    jogadorFichaId,
    jogadorNome,
    coldDelete,
    npcsDisponiveis,
    setNpcsDisponiveis
  });

  const {
    atualizarModificadorGlobal,
    executarAcaoRapida,
    limparHistoricoAcoes
  } = useCombatQuickActions({
    isMestre,
    participantes,
    setParticipantes,
    npcsDisponiveis,
    setNpcsDisponiveis,
    estadoCombate,
    setEstadoCombate,
    relogios,
    setRelogios,
    setAcoesFeed,
    setAlerta,
    jogadorFichaId,
    jogadorNome
  });

  const {
    gastarPontoVilaoCombate,
    transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao
  } = useCombatBossAndVillain({
    isMestre,
    participantes,
    setParticipantes,
    setAcoesFeed,
    setAlerta
  });

  return {
    participantes: participantes || [],
    filaUnificada: filaUnificada || [],
    fichasDisponiveis,
    npcsDisponiveis,
    setNpcsDisponiveis,
    catalogoModulos,
    estadoCombate,
    relogios,
    acoesFeed,
    isLoading,
    alerta,
    fecharAlerta,
    jogadorFichaId,
    jogadorNome,
    sessaoJogador,
    recarregarFichas,
    recarregarParticipantes,
    editandoId,
    setEditandoId,
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
    alterarRecursoCompanheiro,
    gastarPontoVilaoCombate,
    transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao,
    ajustarAcaoSlotInimigo,
    toggleCondicao,
    moverItem: moverItemFila,
    moverItemFila,
    obterPerfilRolagem,
    rolarDadosNoCombate,
    atualizarIniciativa,
    rolarIniciativaCombatente,
    ordenarPorIniciativa: abrirModalGrupoIniciativa,
    modalGrupoIniAberto,
    abrirModalGrupoIniciativa,
    fecharModalGrupoIniciativa,
    aplicarResultadoTesteGrupoIniciativa,
    executarAcaoPreRodada,
    oportunidadeAtiva,
    votarOportunidadeCombate,
    confirmarOportunidadeCombate,
    descartarOportunidadeCombate,
    contadoresAcoes
  };
}

export default useCombatTracker;
