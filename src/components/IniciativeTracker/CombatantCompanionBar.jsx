import { useState, useMemo } from 'react';
import { FaPaw, FaPlus, FaMinus } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { Badge } from '../ui';
import { formatarPoderNpcParaExibicao } from '../../domain/fabula/npcRules';
import { calcularStatusCrise, estaDerrotado as checkDerrotado } from '../../domain/fabula/combatRules';
import styles from './CombatantCompanionBar.module.css';

export default function CombatantCompanionBar({
  companheiro,
  podeEditar = false,
  onAlterarRecurso
}) {
  const [editandoCampo, setEditandoCampo] = useState(null);
  const [valorTemp, setValorTemp] = useState('');

  const pvAtual = Number(companheiro?.pv_atual ?? companheiro?.pv_max ?? 10);
  const pvMax = Number(companheiro?.pv_max || 10);
  const pmAtual = Number(companheiro?.pm_atual ?? companheiro?.pm_max ?? 10);
  const pmMax = Number(companheiro?.pm_max || 10);

  const derrotado = checkDerrotado(pvAtual);
  const emCrise = calcularStatusCrise(pvAtual, pvMax);

  const poderesFormatados = useMemo(() => {
    const lista = Array.isArray(companheiro?.poderes) ? companheiro.poderes : [];
    const vistos = new Set();
    const res = [];
    for (const pod of lista) {
      if (!pod) continue;
      const chave = String(pod.nome || pod.id || pod).toLowerCase().trim();
      if (!vistos.has(chave)) {
        vistos.add(chave);
        res.push(formatarPoderNpcParaExibicao(pod));
      }
    }
    return res;
  }, [companheiro]);

  if (!companheiro) return null;

  const handleStep = (e, campo, delta, max) => {
    e.stopPropagation();
    if (!onAlterarRecurso) return;
    onAlterarRecurso(companheiro.id, campo, delta, true, max);
  };

  const iniciarEdicao = (e, campo, valorAtual) => {
    e.stopPropagation();
    if (!podeEditar) return;
    setEditandoCampo(campo);
    setValorTemp(String(valorAtual));
  };

  const confirmarEdicao = (e, campo, max) => {
    e.stopPropagation();
    if (onAlterarRecurso) {
      const num = parseInt(valorTemp, 10);
      if (!Number.isNaN(num)) {
        onAlterarRecurso(companheiro.id, campo, num, false, max);
      }
    }
    setEditandoCampo(null);
  };

  return (
    <div
      className={styles.companionBar}
      role="region"
      aria-label={`Companheiro Fiel: ${companheiro.nome}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.headerRow}>
        <div className={styles.identityGroup}>
          <FaPaw className={styles.pawIcon} />
          <span className={styles.companionName}>{companheiro.nome || 'Companheiro'}</span>
          <Badge variant="core" size="sm">Nv {companheiro.nivel || 5}</Badge>
          {companheiro.especie && <Badge variant="ether" size="sm">{companheiro.especie}</Badge>}
        </div>

        <div className={styles.statusBadges}>
          {derrotado && <Badge variant="default" size="sm">CAÍDO</Badge>}
          {emCrise && !derrotado && <Badge variant="crise" size="sm">CRISE</Badge>}
        </div>
      </div>

      <div className={styles.vitalsRow}>
        {/* PV do Companheiro */}
        <div className={`${styles.resourceBlock} ${styles.resourceBlockPv}`}>
          <span className={`${styles.resourceLabel} ${styles.resourceLabelPv}`}>PV</span>
          {editandoCampo === 'pv_atual' ? (
            <input
              type="number"
              className={styles.inputQuickEdit}
              value={valorTemp}
              autoFocus
              onChange={(e) => setValorTemp(e.target.value)}
              onBlur={(e) => confirmarEdicao(e, 'pv_atual', pvMax)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmarEdicao(e, 'pv_atual', pvMax);
                if (e.key === 'Escape') setEditandoCampo(null);
              }}
            />
          ) : (
            <span
              className={styles.resourceValue}
              onClick={(e) => iniciarEdicao(e, 'pv_atual', pvAtual)}
              title={podeEditar ? 'Clique para editar PV diretamente' : undefined}
            >
              {pvAtual}<span className={styles.resourceMax}>/{pvMax}</span>
            </span>
          )}

          {podeEditar && editandoCampo !== 'pv_atual' && (
            <div className={styles.btnAdjustGroup}>
              <button
                type="button"
                className={styles.btnStep}
                onClick={(e) => handleStep(e, 'pv_atual', -1, pvMax)}
                title="-1 PV"
                aria-label="Reduzir 1 PV do companheiro"
              >
                <FaMinus />
              </button>
              <button
                type="button"
                className={styles.btnStep}
                onClick={(e) => handleStep(e, 'pv_atual', 1, pvMax)}
                title="+1 PV"
                aria-label="Aumentar 1 PV do companheiro"
              >
                <FaPlus />
              </button>
            </div>
          )}
        </div>

        {/* PM do Companheiro */}
        <div className={`${styles.resourceBlock} ${styles.resourceBlockPm}`}>
          <span className={`${styles.resourceLabel} ${styles.resourceLabelPm}`}>PM</span>
          {editandoCampo === 'pm_atual' ? (
            <input
              type="number"
              className={styles.inputQuickEdit}
              value={valorTemp}
              autoFocus
              onChange={(e) => setValorTemp(e.target.value)}
              onBlur={(e) => confirmarEdicao(e, 'pm_atual', pmMax)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmarEdicao(e, 'pm_atual', pmMax);
                if (e.key === 'Escape') setEditandoCampo(null);
              }}
            />
          ) : (
            <span
              className={styles.resourceValue}
              onClick={(e) => iniciarEdicao(e, 'pm_atual', pmAtual)}
              title={podeEditar ? 'Clique para editar PM diretamente' : undefined}
            >
              {pmAtual}<span className={styles.resourceMax}>/{pmMax}</span>
            </span>
          )}

          {podeEditar && editandoCampo !== 'pm_atual' && (
            <div className={styles.btnAdjustGroup}>
              <button
                type="button"
                className={styles.btnStep}
                onClick={(e) => handleStep(e, 'pm_atual', -1, pmMax)}
                title="-1 PM"
                aria-label="Reduzir 1 PM do companheiro"
              >
                <FaMinus />
              </button>
              <button
                type="button"
                className={styles.btnStep}
                onClick={(e) => handleStep(e, 'pm_atual', 1, pmMax)}
                title="+1 PM"
                aria-label="Aumentar 1 PM do companheiro"
              >
                <FaPlus />
              </button>
            </div>
          )}
        </div>

        {/* Defesas do Companheiro */}
        <span className={styles.defenseStat}>
          DEF: <strong>{companheiro.defesa || 8}</strong>
        </span>
        <span className={styles.defenseStat}>
          M.DEF: <strong>{companheiro.defesa_magica || 8}</strong>
        </span>
      </div>

      {/* Poderes Especiais do Companheiro */}
      {poderesFormatados.length > 0 && (
        <div className={styles.powersStrip}>
          <span className={styles.powersLabel}>
            <LuSparkles /> Poderes:
          </span>
          {poderesFormatados.map((pod, pIdx) => (
            <span
              key={`comp_bar_pod_${pIdx}`}
              className={styles.powerChip}
              title={pod.descricao ? `${pod.nome}: ${pod.descricao}` : pod.nome}
            >
              {pod.resumoCurto}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
