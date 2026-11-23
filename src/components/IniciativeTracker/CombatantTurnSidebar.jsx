import { FaBolt, FaChevronRight, FaChevronLeft, FaTimes } from 'react-icons/fa';
import { Badge } from '../ui';
import CombatantTurnActionArea from './CombatantTurnActionArea';
import styles from './CombatantTurnSidebar.module.css';

export default function CombatantTurnSidebar({
  combatente,
  perfil,
  participantes = [],
  companheiros = [],
  relogios = [],
  alvoId,
  alvosIds = [],
  multiAlvoAtivo = false,
  onSelecionarAlvo,
  onToggleMultiAlvo,
  onLimparAlvo,
  onToggleAlvoMulti,
  onExecutarAcao,
  onRolarDados,
  isRecolhida = false,
  onToggleRecolher,
  onFechar
}) {
  if (!combatente) return null;

  if (isRecolhida) {
    return (
      <>
        <div className={`${styles.sidebarContainer} ${styles.collapsed}`}>
          <button
            type="button"
            className={styles.collapsedTab}
            onClick={onToggleRecolher}
            title={`Abrir Central de Turno de ${combatente.nome}`}
            aria-label="Expandir Central de Turno"
          >
            <FaChevronLeft className={styles.tabIcon} />
            <span>⚡ Turno: {combatente.nome}</span>
          </button>
        </div>

        <button
          type="button"
          className={styles.floatingTriggerMobile}
          onClick={onToggleRecolher}
          title={`Abrir Central de Turno de ${combatente.nome}`}
          aria-label="Abrir Central de Turno"
        >
          <FaBolt />
          <span>Turno: {combatente.nome}</span>
        </button>
      </>
    );
  }

  return (
    <aside className={styles.sidebarContainer} aria-label="Central de Turno Retrátil">
      <div
        className={styles.backdrop}
        onClick={onToggleRecolher}
        role="presentation"
      />

      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerLeft}>
            <FaBolt color="var(--color-border-gold-bright)" />
            <span className={styles.headerTitle} title={combatente.nome}>
              Turno: {combatente.nome}
            </span>
            <Badge variant={combatente.tipo === 'heroi' ? 'core' : 'villain'} size="sm">
              {combatente.tipo === 'heroi' ? 'Herói' : 'Inimigo'}
            </Badge>
          </div>

          <div className={styles.headerControls}>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={onToggleRecolher}
              title="Recolher Central de Turno"
              aria-label="Recolher Central de Turno"
            >
              <FaChevronRight />
            </button>
            {onFechar && (
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={onFechar}
                title="Fechar Central de Turno"
                aria-label="Fechar Central de Turno"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className={styles.sidebarBody}>
          <CombatantTurnActionArea
            key={combatente.id}
            combatente={combatente}
            perfil={perfil}
            participantes={participantes}
            companheiros={companheiros}
            relogios={relogios}
            alvoId={alvoId}
            alvosIds={alvosIds}
            multiAlvoAtivo={multiAlvoAtivo}
            onSelecionarAlvo={onSelecionarAlvo}
            onToggleMultiAlvo={onToggleMultiAlvo}
            onLimparAlvo={onLimparAlvo}
            onToggleAlvoMulti={onToggleAlvoMulti}
            onExecutarAcao={onExecutarAcao}
            onRolarDados={onRolarDados}
          />
        </div>
      </div>
    </aside>
  );
}
