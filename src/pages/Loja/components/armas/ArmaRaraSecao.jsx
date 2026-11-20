import React from 'react';
import SeletorParametrosCaracteristica from '../comum/SeletorParametrosCaracteristica';
import styles from '../CriadorArmas.module.css';

const TIPOS_DANO_ELEMENTAL = ['Físico', 'Fogo', 'Gelo', 'Raio', 'Ar', 'Luz', 'Trevas', 'Terra', 'Veneno'];
const ATRIBUTOS_UNICOS = ['Destreza', 'Astúcia', 'Vigor', 'Vontade'];

export default function ArmaRaraSecao({
    itensBase = [],
    itemBaseSelecionado,
    onSelectBase,
    tipoDano,
    setTipoDano,
    modMao,
    setModMao,
    bonusPrecisaoArma,
    setBonusPrecisaoArma,
    bonusDanoExtraArma,
    setBonusDanoExtraArma,
    atributoUnico,
    setAtributoUnico,
    atributoEscolhido,
    setAtributoEscolhido,
    caracteristicasDisponiveis = [],
    caracteristicaSelecionada,
    setCaracteristicaSelecionada,
    paramsCaracteristica = {},
    setParamsCaracteristica,
    efeitoCaracteristicaExibicao = '',
    categoriaProibida = false
}) {
    return (
        <>
            <div className={styles.gridDuasColunas}>
                <div className={styles.campoGrupo}>
                    <label htmlFor="select-arma-base" className={styles.labelCampo}>
                        Arma Base Comum
                    </label>
                    <select
                        id="select-arma-base"
                        className={styles.selectCampo}
                        value={itensBase.findIndex(i => i.nome === itemBaseSelecionado?.nome)}
                        onChange={e => onSelectBase(itensBase[e.target.value])}
                    >
                        {itensBase.map((item, idx) => (
                            <option key={item.id || idx} value={idx}>
                                {item.nome} ({item.custo || item.preco || 100}z) - {item.stats?.dano || 'Dano base'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.campoGrupo}>
                    <label htmlFor="select-tipo-dano" className={styles.labelCampo}>
                        Tipo de Dano (+100z se Elemental)
                    </label>
                    <select
                        id="select-tipo-dano"
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
            </div>

            {/* Modificações Exclusivas do Livro Básico */}
            <fieldset className={styles.fieldsetModificacoes}>
                <legend className={styles.legendModificacoes}>Modificações Físicas de Forja</legend>
                <div className={styles.gridDuasColunas}>
                    <div className={styles.campoGrupo}>
                        <label htmlFor="select-mod-mao" className={styles.labelCampo}>
                            Empunhadura (Mãos)
                        </label>
                        <select
                            id="select-mod-mao"
                            className={styles.selectCampo}
                            value={modMao}
                            onChange={e => setModMao(e.target.value)}
                            disabled={categoriaProibida}
                        >
                            <option value="normal">Normal (Sem alteração)</option>
                            <option value="1_para_2" disabled={categoriaProibida}>
                                1 mão ➔ 2 mãos (+4 dano)
                            </option>
                            <option value="2_para_1">
                                2 mãos ➔ 1 mão (-4 dano)
                            </option>
                        </select>
                        {categoriaProibida && (
                            <p className={styles.textoAviso}>
                                * Adagas, armas de luta e arremessáveis não podem ser forjadas para 2 mãos.
                            </p>
                        )}
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

                {/* Atributo Único */}
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
            </fieldset>

            {/* Característica Especial Única */}
            <div className={styles.campoGrupo}>
                <label htmlFor="select-caracteristica-arma" className={styles.labelCampo}>
                    Característica Especial (1 Propriedade Mágica)
                </label>
                <select
                    id="select-caracteristica-arma"
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
        </>
    );
}
