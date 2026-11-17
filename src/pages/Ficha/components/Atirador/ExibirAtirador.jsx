import React, { useState } from 'react';
import { FaCrosshairs, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './ExibirAtirador.module.css';

export default function ExibirAtirador({ ficha, classe, handleAjustarRecurso, habilidadeAtirador }) {
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const habs = classe?.habilidades || (habilidadeAtirador ? [habilidadeAtirador] : []) || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvMaestria = getNivel('maestria com armas a distancia');
  const nvBarragem = getNivel('barragem');
  const nvFogoCruzado = getNivel('fogo cruzado');
  const nvOlhosAguia = getNivel('olhos de aguia');
  const nvTiroAviso = getNivel('tiro de aviso');

  if (nvMaestria + nvBarragem + nvFogoCruzado + nvOlhosAguia + nvTiroAviso === 0) return null;

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const ativarBarragem = () => {
    if (!handleAjustarRecurso) return;
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < 10) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: 'Barragem exige 10 PM.' });
      return;
    }
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Ativar Barragem (10 PM)',
      message: 'Gastar 10 PM para adicionar Multi (2) ao próximo ataque à distância (ou +1 Multi até o máximo de 3)?',
      onConfirm: () => handleAjustarRecurso('mp_atual', -10)
    });
  };

  return (
    <div className={styles.container}>
      <span className={styles.title}><FaCrosshairs /> Painel Tático — Atirador</span>

      <div className={styles.badgesRow}>
        {nvMaestria > 0 && (
          <span className={styles.badgeItem}>🎯 Precisão à Distância: <strong>+{nvMaestria}</strong></span>
        )}
        {nvOlhosAguia > 0 && (
          <span className={styles.badgeItem}>🦅 Olhos de Águia: Guarda concede <strong>+{nvOlhosAguia * 3} Dano</strong> ou ataque livre (RA=0)</span>
        )}
        {nvTiroAviso > 0 && (
          <span className={styles.badgeItem}>⚠️ Tiro de Aviso: Sem dano para aplicar Abalado, Lento ou <strong>-{nvTiroAviso * 10} PM</strong></span>
        )}
        {nvFogoCruzado > 0 && (
          <span className={styles.badgeItem}>🛡️ Fogo Cruzado: Anula ataque à distância por <strong>5 + Precisão alvo PM</strong></span>
        )}
      </div>

      {nvBarragem > 0 && (
        <div className={styles.actionsRow}>
          <Button type="button" variant="secondary" size="sm" onClick={ativarBarragem}>
            <FaBolt /> Barragem (-10 PM | Multi +1/2)
          </Button>
        </div>
      )}

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}
