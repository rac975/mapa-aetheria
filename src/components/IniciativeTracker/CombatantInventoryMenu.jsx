import React from 'react';
import { FaCircle, FaFlask, FaTint, FaLeaf, FaBoxOpen } from 'react-icons/fa';
import styles from './CombatantSecondaryActions.module.css';

export default function CombatantInventoryMenu({
  isOpen,
  onClose,
  magiesferas = [],
  onUsarItemPadrao,
  onUsarPocaoCura,
  onUsarElixirMana,
  onUsarTonicoRestaurador,
  onAtivarMagiesfera
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.invDropdownMenu} onClick={(e) => e.stopPropagation()}>
      <div className={styles.invMenuHeader}>Opções de Inventário (PI)</div>

      <button
        type="button"
        className={styles.invMenuItem}
        onClick={() => { onClose(); onUsarItemPadrao(); }}
      >
        <FaBoxOpen />
        <span>Item Geral / Consumível</span>
        <span className={styles.invMenuCost}>1 PI</span>
      </button>

      <button
        type="button"
        className={styles.invMenuItem}
        onClick={() => { onClose(); onUsarPocaoCura(); }}
        title="Poção de Cura: Restaura 40 PV no alvo (ou em si mesmo)"
      >
        <FaFlask />
        <span>Poção de Cura (+40 PV)</span>
        <span className={styles.invMenuCost}>2 PI</span>
      </button>

      <button
        type="button"
        className={styles.invMenuItem}
        onClick={() => { onClose(); onUsarElixirMana(); }}
        title="Elixir: Restaura 30 PM no alvo (ou em si mesmo)"
      >
        <FaTint />
        <span>Elixir de Mana (+30 PM)</span>
        <span className={styles.invMenuCost}>2 PI</span>
      </button>

      <button
        type="button"
        className={styles.invMenuItem}
        onClick={() => { onClose(); onUsarTonicoRestaurador(); }}
        title="Tônico Restaurador: Remove todas as condições do alvo"
      >
        <FaLeaf />
        <span>Tônico Restaurador (Cura Status)</span>
        <span className={styles.invMenuCost}>1 PI</span>
      </button>

      {magiesferas.length > 0 && (
        <>
          <div className={styles.invMenuDivider}>Magiesferas do Inventor</div>
          {magiesferas.map((m, idx) => (
            <button
              key={`${m.id}_${idx}`}
              type="button"
              className={`${styles.invMenuItem} ${styles.invMenuItemSphere}`}
              onClick={() => { onClose(); onAtivarMagiesfera(m); }}
              title={`Ativar Magiesfera ${m.nome}: 2 PI + ${m.custoPm} PM`}
            >
              <FaCircle className={styles.sphereDotIcon} />
              <span>{m.nome}</span>
              <span className={styles.invMenuCost}>2 PI + {m.custoPm} PM</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
