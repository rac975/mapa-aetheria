import React from 'react';
import {
  FaShieldAlt, FaBoxOpen, FaSearch, FaFlagCheckered, FaHandPaper, FaFlag
} from 'react-icons/fa';
import CombatantInventoryMenu from './CombatantInventoryMenu';
import { useCombatSecondaryActionHandlers } from '../../hooks/combat/useCombatSecondaryActionHandlers';
import styles from './CombatantSecondaryActions.module.css';

export default function CombatantSecondaryActions({
  ator,
  perfil,
  alvoId,
  relogios = [],
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setNotaLivre,
  setAvancoRelogio
}) {
  const {
    menuInventarioAberto,
    setMenuInventarioAberto,
    handleGuarda,
    handleInventarioPadrao,
    handlePocaoCura,
    handleElixirMana,
    handleTonicoRestaurador,
    handleAtivarMagiesfera,
    handleEstudo,
    handleObjetivo,
    handleImpedimento,
    handleRendicao
  } = useCombatSecondaryActionHandlers({
    ator,
    perfil,
    alvoId,
    relogios,
    marcarTurnoConcluido,
    onExecutarAcao,
    onRolarDados,
    setNotaLivre,
    setAvancoRelogio
  });

  if (!ator) return null;

  const magiesferas = Array.isArray(perfil?.magiesferas) ? perfil.magiesferas : [];

  return (
    <div className={styles.secondaryActionsBar} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`${styles.secActionBtn} ${styles.secActionBtnGuard}`}
        onClick={handleGuarda}
        title="Entrar em Guarda (+2 em testes opostos e cobre aliado se houver alvo)"
      >
        <FaShieldAlt /> Guarda
      </button>

      <div className={styles.invDropdownContainer}>
        <button
          type="button"
          className={`${styles.secActionBtn} ${styles.secActionBtnInv}`}
          onClick={() => setMenuInventarioAberto((prev) => !prev)}
          title="Ação de Inventário (Usar itens consumíveis, poções ou Magiesferas)"
        >
          <FaBoxOpen /> Inventário {magiesferas.length > 0 && `(${magiesferas.length})`}
        </button>

        <CombatantInventoryMenu
          isOpen={menuInventarioAberto}
          onClose={() => setMenuInventarioAberto(false)}
          magiesferas={magiesferas}
          onUsarItemPadrao={handleInventarioPadrao}
          onUsarPocaoCura={handlePocaoCura}
          onUsarElixirMana={handleElixirMana}
          onUsarTonicoRestaurador={handleTonicoRestaurador}
          onAtivarMagiesfera={handleAtivarMagiesfera}
        />
      </div>

      <button
        type="button"
        className={styles.secActionBtn}
        onClick={handleEstudo}
        title="Estudo: [AST + AST] vs ND 10 para descobrir características e afinidades"
      >
        <FaSearch /> Estudo
      </button>

      <button
        type="button"
        className={styles.secActionBtn}
        onClick={handleObjetivo}
        title="Objetivo: Realizar teste tático para avançar relógio de conflito"
      >
        <FaFlagCheckered /> Objetivo
      </button>

      <button
        type="button"
        className={styles.secActionBtn}
        onClick={handleImpedimento}
        title="Impedimento: Teste Oposto [DES + VON] para atrapalhar um oponente"
      >
        <FaHandPaper /> Impedimento
      </button>

      <button
        type="button"
        className={`${styles.secActionBtn} ${styles.secActionBtnSurrender}`}
        onClick={handleRendicao}
        title="Rendição: O herói aceita uma derrota narrativa sem risco de morte (+2 Pontos de Fábula)"
      >
        <FaFlag /> Rendição
      </button>
    </div>
  );
}
