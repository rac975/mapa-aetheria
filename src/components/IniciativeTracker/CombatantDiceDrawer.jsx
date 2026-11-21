import { useState } from 'react';
import {
  FaDice, FaTimes, FaBolt, FaShieldAlt
} from 'react-icons/fa';
import { Badge, Button } from '../ui';
import {
  ATRIBUTOS_CONFLITO,
  TESTES_RAPIDOS_PADRAO
} from '../../domain/fabula/combatRules';
import CombatantArsenalRollSection from './CombatantArsenalRollSection';
import styles from './CombatantDiceDrawer.module.css';

const LISTA_ATRIBUTOS = Object.values(ATRIBUTOS_CONFLITO);

export default function CombatantDiceDrawer({
  combatente,
  perfil,
  onRolarDados,
  onFechar
}) {
  const [attr1, setAttr1] = useState('des');
  const [attr2, setAttr2] = useState('ast');
  const [modExtra, setModExtra] = useState(0);
  const [ultimaRolagem, setUltimaRolagem] = useState(null);

  if (!perfil) return null;

  const { atributosAtuais, atributosBase, modsCondicoes, armas = [], magias = [], poderes = [] } = perfil;

  const handleRolarAtributoCustom = async () => {
    const s1 = ATRIBUTOS_CONFLITO[attr1]?.sigla || 'DES';
    const s2 = ATRIBUTOS_CONFLITO[attr2]?.sigla || 'AST';
    const res = await onRolarDados({
      combatente, perfil, categoria: 'atributo', titulo: `Teste [${s1} + ${s2}]`,
      attr1, attr2, bonusTeste: Number(modExtra) || 0, calcularDano: false
    });
    if (res) setUltimaRolagem(res);
  };

  const handleRolarPreset = async (preset) => {
    setAttr1(preset.attr1);
    setAttr2(preset.attr2);
    const res = await onRolarDados({
      combatente, perfil, categoria: 'resistencia', titulo: preset.titulo,
      attr1: preset.attr1, attr2: preset.attr2,
      bonusTeste: (Number(modExtra) || 0) + (preset.codigo === 'INICIATIVA' ? (perfil.iniciativaMod || 0) : 0),
      ndAlvo: preset.ndSugerido || null, calcularDano: false
    });
    if (res) setUltimaRolagem(res);
  };

  const handleRolarArma = async (arma) => {
    const res = await onRolarDados({
      combatente, perfil, categoria: 'arma', titulo: `Ataque: ${arma.nome}`,
      attr1: arma.attr1, attr2: arma.attr2,
      bonusTeste: (Number(arma.bonusPrecisao) || 0) + (Number(modExtra) || 0),
      bonusDano: Number(arma.bonusDano) || 0, calcularDano: true, tipoDano: arma.tipoDano || 'fisico',
      condicao: arma.condicao || '', efeito: arma.resumoEfeito || arma.efeito || ''
    });
    if (res) setUltimaRolagem(res);
  };

  const handleRolarMagia = async (magia) => {
    const res = await onRolarDados({
      combatente, perfil, categoria: 'magia', titulo: `Feitiço: ${magia.nome}`,
      attr1: magia.attr1 || 'ast', attr2: magia.attr2 || 'von',
      bonusTeste: (Number(magia.bonusPrecisao) || 0) + (Number(modExtra) || 0),
      bonusDano: Number(magia.bonusDano) || 0, calcularDano: Boolean(magia.ofensiva),
      tipoDano: 'magico', custoPm: Number(magia.custoPm) || 0
    });
    if (res) setUltimaRolagem(res);
  };

  return (
    <div className={`${styles.diceDrawer} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
      <div className={styles.drawerHeader}>
        <div className={styles.headerTitleCluster}>
          <FaDice className={styles.headerIcon} />
          <span className={styles.drawerTitle}>Rolagem de Dados — {combatente.nome}</span>
          <Badge variant={perfil.possuiFichaVinculada ? 'core' : 'default'} size="sm">
            {perfil.possuiFichaVinculada ? 'Ficha Sincronizada' : 'Atributos Padrão'}
          </Badge>
          {combatente.guardando && (
            <Badge variant="ether" size="sm"><FaShieldAlt /> Guarda (+2 Opostos)</Badge>
          )}
        </div>
        <button type="button" className={styles.closeBtn} onClick={onFechar} aria-label="Fechar painel de dados">
          <FaTimes />
        </button>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.atributosRow}>
          {LISTA_ATRIBUTOS.map((atrib) => {
            const atual = atributosAtuais[atrib.key] || 8;
            const base = atributosBase[atrib.key] || 8;
            const penalizado = modsCondicoes[atrib.key] < 0 || atual < base;
            const selecionado = attr1 === atrib.key || attr2 === atrib.key;

            return (
              <button
                key={atrib.key}
                type="button"
                className={`${styles.attrChip} ${selecionado ? styles.attrChipSelected : ''} ${penalizado ? styles.attrChipDebuff : ''}`}
                onClick={() => {
                  setAttr1(attr2);
                  setAttr2(atrib.key);
                }}
                title={`Selecionar ${atrib.nome} (d${atual})${penalizado ? ` — Reduzido de d${base} por condição` : ''}`}
              >
                <span className={styles.attrSigla}>{atrib.sigla}</span>
                <strong className={styles.attrDado}>d{atual}</strong>
                {penalizado && <span className={styles.debuffMark}>↓</span>}
              </button>
            );
          })}

          <div className={styles.customRollControls}>
            <select
              className={styles.attrSelect}
              value={attr1}
              onChange={(e) => setAttr1(e.target.value)}
              aria-label="Primeiro atributo do teste"
            >
              {LISTA_ATRIBUTOS.map((a) => (
                <option key={a.key} value={a.key}>{a.sigla} (d{atributosAtuais[a.key]})</option>
              ))}
            </select>
            <span className={styles.plusSign}>+</span>
            <select
              className={styles.attrSelect}
              value={attr2}
              onChange={(e) => setAttr2(e.target.value)}
              aria-label="Segundo atributo do teste"
            >
              {LISTA_ATRIBUTOS.map((a) => (
                <option key={a.key} value={a.key}>{a.sigla} (d{atributosAtuais[a.key]})</option>
              ))}
            </select>

            <div className={styles.modInputWrap} title="Modificador bônus ou penalidade extra">
              <span className={styles.modLabel}>Mod</span>
              <input
                type="number"
                className={styles.modInput}
                value={modExtra}
                onChange={(e) => setModExtra(Number(e.target.value))}
              />
            </div>

            <Button type="button" variant="primary" size="sm" onClick={handleRolarAtributoCustom}>
              <FaDice /> Rolar [{ATRIBUTOS_CONFLITO[attr1]?.sigla}+{ATRIBUTOS_CONFLITO[attr2]?.sigla}]
            </Button>
          </div>
        </div>

        <div className={styles.presetsStrip}>
          {TESTES_RAPIDOS_PADRAO.map((preset) => {
            const d1 = atributosAtuais[preset.attr1] || 8;
            const d2 = atributosAtuais[preset.attr2] || 8;
            return (
              <button
                key={preset.codigo}
                type="button"
                className={styles.presetBtn}
                onClick={() => handleRolarPreset(preset)}
              >
                <FaDice className={styles.presetIcon} />
                <span>{preset.titulo}</span>
                <span className={styles.presetFormula}>d{d1}+d{d2}</span>
              </button>
            );
          })}
        </div>
      </div>

      <CombatantArsenalRollSection
        atributosAtuais={atributosAtuais}
        armas={armas}
        magias={magias}
        poderes={poderes}
        onRolarArma={handleRolarArma}
        onRolarMagia={handleRolarMagia}
      />

      {ultimaRolagem && (
        <div
          className={`${styles.resultBanner} ${
            ultimaRolagem.isCritico ? styles.resultCrit : ultimaRolagem.isFumble ? styles.resultFumble : ''
          }`}
        >
          <div className={styles.resultLeft}>
            <span className={styles.resultTitle}>{ultimaRolagem.titulo}</span>
            <span className={styles.resultFormula}>{ultimaRolagem.formulaDados}</span>
            {(ultimaRolagem.efeito || ultimaRolagem.condicao) && (
              <span className={styles.weaponEffectNote}>
                ✦ {ultimaRolagem.efeito || `Aplica ${ultimaRolagem.condicao}`}
              </span>
            )}
          </div>
          <div className={styles.resultNumbers}>
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>TOTAL</span>
              <strong className={styles.statBoxValue}>{ultimaRolagem.total}</strong>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>RA</span>
              <strong className={styles.statBoxHr}>{ultimaRolagem.hr}</strong>
            </div>
            {ultimaRolagem.calcularDano && ultimaRolagem.danoTotal !== null && (
              <div className={`${styles.statBox} ${styles.statBoxDamage}`}>
                <span className={styles.statBoxLabel}>DANO ({ultimaRolagem.tipoDano})</span>
                <strong className={styles.statBoxDmgValue}>{ultimaRolagem.danoTotal}</strong>
              </div>
            )}
            {ultimaRolagem.statusCritico && (
              <Badge variant={ultimaRolagem.isCritico ? 'core' : 'crise'} size="sm">
                <FaBolt /> {ultimaRolagem.statusCritico}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
