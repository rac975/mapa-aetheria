import React from 'react';
import { FaCrosshairs } from 'react-icons/fa';
import styles from './ExibirAtirador.module.css';

export default function ExibirAtirador({ habilidadeAtirador }) {
  const nivelHab = parseInt(habilidadeAtirador?.nivel, 10) || 0;
  const nomeHab = (habilidadeAtirador?.nome || '').toLowerCase();

  if (nivelHab === 0) return null;

  if (nomeHab.includes('olhos de aguia')) {
    const bonusDano = nivelHab * 3;
    return (
      <div className={styles.container}>
        <span className={styles.title}>
          <FaCrosshairs /> Bônus Ativo de Olhos de Águia (Nv. {nivelHab})
        </span>
        <span className={styles.desc}>
          Próximo ataque à distância na cena causa <strong>+{bonusDano}</strong> de dano adicional.
        </span>
      </div>
    );
  }

  return null;
}
