import { useNavigate } from 'react-router-dom';
import {
  FaUndoAlt, FaRedo, FaBroadcastTower, FaUserPlus, FaSlidersH, FaSortAmountDown, FaIdCard
} from 'react-icons/fa';
import { Button, Badge } from '../ui';
import styles from './InitiativeTracker.module.css';

export default function CombatTrackerHeader({
  isMestre,
  rodada = 1,
  jogadorNome,
  pendentesTurno = 0,
  totalVivos = 0,
  totalAcoesRodada = 0,
  mostrarModsCena,
  temModGlobalAtivo,
  setMostrarModsCena,
  exibirPainelAdicao,
  setMostrarFormAdicao,
  restaurarTudoCena,
  resetRodada,
  onOrdenarPorIniciativa
}) {
  const navigate = useNavigate();
  const temMultiAcoes = totalAcoesRodada > totalVivos;

  return (
    <header className={styles.boxHeader}>
      <div className={styles.titleGroup}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Ordem de Combate</h2>
          <Badge variant="gold" size="sm">Rodada {rodada}</Badge>
          <Badge variant="core" size="sm"><FaBroadcastTower /> Ao Vivo</Badge>
          {!isMestre && jogadorNome && (
            <Badge variant="ether" size="sm">Jogador: {jogadorNome}</Badge>
          )}
          {totalVivos > 0 && (
            <Badge variant="default" size="sm" title={temMultiAcoes ? `${pendentesTurno} de ${totalAcoesRodada} ações pendentes na rodada` : undefined}>
              {pendentesTurno}/{temMultiAcoes ? totalAcoesRodada : totalVivos} {temMultiAcoes ? 'Ações Pendentes' : 'Turnos Pendentes'}
            </Badge>
          )}
        </div>
        <p className={styles.boxHint}>
          {isMestre
            ? 'Clique em um card para selecioná-lo na Central de Ações. Use os controles de Iniciativa (INI), Vilão, PV/PM, Status e reordene a fila como desejar.'
            : 'Clique no seu card para preparar sua ação, ou clique em um inimigo/aliado para defini-lo como alvo da sua ação.'}
        </p>
      </div>

      <div className={`${styles.headerActions} ${styles.noPrint}`}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/ficha')}
          title="Ir para a Ficha do Personagem"
        >
          <FaIdCard className={styles.btnIcon} /> Ficha
        </Button>

        {isMestre && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onOrdenarPorIniciativa}
              title="Ordenar combatentes por Iniciativa (maior para menor, Heróis primeiro em empate)"
            >
              <FaSortAmountDown className={styles.btnIcon} /> Por Iniciativa
            </Button>
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
          </>
        )}
      </div>
    </header>
  );
}
