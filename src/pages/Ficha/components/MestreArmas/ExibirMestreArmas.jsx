import React, { useState } from 'react';
import { FaFistRaised, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './ExibirMestreArmas.module.css';

export default function ExibirMestreArmas({ ficha, classe, handleAjustarRecurso }) {
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const habs = classe?.habilidades || ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvMaestria = getNivel('maestria com armas');
  const nvChuva = getNivel('chuva de laminas');
  const nvQuebra = getNivel('quebra-ossos');
  const nvTrespassar = getNivel('trespassar');
  const nvContra = getNivel('contra-ataque');

  if (nvMaestria + nvChuva + nvQuebra + nvTrespassar + nvContra === 0) return null;

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const gastarPM = (custo, nomePoder) => {
    if (!handleAjustarRecurso) return;
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < custo) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: `${nomePoder} exige ${custo} PM (você tem ${mpAtual} PM).` });
      return;
    }
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: `Ativar ${nomePoder}`,
      message: `Gastar ${custo} PM para ativar ${nomePoder}?`,
      onConfirm: () => handleAjustarRecurso('mp_atual', -custo)
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}><FaFistRaised /> Painel Marcial — Mestre de Armas</div>

      <div className={styles.badgesRow}>
        {nvMaestria > 0 && <span className={styles.badgeGreen}>⚔️ Precisão Corpo a Corpo: <strong>+{nvMaestria}</strong></span>}
        {nvQuebra > 0 && <span className={styles.badgeGold}>💥 Quebra-Ossos: Atordoado, Fraco ou <strong>-{nvQuebra * 10} PM</strong></span>}
        {nvTrespassar > 0 && <span className={styles.badgeBlue}>🛡️ Trespassar: Ignora resistências / Quebra Escudo/Armadura ou <strong>+{nvTrespassar * 2} Dano</strong></span>}
        {nvContra > 0 && <span className={styles.badgeGreen}>⚡ Contra-Ataque: Ataque livre (RA=0) em Precisão PAR inimiga</span>}
      </div>

      <div className={styles.actionsRow}>
        {nvChuva > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={() => gastarPM(10, 'Chuva de Lâminas')}>
            <FaBolt /> Chuva de Lâminas (-10 PM)
          </Button>
        )}
        {nvTrespassar > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={() => gastarPM(5, 'Trespassar')}>
            <FaBolt /> Trespassar (-5 PM)
          </Button>
        )}
      </div>

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}
