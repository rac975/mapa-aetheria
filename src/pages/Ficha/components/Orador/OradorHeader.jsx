import React from 'react';
import { GiDramaMasks } from "react-icons/gi";

export default function OradorHeader({ styles, nivelOrador, mpValido, mpMaxPermitido, fabulaPontos }) {
  return (
    <div style={styles.header}>
      <div>
        <h3 style={styles.title}>
          <GiDramaMasks /> Habilidades de Orador <span style={styles.badgeNivel}>Nível {nivelOrador}</span>
        </h3>
        <p style={styles.subtitle}>Gerencie os recursos de Mana e Fábula para inspirar seus aliados e subjugar inimigos.</p>
      </div>
      <div style={styles.statusBox}>
        <div>Mana Disponível: <strong style={{ color: '#22d3ee' }}>{mpValido} / {mpMaxPermitido} PM</strong></div>
        <div>Pontos de Fábula: <strong style={{ color: '#fbbf24' }}>{fabulaPontos} PF</strong></div>
      </div>
    </div>
  );
}
