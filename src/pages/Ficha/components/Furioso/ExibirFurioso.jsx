import React, { useState } from 'react';
import { FaFire, FaShieldAlt, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './ExibirFurioso.module.css';

export default function ExibirFurioso({
  ficha,
  classe,
  handleAjustarRecurso,
  emCriseGlobal,
  atributosAtuais = {},
  onElevarAtributoTemporario
}) {
  const [atributoEscolhidoResistir, setAtributoEscolhidoResistir] = useState('vigor');
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const habs = classe?.habilidades || ficha?.habilidades || [];
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

  if (nvAdrenalina + nvIndomavel + nvFrenesi + nvProvocar + nvResistir === 0) return null;

  const danoAdrenalina = nvAdrenalina * 2;
  const curaIndomavel = nvIndomavel * 5;
  const lacos = Array.isArray(ficha?.lacos) ? ficha.lacos : [];
  const maiorLaco = lacos.length > 0
    ? Math.max(...lacos.map((l) => parseInt(l?.forca || l?.nivel || 1, 10) || 1), 1)
    : 1;
  const curaResistir = nvResistir * maiorLaco;

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const usarIndomavel = (tipo) => {
    if (!handleAjustarRecurso) return;
    const fabulaAtual = Number(ficha?.fabula ?? 0);
    if (fabulaAtual <= 0) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Fábula Insuficiente', message: 'Você não possui Pontos de Fábula suficientes!' });
      return;
    }
    const msg = tipo === 'pv'
      ? `Gastar 1 Ponto de Fábula para recuperar ${curaIndomavel} PV?`
      : tipo === 'pm'
        ? `Gastar 1 Ponto de Fábula para recuperar ${curaIndomavel} PM?`
        : 'Gastar 1 Ponto de Fábula para se recuperar de uma condição?';

    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Espírito Indomável',
      message: msg,
      onConfirm: () => {
        handleAjustarRecurso('fabula', -1);
        if (tipo === 'pv') handleAjustarRecurso('hp_atual', curaIndomavel);
        if (tipo === 'pm') handleAjustarRecurso('mp_atual', curaIndomavel);
      }
    });
  };

  const usarProvocar = () => {
    if (!handleAjustarRecurso) return;
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < 5) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: 'Provocar exige 5 PM.' });
      return;
    }

    const valorVig = parseInt(String(atributosAtuais.vigor || ficha?.vigor || 8).replace(/\D/g, ''), 10) || 8;
    const valorVon = parseInt(String(atributosAtuais.vontade || ficha?.vontade || 8).replace(/\D/g, ''), 10) || 8;
    const rVig = Math.floor(Math.random() * valorVig) + 1;
    const rVon = Math.floor(Math.random() * valorVon) + 1;
    const resultadoTeste = rVig + rVon + nvProvocar;

    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar Provocar (5 PM)',
      message: `Rolagem: VIG (d${valorVig}: ${rVig}) + VON (d${valorVon}: ${rVon}) + NP (${nvProvocar}) = ${resultadoTeste}. Confirmar gasto de 5 PM e aplicar Enfurecido em caso de sucesso?`,
      onConfirm: () => handleAjustarRecurso('mp_atual', -5)
    });
  };

  const usarResistir = () => {
    if (!handleAjustarRecurso) return;
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Executar Resistir (Ação Guarda)',
      message: `Recuperar +${curaResistir} PV e elevar ${atributoEscolhidoResistir.toUpperCase()} em 1 passo (máx. d12) até o fim do próximo turno?`,
      onConfirm: () => {
        if (curaResistir > 0) handleAjustarRecurso('hp_atual', curaResistir);
        if (onElevarAtributoTemporario) onElevarAtributoTemporario(atributoEscolhidoResistir);
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaFire /> Fúria Implacável — Furioso</div>
        {emCriseGlobal && nvAdrenalina > 0 && (
          <span className={styles.adrenalinaBadge}>⚡ Adrenalina Ativa (Dano +{danoAdrenalina} em crise)</span>
        )}
      </div>

      <div className={styles.passivasRow}>
        {nvFrenesi > 0 && (
          <span className={styles.frenesiBadge}>🎯 Frenesi Ativo (Dados iguais em adagas, lutas, malhos e arremessos geram Crítico)</span>
        )}
        {nvProvocar > 0 && (
          <button type="button" onClick={usarProvocar} className={styles.provocarBtn}>
            🗣️ Provocar (5 PM | VIG+VON+{nvProvocar})
          </button>
        )}
      </div>

      {nvIndomavel > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.cardTitle}><FaBolt /> Espírito Indomável (Gasta 1 Ponto de Fábula):</div>
          <div className={styles.buttonRow}>
            <Button type="button" variant="primary" size="sm" onClick={() => usarIndomavel('pv')}>Recuperar +{curaIndomavel} PV</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => usarIndomavel('pm')}>Recuperar +{curaIndomavel} PM</Button>
            <Button type="button" variant="core" size="sm" onClick={() => usarIndomavel('condicao')}>Remover Condição</Button>
          </div>
        </div>
      )}

      {nvResistir > 0 && (
        <div className={styles.resistirRow}>
          <span className={styles.resistirLabel}><FaShieldAlt /> Resistir (+{curaResistir} PV):</span>
          <select value={atributoEscolhidoResistir} onChange={(e) => setAtributoEscolhidoResistir(e.target.value)} className={styles.select}>
            <option value="vigor">Elevar Vigor</option>
            <option value="vontade">Elevar Vontade</option>
          </select>
          <Button type="button" variant="primary" size="sm" className={styles.spacerRight} onClick={usarResistir}>
            Executar Guarda
          </Button>
        </div>
      )}

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}