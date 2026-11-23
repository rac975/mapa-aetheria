import { useMemo } from 'react';
import { FaBolt, FaCheck, FaSlidersH } from 'react-icons/fa';
import { Badge } from '../ui';
import {
  isHabilidadeEleitaPreset,
  obterPresetsHabilidade,
  normalizarCodigoHabilidade
} from '../../domain/fabula/abilityPresetRules';
import styles from './CombatantAbilityPresets.module.css';

export default function CombatantAbilityPresets({
  habilidadeAtiva = null,
  habilidadesEleitas = [],
  onSelecionarHabilidade,
  alvo = null,
  combatente = null,
  presetAtivoId = '',
  onAplicarPreset
}) {
  const habilidadeEfetiva = useMemo(() => {
    if (habilidadeAtiva && isHabilidadeEleitaPreset(habilidadeAtiva)) {
      return habilidadeAtiva;
    }
    if (habilidadesEleitas.length > 0) {
      return habilidadesEleitas[0];
    }
    return null;
  }, [habilidadeAtiva, habilidadesEleitas]);

  const presets = useMemo(() => {
    if (!habilidadeEfetiva) return [];
    return obterPresetsHabilidade(habilidadeEfetiva, { combatente, alvo });
  }, [habilidadeEfetiva, combatente, alvo]);

  if (!habilidadeEfetiva || presets.length === 0) {
    return null;
  }

  const codigoAtual = normalizarCodigoHabilidade(habilidadeEfetiva);

  return (
    <div className={styles.presetsWrap}>
      <div className={styles.presetsHeader}>
        <span className={styles.headerTitle}>
          <FaSlidersH /> Presets de Efeito: {habilidadeEfetiva.nome || habilidadeEfetiva.codigo}
        </span>
        {habilidadesEleitas.length > 1 && (
          <div className={styles.abilitiesSwitcher}>
            {habilidadesEleitas.map((hab) => {
              const cod = normalizarCodigoHabilidade(hab);
              const isSelected = cod === codigoAtual;
              return (
                <button
                  key={hab.id || cod}
                  type="button"
                  className={`${styles.switcherBtn} ${isSelected ? styles.switcherBtnActive : ''}`}
                  onClick={() => onSelecionarHabilidade?.(hab)}
                  title={`Alternar para presets de ${hab.nome}`}
                >
                  {hab.nomeCurto || hab.nome}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.presetsGrid}>
        {presets.map((preset) => {
          const isAtivo = String(preset.id) === String(presetAtivoId);
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetCard} ${isAtivo ? styles.presetCardActive : ''}`}
              onClick={() => onAplicarPreset?.(preset)}
              title={`${preset.titulo}: ${preset.descricao}`}
            >
              <div className={styles.presetTopRow}>
                <span className={styles.presetTitle}>{preset.titulo}</span>
                {isAtivo ? (
                  <span className={styles.activeCheck}><FaCheck /></span>
                ) : (
                  preset.badge && <Badge variant="gold" size="sm">{preset.badge}</Badge>
                )}
              </div>
              <div className={styles.presetDesc}>{preset.descricao}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
