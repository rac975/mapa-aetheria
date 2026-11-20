import React from 'react';
import { FaCrosshairs, FaMagic, FaStar } from 'react-icons/fa';
import { Badge } from '../ui';
import { ATRIBUTOS_CONFLITO } from '../../domain/fabula/combatRules';
import styles from './CombatantDiceDrawer.module.css';

export default function CombatantArsenalRollSection({
  atributosAtuais = {},
  armas = [],
  magias = [],
  poderes = [],
  onRolarArma,
  onRolarMagia
}) {
  return (
    <>
      {armas.length > 0 && (
        <div className={styles.sectionBlock}>
          <span className={styles.subTitle}><FaCrosshairs /> Armas & Ataques da Ficha</span>
          <div className={styles.itemsRollGrid}>
            {armas.map((arma) => {
              const s1 = ATRIBUTOS_CONFLITO[arma.attr1]?.sigla || 'DES';
              const s2 = ATRIBUTOS_CONFLITO[arma.attr2]?.sigla || 'VIG';
              const f1 = atributosAtuais[arma.attr1] || 8;
              const f2 = atributosAtuais[arma.attr2] || 8;
              const modPrec = Number(arma.bonusPrecisao) || 0;
              const modStr = modPrec > 0 ? ` + ${modPrec}` : modPrec < 0 ? ` - ${Math.abs(modPrec)}` : '';
              const textoEfeito = arma.resumoEfeito || arma.efeito || '';

              return (
                <button
                  key={arma.id}
                  type="button"
                  className={styles.weaponRollBtn}
                  onClick={() => onRolarArma(arma)}
                >
                  <div className={styles.weaponTop}>
                    <strong className={styles.weaponName}>{arma.nome}</strong>
                    <div className={styles.weaponBadgesGroup}>
                      <Badge variant="gold" size="sm">RA + {arma.bonusDano} {arma.tipoDano}</Badge>
                      {arma.atingeVoadores && (
                        <Badge variant="ether" size="sm" title="Atinge alvos voadores">🦅 Voador</Badge>
                      )}
                      {arma.ehSegundaForma && (
                        <Badge variant="gold" size="sm" title="2ª Forma da Arma Mutável">🔄 2ª Forma</Badge>
                      )}
                      {Array.isArray(arma.especiesCacadora) && arma.especiesCacadora.length > 0 && (
                        <Badge variant="crise" size="sm">🎯 Caçadora: {arma.especiesCacadora.join('/')}</Badge>
                      )}
                      {arma.condicao && (
                        <Badge variant="crise" size="sm">{arma.condicao}</Badge>
                      )}
                    </div>
                  </div>
                  <span className={styles.weaponFormula}>
                    [{s1} d{f1} + {s2} d{f2}]{modStr}
                  </span>
                  {textoEfeito && (
                    <span className={styles.weaponEffectNote}>✦ {textoEfeito}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {magias.length > 0 && (
        <div className={styles.sectionBlock}>
          <span className={styles.subTitle}><FaMagic /> Magias & Feitiços da Ficha</span>
          <div className={styles.itemsRollGrid}>
            {magias.map((magia) => {
              const fAst = atributosAtuais.ast || 8;
              const fVon = atributosAtuais.von || 8;
              return (
                <button
                  key={magia.id}
                  type="button"
                  className={styles.spellRollBtn}
                  onClick={() => onRolarMagia(magia)}
                >
                  <div className={styles.weaponTop}>
                    <strong className={styles.weaponName}>{magia.nome}</strong>
                    <Badge variant="ether" size="sm">{magia.custoPm} PM</Badge>
                  </div>
                  <span className={styles.weaponFormula}>
                    [AST d{fAst} + VON d{fVon}]{magia.bonusPrecisao ? ` + ${magia.bonusPrecisao}` : ''}
                    {magia.bonusDano > 0 ? ` • RA+${magia.bonusDano}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {poderes.length > 0 && (
        <div className={styles.sectionBlock}>
          <span className={styles.subTitle}><FaStar /> Poderes Especiais do NPC</span>
          <div className={styles.poderesCombatList}>
            {poderes.map((poder, idx) => (
              <div key={idx} className={styles.poderCombatCard}>
                <div className={styles.weaponTop}>
                  <span className={styles.poderCombatTitle}>{poder.nome}</span>
                  {Array.isArray(poder.tagsParametros) && poder.tagsParametros.length > 0 && (
                    <div className={styles.weaponBadgesGroup}>
                      {poder.tagsParametros.map((tag, tIdx) => (
                        <Badge key={tIdx} variant="ether" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {poder.descricao && (
                  <p className={styles.poderCombatDesc}>{poder.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
