import React from 'react';
import { Button } from '../../../../components/ui';
import styles from './ExibirOrador.module.css';

export default function OradorHabilidadesCards({
  usarAliadoInesperado,
  usarCondenar,
  perdaPmCondenar,
  usarConfioEmVoce,
  usarEncorajar,
  curaEncorajar
}) {
  return (
    <div className={styles.grid}>
      {/* Aliado Inesperado */}
      <div className={styles.card}>
        <div>
          <h4 className={styles.cardTitle}>Aliado Inesperado</h4>
          <p className={styles.cardDesc}>Gaste 1 Ponto de Fábula para introduzir um elemento ou NPC de ajuda na cena.</p>
        </div>
        <Button
          type="button"
          variant="core"
          size="sm"
          fullWidth
          onClick={usarAliadoInesperado}
        >
          Usar Aliado Inesperado (1 PF)
        </Button>
      </div>

      {/* Condenar */}
      <div className={styles.card}>
        <div>
          <h4 className={styles.cardTitle}>Condenar</h4>
          <p className={styles.cardDesc}>Custa 5 PM. Alvo sofre teste oposto e perde {perdaPmCondenar} PM.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          onClick={usarCondenar}
        >
          Usar Condenar (5 PM)
        </Button>
      </div>

      {/* Confio em Você */}
      <div className={styles.card}>
        <div>
          <h4 className={styles.cardTitle}>Confio em Você</h4>
          <p className={styles.cardDesc}>Gaste 1 Ponto de Fábula para permitir que um aliado re-role um dado.</p>
        </div>
        <Button
          type="button"
          variant="core"
          size="sm"
          fullWidth
          onClick={usarConfioEmVoce}
        >
          Usar Confio em Você (1 PF)
        </Button>
      </div>

      {/* Encorajar */}
      <div className={styles.card}>
        <div>
          <h4 className={styles.cardTitle}>Encorajar</h4>
          <p className={styles.cardDesc}>Custa 5 PM. Aliado recupera {curaEncorajar} PV e sobe um passo em um Atributo.</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          fullWidth
          onClick={usarEncorajar}
        >
          Usar Encorajar (5 PM)
        </Button>
      </div>
    </div>
  );
}
