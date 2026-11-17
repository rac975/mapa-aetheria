import React from 'react';
import OradorHeader from './OradorHeader';
import OradorHabilidadesCards from './OradorHabilidadesCards';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './ExibirOrador.module.css';

export default function ExibirOrador({ ficha, classeObjeto, handleAjustarRecurso }) {
<<<<<<< Updated upstream
  const { showAlert } = useAlert();
=======
>>>>>>> Stashed changes
  const dadosClasse = classeObjeto || ficha;
  const nivelOrador = parseInt(dadosClasse?.nivel, 10) || 1;

  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
  const mpMaxPermitido = Number(ficha?.mp_max ?? 99);
  const mpValido = mpAtual > mpMaxPermitido ? mpMaxPermitido : mpAtual;
  const fabulaPontos = Number(ficha?.fabula ?? 0);

  // --- CÁLCULOS DAS HABILIDADES DO ORADOR ---
  
  const usarAliadoInesperado = () => {
    if (fabulaPontos < 1) {
<<<<<<< Updated upstream
      showAlert(`Pontos de Fábula insuficientes! Você tem ${fabulaPontos} PF (Exige 1 PF).`);
=======
      window.alert(`Pontos de Fábula insuficientes! Você tem ${fabulaPontos} PF (Exige 1 PF).`);
>>>>>>> Stashed changes
      return;
    }

    if (window.confirm("Usar Aliado Inesperado (Custo: 1 Ponto de Fábula)? Declarar que um NPC ou elemento inesperado surge para ajudar o grupo.")) {
      if (handleAjustarRecurso) {
        handleAjustarRecurso('fabula', -1);
      }
<<<<<<< Updated upstream
      showAlert("🌟 Aliado Inesperado ativado! 1 Ponto de Fábula descontado.");
=======
      window.alert("🌟 Aliado Inesperado ativado! 1 Ponto de Fábula descontado.");
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      showAlert(`MP insuficiente! Você tem ${mpValido} PM e Condenar exige 5 PM.`);
=======
      window.alert(`MP insuficiente! Você tem ${mpValido} PM e Condenar exige 5 PM.`);
>>>>>>> Stashed changes
      return;
    }

    if (window.confirm(`Usar Condenar (Custo: 5 PM)? Teste oposto de AST + VON com bônus de +${bonusAstVonCondenar}. Alvo perde ${perdaPmCondenar} PM e ganha fraqueza de dano.`)) {
      handleAjustarRecurso('mp_atual', -5);
<<<<<<< Updated upstream
      showAlert(`⚖️ Condenar ativado! 5 PM descontados.`);
=======
      window.alert(`⚖️ Condenar ativado! 5 PM descontados.`);
>>>>>>> Stashed changes
    }
  };

  const usarConfioEmVoce = () => {
    if (fabulaPontos < 1) {
<<<<<<< Updated upstream
      showAlert(`Pontos de Fábula insuficientes! Você tem ${fabulaPontos} PF (Exige 1 PF).`);
=======
      window.alert(`Pontos de Fábula insuficientes! Você tem ${fabulaPontos} PF (Exige 1 PF).`);
>>>>>>> Stashed changes
      return;
    }

    if (window.confirm("Usar Confio em Você (Custo: 1 Ponto de Fábula)? Permite que um aliado re-role um dado em um teste.")) {
      if (handleAjustarRecurso) {
        handleAjustarRecurso('fabula', -1);
      }
<<<<<<< Updated upstream
      showAlert("🤝 Confio em Você ativado! 1 Ponto de Fábula descontado.");
=======
      window.alert("🤝 Confio em Você ativado! 1 Ponto de Fábula descontado.");
>>>>>>> Stashed changes
    }
  };

  const curaEncorajar = nivelOrador * 5;

  const usarEncorajar = () => {
    if (!handleAjustarRecurso) {
      console.error("handleAjustarRecurso não foi fornecido!");
      return;
    }

    if (mpValido < 5) {
<<<<<<< Updated upstream
      showAlert(`MP insuficiente! Você tem ${mpValido} PM e Encorajar exige 5 PM.`);
=======
      window.alert(`MP insuficiente! Você tem ${mpValido} PM e Encorajar exige 5 PM.`);
>>>>>>> Stashed changes
      return;
    }

    if (window.confirm(`Usar Encorajar (Custo: 5 PM)? Escolha um aliado para recuperar ${curaEncorajar} PV e subir um passo em um Atributo até o próximo turno.`)) {
      handleAjustarRecurso('mp_atual', -5);
<<<<<<< Updated upstream
      showAlert(`🗣️ Encorajar ativado! 5 PM descontados.`);
=======
      window.alert(`🗣️ Encorajar ativado! 5 PM descontados.`);
>>>>>>> Stashed changes
    }
  };

  const bonusPersuasivo = nivelOrador;

  return (
    <div className={styles.container}>
      <OradorHeader
        nivelOrador={nivelOrador}
        mpValido={mpValido}
        mpMaxPermitido={mpMaxPermitido}
        fabulaPontos={fabulaPontos}
      />

      <OradorHabilidadesCards
        usarAliadoInesperado={usarAliadoInesperado}
        usarCondenar={usarCondenar}
        perdaPmCondenar={perdaPmCondenar}
        usarConfioEmVoce={usarConfioEmVoce}
        usarEncorajar={usarEncorajar}
        curaEncorajar={curaEncorajar}
      />

      {/* Persuasivo (Passiva) */}
      <div className={styles.passivaBox}>
        <h4 className={styles.passivaHeader}>
          <span>Persuasivo (Passiva)</span>
          <span className={styles.passivaBonus}>Bônus: +{bonusPersuasivo}</span>
        </h4>
        <p className={styles.cardDesc}>Você ganha bônus em testes sociais e interações baseadas em Astúcia e Vontade de acordo com o nível na classe.</p>
      </div>
    </div>
  );
}
