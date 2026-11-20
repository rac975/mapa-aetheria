import React from 'react';
import {
  ESPECIES_ALVO_EQUIPAMENTO,
  TIPOS_DANO_EQUIPAMENTO,
  identificarTipoParametroCaracteristica
} from '../../../../domain/fabula/equipmentRules';

export default function SeletorParametrosCaracteristica({
  caracteristicaSelecionada,
  paramsCaracteristica = {},
  onChangeParams,
  styles
}) {
  const tipoParam = identificarTipoParametroCaracteristica(caracteristicaSelecionada);
  if (!tipoParam) return null;

  const especie1 = paramsCaracteristica.especie1 || ESPECIES_ALVO_EQUIPAMENTO[0];
  const especie2 = paramsCaracteristica.especie2 || ESPECIES_ALVO_EQUIPAMENTO[1];
  const tipoDano1 = paramsCaracteristica.tipoDano1 || TIPOS_DANO_EQUIPAMENTO[1];
  const tipoDano2 = paramsCaracteristica.tipoDano2 || TIPOS_DANO_EQUIPAMENTO[2];

  const atualizar = (campo, valor) => {
    const proximo = { ...paramsCaracteristica, [campo]: valor };
    if (campo === 'especie1' && valor === proximo.especie2) {
      proximo.especie2 = ESPECIES_ALVO_EQUIPAMENTO.find((e) => e !== valor) || ESPECIES_ALVO_EQUIPAMENTO[1];
    }
    if (campo === 'especie2' && valor === proximo.especie1) {
      proximo.especie1 = ESPECIES_ALVO_EQUIPAMENTO.find((e) => e !== valor) || ESPECIES_ALVO_EQUIPAMENTO[0];
    }
    if (campo === 'tipoDano1' && valor === proximo.tipoDano2) {
      proximo.tipoDano2 = TIPOS_DANO_EQUIPAMENTO.find((t) => t !== valor) || TIPOS_DANO_EQUIPAMENTO[2];
    }
    if (campo === 'tipoDano2' && valor === proximo.tipoDano1) {
      proximo.tipoDano1 = TIPOS_DANO_EQUIPAMENTO.find((t) => t !== valor) || TIPOS_DANO_EQUIPAMENTO[1];
    }
    onChangeParams(proximo);
  };

  if (tipoParam === 'especie_1') {
    return (
      <fieldset className={styles.fieldsetModificacoes}>
        <legend className={styles.legendModificacoes}>🎯 Parâmetro — Caçadora (1 Espécie)</legend>
        <div className={styles.campoGrupo}>
          <label htmlFor="select-param-especie1" className={styles.labelCampo}>
            Espécie Alvo (+5 de dano contra a espécie escolhida)
          </label>
          <select
            id="select-param-especie1"
            className={styles.selectCampo}
            value={especie1}
            onChange={(e) => atualizar('especie1', e.target.value)}
          >
            {ESPECIES_ALVO_EQUIPAMENTO.map((esp) => (
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
        </div>
      </fieldset>
    );
  }

  if (tipoParam === 'especie_2') {
    return (
      <fieldset className={styles.fieldsetModificacoes}>
        <legend className={styles.legendModificacoes}>🎯 Parâmetros — Dupla Caçadora (2 Espécies Diferentes)</legend>
        <div className={styles.gridDuasColunas}>
          <div className={styles.campoGrupo}>
            <label htmlFor="select-param-dupla-esp1" className={styles.labelCampo}>
              1ª Espécie Alvo
            </label>
            <select
              id="select-param-dupla-esp1"
              className={styles.selectCampo}
              value={especie1}
              onChange={(e) => atualizar('especie1', e.target.value)}
            >
              {ESPECIES_ALVO_EQUIPAMENTO.map((esp) => (
                <option key={esp} value={esp} disabled={esp === especie2}>
                  {esp}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.campoGrupo}>
            <label htmlFor="select-param-dupla-esp2" className={styles.labelCampo}>
              2ª Espécie Alvo
            </label>
            <select
              id="select-param-dupla-esp2"
              className={styles.selectCampo}
              value={especie2}
              onChange={(e) => atualizar('especie2', e.target.value)}
            >
              {ESPECIES_ALVO_EQUIPAMENTO.map((esp) => (
                <option key={esp} value={esp} disabled={esp === especie1}>
                  {esp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
    );
  }

  if (tipoParam === 'dano_1') {
    return (
      <fieldset className={styles.fieldsetModificacoes}>
        <legend className={styles.legendModificacoes}>🛡️ Parâmetro — Resistência (1 Tipo de Dano)</legend>
        <div className={styles.campoGrupo}>
          <label htmlFor="select-param-dano1" className={styles.labelCampo}>
            Tipo de Dano Resistido
          </label>
          <select
            id="select-param-dano1"
            className={styles.selectCampo}
            value={tipoDano1}
            onChange={(e) => atualizar('tipoDano1', e.target.value)}
          >
            {TIPOS_DANO_EQUIPAMENTO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </fieldset>
    );
  }

  if (tipoParam === 'dano_2') {
    return (
      <fieldset className={styles.fieldsetModificacoes}>
        <legend className={styles.legendModificacoes}>🛡️ Parâmetros — Dupla Resistência (2 Tipos de Dano Diferentes)</legend>
        <div className={styles.gridDuasColunas}>
          <div className={styles.campoGrupo}>
            <label htmlFor="select-param-dupla-dano1" className={styles.labelCampo}>
              1º Tipo de Dano Resistido
            </label>
            <select
              id="select-param-dupla-dano1"
              className={styles.selectCampo}
              value={tipoDano1}
              onChange={(e) => atualizar('tipoDano1', e.target.value)}
            >
              {TIPOS_DANO_EQUIPAMENTO.map((t) => (
                <option key={t} value={t} disabled={t === tipoDano2}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.campoGrupo}>
            <label htmlFor="select-param-dupla-dano2" className={styles.labelCampo}>
              2º Tipo de Dano Resistido
            </label>
            <select
              id="select-param-dupla-dano2"
              className={styles.selectCampo}
              value={tipoDano2}
              onChange={(e) => atualizar('tipoDano2', e.target.value)}
            >
              {TIPOS_DANO_EQUIPAMENTO.map((t) => (
                <option key={t} value={t} disabled={t === tipoDano1}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
    );
  }

  return null;
}
