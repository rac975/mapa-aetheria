import { useState, useMemo } from 'react';
import { FaBolt, FaArrowRight, FaChevronDown, FaChevronUp, FaBookOpen } from 'react-icons/fa';
import { Badge } from '../ui';
import { separarHabilidadesAtivasEPassivas } from '../../domain/fabula/abilityClassificationRules';
import styles from './CombatantArsenalActions.module.css';

export default function CombatantAbilitiesSection({
  habilidades = [],
  onSelecionarHabilidade,
  onAtivarHabilidadeDireta
}) {
  const [abertoAtivas, setAbertoAtivas] = useState(true);
  const [abertoPassivas, setAbertoPassivas] = useState(false);

  const { ativas, passivas } = useMemo(
    () => separarHabilidadesAtivasEPassivas(habilidades),
    [habilidades]
  );

  if (!habilidades || habilidades.length === 0) return null;

  return (
    <div className={styles.sectionBlock}>
      {/* 1. SEÇÃO DE HABILIDADES ATIVAS (ABERTA POR PADRÃO) */}
      {ativas.length > 0 && (
        <div className={styles.sectionBlock}>
          <button
            type="button"
            className={styles.headingToggleBtn}
            onClick={() => setAbertoAtivas((v) => !v)}
            title={abertoAtivas ? 'Recolher Habilidades Ativas' : 'Expandir Habilidades Ativas'}
            aria-label="Alternar exibição de Habilidades Ativas"
          >
            <span className={styles.sectionHeading}>
              <FaBolt /> Habilidades Ativas ({ativas.length})
            </span>
            <span className={styles.chevronIcon}>
              {abertoAtivas ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
            </span>
          </button>

          {abertoAtivas && (
            <div className={styles.abilitiesScrollableGrid}>
              {ativas.map((hab) => {
                const custo = Number(hab.custoPm) || 0;
                const custoPi = Number(hab.custoPi) || 0;
                const custoPf = Number(hab.custoPf) || 0;
                const custoTexto = [
                  custo > 0 ? `${custo} PM` : null,
                  custoPi > 0 ? `${custoPi} PI` : null,
                  custoPf > 0 ? `${custoPf} PF` : null
                ].filter(Boolean).join(' • ');

                return (
                  <div
                    key={hab.id || hab.codigo || hab.nome}
                    className={`${styles.itemBtn} ${styles.itemBtnAbility}`}
                    onClick={() => onSelecionarHabilidade?.(hab)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelecionarHabilidade?.(hab);
                      }
                    }}
                    title={`Carregar habilidade ${hab.nome} na Central de Turno`}
                  >
                    <div className={styles.itemTopLine}>
                      <span className={styles.itemTitle}>{hab.nome}</span>
                      <div className={styles.itemBadges}>
                        {hab.nivel && <Badge variant="core" size="sm">Nv {hab.nivel}</Badge>}
                        {custo > 0 && <Badge variant="gold" size="sm">{custo} PM</Badge>}
                        {custoPi > 0 && <Badge variant="info" size="sm">{custoPi} PI</Badge>}
                        {custoPf > 0 && <Badge variant="warning" size="sm">{custoPf} PF</Badge>}
                      </div>
                    </div>

                    {(hab.efeito || hab.descricao) && (
                      <div className={styles.itemDesc}>{hab.efeito || hab.descricao}</div>
                    )}

                    <div className={styles.abilityActionRow}>
                      <button
                        type="button"
                        className={styles.abilityFastTriggerBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAtivarHabilidadeDireta?.(hab);
                        }}
                        title={`Ativar ${hab.nome} diretamente no combate (${custoTexto ? `Debita ${custoTexto} e ` : ''}registra no feed)`}
                      >
                        <FaBolt /> Ativar no Combate
                      </button>
                      <span className={styles.abilityPrepHint}>
                        <FaArrowRight /> Preparar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. SEÇÃO DE HABILIDADES PASSIVAS (RECOLHIDA POR PADRÃO, APENAS CONSULTA) */}
      {passivas.length > 0 && (
        <div className={styles.sectionBlock}>
          <button
            type="button"
            className={styles.headingToggleBtn}
            onClick={() => setAbertoPassivas((v) => !v)}
            title={abertoPassivas ? 'Recolher Habilidades Passivas' : 'Expandir Habilidades Passivas'}
            aria-label="Alternar exibição de Habilidades Passivas"
          >
            <span className={styles.sectionHeading}>
              <FaBookOpen /> Habilidades Passivas / Consulta ({passivas.length})
            </span>
            <span className={styles.chevronIcon}>
              {abertoPassivas ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
            </span>
          </button>

          {abertoPassivas && (
            <div className={styles.abilitiesScrollableGrid}>
              {passivas.map((hab) => (
                <div
                  key={hab.id || hab.codigo || hab.nome}
                  className={`${styles.itemBtn} ${styles.itemBtnPassive}`}
                  title={`Habilidade passiva: ${hab.nome}`}
                >
                  <div className={styles.itemTopLine}>
                    <span className={styles.itemTitle}>{hab.nome}</span>
                    <div className={styles.itemBadges}>
                      {hab.nivel && <Badge variant="neutral" size="sm">Nv {hab.nivel}</Badge>}
                      <Badge variant="info" size="sm">Passiva</Badge>
                    </div>
                  </div>

                  {(hab.efeito || hab.descricao) && (
                    <div className={styles.itemDesc}>{hab.efeito || hab.descricao}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
