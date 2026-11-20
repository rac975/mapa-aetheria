import React from 'react';
import { FaCoins, FaHammer, FaStar, FaShieldAlt } from 'react-icons/fa';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Badge, Input, Card } from '../../../components/ui';
import { useArmaForja } from '../hooks/useArmaForja';
import ArmaRaraSecao from './armas/ArmaRaraSecao';
import ArmaAtlasSecao from './armas/ArmaAtlasSecao';
import ArmaPreviewCard from './armas/ArmaPreviewCard';
import styles from './CriadorArmas.module.css';

export default function CriadorArmas({ onSalvarItem }) {
    const { showAlert } = useAlert();
    const forja = useArmaForja(onSalvarItem, showAlert);

    const handleSubmit = (e) => {
        e.preventDefault();
        forja.salvarArma();
    };

    const nomeExibicao = forja.nomeItem || (forja.subMetodo === 'padrao_raro'
        ? forja.itemBaseSelecionado?.nome || 'Arma Rara'
        : 'Arma Personalizada');

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.forjaCard}>
                <nav className={styles.subMetodoNav} aria-label="Modo de Criação de Armas">
                    <Button
                        variant={forja.subMetodo === 'padrao_raro' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => forja.setSubMetodo('padrao_raro')}
                    >
                        <FaStar /> Arma Rara (Livro Básico)
                    </Button>
                    <Button
                        variant={forja.subMetodo === 'personalizada_atlas' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => forja.setSubMetodo('personalizada_atlas')}
                    >
                        <FaShieldAlt /> Arma Personalizada (Atlas de Alta Fantasia)
                    </Button>
                </nav>

                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <Input
                        label="Nome da Arma"
                        value={forja.nomeItem}
                        onChange={e => forja.setNomeItem(e.target.value)}
                        placeholder="Ex: Lâmina do Trovão"
                        required
                    />

                    {forja.subMetodo === 'padrao_raro' ? (
                        <ArmaRaraSecao
                            itensBase={forja.itensBaseComuns}
                            itemBaseSelecionado={forja.itemBaseSelecionado}
                            onSelectBase={forja.setItemBaseSelecionado}
                            tipoDano={forja.tipoDano}
                            setTipoDano={forja.setTipoDano}
                            modMao={forja.modMao}
                            setModMao={forja.setModMao}
                            bonusPrecisaoArma={forja.bonusPrecisaoArma}
                            setBonusPrecisaoArma={forja.setBonusPrecisaoArma}
                            bonusDanoExtraArma={forja.bonusDanoExtraArma}
                            setBonusDanoExtraArma={forja.setBonusDanoExtraArma}
                            atributoUnico={forja.atributoUnico}
                            setAtributoUnico={forja.setAtributoUnico}
                            atributoEscolhido={forja.atributoEscolhido}
                            setAtributoEscolhido={forja.setAtributoEscolhido}
                            caracteristicasDisponiveis={forja.caracteristicasDisponiveis}
                            caracteristicaSelecionada={forja.caracteristicaSelecionada}
                            setCaracteristicaSelecionada={forja.setCaracteristicaSelecionada}
                            paramsCaracteristica={forja.paramsCaracteristica}
                            setParamsCaracteristica={forja.setParamsCaracteristica}
                            efeitoCaracteristicaExibicao={forja.caracResolvida?.efeitoFormatado}
                            categoriaProibida={forja.categoriaProibida}
                        />
                    ) : (
                        <ArmaAtlasSecao
                            raridadePers={forja.raridadePers}
                            setRaridadePers={forja.setRaridadePers}
                            categoriaPers={forja.categoriaPers}
                            setCategoriaPers={forja.setCategoriaPers}
                            alcancePers={forja.alcancePers}
                            setAlcancePers={forja.setAlcancePers}
                            precisaoPers={forja.precisaoPers}
                            setPrecisaoPers={forja.setPrecisaoPers}
                            personalizacoesAtlas={forja.personalizacoesAtlas}
                            togglePersAtlas={forja.togglePersAtlas}
                            vagasOcupadasAtlas={forja.vagasOcupadasAtlas}
                            temMutavel={forja.temMutavel}
                            nomeSegundaForma={forja.nomeSegundaForma}
                            setNomeSegundaForma={forja.setNomeSegundaForma}
                            categoriaSegundaForma={forja.categoriaSegundaForma}
                            setCategoriaSegundaForma={forja.setCategoriaSegundaForma}
                            alcanceSegundaForma={forja.alcanceSegundaForma}
                            setAlcanceSegundaForma={forja.setAlcanceSegundaForma}
                            precisaoSegundaForma={forja.precisaoSegundaForma}
                            setPrecisaoSegundaForma={forja.setPrecisaoSegundaForma}
                            onCopiarPrimeiraForma={forja.copiarPrimeiraForma}
                            tipoDano={forja.tipoDano}
                            setTipoDano={forja.setTipoDano}
                            bonusPrecisaoArma={forja.bonusPrecisaoArma}
                            setBonusPrecisaoArma={forja.setBonusPrecisaoArma}
                            bonusDanoExtraArma={forja.bonusDanoExtraArma}
                            setBonusDanoExtraArma={forja.setBonusDanoExtraArma}
                            atributoUnico={forja.atributoUnico}
                            setAtributoUnico={forja.setAtributoUnico}
                            atributoEscolhido={forja.atributoEscolhido}
                            setAtributoEscolhido={forja.setAtributoEscolhido}
                            caracteristicasDisponiveis={forja.caracteristicasDisponiveis}
                            caracteristicaSelecionada={forja.caracteristicaSelecionada}
                            setCaracteristicaSelecionada={forja.setCaracteristicaSelecionada}
                            paramsCaracteristica={forja.paramsCaracteristica}
                            setParamsCaracteristica={forja.setParamsCaracteristica}
                            efeitoCaracteristicaExibicao={forja.caracResolvida?.efeitoFormatado}
                        />
                    )}

                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Dano: <span className={styles.resumoDanoValor}>{forja.danoFinalStr}</span> [{forja.subMetodo === 'padrao_raro' ? forja.tipoDano : forja.statsAtlas.tipo_dano}] | Precisão: <span className={styles.resumoDanoValor}>{forja.precisaoFinalFormatada}</span>
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {forja.precoFinal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            <Button type="submit" variant="primary" size="md" disabled={forja.salvando}>
                                <FaHammer /> {forja.salvando ? 'Forjando...' : 'Forjar Arma'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            <ArmaPreviewCard
                nomeExibicao={nomeExibicao}
                subtitulo={forja.subMetodo === 'padrao_raro'
                    ? `${forja.statsBase.categoria || 'Arma'} • ${forja.strMaosFinal}`
                    : `${forja.categoriaPers.toUpperCase()} • ${forja.alcancePers.toUpperCase()} • DUAS MÃOS`}
                precoTotal={forja.precoFinal}
                raridadeTag={forja.subMetodo === 'padrao_raro'
                    ? 'Raro'
                    : (forja.raridadePers === 'rara' ? 'Raro (Atlas)' : 'Personalizada')}
                ehMarcial={forja.ehMarcialFinal}
                atingeVoadores={forja.subMetodo === 'padrao_raro'
                    ? Boolean(forja.caracteristicaSelecionada?.atinge_voadores || forja.caracteristicaSelecionada?.id === 'atingir_voador')
                    : forja.statsAtlas.atinge_voadores}
                contaComoEscudo={forja.subMetodo === 'personalizada_atlas' && Boolean(forja.statsAtlas.escudo)}
                bonusDefesa={forja.subMetodo === 'padrao_raro'
                    ? (forja.caracResolvida?.bonusDefesa || 0)
                    : (forja.statsAtlas.defesa || 0)}
                bonusDefMagica={forja.subMetodo === 'padrao_raro'
                    ? (forja.caracResolvida?.bonusDefMagica || 0)
                    : (forja.statsAtlas.defesa_magica || 0)}
                bonusIniciativa={forja.subMetodo === 'padrao_raro'
                    ? (forja.caracResolvida?.bonusIniciativa || 0)
                    : (forja.statsAtlas.iniciativa || 0)}
                especiesCacadora={forja.subMetodo === 'padrao_raro'
                    ? (forja.caracResolvida?.especiesAlvo || [])
                    : (forja.statsAtlas.especies_cacadora || [])}
                resistencias={forja.subMetodo === 'padrao_raro'
                    ? (forja.caracResolvida?.resistencias || [])
                    : (forja.statsAtlas.resistencias || [])}
                segundaForma={forja.subMetodo === 'personalizada_atlas' && forja.temMutavel ? forja.statsAtlas.segunda_forma : null}
                precisaoTexto={forja.precisaoFinalFormatada}
                danoTexto={forja.danoFinalStr}
                tipoDano={forja.subMetodo === 'padrao_raro' ? forja.tipoDano : forja.statsAtlas.tipo_dano}
                efeitos={forja.subMetodo === 'padrao_raro'
                    ? (forja.caracResolvida?.efeitoFormatado ? [forja.caracResolvida.efeitoFormatado] : [])
                    : forja.statsAtlas.efeitos}
            />
        </div>
    );
}
