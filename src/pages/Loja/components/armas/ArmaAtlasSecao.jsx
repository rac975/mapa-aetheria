import React from 'react';
import { FaCopy } from 'react-icons/fa';
import { Input, Button } from '../../../../components/ui';
import {
    CATEGORIAS_ARMA,
    ALCANCES_ARMA,
    ATRIBUTOS_PRECISAO,
    PERSONALIZACOES_DISPONIVEIS,
    MAX_VAGAS_PERSONALIZACOES
} from '../../../../domain/fabula/weaponForge';
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
    onCopiarPrimeiraForma
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

            {/* Suporte Completo a Arma Mutável (2ª Forma) */}
            {temMutavel && (
                <div className={styles.mutavelContainer}>
                    <div className={styles.mutavelHeader}>
                        <h4 className={styles.mutavelTitulo}>⚔️ Configuração da 2ª Forma (Arma Mutável)</h4>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleCopiar}
                            title="Copia Categoria, Alcance e Atributos de Precisão da 1ª forma"
                        >
                            <FaCopy /> Copiar da 1ª forma
                        </Button>
                    </div>

                    <Input
                        label="Nome da Segunda Forma"
                        value={nomeSegundaForma}
                        onChange={e => setNomeSegundaForma(e.target.value)}
                        placeholder="Ex: Modo Foice / Modo Tridente"
                        required
                    />

                    <div className={styles.gridTresColunas}>
                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-atlas-cat2" className={styles.labelCampo}>
                                Categoria (2ª Forma)
                            </label>
                            <select
                                id="select-atlas-cat2"
                                className={styles.selectCampo}
                                value={categoriaSegundaForma}
                                onChange={e => setCategoriaSegundaForma && setCategoriaSegundaForma(e.target.value)}
                            >
                                {CATEGORIAS_ARMA.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-atlas-alc2" className={styles.labelCampo}>
                                Alcance (2ª Forma)
                            </label>
                            <select
                                id="select-atlas-alc2"
                                className={styles.selectCampo}
                                value={alcanceSegundaForma}
                                onChange={e => setAlcanceSegundaForma && setAlcanceSegundaForma(e.target.value)}
                            >
                                {ALCANCES_ARMA.map(alc => (
                                    <option key={alc} value={alc}>{alc}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-atlas-prec2" className={styles.labelCampo}>
                                Atributos de Precisão (2ª Forma)
                            </label>
                            <select
                                id="select-atlas-prec2"
                                className={styles.selectCampo}
                                value={precisaoSegundaForma}
                                onChange={e => setPrecisaoSegundaForma && setPrecisaoSegundaForma(e.target.value)}
                            >
                                {ATRIBUTOS_PRECISAO.map(prec => (
                                    <option key={prec} value={prec}>{prec}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
