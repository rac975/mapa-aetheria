import React from 'react';
import { FaHammer, FaCoins, FaShieldAlt, FaExchangeAlt } from 'react-icons/fa';
import { Badge } from '../../../../components/ui';
import styles from '../CriadorArmas.module.css';

export default function ArmaPreviewCard({
    nomeExibicao,
    subtitulo,
    precoTotal,
    raridadeTag = 'Raro',
    ehMarcial = false,
    atingeVoadores = false,
    contaComoEscudo = false,
    bonusDefesa = 0,
    bonusDefMagica = 0,
    bonusIniciativa = 0,
    especiesCacadora = [],
    resistencias = [],
    segundaForma = null,
    precisaoTexto = '(DES + AST)',
    danoTexto = 'RA + 6',
    tipoDano = 'físico',
    efeitos = []
}) {
    return (
        <section className={styles.previewArea} aria-label="Prévia da Carta de Equipamento">
            <div className={styles.previewTitulo}>
                <FaHammer /> Prévia da Carta de Equipamento (Pronta para Impressão)
            </div>

            <div className={styles.physicalCard}>
                <div className={styles.cardHeaderFisica}>
                    <div>
                        <h4 className={styles.cardNomeFisico}>{nomeExibicao}</h4>
                        <span className={styles.cardSubtituloFisico}>{subtitulo}</span>
                    </div>
                    <Badge variant="gold" size="sm">
                        <FaCoins /> {precoTotal}z
                    </Badge>
                </div>

                <div className={styles.tagsRow}>
                    <Badge variant="ether" size="sm">{raridadeTag}</Badge>
                    <Badge variant={ehMarcial ? 'crise' : 'default'} size="sm">
                        {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                    </Badge>
                    {atingeVoadores && (
                        <Badge variant="info" size="sm">
                            🦅 Atinge Voadores
                        </Badge>
                    )}
                    {contaComoEscudo && (
                        <Badge variant="gold" size="sm">
                            <FaShieldAlt /> +2 DEF (Conta como Escudo)
                        </Badge>
                    )}
                    {!contaComoEscudo && bonusDefesa !== 0 && (
                        <Badge variant="gold" size="sm">
                            {bonusDefesa > 0 ? `+${bonusDefesa}` : bonusDefesa} DEF
                        </Badge>
                    )}
                    {bonusDefMagica !== 0 && (
                        <Badge variant="info" size="sm">
                            {bonusDefMagica > 0 ? `+${bonusDefMagica}` : bonusDefMagica} M.DEF
                        </Badge>
                    )}
                    {bonusIniciativa !== 0 && (
                        <Badge variant="core" size="sm">
                            {bonusIniciativa > 0 ? `+${bonusIniciativa}` : bonusIniciativa} Ini
                        </Badge>
                    )}
                    {especiesCacadora.length > 0 && (
                        <Badge variant="crise" size="sm">
                            🎯 Caçadora: {especiesCacadora.join(' / ')}
                        </Badge>
                    )}
                    {resistencias.length > 0 && (
                        <Badge variant="ether" size="sm">
                            🛡️ Res: {resistencias.join(' / ')}
                        </Badge>
                    )}
                </div>

                <div className={styles.cardStatsGrid}>
                    <div className={styles.cardStatItem}>
                        <span className={styles.cardStatLabel}>Precisão</span>
                        <span className={styles.cardStatValor}>{precisaoTexto}</span>
                    </div>
                    <div className={styles.cardStatItem}>
                        <span className={styles.cardStatLabel}>Dano</span>
                        <span className={styles.cardStatValor}>
                            {danoTexto} [{tipoDano.toUpperCase()}]
                        </span>
                    </div>
                </div>

                {segundaForma && (
                    <div className={styles.segundaFormaCard}>
                        <div className={styles.segundaFormaHeader}>
                            <span><FaExchangeAlt /> 2ª Forma: {segundaForma.nome || 'Alternativa'}</span>
                            <Badge variant={segundaForma.marcial ? 'crise' : 'default'} size="sm">
                                {segundaForma.marcial ? 'Marcial' : 'Simples'}
                            </Badge>
                        </div>
                        <div className={styles.segundaFormaMeta}>
                            {(segundaForma.categoria || '').toUpperCase()} • {segundaForma.alcance} • {segundaForma.precisao || segundaForma.precisao_tipo} • {segundaForma.dano} [{(segundaForma.tipo_dano || tipoDano).toUpperCase()}]
                        </div>
                        {(segundaForma.atinge_voadores || segundaForma.especies_cacadora?.length > 0 || segundaForma.resistencias?.length > 0) && (
                            <div className={styles.tagsRow}>
                                {segundaForma.atinge_voadores && (
                                    <Badge variant="info" size="sm">🦅 Voadores</Badge>
                                )}
                                {segundaForma.especies_cacadora?.length > 0 && (
                                    <Badge variant="crise" size="sm">
                                        🎯 Caçadora: {segundaForma.especies_cacadora.join(' / ')}
                                    </Badge>
                                )}
                                {segundaForma.resistencias?.length > 0 && (
                                    <Badge variant="ether" size="sm">
                                        🛡️ Res: {segundaForma.resistencias.join(' / ')}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.cardEfeitosArea}>
                    <strong>Propriedades Mágicas & Efeitos:</strong>
                    {efeitos && efeitos.length > 0 ? (
                        <ul className={styles.cardEfeitosLista}>
                            {efeitos.map((efeito, i) => (
                                <li key={i}>{efeito}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.efeitoDescricao}>
                            Nenhuma propriedade adicional selecionada.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
