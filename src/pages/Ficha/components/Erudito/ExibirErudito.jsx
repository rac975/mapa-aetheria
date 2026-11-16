import React, { useState } from 'react';
import { FaBookOpen, FaSearch, FaBrain } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ExibirErudito.module.css';

export default function ExibirErudito({ ficha, handleAjustarRecurso }) {
  const [qtdAnalises, setQtdAnalises] = useState(1);

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvAnalise = getNivel('analise rapida');
  const nvConcentrado = getNivel('concentrado');
  const nvConhecimento = getNivel('conhecimento e poder');
  const nvLampejo = getNivel('lampejo de saber');

  if (nvAnalise + nvConcentrado + nvConhecimento + nvLampejo === 0) {
    return null;
  }

  const usarAnaliseRapida = () => {
    if (!handleAjustarRecurso) return;
    const custoTotal = qtdAnalises * 5;
    if (window.confirm(`Gastar ${custoTotal} PM para revelar ${qtdAnalises} Traço(s) ou Afinidade(s)?`)) {
      handleAjustarRecurso('mp_atual', -custoTotal);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <FaBookOpen /> Painel Tático — Erudito
      </div>

      <div className={styles.badgesRow}>
        {nvConcentrado > 0 && (
          <span className={styles.badgeBlue}>
            <FaBrain size={10} /> Concentrado: <strong>+{nvConcentrado * 3} PM</strong> | <strong>+{nvConcentrado}</strong> em (AST+AST) aberto
          </span>
        )}
        {nvLampejo > 0 && (
          <span className={styles.badgeGold}>
            💡 Lampejo de Saber (13+): até <strong>{nvLampejo}</strong> pergunta(s)
          </span>
        )}
        {nvConhecimento > 0 && (
          <span className={styles.badgeGreen}>
            🎯 Conhecimento é Poder: substitui 1 dado de Precisão por <strong>AST</strong>
          </span>
        )}
      </div>

      {nvAnalise > 0 && (
        <div className={styles.actionRow}>
          <select
            value={qtdAnalises}
            onChange={(e) => setQtdAnalises(Number(e.target.value))}
            className={styles.select}
          >
            {Array.from({ length: nvAnalise }, (_, idx) => idx + 1).map((n) => (
              <option key={n} value={n}>
                {n}x Análise ({n * 5} PM)
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={usarAnaliseRapida}
          >
            <FaSearch /> Análise Rápida (-{qtdAnalises * 5} PM)
          </Button>
        </div>
      )}
    </div>
  );
}
