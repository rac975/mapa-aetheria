import CombatantWeaponsSection from './CombatantWeaponsSection';
import CombatantSpellsArcanaSection from './CombatantSpellsArcanaSection';
import CombatantAbilitiesSection from './CombatantAbilitiesSection';
import CombatantCompanionSection from './CombatantCompanionSection';
import { useArsenalActionHandlers } from '../../hooks/combat/useArsenalActionHandlers';
import styles from './CombatantArsenalActions.module.css';

export default function CombatantArsenalActions({
  combatente,
  perfil,
  participantes = [],
  alvoId,
  alvosIds = [],
  alvo = null,
  multiAlvoAtivo = false,
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setDanoAplicado,
  setCuraAplicada,
  setTipoDano,
  setCustoPm,
  setNotaLivre,
  onHabilidadeSelecionada
}) {
  const {
    handleRolarArma,
    handleRolarMagia,
    handleInvocarArcano,
    handleDispensarArcano,
    handleAtivarHabilidadeDireta,
    handleSelecionarHabilidade,
    handleRolarAtaqueCompanheiro,
    handleUsarFeiticoCompanheiro,
    handleUsarPoderCompanheiro
  } = useArsenalActionHandlers({
    combatente,
    perfil,
    participantes,
    alvoId,
    alvosIds,
    alvo,
    multiAlvoAtivo,
    marcarTurnoConcluido,
    onExecutarAcao,
    onRolarDados,
    setDanoAplicado,
    setCuraAplicada,
    setTipoDano,
    setCustoPm,
    setNotaLivre,
    onHabilidadeSelecionada
  });

  if (!combatente || !perfil) return null;

  const armas = (perfil.armas || []).filter(
    (a) => a.id !== 'desarmado' && a.id !== 'ataque_desarmado' && !a.ehDesarmado && !a.nome?.toLowerCase().includes('desarmad')
  );
  const magias = perfil.magias || [];
  const habilidades = perfil.habilidades || [];
  const companheiro = perfil.companheiro || null;

  return (
    <div className={styles.arsenalWrap} onClick={(e) => e.stopPropagation()}>
      <CombatantWeaponsSection
        armas={armas}
        combatenteTipo={combatente.tipo}
        onRolarArma={handleRolarArma}
      />
      <CombatantSpellsArcanaSection
        magias={magias}
        onRolarMagia={handleRolarMagia}
        onInvocarArcano={handleInvocarArcano}
        onDispensarArcano={handleDispensarArcano}
      />
      {companheiro && (
        <CombatantCompanionSection
          companheiro={companheiro}
          onRolarAtaqueCompanheiro={handleRolarAtaqueCompanheiro}
          onUsarFeiticoCompanheiro={handleUsarFeiticoCompanheiro}
          onUsarPoderCompanheiro={handleUsarPoderCompanheiro}
        />
      )}
      <CombatantAbilitiesSection
        habilidades={habilidades}
        onSelecionarHabilidade={handleSelecionarHabilidade}
        onAtivarHabilidadeDireta={handleAtivarHabilidadeDireta}
      />
    </div>
  );
}
