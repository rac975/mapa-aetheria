import { useState } from 'react';
import {
  FaDice, FaTimes, FaCrosshairs, FaMagic, FaBolt, FaShieldAlt
} from 'react-icons/fa';
import { Badge, Button } from '../ui';
import {
  ATRIBUTOS_CONFLITO,
  TESTES_RAPIDOS_PADRAO
} from '../../domain/fabula/combatRules';
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
  const [isOposto, setIsOposto] = useState(false);
  const [ultimaRolagem, setUltimaRolagem] = useState(null);

  if (!perfil) return null;

  const { atributosAtuais, atributosBase, modsCondicoes, armas = [], magias = [] } = perfil;

  const handleRolarAtributoCustom = async () => {
    const s1 = ATRIBUTOS_CONFLITO[attr1]?.sigla || 'DES';
    const s2 = ATRIBUTOS_CONFLITO[attr2]?.sigla || 'AST';
    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'atributo',
      titulo: `Teste [${s1} + ${s2}]`,
      attr1,
      attr2,
      bonusTeste: Number(modExtra) || 0,
      isOposto,
      calcularDano: false
    });
    if (res) setUltimaRolagem(res);
  };

  const handleRolarPreset = async (preset) => {
    setAttr1(preset.attr1);
    setAttr2(preset.attr2);
    setIsOposto(Boolean(preset.isOposto));
    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'resistencia',
      titulo: preset.titulo,
      attr1: preset.attr1,
      attr2: preset.attr2,
      bonusTeste: (Number(modExtra) || 0) + (preset.codigo === 'INICIATIVA' ? (perfil.iniciativaMod || 0) : 0),
      isOposto: Boolean(preset.isOposto),
      ndAlvo: preset.ndSugerido || null,
      calcularDano: false
    });
    if (res) setUltimaRolagem(res);
  };

  const handleRolarArma = async (arma) => {
    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'arma',
      titulo: `Ataque: ${arma.nome}`,
      attr1: arma.attr1,
      attr2: arma.attr2,
      bonusTeste: (Number(arma.bonusPrecisao) || 0) + (Number(modExtra) || 0),
      bonusDano: Number(arma.bonusDano) || 0,
      calcularDano: true,
      tipoDano: arma.tipoDano || 'fisico'
    });
    if (res) setUltimaRolagem(res);
  };

  const handleRolarMagia = async (magia) => {
    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'magia',
      titulo: `Feitiço: ${magia.nome}`,
      attr1: magia.attr1 || 'ast',
      attr2: magia.attr2 || 'von',
      bonusTeste: (Number(magia.bonusPrecisao) || 0) + (Number(modExtra) || 0),
      bonusDano: Number(magia.bonusDano) || 0,
      calcularDano: Boolean(magia.ofensiva),
      tipoDano: 'magico',
      custoPm: Number(magia.custoPm) || 0
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

      {/* 1. Atributos Reais e Seletor de Teste */}
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

            <label className={styles.opostoLabel} title="Em Testes Opostos, estar em Guarda soma +2 automaticamente">
              <input
                type="checkbox"
                checked={isOposto}
                onChange={(e) => setIsOposto(e.target.checked)}
              />
              <span>Oposto</span>
            </label>

            <Button type="button" variant="primary" size="sm" onClick={handleRolarAtributoCustom}>
              <FaDice /> Rolar [{ATRIBUTOS_CONFLITO[attr1]?.sigla}+{ATRIBUTOS_CONFLITO[attr2]?.sigla}]
            </Button>
          </div>
        </div>

        {/* Presets rápidos de Resistência / Iniciativa / Estudo */}
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

      {/* 2. Armas e Ataques Cadastrados */}
      {armas.length > 0 && (
        <div className={styles.sectionBlock}>
          <span className={styles.subTitle}><FaCrosshairs /> Armas & Ataques da Ficha</span>
          <div className={styles.itemsRollGrid}>
            {armas.map((arma) => {
              const s1 = ATRIBUTOS_CONFLITO[arma.attr1]?.sigla || 'DES';
              const s2 = ATRIBUTOS_CONFLITO[arma.attr2]?.sigla || 'VIG';
              const f1 = atributosAtuais[arma.attr1] || 8;
              const f2 = atributosAtuais[arma.attr2] || 8;
              return (
                <button
                  key={arma.id}
                  type="button"
                  className={styles.weaponRollBtn}
                  onClick={() => handleRolarArma(arma)}
                >
                  <div className={styles.weaponTop}>
                    <strong className={styles.weaponName}>{arma.nome}</strong>
                    <Badge variant="gold" size="sm">HR + {arma.bonusDano} {arma.tipoDano}</Badge>
                  </div>
                  <span className={styles.weaponFormula}>
                    [{s1} d{f1} + {s2} d{f2}]{arma.bonusPrecisao ? ` + ${arma.bonusPrecisao}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Magias e Feitiços Cadastrados */}
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
                  onClick={() => handleRolarMagia(magia)}
                >
                  <div className={styles.weaponTop}>
                    <strong className={styles.weaponName}>{magia.nome}</strong>
                    <Badge variant="ether" size="sm">{magia.custoPm} PM</Badge>
                  </div>
                  <span className={styles.weaponFormula}>
                    [AST d{fAst} + VON d{fVon}]{magia.bonusPrecisao ? ` + ${magia.bonusPrecisao}` : ''}
                    {magia.bonusDano > 0 ? ` • HR+${magia.bonusDano}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Resultado Imediato da Última Rolagem */}
      {ultimaRolagem && (
        <div
          className={`${styles.resultBanner} ${
            ultimaRolagem.isCritico
              ? styles.resultCrit
              : ultimaRolagem.isFumble
                ? styles.resultFumble
                : ''
          }`}
        >
          <div className={styles.resultLeft}>
            <span className={styles.resultTitle}>{ultimaRolagem.titulo}</span>
            <span className={styles.resultFormula}>{ultimaRolagem.formulaDados}</span>
          </div>
          <div className={styles.resultNumbers}>
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>TOTAL</span>
              <strong className={styles.statBoxValue}>{ultimaRolagem.total}</strong>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>HR</span>
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
