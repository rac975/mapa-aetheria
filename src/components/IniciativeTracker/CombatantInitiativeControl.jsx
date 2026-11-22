import { useState, useEffect } from 'react';
import { FaDice, FaBolt, FaCheck, FaTimes } from 'react-icons/fa';
import {
  extrairIniciativaCombatente,
  extrairModificadorIniciativaHeroi,
  extrairIniciativaFixaInimigo
} from '../../domain/fabula/combatInitiativeRules';
import styles from './CombatantInitiativeControl.module.css';

/**
 * Controle de Iniciativa (INI) para combatentes:
 * - HERÓI: permite inserção/edição manual (dado físico) ou rolagem pelo app ([DES + AST] + Modificador da Ficha).
 * - INIMIGO: exibe a Iniciativa fixa da ficha do NPC (sem rolagem de dado).
 */
export default function CombatantInitiativeControl({
  p,
  isMestre,
  ehMeuPersonagem,
  perfilRolagem,
  onAtualizarIniciativa,
  onRolarIniciativa
}) {
  const isHeroi = p?.tipo === 'heroi';
  const podeEditar = isMestre || ehMeuPersonagem;

  const valorIniciativa = isHeroi
    ? extrairIniciativaCombatente(p)
    : extrairIniciativaFixaInimigo(p, perfilRolagem?.npc, perfilRolagem);

  const modIniHeroi = isHeroi
    ? extrairModificadorIniciativaHeroi(p, perfilRolagem?.ficha, perfilRolagem)
    : 0;

  const [isEditing, setIsEditing] = useState(false);
  const [valorTemp, setValorTemp] = useState(String(valorIniciativa));

  useEffect(() => {
    setValorTemp(String(valorIniciativa));
  }, [valorIniciativa]);

  const handleSalvarManual = () => {
    const num = Math.floor(Number(valorTemp));
    const finalVal = Number.isFinite(num) ? num : 0;
    onAtualizarIniciativa?.(p.id, finalVal);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSalvarManual();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setValorTemp(String(valorIniciativa));
      setIsEditing(false);
    }
  };

  const handleRolarApp = (e) => {
    e.stopPropagation();
    if (!isHeroi) return;
    onRolarIniciativa?.(p);
  };

  const modFormatado = modIniHeroi >= 0 ? `+${modIniHeroi}` : `${modIniHeroi}`;
  const clusterClasses = [
    styles.initiativeCluster,
    isHeroi ? styles.heroi : styles.inimigo
  ].join(' ');

  return (
    <div
      className={clusterClasses}
      onClick={(e) => e.stopPropagation()}
      title={isHeroi
        ? `Iniciativa do Herói (Mod. da Ficha: ${modFormatado}). Clique no valor para dado físico ou no dado para rolar [DES + AST] ${modFormatado}.`
        : `Iniciativa fixa da ficha do Adversário: ${valorIniciativa} (Inimigos não rolam iniciativa em Fabula Ultima)`}
    >
      <span className={styles.iniLabel}>
        <FaBolt className={styles.iniIcon} /> INI
      </span>

      {isHeroi && podeEditar && isEditing ? (
        <>
          <input
            type="number"
            className={styles.iniInput}
            value={valorTemp}
            onChange={(e) => setValorTemp(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label={`Iniciativa manual de ${p.nome}`}
          />
          <button
            type="button"
            className={styles.editActionBtn}
            onClick={handleSalvarManual}
            title="Confirmar dado físico"
          >
            <FaCheck />
          </button>
          <button
            type="button"
            className={`${styles.editActionBtn} ${styles.editActionBtnCancel}`}
            onClick={() => {
              setValorTemp(String(valorIniciativa));
              setIsEditing(false);
            }}
            title="Cancelar"
          >
            <FaTimes />
          </button>
        </>
      ) : isHeroi && podeEditar ? (
        <>
          <button
            type="button"
            className={styles.iniValueBtn}
            onClick={() => setIsEditing(true)}
            title="Clique para inserir o valor do dado físico da mesa"
          >
            {valorIniciativa}
          </button>
          <span className={styles.iniLabel} title={`Modificador de Iniciativa da Ficha: ${modFormatado}`}>
            ({modFormatado})
          </span>
          <button
            type="button"
            className={styles.rollBtn}
            onClick={handleRolarApp}
            title={`Rolar Iniciativa no App [DES + AST] ${modFormatado}`}
            aria-label={`Rolar iniciativa de ${p.nome}`}
          >
            <FaDice />
          </button>
        </>
      ) : isHeroi ? (
        <>
          <span className={styles.iniValueStatic}>{valorIniciativa}</span>
          <span className={styles.iniLabel}>({modFormatado})</span>
        </>
      ) : (
        /* INIMIGO: Iniciativa fixa vinda da ficha do NPC (sem botão de rolagem de dado) */
        <span className={styles.iniValueStatic} title="Iniciativa fixa da ficha do NPC">
          {valorIniciativa}
        </span>
      )}
    </div>
  );
}
