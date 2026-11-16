import React from 'react';
import { FaFistRaised, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ExibirMestreArmas.module.css';

export default function ExibirMestreArmas({ ficha, handleAjustarRecurso }) {
  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) => (item.nome || '').toLowerCase().includes(termo));
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvMaestria = getNivel('maestria com armas');
  const nvChuva = getNivel('chuva de lâminas');
  const nvQuebra = getNivel('quebra-ossos');
  const nvTrespassar = getNivel('trespassar');
  const nvContra = getNivel('contra-ataque');

  if (nvMaestria + nvChuva + nvQuebra + nvTrespassar + nvContra === 0) {
    return null;
  }

  const gastarPM = (custo, nomePoder) => {
    if (!handleAjustarRecurso) return;
    if (window.confirm(`Gastar ${custo} PM para ativar ${nomePoder}?`)) {
      handleAjustarRecurso('mp_atual', -custo);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <FaFistRaised /> Painel Marcial — Mestre de Armas
      </div>

      <div className={styles.badgesRow}>
        {nvMaestria > 0 && (
          <span className={styles.badgeGreen}>
            ⚔️ Precisão Corpo a Corpo: <strong>+{nvMaestria}</strong>
          </span>
        )}
        {nvQuebra > 0 && (
          <span className={styles.badgeGold}>
            💥 Quebra-Ossos: Atordoado, Fraco ou <strong>-{nvQuebra * 10} PM</strong>
          </span>
        )}
        {nvTrespassar > 0 && (
          <span className={styles.badgeBlue}>
            🛡️ Trespassar: Quebra Escudo/Armadura ou <strong>+{nvTrespassar * 2} Dano</strong>
          </span>
        )}
      </div>

      <div className={styles.actionsRow}>
        {nvChuva > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => gastarPM(10, 'Chuva de Lâminas')}
          >
            <FaBolt /> Chuva de Lâminas (-10 PM)
          </Button>
        )}

        {nvTrespassar > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => gastarPM(5, 'Trespassar')}
          >
            <FaBolt /> Trespassar (-5 PM)
          </Button>
        )}
      </div>
    </div>
  );
}
