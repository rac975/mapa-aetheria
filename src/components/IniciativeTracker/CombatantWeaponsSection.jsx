import { FaCrosshairs } from 'react-icons/fa';
import { Badge } from '../ui';
import styles from './CombatantArsenalActions.module.css';

export default function CombatantWeaponsSection({
  armas = [],
  combatenteTipo = 'heroi',
  onRolarArma
}) {
  if (!armas || armas.length === 0) return null;

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHeading}>
        <FaCrosshairs /> {combatenteTipo === 'heroi' ? 'Armas & Módulos Equipados' : 'Ataques do Inimigo'}
      </div>
      <div className={styles.itemsGrid}>
        {armas.map((arma) => (
          <button
            key={arma.id}
            type="button"
            className={styles.itemBtn}
            onClick={() => onRolarArma?.(arma)}
            title={`Rolar ataque com ${arma.nome}`}
          >
            <div className={styles.itemTopLine}>
              <span className={styles.itemTitle}>{arma.nome}</span>
              <div className={styles.itemBadges}>
                {arma.isDuasArmas && <Badge variant="crise" size="sm">Duas Armas</Badge>}
                {arma.ehDuasMaos && !arma.isDuasArmas && <Badge variant="default" size="sm">2 Mãos</Badge>}
                {arma.propriedadeMulti && <Badge variant="gold" size="sm">Multi ({arma.propriedadeMulti})</Badge>}
                {arma.alcance === 'distancia' ? (
                  <Badge variant="ether" size="sm">Distância</Badge>
                ) : (
                  <Badge variant="default" size="sm">CaC</Badge>
                )}
                {arma.atingeVoadores && <Badge variant="gold" size="sm">🦅</Badge>}
                {arma.ehSegundaForma && <Badge variant="core" size="sm">2ª Forma</Badge>}
                {arma.isModuloVeicular && <Badge variant="gold" size="sm">Veicular</Badge>}
                {arma.substituiuAstucia && <Badge variant="ether" size="sm">🧠 AST</Badge>}
                {arma.condicao && <Badge variant="crise" size="sm">{arma.condicao}</Badge>}
              </div>
            </div>
            <div className={styles.itemSubLine}>
              <span className={styles.itemFormula}>
                [{arma.attr1.toUpperCase()}+{arma.attr2.toUpperCase()}
                {arma.bonusPrecisao ? `+${arma.bonusPrecisao}` : ''}]
              </span>
              <span className={styles.itemDmg}>
                {arma.isDuasArmas
                  ? `1º RA+${arma.bonusDano} • 2º (RA=0)+${arma.bonusDanoSecundario}`
                  : `+${arma.bonusDano} (${arma.tipoDano})`}
              </span>
            </div>
            {(arma.resumoEfeito || arma.efeito) && (
              <div className={styles.itemDesc}>{arma.resumoEfeito || arma.efeito}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
