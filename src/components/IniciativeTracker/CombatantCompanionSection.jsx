import { useState, useMemo } from 'react';
import { FaPaw, FaCrosshairs, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { Badge } from '../ui';
import { formatarPoderNpcParaExibicao } from '../../domain/fabula/npcRules';
import styles from './CombatantCompanionSection.module.css';

export default function CombatantCompanionSection({
  companheiro,
  onRolarAtaqueCompanheiro,
  onUsarFeiticoCompanheiro,
  onUsarPoderCompanheiro
}) {
  const [expandido, setExpandido] = useState(false);

  const ataques = companheiro?.ataques || [];
  const feiticos = companheiro?.feiticos || [];

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

  const temAcoes = ataques.length > 0 || feiticos.length > 0 || poderesFormatados.length > 0;

  return (
    <div className={styles.companionBlock}>
      <div className={styles.companionHeading}>
        <div className={styles.companionTitleGroup}>
          <FaPaw className={styles.pawIcon} />
          <span className={styles.companionName}>{companheiro.nome}</span>
          <Badge variant="core" size="sm">Nv {companheiro.nivel || 5}</Badge>
        </div>

        <div className={styles.companionStatsLine}>
          <span className={styles.statPill}>
            PV <strong>{companheiro.pv_atual ?? '--'}/{companheiro.pv_max ?? '--'}</strong>
          </span>
          <span className={styles.statPill}>
            PM <strong>{companheiro.pm_atual ?? '--'}/{companheiro.pm_max ?? '--'}</strong>
          </span>
          <span className={styles.statPill}>
            DEF <strong>{companheiro.defesa ?? 8}</strong>
          </span>
          <span className={styles.statPill}>
            M.DEF <strong>{companheiro.defesa_magica ?? 8}</strong>
          </span>

          {temAcoes && (
            <button
              type="button"
              className={styles.toggleAcoesBtn}
              onClick={() => setExpandido((v) => !v)}
              title={expandido ? 'Ocultar detalhes e ações do companheiro' : 'Ver e comandar ações do companheiro'}
              aria-label="Alternar ações do companheiro"
            >
              {expandido ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          )}
        </div>
      </div>

      {expandido && temAcoes && (
        <div className={styles.companionSubSection}>
          {ataques.length > 0 && (
            <div className={styles.companionGrid}>
              {ataques.map((atk, idx) => (
                <button
                  key={`comp_atk_${atk.id || 'atk'}_${idx}`}
                  type="button"
                  className={styles.companionBtn}
                  onClick={() => onRolarAtaqueCompanheiro?.(atk, companheiro)}
                  title={`Comandar ${companheiro.nome} a atacar com ${atk.nome}`}
                >
                  <div className={styles.companionBtnTop}>
                    <span className={styles.companionBtnName}><FaCrosshairs /> {atk.nome}</span>
                    <Badge variant="gold" size="sm">+{atk.bonusPrecisao}</Badge>
                  </div>
                  <div className={styles.companionBtnFormula}>
                    +{atk.bonusDano} ({atk.tipoDano}) • {atk.alcance === 'distancia' ? 'Distância' : 'CaC'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {feiticos.length > 0 && (
            <div className={styles.companionGrid}>
              {feiticos.map((feit, idx) => (
                <button
                  key={`comp_feit_${feit.id || 'feit'}_${idx}`}
                  type="button"
                  className={styles.companionBtn}
                  onClick={() => onUsarFeiticoCompanheiro?.(feit, companheiro)}
                  title={`Comandar ${companheiro.nome} a conjurar ${feit.nome}`}
                >
                  <div className={styles.companionBtnTop}>
                    <span className={styles.companionBtnName}>{feit.nome}</span>
                    <Badge variant="ether" size="sm">{feit.custoPm} PM</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {poderesFormatados.length > 0 && (
            <div className={styles.powersContainer}>
              <div className={styles.powersTitle}>
                <LuSparkles /> Poderes Especiais ({poderesFormatados.length}):
              </div>
              <div className={styles.powersChips}>
                {poderesFormatados.map((pod, idx) => (
                  <button
                    key={`comp_pod_${idx}`}
                    type="button"
                    className={styles.powerChipBtn}
                    onClick={() => onUsarPoderCompanheiro?.(pod, companheiro)}
                    title={pod.descricao ? `${pod.nome}: ${pod.descricao}` : `Usar poder ${pod.nome}`}
                  >
                    <span>{pod.resumoCurto}</span>
                    {Number(pod.custoPm) > 0 && <Badge variant="ether" size="sm">{pod.custoPm} PM</Badge>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
