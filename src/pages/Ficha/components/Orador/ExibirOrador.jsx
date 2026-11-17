import React, { useState } from 'react';
import { calcularDadosOrador } from '../../../../domain/fabula/coreClassRules';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import OradorHeader from './OradorHeader';
import OradorHabilidadesCards from './OradorHabilidadesCards';
import styles from './ExibirOrador.module.css';

export default function ExibirOrador({ ficha, classeObjeto, classes = [], handleAjustarRecurso }) {
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const listaClasses = classes?.length > 0 ? classes : (classeObjeto ? [classeObjeto] : []);
  const nivelOrador = parseInt((classeObjeto || ficha)?.nivel, 10) || 1;
  const dadosOrador = calcularDadosOrador(listaClasses);

  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
  const mpMaxPermitido = Number(ficha?.mp_max ?? 99);
  const mpValido = Math.min(mpAtual, mpMaxPermitido);
  const fabulaPontos = Number(ficha?.fabula ?? 0);

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const usarAliadoInesperado = () => {
    if (fabulaPontos < 1) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Pontos de Fábula Insuficientes', message: `Você tem ${fabulaPontos} PF (Aliado Inesperado exige 1 PF).` });
      return;
    }
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Usar Aliado Inesperado',
      message: 'Gastar 1 Ponto de Fábula para tornar solícita uma criatura não-hostil presente na cena?',
      onConfirm: () => {
        if (handleAjustarRecurso) handleAjustarRecurso('fabula', -1);
      }
    });
  };

  const usarCondenar = () => {
    if (!handleAjustarRecurso) return;
    if (mpValido < 5) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: `Você tem ${mpValido} PM e Condenar exige 5 PM.` });
      return;
    }
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Usar Condenar (5 PM)',
      message: `Teste oposto de AST + VON (+${dadosOrador.bonusTesteCondenar}). Em sucesso, o inimigo perde ${dadosOrador.perdaPmCondenar} PM, fica Abalado/Atordoado e sofre +${dadosOrador.bonusDanoCondenar} de dano adicional até seu próximo turno.`,
      onConfirm: () => handleAjustarRecurso('mp_atual', -5)
    });
  };

  const usarConfioEmVoce = () => {
    if (fabulaPontos < 1) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Pontos de Fábula Insuficientes', message: `Você tem ${fabulaPontos} PF (Confio em Você exige 1 PF).` });
      return;
    }
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Usar Confio em Você (1 PF)',
      message: `Gastar 1 PF para invocar Traço/Laço de outro PJ em um teste (e se tiver Laço com ele, recupera +${dadosOrador.curaPmConfioComLaco} PM)?`,
      onConfirm: () => {
        if (handleAjustarRecurso) handleAjustarRecurso('fabula', -1);
      }
    });
  };

  const usarEncorajar = () => {
    if (!handleAjustarRecurso) return;
    if (mpValido < 5) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: `Você tem ${mpValido} PM e Encorajar exige 5 PM.` });
      return;
    }
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Usar Encorajar (5 PM)',
      message: `Gastar 5 PM para que um aliado recupere ${dadosOrador.curaPvEncorajar} PV e eleve um atributo em 1 passo até seu próximo turno?`,
      onConfirm: () => handleAjustarRecurso('mp_atual', -5)
    });
  };

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
        perdaPmCondenar={dadosOrador.perdaPmCondenar}
        usarConfioEmVoce={usarConfioEmVoce}
        usarEncorajar={usarEncorajar}
        curaEncorajar={dadosOrador.curaPvEncorajar}
      />

      {dadosOrador.nvPersuasivo > 0 && (
        <div className={styles.persuasivoBadge}>
          <strong>Persuasivo (Nv. {dadosOrador.nvPersuasivo}):</strong> Ao passar em testes sociais de Relógio, gaste até {dadosOrador.maxPmPersuasivo} PM (+1 seção a cada 20 PM).
        </div>
      )}

      <CustomAlert
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onConfirm={alerta.onConfirm}
        onClose={fecharAlerta}
      />
    </div>
  );
}
