import { FaShieldAlt, FaMagic, FaBoxOpen, FaStar, FaSkull, FaHeartbeat } from 'react-icons/fa';
import { Badge, ResourceBar } from '../ui';
import styles from './CombatantItem.module.css';

export default function CombatantVitalsCluster({
  p,
  isMestre,
  maxHp,
  maxMp,
  emCrise,
  defesaHeroi,
  mdefHeroi,
  perfilRolagem,
  ehChefeOuVilao,
  pontosVilao,
  danoInimigo
}) {
  return (
    <div className={styles.vitalsCluster} onClick={(e) => isMestre && e.stopPropagation()}>
      {(p.tipo === 'heroi' || isMestre) && (
        <div className={styles.barsInline}>
          <div className={styles.barCompact}>
            <ResourceBar type="pv" current={p.hp_atual} max={maxHp} label="PV" isCrise={emCrise} />
          </div>
          <div className={styles.barCompact}>
            <ResourceBar type="pm" current={p.mp_atual} max={maxMp} label="PM" />
          </div>
        </div>
      )}

      {p.tipo === 'heroi' ? (
        <div className={styles.pillsInline}>
          <span className={styles.statPill} title="Defesa Física"><FaShieldAlt /> DEF {defesaHeroi}</span>
          <span className={styles.statPill} title="Defesa Mágica"><FaMagic /> M.DEF {mdefHeroi}</span>
          <span className={styles.statPill} title="Pontos de Inventário"><FaBoxOpen /> IP {p.ip}</span>
          <span className={`${styles.statPill} ${styles.statPillGold}`} title="Pontos de Fábula"><FaStar /> PF {p.pontos_fabula}</span>
        </div>
      ) : (
        <div className={styles.pillsInline}>
          {isMestre && perfilRolagem && (
            <>
              <span className={styles.statPill} title="Defesa Física"><FaShieldAlt /> DEF {perfilRolagem.defesa}</span>
              <span className={styles.statPill} title="Defesa Mágica"><FaMagic /> M.DEF {perfilRolagem.mdef}</span>
            </>
          )}
          {isMestre && (ehChefeOuVilao || pontosVilao > 0) && (
            <span className={`${styles.statPill} ${styles.statPillVillain}`} title="Pontos de Vilão (Última)">
              <FaSkull /> PVilão {pontosVilao}
            </span>
          )}
          {isMestre && <Badge variant="crise" size="sm"><FaHeartbeat /> Dano: {danoInimigo}</Badge>}
        </div>
      )}
    </div>
  );
}
