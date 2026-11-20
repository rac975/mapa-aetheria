import { useState, useEffect } from 'react';
import { FaRing, FaCoins, FaHammer, FaShieldAlt } from 'react-icons/fa';
import {
    mesclarCaracteristicasCatalogo,
    resolverCaracteristicaParametrizada
} from '../../../domain/fabula/equipmentRules';
import { lojaService } from '../../../services/lojaService';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Badge, Input, Card } from '../../../components/ui';
import SeletorParametrosCaracteristica from './comum/SeletorParametrosCaracteristica';
import styles from './CriadorItensRaros.module.css';

const TIPOS_ACESSORIO = [
    'Anel',
    'Amuleto',
    'Manto / Capa',
    'Botas',
    'Elmo / Tiara',
    'Broche',
    'Cinto'
];

export default function CriadorAcessorios({ onSalvarItem }) {
    const { showAlert } = useAlert();
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [paramsCaracteristica, setParamsCaracteristica] = useState({
        especie1: 'Fera',
        especie2: 'Monstro',
        tipoDano1: 'Fogo',
        tipoDano2: 'Gelo'
    });
    const [tipoAcessorio, setTipoAcessorio] = useState('Anel');
    const [nomeItem, setNomeItem] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function carregarAcessorios() {
            const catalogo = await lojaService.getCaracteristicasAcessorios();
            setCaracteristicas(mesclarCaracteristicasCatalogo(catalogo || []));
        }
        carregarAcessorios();
    }, []);

    const precoTotal = Math.max(100, (caracteristicaSelecionada?.custo || 0) + 100);
    const caracResolvida = resolverCaracteristicaParametrizada(caracteristicaSelecionada, paramsCaracteristica);
    const { bonusDefesa, bonusDefMagica, bonusIniciativa } = caracResolvida;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return showAlert('Dê um nome para o acessório!');
        if (!caracResolvida.valido) return showAlert(caracResolvida.erroValidacao);

        setSalvando(true);
        const efeitosList = caracResolvida.efeitoFormatado ? [caracResolvida.efeitoFormatado] : [];

        try {
            await onSalvarItem({
                nome: nomeItem,
                tipo: 'acessorio',
                custo: precoTotal,
                stats: {
                    slot: 'acessorio',
                    categoria: tipoAcessorio,
                    raridade: 'raro',
                    custo: precoTotal,
                    defesa: bonusDefesa,
                    defesa_magica: bonusDefMagica,
                    iniciativa: bonusIniciativa,
                    efeitos: efeitosList,
                    ...(caracResolvida.especiesAlvo.length > 0 ? { especies_cacadora: caracResolvida.especiesAlvo } : {}),
                    ...(caracResolvida.resistencias.length > 0 ? { resistencias: caracResolvida.resistencias.map(r => r.toLowerCase()) } : {}),
                    ...(caracResolvida.caracteristicaMeta ? { caracteristica_especial: caracResolvida.caracteristicaMeta } : {})
                }
            });
            setNomeItem('');
            setCaracteristicaSelecionada(null);
        } finally {
            setSalvando(false);
        }
    };

    const nomeExibicao = nomeItem || `${tipoAcessorio} Raro`;

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.oficinaCard}>
                <h3 className={styles.titulo}>
                    <FaRing /> Forja de Acessórios Raros
                </h3>

                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <div className={styles.gridDuasColunas}>
                        <Input
                            label="Nome do Acessório"
                            value={nomeItem}
                            onChange={e => setNomeItem(e.target.value)}
                            placeholder="Ex: Anel do Vento Etéreo"
                            required
                        />

                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-tipo-acessorio" className={styles.labelCampo}>
                                Tipo de Acessório
                            </label>
                            <select
                                id="select-tipo-acessorio"
                                className={styles.selectCampo}
                                value={tipoAcessorio}
                                onChange={e => setTipoAcessorio(e.target.value)}
                            >
                                {TIPOS_ACESSORIO.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.campoGrupo}>
                        <label htmlFor="select-acessorio-caracteristica" className={styles.labelCampo}>
                            Característica Especial / Efeito Mágico
                        </label>
                        <select
                            id="select-acessorio-caracteristica"
                            className={styles.selectCampo}
                            value={caracteristicaSelecionada?.id || 'nenhuma'}
                            onChange={e => {
                                const val = e.target.value;
                                setCaracteristicaSelecionada(val === 'nenhuma' ? null : caracteristicas.find(c => String(c.id) === val));
                            }}
                        >
                            {caracteristicas.map((c, idx) => (
                                <option key={c.id || idx} value={c.id}>
                                    {c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}
                                </option>
                            ))}
                        </select>
                        {caracResolvida.efeitoFormatado && (
                            <p className={styles.efeitoDescricao}>
                                Efeito: {caracResolvida.efeitoFormatado}
                            </p>
                        )}
                    </div>

                    <SeletorParametrosCaracteristica
                        caracteristicaSelecionada={caracteristicaSelecionada}
                        paramsCaracteristica={paramsCaracteristica}
                        onChangeParams={setParamsCaracteristica}
                        styles={styles}
                    />

                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Slot: <span className={styles.resumoDanoValor}>{tipoAcessorio}</span>
                                {bonusDefesa !== 0 && ` | Defesa: ${bonusDefesa > 0 ? `+${bonusDefesa}` : bonusDefesa}`}
                                {bonusDefMagica !== 0 && ` | M.DEF: ${bonusDefMagica > 0 ? `+${bonusDefMagica}` : bonusDefMagica}`}
                                {bonusIniciativa !== 0 && ` | Ini: ${bonusIniciativa > 0 ? `+${bonusIniciativa}` : bonusIniciativa}`}
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {precoTotal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            <Button type="submit" variant="primary" size="md" disabled={salvando}>
                                <FaHammer /> {salvando ? 'Forjando...' : 'Forjar Acessório'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            <section className={styles.previewArea} aria-label="Prévia da Carta de Equipamento">
                <div className={styles.previewTitulo}>
                    <FaShieldAlt /> Prévia da Carta de Equipamento (Pronta para Impressão)
                </div>

                <div className={styles.physicalCard}>
                    <div className={styles.cardHeaderFisica}>
                        <div>
                            <h4 className={styles.cardNomeFisico}>{nomeExibicao}</h4>
                            <span className={styles.cardSubtituloFisico}>
                                ACESSÓRIO • {tipoAcessorio.toUpperCase()}
                            </span>
                        </div>
                        <Badge variant="gold" size="sm"><FaCoins /> {precoTotal}z</Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant="ether" size="sm">Raro</Badge>
                        <Badge variant="default" size="sm">{tipoAcessorio}</Badge>
                        {bonusDefesa !== 0 && (
                            <Badge variant="gold" size="sm">{bonusDefesa > 0 ? `+${bonusDefesa}` : bonusDefesa} DEF</Badge>
                        )}
                        {bonusDefMagica !== 0 && (
                            <Badge variant="info" size="sm">{bonusDefMagica > 0 ? `+${bonusDefMagica}` : bonusDefMagica} M.DEF</Badge>
                        )}
                        {bonusIniciativa !== 0 && (
                            <Badge variant="core" size="sm">
                                {bonusIniciativa > 0 ? `+${bonusIniciativa}` : bonusIniciativa} Ini
                            </Badge>
                        )}
                        {caracResolvida.especiesAlvo.length > 0 && (
                            <Badge variant="crise" size="sm">🎯 Caçadora: {caracResolvida.especiesAlvo.join(' / ')}</Badge>
                        )}
                        {caracResolvida.resistencias.length > 0 && (
                            <Badge variant="ether" size="sm">🛡️ Res: {caracResolvida.resistencias.join(' / ')}</Badge>
                        )}
                    </div>

                    <div className={styles.cardStatsGrid}>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Slot</span>
                            <span className={styles.cardStatValor}>Acessório</span>
                        </div>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Capacidade</span>
                            <span className={styles.cardStatValor}>1 Vaga</span>
                        </div>
                    </div>

                    <div className={styles.cardEfeitosArea}>
                        <strong>Propriedades Mágicas & Efeitos:</strong>
                        <p className={styles.efeitoDescricao}>
                            {caracResolvida.efeitoFormatado || 'Nenhuma propriedade adicional selecionada.'}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
