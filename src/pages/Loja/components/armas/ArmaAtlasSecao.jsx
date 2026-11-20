import React from 'react';
import {
    CATEGORIAS_ARMA,
    ALCANCES_ARMA,
    ATRIBUTOS_PRECISAO,
    PERSONALIZACOES_DISPONIVEIS,
    MAX_VAGAS_PERSONALIZACOES
} from '../../../../domain/fabula/weaponForge';
import ArmaMelhoriasRarasSecao from './ArmaMelhoriasRarasSecao';
import ArmaSegundaFormaSecao from './ArmaSegundaFormaSecao';
import styles from '../CriadorArmas.module.css';

export default function ArmaAtlasSecao({
    raridadePers,
    setRaridadePers,
    categoriaPers,
    setCategoriaPers,
    alcancePers,
    setAlcancePers,
    precisaoPers,
    setPrecisaoPers,
    personalizacoesAtlas = [],
    togglePersAtlas,
    vagasOcupadasAtlas = 0,
    temMutavel = false,
    nomeSegundaForma = '',
    setNomeSegundaForma,
    categoriaSegundaForma = 'espada',
    setCategoriaSegundaForma,
    alcanceSegundaForma = 'Corpo a corpo',
    setAlcanceSegundaForma,
    precisaoSegundaForma = '(DES + AST)',
    setPrecisaoSegundaForma,
    onCopiarPrimeiraForma,
    tipoDano,
    setTipoDano,
    bonusPrecisaoArma,
    setBonusPrecisaoArma,
    bonusDanoExtraArma,
    setBonusDanoExtraArma,
    atributoUnico,
    setAtributoUnico,
    atributoEscolhido,
    setAtributoEscolhido,
    caracteristicasDisponiveis,
    caracteristicaSelecionada,
    setCaracteristicaSelecionada,
    paramsCaracteristica,
    setParamsCaracteristica,
    efeitoCaracteristicaExibicao
}) {
    const handleCopiar = () => {
        if (onCopiarPrimeiraForma) {
            onCopiarPrimeiraForma();
            return;
        }
        if (setCategoriaSegundaForma) setCategoriaSegundaForma(categoriaPers);
        if (setAlcanceSegundaForma) setAlcanceSegundaForma(alcancePers);
        if (setPrecisaoSegundaForma) setPrecisaoSegundaForma(precisaoPers);
    };

    const ehRara = raridadePers !== 'padrao';

    return (
        <>
            <div className={styles.gridQuatroColunas}>
                <div className={styles.campoGrupo}>
                    <label htmlFor="select-atlas-raridade" className={styles.labelCampo}>
                        Raridade da Criação
                    </label>
                    <select
                        id="select-atlas-raridade"
                        className={styles.selectCampo}
                        value={raridadePers}
                        onChange={e => setRaridadePers(e.target.value)}
                    >
                        <option value="padrao">Padrão (300z)</option>
                        <option value="rara">Rara (+200z) - 500z Base</option>
                    </select>
                </div>

                <div className={styles.campoGrupo}>
                    <label htmlFor="select-atlas-categoria" className={styles.labelCampo}>
                        Categoria
                    </label>
                    <select
                        id="select-atlas-categoria"
                        className={styles.selectCampo}
                        value={categoriaPers}
                        onChange={e => setCategoriaPers(e.target.value)}
                    >
                        {CATEGORIAS_ARMA.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.campoGrupo}>
                    <label htmlFor="select-atlas-alcance" className={styles.labelCampo}>
                        Alcance
                    </label>
                    <select
                        id="select-atlas-alcance"
                        className={styles.selectCampo}
                        value={alcancePers}
                        onChange={e => setAlcancePers(e.target.value)}
                    >
                        {ALCANCES_ARMA.map(alc => (
                            <option key={alc} value={alc}>{alc}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.campoGrupo}>
                    <label htmlFor="select-atlas-precisao" className={styles.labelCampo}>
                        Atributos de Precisão
                    </label>
                    <select
                        id="select-atlas-precisao"
                        className={styles.selectCampo}
                        value={precisaoPers}
                        onChange={e => setPrecisaoPers(e.target.value)}
                    >
                        {ATRIBUTOS_PRECISAO.map(prec => (
                            <option key={prec} value={prec}>{prec}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Seleção de Personalizações Oficiais */}
            <fieldset className={styles.fieldsetModificacoes}>
                <legend className={styles.legendModificacoes}>
                    Personalizações do Atlas ({vagasOcupadasAtlas}/{MAX_VAGAS_PERSONALIZACOES} vagas ocupadas)
                </legend>
                <div className={styles.modificacoesLista}>
                    {PERSONALIZACOES_DISPONIVEIS.map(pers => {
                        const selecionado = personalizacoesAtlas.some(p => p.id === pers.id);
                        return (
                            <label key={pers.id} className={styles.checkboxItem}>
                                <input
                                    type="checkbox"
                                    checked={selecionado}
                                    onChange={() => togglePersAtlas(pers)}
                                />
                                <span>
                                    {pers.nome}
                                    {pers.custoExtra > 0 && ` (+${pers.custoExtra}z)`}
                                    {pers.marcial && <strong className={styles.textoDestaqueOuro}> [Marcial]</strong>}
                                    {pers.vagas === 2 && ' (Ocupa 2 vagas)'}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            {/* Aprimoramentos e Características da Arma Rara (Livro Básico no Atlas) */}
            {ehRara && (
                <ArmaMelhoriasRarasSecao
                    tipoDano={tipoDano}
                    setTipoDano={setTipoDano}
                    bonusPrecisaoArma={bonusPrecisaoArma}
                    setBonusPrecisaoArma={setBonusPrecisaoArma}
                    bonusDanoExtraArma={bonusDanoExtraArma}
                    setBonusDanoExtraArma={setBonusDanoExtraArma}
                    atributoUnico={atributoUnico}
                    setAtributoUnico={setAtributoUnico}
                    atributoEscolhido={atributoEscolhido}
                    setAtributoEscolhido={setAtributoEscolhido}
                    caracteristicasDisponiveis={caracteristicasDisponiveis}
                    caracteristicaSelecionada={caracteristicaSelecionada}
                    setCaracteristicaSelecionada={setCaracteristicaSelecionada}
                    paramsCaracteristica={paramsCaracteristica}
                    setParamsCaracteristica={setParamsCaracteristica}
                    efeitoCaracteristicaExibicao={efeitoCaracteristicaExibicao}
                    temMutavel={temMutavel}
                />
            )}

            {/* Suporte Completo a Arma Mutável (2ª Forma) */}
            {temMutavel && (
                <ArmaSegundaFormaSecao
                    nomeSegundaForma={nomeSegundaForma}
                    setNomeSegundaForma={setNomeSegundaForma}
                    categoriaSegundaForma={categoriaSegundaForma}
                    setCategoriaSegundaForma={setCategoriaSegundaForma}
                    alcanceSegundaForma={alcanceSegundaForma}
                    setAlcanceSegundaForma={setAlcanceSegundaForma}
                    precisaoSegundaForma={precisaoSegundaForma}
                    setPrecisaoSegundaForma={setPrecisaoSegundaForma}
                    onCopiar={handleCopiar}
                />
            )}
        </>
    );
}
