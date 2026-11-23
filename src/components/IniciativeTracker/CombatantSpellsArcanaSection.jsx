import { FaMagic, FaGem } from 'react-icons/fa';
import { Badge } from '../ui';
import styles from './CombatantArsenalActions.module.css';

export default function CombatantSpellsArcanaSection({
  magias = [],
  onRolarMagia,
  onInvocarArcano,
  onDispensarArcano
}) {
  if (!magias || magias.length === 0) return null;

  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHeading}>
        <FaMagic /> Conjurar / Feitiços & Arcanos
      </div>
      <div className={styles.itemsGrid}>
        {magias.map((magia) => {
          if (magia.isArcano) {
            if (magia.isDispensaArcano) {
              return (
                <button
                  key={magia.id}
                  type="button"
                  className={`${styles.itemBtn} ${styles.itemBtnArcano}`}
                  onClick={() => onDispensarArcano?.(magia)}
                  title={`Dispensar ${magia.nomeArcano || magia.nome}: ativa efeito de descarte (${magia.danoTotal > 0 ? `${magia.danoTotal} dano ${magia.tipoDano}` : 'Efeito especial'})`}
                >
                  <div className={styles.itemTopLine}>
                    <span className={styles.itemTitle}>{magia.nome}</span>
                    <div className={styles.itemBadges}>
                      <Badge variant="crise" size="sm">Dispensa</Badge>
                      {magia.danoTotal > 0 && (
                        <Badge variant="gold" size="sm">+{magia.danoTotal} Dano ({magia.tipoDano})</Badge>
                      )}
                    </div>
                  </div>
                  <div className={styles.arcanoAutoNotice}>
                    <FaGem className={styles.arcanoIcon} /> Efeito de Descarte (Escala Nv)
                  </div>
                  {magia.descricao && (
                    <div className={styles.itemDesc}>{magia.descricao}</div>
                  )}
                  {magia.circuloArcanoTexto && (
                    <div className={styles.itemDesc}>
                      ⚡ {magia.circuloArcanoTexto}
                    </div>
                  )}
                </button>
              );
            }

            return (
              <button
                key={magia.id}
                type="button"
                className={`${styles.itemBtn} ${styles.itemBtnArcano}`}
                onClick={() => onInvocarArcano?.(magia)}
                title={`Invocar ${magia.nomeArcano || magia.nome} sem teste de atributo (Consome ${magia.custoPm} PM)`}
              >
                <div className={styles.itemTopLine}>
                  <span className={styles.itemTitle}>{magia.nome}</span>
                  <div className={styles.itemBadges}>
                    <Badge variant="core" size="sm">Arcano</Badge>
                    <Badge variant="gold" size="sm">{magia.custoPm} PM</Badge>
                    {magia.curaRegeneracao > 0 && (
                      <Badge variant="ether" size="sm">+{magia.curaRegeneracao} PV</Badge>
                    )}
                  </div>
                </div>
                <div className={styles.arcanoAutoNotice}>
                  <FaGem className={styles.arcanoIcon} /> Invocação Automática (Sem Teste)
                </div>
                {(magia.efeitoInvocacao || magia.descricao) && (
                  <div className={styles.itemDesc}>
                    {magia.efeitoInvocacao || magia.descricao}
                  </div>
                )}
              </button>
            );
          }

          return (
            <button
              key={magia.id}
              type="button"
              className={`${styles.itemBtn} ${styles.itemBtnSpell}`}
              onClick={() => onRolarMagia?.(magia)}
              title={`Conjurar feitiço ${magia.nome}`}
            >
              <div className={styles.itemTopLine}>
                <span className={styles.itemTitle}>{magia.nome}</span>
                <div className={styles.itemBadges}>
                  {magia.isQuimerista && <Badge variant="ether" size="sm">Quimerista</Badge>}
                  {magia.especie && <Badge variant="core" size="sm">{magia.especie}</Badge>}
                  {magia.condicao && <Badge variant="danger" size="sm">{magia.condicao}</Badge>}
                  <Badge variant="gold" size="sm">{magia.custoPm} PM</Badge>
                </div>
              </div>
              <div className={styles.itemSubLine}>
                <span className={styles.itemFormula}>
                  [{(magia.attr1 || 'ast').toUpperCase()}+{(magia.attr2 || 'von').toUpperCase()}
                  {magia.bonusPrecisao ? `+${magia.bonusPrecisao}` : ''}]
                </span>
                {Number(magia.bonusDano) > 0 && (
                  <span className={styles.itemDmg}>+{magia.bonusDano} Dano</span>
                )}
              </div>
              {magia.descricao && <div className={styles.itemDesc}>{magia.descricao}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
