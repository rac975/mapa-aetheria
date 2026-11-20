import React from 'react';
import SeletorParametrosCaracteristica from '../comum/SeletorParametrosCaracteristica';
import {
    TIPOS_DANO_ELEMENTAL,
    ATRIBUTOS_UNICOS
} from '../../../../domain/fabula/weaponForge';
import styles from '../CriadorArmas.module.css';

export default function ArmaMelhoriasRarasSecao({
    tipoDano = 'Físico',
    setTipoDano,
    bonusPrecisaoArma = false,
    setBonusPrecisaoArma,
    bonusDanoExtraArma = false,
    setBonusDanoExtraArma,
    atributoUnico = false,
    setAtributoUnico,
    atributoEscolhido = 'Destreza',
    setAtributoEscolhido,
    caracteristicasDisponiveis = [],
    caracteristicaSelecionada = null,
    setCaracteristicaSelecionada,
    paramsCaracteristica = {},
    setParamsCaracteristica,
    efeitoCaracteristicaExibicao = '',
    temMutavel = false
}) {
    return (
        <fieldset className={styles.fieldsetModificacoes}>
            <legend className={styles.legendModificacoes}>
                ✨ Aprimoramentos de Criação Rara (Livro Básico)
            </legend>

            <div className={styles.gridDuasColunas}>
                <div className={styles.campoGrupo}>
                    <label htmlFor="select-atlas-tipo-dano" className={styles.labelCampo}>
                        Tipo de Dano (+100z se Elemental)
                    </label>
                    <select
                        id="select-atlas-tipo-dano"
                        className={styles.selectCampo}
                        value={tipoDano}
                        onChange={e => setTipoDano(e.target.value)}
                    >
                        {TIPOS_DANO_ELEMENTAL.map(t => (
                            <option key={t} value={t}>
                                {t} {t !== 'Físico' ? '(+100z)' : '(Padrão)'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.modificacoesLista}>
                    <label className={styles.checkboxItem}>
                        <input
                            type="checkbox"
                            checked={bonusPrecisaoArma}
                            onChange={e => setBonusPrecisaoArma(e.target.checked)}
                        />
                        <span>Aumento de Precisão: +1 Precisão (+100z)</span>
                    </label>

                    <label className={styles.checkboxItem}>
                        <input
                            type="checkbox"
                            checked={bonusDanoExtraArma}
                            onChange={e => setBonusDanoExtraArma(e.target.checked)}
                        />
                        <span>Aumento de Dano: +4 Dano (+200z)</span>
                    </label>
                </div>
            </div>

            <div className={styles.gridDuasColunas}>
                <label className={styles.checkboxItem}>
                    <input
                        type="checkbox"
                        checked={atributoUnico}
                        onChange={e => setAtributoUnico(e.target.checked)}
                    />
                    <span>Atributo Único (+50z)</span>
                </label>

                {atributoUnico && (
                    <select
                        className={styles.selectCampo}
                        value={atributoEscolhido}
                        onChange={e => setAtributoEscolhido(e.target.value)}
                        aria-label="Atributo único para rolagem de precisão"
                    >
                        {ATRIBUTOS_UNICOS.map(a => (
                            <option key={a} value={a}>
                                Dobro de {a} ([{a.substring(0, 3).toUpperCase()} + {a.substring(0, 3).toUpperCase()}])
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className={styles.campoGrupo}>
                <label htmlFor="select-atlas-caracteristica-arma" className={styles.labelCampo}>
                    Característica Especial (1 Propriedade Mágica)
                </label>
                <select
                    id="select-atlas-caracteristica-arma"
                    className={styles.selectCampo}
                    value={caracteristicaSelecionada?.id || 'nenhuma'}
                    onChange={e => {
                        const val = e.target.value;
                        const encontrada = caracteristicasDisponiveis.find(c => c.id === val);
                        setCaracteristicaSelecionada(val === 'nenhuma' ? null : encontrada);
                    }}
                >
                    {caracteristicasDisponiveis.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}
                        </option>
                    ))}
                </select>
                {(efeitoCaracteristicaExibicao || caracteristicaSelecionada?.efeito) && (
                    <p className={styles.efeitoDescricao}>
                        Efeito: {efeitoCaracteristicaExibicao || caracteristicaSelecionada?.efeito}
                    </p>
                )}
            </div>

            {setParamsCaracteristica && (
                <SeletorParametrosCaracteristica
                    caracteristicaSelecionada={caracteristicaSelecionada}
                    paramsCaracteristica={paramsCaracteristica}
                    onChangeParams={setParamsCaracteristica}
                    styles={styles}
                />
            )}

            {temMutavel && (
                <p className={styles.textoAviso}>
                    * Regra Oficial do Atlas: Os aprimoramentos raros e a característica especial são refletidos em ambas as formas da arma mutável.
                </p>
            )}
        </fieldset>
    );
}
