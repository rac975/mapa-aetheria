import React from 'react';

export default function OradorHabilidadesCards({
  styles,
  usarAliadoInesperado,
  usarCondenar,
  perdaPmCondenar,
  usarConfioEmVoce,
  usarEncorajar,
  curaEncorajar
}) {
  return (
    <div style={styles.grid}>
      {/* Aliado Inesperado */}
      <div style={styles.card}>
        <div>
          <h4 style={styles.cardTitle}>Aliado Inesperado</h4>
          <p style={styles.cardDesc}>Gaste 1 Ponto de Fábula para introduzir um elemento ou NPC de ajuda na cena.</p>
        </div>
        <button
          onClick={usarAliadoInesperado}
          style={styles.buttonAmber}
          onMouseOver={(e) => e.target.style.backgroundColor = '#b45309'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(217, 119, 6, 0.8)'}
        >
          Usar Aliado Inesperado (1 PF)
        </button>
      </div>

      {/* Condenar */}
      <div style={styles.card}>
        <div>
          <h4 style={styles.cardTitle}>Condenar</h4>
          <p style={styles.cardDesc}>Custa 5 PM. Alvo sofre teste oposto e perde {perdaPmCondenar} PM.</p>
        </div>
        <button
          onClick={usarCondenar}
          style={styles.buttonIndigo}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(79, 70, 229, 0.8)'}
        >
          Usar Condenar (5 PM)
        </button>
      </div>

      {/* Confio em Você */}
      <div style={styles.card}>
        <div>
          <h4 style={styles.cardTitle}>Confio em Você</h4>
          <p style={styles.cardDesc}>Gaste 1 Ponto de Fábula para permitir que um aliado re-role um dado.</p>
        </div>
        <button
          onClick={usarConfioEmVoce}
          style={styles.buttonAmber}
          onMouseOver={(e) => e.target.style.backgroundColor = '#b45309'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(217, 119, 6, 0.8)'}
        >
          Usar Confio em Você (1 PF)
        </button>
      </div>

      {/* Encorajar */}
      <div style={styles.card}>
        <div>
          <h4 style={styles.cardTitle}>Encorajar</h4>
          <p style={styles.cardDesc}>Custa 5 PM. Aliado recupera {curaEncorajar} PV e sobe um passo em um Atributo.</p>
        </div>
        <button
          onClick={usarEncorajar}
          style={styles.buttonIndigo}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(79, 70, 229, 0.8)'}
        >
          Usar Encorajar (5 PM)
        </button>
      </div>
    </div>
  );
}
