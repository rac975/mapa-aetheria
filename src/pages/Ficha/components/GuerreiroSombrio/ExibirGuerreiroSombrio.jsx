import React, { useState } from 'react';
import { FaMoon, FaSkull, FaHeartbeat } from 'react-icons/fa';
import { processarGolpeDasSombras } from '../../../../domain/fabula/classRules';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './ExibirGuerreiroSombrio.module.css';

export default function ExibirGuerreiroSombrio({
  ficha,
  classe,
  handleAjustarRecurso,
  vigorValor = 8,
  emCriseGlobal,
  classes = [],
  onAtivarGolpe
}) {
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const habs = classe?.habilidades || ficha?.habilidades || [];
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

  if (nvAgonia + nvCoracao + nvGolpe + nvLicao + nvSangue === 0) return null;

  const recAgonia = nvAgonia * 2;
  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const usarAgonia = () => {
    if (!handleAjustarRecurso) return;
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Acionar Agonia',
      message: `Após ferir um inimigo com o qual possui Laço (1x/turno), recuperar +${recAgonia} PV e +${recAgonia} PM?`,
      onConfirm: () => {
        handleAjustarRecurso('hp_atual', recAgonia);
        handleAjustarRecurso('mp_atual', recAgonia);
      }
    });
  };

  const acionarGolpeDasSombras = () => {
    if (!handleAjustarRecurso) return;
    const facesVig = parseInt(String(vigorValor).replace(/\D/g, ''), 10) || 8;
    const resultado = processarGolpeDasSombras(ficha, classes, facesVig);

    if (!resultado.sucesso) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Golpe das Sombras Bloqueado', message: resultado.mensagem });
      return;
    }

    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar Golpe das Sombras',
      message: `${resultado.mensagem}\n\nExecutar o golpe e sacrificar ${resultado.custoPv} PV?`,
      onConfirm: () => {
        handleAjustarRecurso('hp_atual', -resultado.custoPv);
        if (onAtivarGolpe) {
          onAtivarGolpe({
            usandoGolpeDasSombras: true,
            resultadoVigorRolado: resultado.custoPv
          });
        }
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaMoon /> Disciplina Sombria — Guerreiro Sombrio</div>
        {emCriseGlobal && nvSangue > 0 && (
          <span className={styles.criseBadge}>🛡️ Sangue das Trevas Ativo (Resistência a Trevas e Veneno)</span>
        )}
      </div>

      <div className={styles.passivasRow}>
        {nvCoracao > 0 && (
          <span className={styles.badgeCoracao}>🖤 Coração da Escuridão disponível (1x/cena ao entrar em Crise)</span>
        )}
        {nvLicao > 0 && (
          <span className={styles.badgeLicao}>👁️ Lição Dolorosa: Estudo imediato ao sofrer dano (+{nvLicao})</span>
        )}
      </div>

      {nvAgonia > 0 && (
        <div className={styles.actionBox}>
          <Button type="button" variant="secondary" size="sm" fullWidth onClick={usarAgonia}>
            <FaHeartbeat /> Acionar Agonia (Recuperar +{recAgonia} PV e +{recAgonia} PM)
          </Button>
        </div>
      )}

      {nvGolpe > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.cardTitle}><FaSkull /> Golpe das Sombras (Sacrifício de Vigor)</div>
          <Button type="button" variant="danger" size="sm" onClick={acionarGolpeDasSombras}>
            Executar Golpe das Sombras (Rolar d{parseInt(String(vigorValor).replace(/\D/g, ''), 10) || 8})
          </Button>
        </div>
      )}

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}