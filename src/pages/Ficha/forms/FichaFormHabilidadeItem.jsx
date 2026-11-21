import React from 'react';
import { FaPaw, FaPlus, FaMinus } from 'react-icons/fa';
import { NIVEL_MAXIMO_HABILIDADE_PADRAO } from '../../../domain/fabula/characterProgression';
import CompanheiroFielCard from '../components/Andarilho/CompanheiroFielCard';
import ExibirEngenhocas from '../components/Inventor/ExibirEngenhocas';
import VincularArcanoCard from '../components/Arcanista/VincularArcanoCard';
import styles from './FichaFormClasses.module.css';

export default function FichaFormHabilidadeItem({
  h,
  hIndex,
  indexClasse,
  fichaId,
  formClasses,
  setFormClasses,
  classeCatalogoOficial,
  showAlert
}) {
  const ehCompanheiroFiel = (h.nome || '').toLowerCase().includes('companheiro fiel');
  const ehEngenhocas = (h.nome || '').toLowerCase().includes('engenhocas');
  const nomeNorm = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const ehVincularArcano = nomeNorm.includes('vincular') && nomeNorm.includes('invocar');
  const nivelHab = parseInt(h.nivel, 10) || 0;
  const habCatalogoOficial = (classeCatalogoOficial?.habilidades_padrao || []).find(
    (hp) => hp.nome.trim().toLowerCase() === h.nome.trim().toLowerCase()
  );
  const limiteMaximoHab = habCatalogoOficial?.nivel_maximo ?? NIVEL_MAXIMO_HABILIDADE_PADRAO;

  const alterarNivelHabilidade = (novoNivel) => {
    const parsed = parseInt(novoNivel, 10);
    const val = isNaN(parsed) ? 0 : Math.max(0, Math.min(limiteMaximoHab, parsed));
    if (parsed > limiteMaximoHab) {
      if (showAlert) showAlert(`⛔ Esta habilidade pode ter no máximo ${limiteMaximoHab} ponto(s)!`);
      return;
    }
    setFormClasses((prevClasses) =>
      prevClasses.map((c, i) => {
        if (i !== indexClasse) return c;
        const habsAtualizadas = (c.habilidades || []).map((hab, hi) =>
          hi === hIndex ? { ...hab, nivel: val } : hab
        );
        return { ...c, habilidades: habsAtualizadas };
      })
    );
  };

  return (
    <div className={styles.habilidadeRow}>
      <div className={styles.habilidadeRowTop}>
        <div className={styles.habilidadeInfo}>
          <div className={styles.habilidadeTitle}>
            <span>{h.nome}</span>
            <span className={styles.habilidadeTetoText}>(Máx: {limiteMaximoHab})</span>
            {ehCompanheiroFiel && <FaPaw />}
          </div>
          <div className={styles.habilidadeDescricao}>{h.descricao}</div>
        </div>
        <div className={styles.habilidadeInputGroup}>
          <span className={styles.nivelLabel}>Nv.</span>
          <div className={styles.habStepperContainer}>
            <button
              type="button"
              className={styles.habStepperBtn}
              onClick={(e) => {
                e.stopPropagation();
                alterarNivelHabilidade(nivelHab - 1);
              }}
              disabled={nivelHab <= 0}
              aria-label={`Diminuir nível de ${h.nome}`}
              title="Diminuir nível"
            >
              <FaMinus size={9} />
            </button>
            <input
              type="number"
              min="0"
              max={limiteMaximoHab}
              value={h.nivel || 0}
              onChange={(e) => alterarNivelHabilidade(e.target.value)}
              className={styles.habilidadeNivelInput}
              aria-label={`Nível de ${h.nome}`}
            />
            <button
              type="button"
              className={styles.habStepperBtn}
              onClick={(e) => {
                e.stopPropagation();
                alterarNivelHabilidade(nivelHab + 1);
              }}
              disabled={nivelHab >= limiteMaximoHab}
              aria-label={`Aumentar nível de ${h.nome}`}
              title="Aumentar nível"
            >
              <FaPlus size={9} />
            </button>
          </div>
        </div>
      </div>

      {ehCompanheiroFiel && nivelHab > 0 && (
        <div className={styles.subCardContainer}>
          <CompanheiroFielCard fichaId={fichaId} classes={formClasses} />
        </div>
      )}

      {ehEngenhocas && nivelHab > 0 && (
        <div className={styles.subCardContainer}>
          <ExibirEngenhocas
            habilidadeEngenhocas={h}
            aoAtualizarEngenhocas={(novosRamos) => {
              setFormClasses((prevClasses) =>
                prevClasses.map((c, i) => {
                  if (i !== indexClasse) return c;
                  const habsAtualizadas = (c.habilidades || []).map((hab, hi) =>
                    hi === hIndex ? { ...hab, ramos: novosRamos } : hab
                  );
                  return { ...c, habilidades: habsAtualizadas };
                })
              );
            }}
          />
        </div>
      )}

      {ehVincularArcano && nivelHab > 0 && (
        <div className={styles.subCardContainer}>
          <VincularArcanoCard
            habilidade={h}
            aoAtualizarArcano={(novoArcano, novaLista) => {
              setFormClasses((prevClasses) =>
                prevClasses.map((c, i) => {
                  if (i !== indexClasse) return c;
                  const habsAtualizadas = (c.habilidades || []).map((hab, hi) =>
                    hi === hIndex
                      ? { ...hab, arcano_vinculado: novoArcano, arcanos_vinculados: novaLista }
                      : hab
                  );
                  return {
                    ...c,
                    habilidades: habsAtualizadas,
                    arcano_vinculado: novoArcano,
                    arcanos_vinculados: novaLista
                  };
                })
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
