import React, { useState } from 'react';
import { FaFire, FaShieldAlt, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
<<<<<<< Updated upstream
import { useAlert } from '../../../../contexts/useAlert';
import styles from './ExibirFurioso.module.css';

export default function ExibirFurioso({ ficha, handleAjustarRecurso, emCriseGlobal, atributosAtuais = {}, onElevarAtributoTemporario }) {
  const { showAlert } = useAlert();
=======
import styles from './ExibirFurioso.module.css';

export default function ExibirFurioso({ ficha, handleAjustarRecurso, emCriseGlobal, atributosAtuais = {}, onElevarAtributoTemporario }) {
>>>>>>> Stashed changes
  const [atributoEscolhidoResistir, setAtributoEscolhidoResistir] = useState('vigor');

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvAdrenalina = getNivel('adrenalina');
  const nvIndomavel = getNivel('espirito indomavel');
  const nvFrenesi = getNivel('frenesi');
  const nvProvocar = getNivel('provocar');
  const nvResistir = getNivel('resistir');

  if (nvAdrenalina + nvIndomavel + nvFrenesi + nvProvocar + nvResistir === 0) {
    return null;
  }

  const danoAdrenalina = nvAdrenalina * 2;
  const curaIndomavel = nvIndomavel * 5;

  const lacos = ficha?.lacos || [];
  const maiorLaco = lacos.length > 0 
    ? Math.max(...lacos.map(l => parseInt(l.forca || l.nivel || 1, 10)), 1) 
    : 1;

  const curaResistir = nvResistir * maiorLaco;

  const usarIndomavel = (tipo) => {
    if (!handleAjustarRecurso) return;

    const fabulaAtual = Number(ficha?.fabula ?? 3);
    if (fabulaAtual <= 0) {
<<<<<<< Updated upstream
      showAlert("Você não possui Pontos de Fábula suficientes!");
=======
      window.alert("Você não possui Pontos de Fábula suficientes!");
>>>>>>> Stashed changes
      return;
    }

    let msg = tipo === 'pv' ? `Gastar 1 Ponto de Fábula para recuperar ${curaIndomavel} PV?`
      : tipo === 'pm' ? `Gastar 1 Ponto de Fábula para recuperar ${curaIndomavel} PM?`
      : `Gastar 1 Ponto de Fábula para se recuperar de uma condição?`;

    if (window.confirm(msg)) {
      handleAjustarRecurso('fabula', -1);
      if (tipo === 'pv') handleAjustarRecurso('hp_atual', curaIndomavel);
      if (tipo === 'pm') handleAjustarRecurso('mp_atual', curaIndomavel);
<<<<<<< Updated upstream
      showAlert(`✨ Espírito Indomável aplicado com sucesso!`);
=======
      window.alert(`✨ Espírito Indomável aplicado com sucesso!`);
>>>>>>> Stashed changes
    }
  };

  const usarProvocar = () => {
    if (!handleAjustarRecurso) return;

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < 5) {
<<<<<<< Updated upstream
      showAlert("MP insuficiente! Provocar exige 5 PM.");
=======
      window.alert("MP insuficiente! Provocar exige 5 PM.");
>>>>>>> Stashed changes
      return;
    }

    const valorVig = atributosAtuais.vigor || 8;
    const valorVon = atributosAtuais.vontade || 8;

    const rolarD = (faces) => Math.floor(Math.random() * faces) + 1;
    const rVig = rolarD(valorVig);
    const rVon = rolarD(valorVon);
    const resultadoTeste = rVig + rVon + nvProvocar;

    if (window.confirm(`Usar Provocar (Custo: 5 PM)?\n\nRolagem: VIG (d${valorVig}: ${rVig}) + VON (d${valorVon}: ${rVon}) + NP (${nvProvocar}) = Total: ${resultadoTeste}\n\nDeseja confirmar o gasto de PM e realizar a provocação?`)) {
      handleAjustarRecurso('mp_atual', -5);
<<<<<<< Updated upstream
      showAlert(`🗣️ Criatura provocada com sucesso! Teste finalizado com resultado ${resultadoTeste}.`);
=======
      window.alert(`🗣️ Criatura provocada com sucesso! Teste finalizado com resultado ${resultadoTeste}.`);
>>>>>>> Stashed changes
    }
  };

  const usarResistir = () => {
    if (!handleAjustarRecurso) return;

    if (window.confirm(`Executar Resistir com Ação Guarda?\n- Recuperação: +${curaResistir} PV\n- Atributo Elevado: ${atributoEscolhidoResistir.toUpperCase()} sobe um passo até o próximo turno.`)) {
      if (curaResistir > 0) {
        handleAjustarRecurso('hp_atual', curaResistir);
      }
      if (onElevarAtributoTemporario) {
        onElevarAtributoTemporario(atributoEscolhidoResistir);
      }
<<<<<<< Updated upstream
      showAlert(`🛡️ Resistir ativado! +${curaResistir} PV recuperados e ${atributoEscolhidoResistir.toUpperCase()} elevado.`);
=======
      window.alert(`🛡️ Resistir ativado! +${curaResistir} PV recuperados e ${atributoEscolhidoResistir.toUpperCase()} elevado.`);
>>>>>>> Stashed changes
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaFire /> Fúria Implacável — Furioso
        </div>

        {emCriseGlobal && nvAdrenalina > 0 && (
          <span className={styles.adrenalinaBadge}>
            ⚡ Adrenalina Ativa (Dano +{danoAdrenalina} em crise)
          </span>
        )}
      </div>

      <div className={styles.passivasRow}>
        {nvFrenesi > 0 && (
          <span className={styles.frenesiBadge}>
            🎯 Frenesi Ativo (Dados iguais em adagas, lutas, malhos e arremessos geram Crítico)
          </span>
        )}
        {nvProvocar > 0 && (
          <button
            type="button"
            onClick={usarProvocar}
            className={styles.provocarBtn}
          >
            🗣️ Provocar (5 PM | VIG+VON+{nvProvocar})
          </button>
        )}
      </div>

      {nvIndomavel > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.cardTitle}>
            <FaBolt /> Espírito Indomável (Gasta 1 Ponto de Fábula):
          </div>
          <div className={styles.buttonRow}>
            <Button type="button" variant="primary" size="sm" onClick={() => usarIndomavel('pv')}>
              Recuperar +{curaIndomavel} PV
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => usarIndomavel('pm')}>
              Recuperar +{curaIndomavel} PM
            </Button>
            <Button type="button" variant="core" size="sm" onClick={() => usarIndomavel('condicao')}>
              Remover Condição
            </Button>
          </div>
        </div>
      )}

      {nvResistir > 0 && (
        <div className={styles.resistirRow}>
          <span className={styles.resistirLabel}>
            <FaShieldAlt /> Resistir (+{curaResistir} PV):
          </span>
          <select
            value={atributoEscolhidoResistir}
            onChange={(e) => setAtributoEscolhidoResistir(e.target.value)}
            className={styles.select}
          >
            <option value="vigor">Elevar Vigor</option>
            <option value="vontade">Elevar Vontade</option>
          </select>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.spacerRight}
            onClick={usarResistir}
          >
            Executar Guarda
          </Button>
        </div>
      )}
    </div>
  );
}
