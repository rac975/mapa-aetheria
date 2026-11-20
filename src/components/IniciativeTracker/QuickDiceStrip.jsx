import { useState } from 'react';
import { FaDice, FaCrosshairs, FaMagic } from 'react-icons/fa';
import { Badge } from '../ui';
import { ATRIBUTOS_CONFLITO } from '../../domain/fabula/combatRules';
import styles from './QuickDiceStrip.module.css';

const LISTA_ATRIBS = Object.values(ATRIBUTOS_CONFLITO);

export default function QuickDiceStrip({
  atorSelecionado,
  perfilAtor,
  acaoCodigo,
  onRolarArma,
  onRolarMagia,
  onRolarTeste
}) {
  const [attr1, setAttr1] = useState('des');
  const [attr2, setAttr2] = useState('ast');

  if (!atorSelecionado || !perfilAtor) return null;

  const { atributosAtuais, armas = [], magias = [] } = perfilAtor;
  const mostrarArmas =
    ['ATAQUE', 'CONTRA_ATAQUE', 'MULTI_ATAQUE', 'DUAS_ARMAS', 'TIRO_AVISO_QUEBRA_OSSOS'].includes(acaoCodigo) ||
    armas.length > 0;
  const mostrarMagias = acaoCodigo === 'CONJURAR' && magias.length > 0;

  return (
    <div className={styles.quickDiceStrip}>
      <div className={styles.quickDiceHeader}>
        <div className={styles.quickDiceLabelGroup}>
          <FaDice className={styles.diceAccentIcon} />
          <span className={styles.quickDiceTitle}>Dados de {atorSelecionado.nome}:</span>
          <div className={styles.miniAttrsInline}>
            {LISTA_ATRIBS.map((a) => (
              <span key={a.key} className={styles.miniAttrBadge}>
                {a.sigla} <strong>d{atributosAtuais[a.key] || 8}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className={styles.quickTestInline}>
          <select
            className={styles.miniSelect}
            value={attr1}
            onChange={(e) => setAttr1(e.target.value)}
            aria-label="Atributo 1 para rolagem rápida"
          >
            {LISTA_ATRIBS.map((a) => (
              <option key={a.key} value={a.key}>{a.sigla} (d{atributosAtuais[a.key]})</option>
            ))}
          </select>
          <span className={styles.plusSign}>+</span>
          <select
            className={styles.miniSelect}
            value={attr2}
            onChange={(e) => setAttr2(e.target.value)}
            aria-label="Atributo 2 para rolagem rápida"
          >
            {LISTA_ATRIBS.map((a) => (
              <option key={a.key} value={a.key}>{a.sigla} (d{atributosAtuais[a.key]})</option>
            ))}
          </select>
          <button
            type="button"
            className={styles.quickRollTriggerBtn}
            onClick={() => onRolarTeste(attr1, attr2)}
            title="Rolar teste com os atributos da ficha e preencher nota"
          >
            <FaDice /> Rolar Teste
          </button>
        </div>
      </div>

      <div className={styles.quickItemsRollRow}>
        {mostrarMagias ? (
          magias.map((m) => (
            <button
              key={m.id}
              type="button"
              className={styles.quickSpellRollChip}
              onClick={() => onRolarMagia(m)}
              title={`Rolar feitiço ${m.nome} e preencher PM/Dano automaticamente`}
            >
              <FaMagic />
              <span>{m.nome}</span>
              <Badge variant="ether" size="sm">{m.custoPm} PM</Badge>
            </button>
          ))
        ) : (
          mostrarArmas &&
          armas.map((arma) => {
            const s1 = ATRIBUTOS_CONFLITO[arma.attr1]?.sigla || 'DES';
            const s2 = ATRIBUTOS_CONFLITO[arma.attr2]?.sigla || 'VIG';
            return (
              <button
                key={arma.id}
                type="button"
                className={styles.quickWeaponRollChip}
                onClick={() => onRolarArma(arma)}
                title={`Rolar ataque com ${arma.nome} e preencher Dano Bruto automaticamente`}
              >
                <FaCrosshairs />
                <span>{arma.nome} [{s1}+{s2}]</span>
                {arma.atingeVoadores && (
                  <span className={styles.chipFlyTag} title="Atinge alvos voadores">🦅</span>
                )}
                <span className={styles.chipDmgTag}>RA+{arma.bonusDano}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
