import React, { useState } from 'react';
import { FaShieldAlt, FaUserShield, FaHeart } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ExibirGuardiao.module.css';

export default function ExibirGuardiao({ ficha }) {
  const [protegerUsado, setProtegerUsado] = useState(false);

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) => (item.nome || '').toLowerCase().includes(termo));
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvMaestriaDef = getNivel('maestria defensiva');
  const nvFortaleza = getNivel('fortaleza');
  const nvDuploEscudeiro = getNivel('duplo escudeiro');
  const nvProteger = getNivel('proteger');
  const nvGuardaCostas = getNivel('guarda-costas');

  // Só exibe o painel se tiver alguma habilidade ativa
  if (nvMaestriaDef + nvFortaleza + nvDuploEscudeiro + nvProteger + nvGuardaCostas === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <FaShieldAlt /> Painel Tático do Guardião
      </div>

      <div className={styles.badgesRow}>
        {nvMaestriaDef > 0 && (
          <span className={styles.badgeGreen}>
            🛡️ Redução de Dano: <strong>-{nvMaestriaDef}</strong> (c/ Escudo/Arm. Marcial)
          </span>
        )}

        {nvFortaleza > 0 && (
          <span className={styles.badgeRed}>
            <FaHeart size={10} /> Bônus Fortaleza: <strong>+{nvFortaleza * 3} PV</strong>
          </span>
        )}

        {nvDuploEscudeiro > 0 && (
          <span className={styles.badgeGold}>
            ⚔️ Escudos Gêmeos: VIG+VIG | Dano RA + {5 + nvMaestriaDef}
          </span>
        )}
      </div>

      {(nvProteger > 0 || nvGuardaCostas > 0) && (
        <div className={styles.actionRow}>
          {nvProteger > 0 && (
            <Button
              type="button"
              variant={protegerUsado ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setProtegerUsado(!protegerUsado)}
            >
              <FaUserShield /> {protegerUsado ? 'Proteger Usado (Resetar Turno)' : 'Usar Proteger (1x/turno)'}
            </Button>
          )}
          {nvGuardaCostas > 0 && (
            <span className={styles.helperText}>
              • Guarda-Costas: Cobertura concede <strong>Resistência a todos os danos</strong>.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
