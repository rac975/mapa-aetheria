import { useState } from 'react';
import { FaSlidersH, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { AFINIDADES_DANO } from '../../domain/fabula/combatRules';
import { CONDICOES_DISPONIVEIS } from '../../constants/condicoes';
import styles from './CombatantEffectAccordion.module.css';

const LISTA_TIPOS_DANO = ['fisico', 'magico', 'fogo', 'gelo', 'raio', 'ar', 'terra', 'luz', 'sombra', 'veneno'];

export default function CombatantEffectAccordion({
  danoAplicado,
  setDanoAplicado,
  curaAplicada,
  setCuraAplicada,
  recursoCura,
  setRecursoCura,
  tipoDano,
  setTipoDano,
  afinidadeAlvo,
  setAfinidadeAlvo,
  condicaoAlvo,
  setCondicaoAlvo,
  custoPm,
  setCustoPm,
  custoPi,
  setCustoPi,
  notaLivre,
  setNotaLivre
}) {
  const [aberto, setAberto] = useState(false);

  const temModificadorAtivo =
    Number(danoAplicado) > 0 ||
    Number(curaAplicada) > 0 ||
    Number(custoPm) > 0 ||
    Number(custoPi) > 0 ||
    afinidadeAlvo !== AFINIDADES_DANO.NORMAL ||
    Boolean(condicaoAlvo) ||
    Boolean(notaLivre);

  return (
    <div className={styles.accordionWrap} onClick={(e) => e.stopPropagation()}>
      <header className={styles.accordionHeader} onClick={() => setAberto((v) => !v)}>
        <div className={styles.accordionTitle}>
          <FaSlidersH />
          <span>Ajuste / Aplicar Efeito</span>
          {temModificadorAtivo && <span>(Ativo)</span>}
        </div>
        <div className={styles.accordionIcon}>
          {aberto ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </header>

      {aberto && (
        <div className={styles.accordionBody}>
          <div className={styles.fieldsGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Dano Bruto</label>
              <input
                type="number"
                min="0"
                className={styles.fieldInput}
                value={danoAplicado}
                onChange={(e) => setDanoAplicado(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tipo de Dano</label>
              <select
                className={styles.fieldSelect}
                value={tipoDano}
                onChange={(e) => setTipoDano(e.target.value)}
              >
                {LISTA_TIPOS_DANO.map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Afinidade Alvo</label>
              <select
                className={styles.fieldSelect}
                value={afinidadeAlvo}
                onChange={(e) => setAfinidadeAlvo(e.target.value)}
              >
                {Object.values(AFINIDADES_DANO).map((a) => (
                  <option key={a} value={a}>{a.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cura</label>
              <input
                type="number"
                min="0"
                className={styles.fieldInput}
                value={curaAplicada}
                onChange={(e) => setCuraAplicada(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Recurso da Cura</label>
              <select
                className={styles.fieldSelect}
                value={recursoCura}
                onChange={(e) => setRecursoCura(e.target.value)}
              >
                <option value="pv">PV (Vida)</option>
                <option value="pm">PM (Mente)</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Aplicar Condição</label>
              <select
                className={styles.fieldSelect}
                value={condicaoAlvo || ''}
                onChange={(e) => setCondicaoAlvo(e.target.value)}
              >
                <option value="">-- Nenhuma --</option>
                {CONDICOES_DISPONIVEIS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Custo PM</label>
              <input
                type="number"
                min="0"
                className={styles.fieldInput}
                value={custoPm}
                onChange={(e) => setCustoPm(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Custo PI</label>
              <input
                type="number"
                min="0"
                className={styles.fieldInput}
                value={custoPi}
                onChange={(e) => setCustoPi(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidthField}`}>
              <label className={styles.fieldLabel}>Nota / Efeito Livre</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="Ex.: Crítico com Fogo • Alvo recua 1 passo"
                value={notaLivre}
                onChange={(e) => setNotaLivre(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
