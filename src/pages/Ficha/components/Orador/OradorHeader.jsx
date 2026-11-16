import React from 'react';
import { GiDramaMasks } from "react-icons/gi";
import { Badge } from '../../../../components/ui';
import styles from './ExibirOrador.module.css';

export default function OradorHeader({ nivelOrador, mpValido, mpMaxPermitido, fabulaPontos }) {
  return (
    <div className={styles.header}>
      <div>
        <h3 className={styles.title}>
          <GiDramaMasks /> Habilidades de Orador <Badge variant="gold" size="sm">Nível {nivelOrador}</Badge>
        </h3>
        <p className={styles.subtitle}>Gerencie os recursos de Mana e Fábula para inspirar seus aliados e subjugar inimigos.</p>
      </div>
      <div className={styles.statusBox}>
        <div>Mana Disponível: <strong className={styles.statusPm}>{mpValido} / {mpMaxPermitido} PM</strong></div>
        <div>Pontos de Fábula: <strong className={styles.statusFabula}>{fabulaPontos} PF</strong></div>
      </div>
    </div>
  );
}
