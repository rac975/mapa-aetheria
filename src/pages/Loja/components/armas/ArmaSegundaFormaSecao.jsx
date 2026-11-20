import React from 'react';
import { FaCopy } from 'react-icons/fa';
import { Input, Button } from '../../../../components/ui';
import {
    CATEGORIAS_ARMA,
    ALCANCES_ARMA,
    ATRIBUTOS_PRECISAO
} from '../../../../domain/fabula/weaponForge';
import styles from '../CriadorArmas.module.css';

export default function ArmaSegundaFormaSecao({
    nomeSegundaForma = '',
    setNomeSegundaForma,
    categoriaSegundaForma = 'espada',
    setCategoriaSegundaForma,
    alcanceSegundaForma = 'Corpo a corpo',
    setAlcanceSegundaForma,
    precisaoSegundaForma = '(DES + AST)',
    setPrecisaoSegundaForma,
    onCopiar
}) {
    return (
        <div className={styles.mutavelContainer}>
            <div className={styles.mutavelHeader}>
                <h4 className={styles.mutavelTitulo}>⚔️ Configuração da 2ª Forma (Arma Mutável)</h4>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onCopiar}
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
    );
}
