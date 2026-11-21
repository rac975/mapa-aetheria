import React from 'react';
import {
  gerarTextoBeneficioDancarino
} from '../../../domain/fabula/highFantasyRules';
import {
  gerarTextoBeneficioPvOuPm
} from '../../../domain/fabula/naturalFantasyRules';
import styles from './FichaFormClasses.module.css';

export default function FichaFormBeneficioCard({
  classe,
  index,
  setFormClasses,
  ehDancarino,
  ehFloralista,
  ehInvocador,
  infoDancarino,
  infoFloralista,
  infoInvocador
}) {
  const handleAlterarBeneficioDancarino = (escolha) => {
    setFormClasses((prevClasses) =>
      prevClasses.map((c, i) => {
        if (i !== index) return c;
        const novosDados = { ...(c.dados_dancarino || {}), beneficioInicial: escolha };
        return {
          ...c,
          beneficios: gerarTextoBeneficioDancarino(escolha),
          dados_dancarino: novosDados,
          habilidades: (c.habilidades || []).map((h) =>
            (h.nome || '').toLowerCase().startsWith('danc') || (h.nome || '').toLowerCase().startsWith('danç')
              ? { ...h, dados_dancarino: { ...(h.dados_dancarino || {}), ...novosDados } }
              : h
          )
        };
      })
    );
  };

  const handleAlterarBeneficioNatural = (escolha, dadosProp, habTermo) => {
    setFormClasses((prevClasses) =>
      prevClasses.map((c, i) => {
        if (i !== index) return c;
        const novosDados = { ...(c[dadosProp] || {}), beneficioInicial: escolha };
        return {
          ...c,
          beneficios: gerarTextoBeneficioPvOuPm(escolha),
          [dadosProp]: novosDados,
          habilidades: (c.habilidades || []).map((h) =>
            (h.nome || '').toLowerCase().includes(habTermo)
              ? { ...h, [dadosProp]: { ...(h[dadosProp] || {}), ...novosDados } }
              : h
          )
        };
      })
    );
  };

  return (
    <>
      <input type="text" readOnly value={classe.beneficios || ''} className={styles.beneficiosInput} />
      {ehDancarino && infoDancarino && (
        <div className={styles.subCardContainer}>
          <select
            value={infoDancarino.escolha}
            onChange={(e) => handleAlterarBeneficioDancarino(e.target.value)}
            className={styles.selectClasse}
          >
            <option value="pv">Escolha Dançarino: +5 PV Máximos</option>
            <option value="pm">Escolha Dançarino: +5 PM Máximos</option>
          </select>
        </div>
      )}
      {ehFloralista && infoFloralista && (
        <div className={styles.subCardContainer}>
          <select
            value={infoFloralista.escolha}
            onChange={(e) => handleAlterarBeneficioNatural(e.target.value, 'dados_floralista', 'cloromancia')}
            className={styles.selectClasse}
          >
            <option value="pv">Escolha Floralista: +5 PV Máximos</option>
            <option value="pm">Escolha Floralista: +5 PM Máximos</option>
          </select>
        </div>
      )}
      {ehInvocador && infoInvocador && (
        <div className={styles.subCardContainer}>
          <select
            value={infoInvocador.escolha}
            onChange={(e) => handleAlterarBeneficioNatural(e.target.value, 'dados_invocador', 'invoca')}
            className={styles.selectClasse}
          >
            <option value="pv">Escolha Invocador: +5 PV Máximos</option>
            <option value="pm">Escolha Invocador: +5 PM Máximos</option>
          </select>
        </div>
      )}
    </>
  );
}
