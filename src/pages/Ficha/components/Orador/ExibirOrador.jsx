import React from 'react';
import OradorHeader from './OradorHeader';
import OradorHabilidadesCards from './OradorHabilidadesCards';

export default function ExibirOrador({ ficha, classeObjeto, handleAjustarRecurso }) {
  const dadosClasse = classeObjeto || ficha;
  const nivelOrador = parseInt(dadosClasse?.nivel, 10) || 1;

  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
  const mpMaxPermitido = Number(ficha?.mp_max ?? 99);
  const mpValido = mpAtual > mpMaxPermitido ? mpMaxPermitido : mpAtual;
  const fabulaPontos = Number(ficha?.fabula ?? 0);

  // --- CÁLCULOS DAS HABILIDADES DO ORADOR ---
  
  const usarAliadoInesperado = () => {
    if (fabulaPontos < 1) {
      window.alert(`Pontos de Fábula insuficientes! Você tem ${fabulaPontos} PF (Exige 1 PF).`);
      return;
    }

    if (window.confirm("Usar Aliado Inesperado (Custo: 1 Ponto de Fábula)? Declarar que um NPC ou elemento inesperado surge para ajudar o grupo.")) {
      if (handleAjustarRecurso) {
        handleAjustarRecurso('fabula', -1);
      }
      window.alert("🌟 Aliado Inesperado ativado! 1 Ponto de Fábula descontado.");
    }
  };

  const perdaPmCondenar = nivelOrador * 2;
  const bonusAstVonCondenar = nivelOrador;

  const usarCondenar = () => {
    if (!handleAjustarRecurso) {
      console.error("handleAjustarRecurso não foi fornecido!");
      return;
    }

    if (mpValido < 5) {
      window.alert(`MP insuficiente! Você tem ${mpValido} PM e Condenar exige 5 PM.`);
      return;
    }

    if (window.confirm(`Usar Condenar (Custo: 5 PM)? Teste oposto de AST + VON com bônus de +${bonusAstVonCondenar}. Alvo perde ${perdaPmCondenar} PM e ganha fraqueza de dano.`)) {
      handleAjustarRecurso('mp_atual', -5);
      window.alert(`⚖️ Condenar ativado! 5 PM descontados.`);
    }
  };

  const usarConfioEmVoce = () => {
    if (fabulaPontos < 1) {
      window.alert(`Pontos de Fábula insuficientes! Você tem ${fabulaPontos} PF (Exige 1 PF).`);
      return;
    }

    if (window.confirm("Usar Confio em Você (Custo: 1 Ponto de Fábula)? Permite que um aliado re-role um dado em um teste.")) {
      if (handleAjustarRecurso) {
        handleAjustarRecurso('fabula', -1);
      }
      window.alert("🤝 Confio em Você ativado! 1 Ponto de Fábula descontado.");
    }
  };

  const curaEncorajar = nivelOrador * 5;

  const usarEncorajar = () => {
    if (!handleAjustarRecurso) {
      console.error("handleAjustarRecurso não foi fornecido!");
      return;
    }

    if (mpValido < 5) {
      window.alert(`MP insuficiente! Você tem ${mpValido} PM e Encorajar exige 5 PM.`);
      return;
    }

    if (window.confirm(`Usar Encorajar (Custo: 5 PM)? Escolha um aliado para recuperar ${curaEncorajar} PV e subir um passo em um Atributo até o próximo turno.`)) {
      handleAjustarRecurso('mp_atual', -5);
      window.alert(`🗣️ Encorajar ativado! 5 PM descontados.`);
    }
  };

  const bonusPersuasivo = nivelOrador;

  // --- ESTILOS EM LINHA ---
  const styles = {
    container: {
      backgroundColor: 'rgba(13, 15, 24, 0.9)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      color: '#f8fafc',
      marginTop: '16px',
      fontFamily: 'inherit',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
      paddingBottom: '12px',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#fbbf24',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    badgeNivel: {
      fontSize: '0.75rem',
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      color: '#fcd34d',
      padding: '2px 8px',
      borderRadius: '9999px',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
    subtitle: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      margin: '4px 0 0 0',
    },
    statusBox: {
      textAlign: 'right',
      fontSize: '0.75rem',
      color: '#cbd5e1',
      backgroundColor: 'rgba(30, 41, 59, 0.8)',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(51, 65, 85, 1)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '12px',
    },
    card: {
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      border: '1px solid rgba(51, 65, 85, 0.6)',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontWeight: 600,
      color: '#fcd34d',
      fontSize: '0.875rem',
      margin: '0 0 4px 0',
    },
    cardDesc: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      margin: 0,
      lineHeight: '1.4',
    },
    buttonAmber: {
      marginTop: '12px',
      width: '100%',
      backgroundColor: 'rgba(217, 119, 6, 0.8)',
      hoverBackgroundColor: '#d97706',
      color: '#ffffff',
      fontSize: '0.75rem',
      fontWeight: 500,
      padding: '8px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    buttonIndigo: {
      marginTop: '12px',
      width: '100%',
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      color: '#ffffff',
      fontSize: '0.75rem',
      fontWeight: 500,
      padding: '8px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    passivaBox: {
      marginTop: '12px',
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      border: '1px solid rgba(51, 65, 85, 0.4)',
      borderRadius: '8px',
      padding: '12px',
    },
    passivaHeader: {
      fontWeight: 600,
      color: '#cbd5e1',
      fontSize: '0.875rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: 0,
    }
  };

  return (
    <div style={styles.container}>
      <OradorHeader
        styles={styles}
        nivelOrador={nivelOrador}
        mpValido={mpValido}
        mpMaxPermitido={mpMaxPermitido}
        fabulaPontos={fabulaPontos}
      />

      <OradorHabilidadesCards
        styles={styles}
        usarAliadoInesperado={usarAliadoInesperado}
        usarCondenar={usarCondenar}
        perdaPmCondenar={perdaPmCondenar}
        usarConfioEmVoce={usarConfioEmVoce}
        usarEncorajar={usarEncorajar}
        curaEncorajar={curaEncorajar}
      />

      {/* Persuasivo (Passiva) */}
      <div style={styles.passivaBox}>
        <h4 style={styles.passivaHeader}>
          <span>Persuasivo (Passiva)</span>
          <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>Bônus: +{bonusPersuasivo}</span>
        </h4>
        <p style={{ ...styles.cardDesc, marginTop: '4px' }}>Você ganha bônus em testes sociais e interações baseadas em Astúcia e Vontade de acordo com o nível na classe.</p>
      </div>
    </div>
  );
}
