import { FaExchangeAlt, FaDice } from 'react-icons/fa';
import { Badge, Button } from '../../../../components/ui';
import { SLOTS_EQUIPAMENTO } from '../../../../domain/fabula/equipmentRules';
import ResultadoRolagemArma from './ResultadoRolagemArma';
import styles from './FichaSlotEquipado.module.css';

export default function FichaSlotEquipado({
  slot,
  itemEquipado,
  classes = [],
  ultimaRolagem,
  modoAtual = 'normal',
  setModoAtual,
  onExecutarRolagem,
  onTrocar,
  onDesequipar
}) {
  const tipoItemEquipado = (itemEquipado?.tipo || '').toLowerCase();
  const temDuploEscudeiro = classes.some((c) =>
    (c.habilidades || []).some(
      (h) => (h.nome || '').toLowerCase().includes('duplo escudeiro') && (parseInt(h.nivel, 10) || 0) > 0
    )
  );

  const ehArmaOuEscudoAtacavel =
    slot.id.includes('mao') &&
    itemEquipado &&
    (tipoItemEquipado.includes('arma') ||
      (slot.id === SLOTS_EQUIPAMENTO.MAO_DOMINANTE && tipoItemEquipado.includes('escudo') && temDuploEscudeiro));

  return (
    <div className={styles.itemEquipadoCard}>
      <div className={styles.itemInfo}>
        <span className={styles.itemNome}>{itemEquipado.nome}</span>
        <Badge variant="gold" size="sm">{itemEquipado.tipo}</Badge>
      </div>

      {ehArmaOuEscudoAtacavel && (
        <div className={styles.ataqueArea}>
          <div className={styles.modoAtaqueSwitcher}>
            <button
              type="button"
              onClick={() => setModoAtual('normal')}
              className={`${styles.modoAtaqueBtn} ${modoAtual === 'normal' ? styles.modoAtaqueBtnActive : ''}`}
            >
              Ataque Único
            </button>
            <button
              type="button"
              onClick={() => setModoAtual('multi')}
              className={`${styles.modoAtaqueBtn} ${modoAtual === 'multi' ? styles.modoAtaqueBtnActiveMulti : ''}`}
            >
              Multiataque / 2ª Arma
            </button>
          </div>

          <Button
            type="button"
            variant="core"
            size="sm"
            fullWidth
            onClick={() => onExecutarRolagem(itemEquipado, slot.id)}
          >
            <FaDice /> Rolar Ataque e Dano
          </Button>

          <ResultadoRolagemArma ultimaRolagem={ultimaRolagem} />
        </div>
      )}

      <div className={styles.slotActions}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onTrocar}
        >
          <FaExchangeAlt /> Trocar
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onDesequipar}
        >
          Desequipar
        </Button>
      </div>
    </div>
  );
}
