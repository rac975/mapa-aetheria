import {
  FaShieldAlt, FaBoxOpen, FaSearch, FaFlagCheckered, FaHandPaper, FaFlag
} from 'react-icons/fa';
import { calcularProgressoRelogioPorTeste } from '../../domain/fabula/combatRules';
import styles from './CombatantSecondaryActions.module.css';

export default function CombatantSecondaryActions({
  ator,
  perfil,
  alvoId,
  relogios = [],
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setNotaLivre,
  setAvancoRelogio
}) {
  if (!ator) return null;

  const handleGuarda = async () => {
    await onExecutarAcao?.({
      acaoCodigo: 'GUARDA',
      atorId: ator.id,
      alvoId: alvoId || null,
      marcarTurnoConcluido
    });
  };

  const handleInventario = async () => {
    await onExecutarAcao?.({
      acaoCodigo: 'INVENTARIO',
      atorId: ator.id,
      custoPi: 1,
      notaLivre: 'Consumiu 1 Ponto de Inventário (PI)',
      marcarTurnoConcluido
    });
  };

  const handleEstudo = async () => {
    const res = await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'atributo',
      titulo: 'Estudo de Alvo',
      attr1: 'ast',
      attr2: 'ast',
      ndAlvo: 10,
      calcularDano: false
    });
    if (res) {
      setNotaLivre?.(`Estudo: ${res.total} ${res.formulaDados} vs ND 10${res.isCritico ? ' (Crítico!)' : ''}`);
    }
  };

  const handleObjetivo = async () => {
    const relogioAtivo = relogios[0];
    const res = await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'atributo',
      titulo: 'Ação de Objetivo',
      attr1: 'ast',
      attr2: 'von',
      ndAlvo: 10,
      calcularDano: false
    });
    if (res) {
      const prog = calcularProgressoRelogioPorTeste({
        resultadoTeste: res.total,
        nivelDificuldade: 10,
        isCritico: res.isCritico,
        isFalhaCritica: res.isFumble
      });
      setAvancoRelogio?.(prog.secoesAvancadas);
      setNotaLivre?.(`Objetivo: ${res.total} ${res.formulaDados} • Avanço sugerido: +${prog.secoesAvancadas} fatias`);
      if (relogioAtivo) {
        await onExecutarAcao?.({
          acaoCodigo: 'OBJETIVO',
          atorId: ator.id,
          relogioId: relogioAtivo.id,
          avancoRelogio: prog.secoesAvancadas,
          marcarTurnoConcluido
        });
      }
    }
  };

  const handleImpedimento = async () => {
    const res = await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'atributo',
      titulo: 'Impedimento Tático',
      attr1: 'des',
      attr2: 'von',
      calcularDano: false
    });
    if (res) {
      setNotaLivre?.(`Impedimento: ${res.total} ${res.formulaDados}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);
    }
  };

  const handleRendicao = async () => {
    await onExecutarAcao?.({
      acaoCodigo: 'RENDICAO',
      atorId: ator.id,
      notaLivre: `${ator.nome} optou pela Rendição oficial perante os adversários.`,
      marcarTurnoConcluido: true
    });
  };

  return (
    <div className={styles.secondaryActionsBar} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`${styles.secActionBtn} ${styles.secActionBtnGuard}`}
        onClick={handleGuarda}
        title="Entrar em Guarda (+2 em testes opostos e cobre aliado se houver alvo)"
      >
        <FaShieldAlt /> Guarda
      </button>

      <button
        type="button"
        className={`${styles.secActionBtn} ${styles.secActionBtnInv}`}
        onClick={handleInventario}
        title="Ação de Inventário (gasta 1 PI para usar poção, elixir ou item preparado)"
      >
        <FaBoxOpen /> Inventário
      </button>

      <button
        type="button"
        className={styles.secActionBtn}
        onClick={handleEstudo}
        title="Estudo: [AST + AST] vs ND 10 para descobrir características e afinidades"
      >
        <FaSearch /> Estudo
      </button>

      <button
        type="button"
        className={styles.secActionBtn}
        onClick={handleObjetivo}
        title="Objetivo: Realizar teste tático para avançar relógio de conflito"
      >
        <FaFlagCheckered /> Objetivo
      </button>

      <button
        type="button"
        className={styles.secActionBtn}
        onClick={handleImpedimento}
        title="Impedimento: Teste Oposto [DES + VON] para atrapalhar um oponente"
      >
        <FaHandPaper /> Impedimento
      </button>

      <button
        type="button"
        className={`${styles.secActionBtn} ${styles.secActionBtnSurrender}`}
        onClick={handleRendicao}
        title="Rendição: O herói aceita uma derrota narrativa sem risco de morte definitiva"
      >
        <FaFlag /> Rendição
      </button>
    </div>
  );
}
