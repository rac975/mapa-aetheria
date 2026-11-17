import React from 'react';
import { FaMoon, FaSkull, FaHeartbeat } from 'react-icons/fa';
import { processarGolpeDasSombras } from '../../../../domain/fabula/classRules';
import { Button } from '../../../../components/ui';
<<<<<<< Updated upstream
import { useAlert } from '../../../../contexts/useAlert';
import styles from './ExibirGuerreiroSombrio.module.css';

export default function ExibirGuerreiroSombrio({ ficha, handleAjustarRecurso, vigorValor = 8, emCriseGlobal, classes = [], onAtivarGolpe }) {
  const { showAlert } = useAlert();
=======
import styles from './ExibirGuerreiroSombrio.module.css';

export default function ExibirGuerreiroSombrio({ ficha, handleAjustarRecurso, vigorValor = 8, emCriseGlobal, classes = [], onAtivarGolpe }) {
>>>>>>> Stashed changes
  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvAgonia = getNivel('agonia');
  const nvCoracao = getNivel('coracao da escuridao');
  const nvGolpe = getNivel('golpe das sombras');
  const nvLicao = getNivel('licao dolorosa');
  const nvSangue = getNivel('sangue das trevas');

  if (nvAgonia + nvCoracao + nvGolpe + nvLicao + nvSangue === 0) {
    return null;
  }

  const recAgonia = nvAgonia * 2;

  const usarAgonia = () => {
    if (!handleAjustarRecurso) return;

    const valorRecuperacao = nvAgonia * 2;

    if (window.confirm(`Ativar Agonia? Recuperar ${valorRecuperacao} PV e ${valorRecuperacao} MP.`)) {
      handleAjustarRecurso('hp_atual', valorRecuperacao);
      handleAjustarRecurso('mp_atual', valorRecuperacao);
    }
  };

  const acionarGolpeDasSombras = () => {
    if (!handleAjustarRecurso) return;

    const resultado = processarGolpeDasSombras(ficha, classes, vigorValor);

    if (!resultado.sucesso) {
<<<<<<< Updated upstream
      showAlert(resultado.mensagem);
=======
      window.alert(resultado.mensagem);
>>>>>>> Stashed changes
      return;
    }

    if (window.confirm(`${resultado.mensagem}\n\nDeseja executar o golpe e perder ${resultado.custoPv} PV?`)) {
      // 1. Deduz o PV atual
      handleAjustarRecurso('hp_atual', -resultado.custoPv);

      // 2. Cria o objeto de opções do golpe
      const opcoesDanoExtra = {
        usandoGolpeDasSombras: true,
        resultadoVigorRolado: resultado.custoPv // O PV perdido é o valor exato do dVigor
      };

      // 3. Comunica o componente pai (FichaClassesSecao ou FichaPage) que o golpe está armado!
      if (onAtivarGolpe) {
        onAtivarGolpe(opcoesDanoExtra);
      }

<<<<<<< Updated upstream
      showAlert(`💥 Golpe das Sombras Armado para o próximo ataque!\n- PV Sacrificados: -${resultado.custoPv}\n- Dano de Trevas Adicional: +${resultado.danoAdicional}`);
=======
      window.alert(`💥 Golpe das Sombras Armado para o próximo ataque!\n- PV Sacrificados: -${resultado.custoPv}\n- Dano de Trevas Adicional: +${resultado.danoAdicional}`);
>>>>>>> Stashed changes
    }
  };

  if (nvGolpe === 0) return null;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.title}>
          <FaMoon /> Disciplina Sombria — Guerreiro Sombrio
        </div>

        {emCriseGlobal && nvSangue > 0 && (
          <span className={styles.criseBadge}>
            🛡️ Sangue das Trevas Ativo (Resistência a Trevas e Veneno)
          </span>
        )}
      </div>

      {/* Resumo Passivo */}
      <div className={styles.passivasRow}>
        {nvCoracao > 0 && (
          <span className={styles.badgeCoracao}>
            🖤 Coração da Escuridão disponível (1x/cena)
          </span>
        )}
        {nvLicao > 0 && (
          <span className={styles.badgeLicao}>
            👁️ Lição Dolorosa: Bônus de <strong>+{nvLicao}</strong> ao Estudar após sofrer dano
          </span>
        )}
      </div>

      {/* Ação Agonia */}
      {nvAgonia > 0 && (
        <div className={styles.actionBox}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            onClick={usarAgonia}
          >
            <FaHeartbeat /> Acionar Agonia (Recuperar +{recAgonia} PV e +{recAgonia} MP)
          </Button>
        </div>
      )}

      {/* Ação Golpe das Sombras */}
      {nvGolpe > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.cardTitle}>
            <FaSkull /> Golpe das Sombras (Sacrifício de Vigor)
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={acionarGolpeDasSombras}
          >
            Executar Golpe das Sombras (Rolar d{vigorValor})
          </Button>
        </div>
      )}
    </div>
  );
}
