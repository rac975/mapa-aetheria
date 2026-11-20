import { useState, useEffect } from 'react';
import { FaShieldAlt, FaCoins, FaHammer } from 'react-icons/fa';
import {
    isEscudo,
    ESCUDOS_BASE_COMUNS,
    mesclarCaracteristicasCatalogo,
    resolverCaracteristicaParametrizada,
    aplicarBonusDefensivoEquipamento
} from '../../../domain/fabula/equipmentRules';
import { lojaService } from '../../../services/lojaService';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Badge, Input, Card } from '../../../components/ui';
import SeletorParametrosCaracteristica from './comum/SeletorParametrosCaracteristica';
import styles from './CriadorItensRaros.module.css';

export default function CriadorArmadurasEscudos({ onSalvarItem }) {
    const { showAlert } = useAlert();
    const [itensBase, setItensBase] = useState([]);
    const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [paramsCaracteristica, setParamsCaracteristica] = useState({
        especie1: 'Fera', especie2: 'Monstro', tipoDano1: 'Fogo', tipoDano2: 'Gelo'
    });
    const [nomeItem, setNomeItem] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function carregarDados() {
            const basesBanco = await lojaService.getBasesArmadurasEEscudos();
            const nomesExistentes = new Set((basesBanco || []).map(b => (b.nome || '').trim().toLowerCase()));
            const escudosNaoCadastrados = ESCUDOS_BASE_COMUNS.filter(esc => !nomesExistentes.has(esc.nome.trim().toLowerCase()));
            const listaCompleta = [...(basesBanco || []), ...escudosNaoCadastrados];
            setItensBase(listaCompleta);
            if (listaCompleta.length > 0) setItemBaseSelecionado(listaCompleta[0]);

            const catalogo = await lojaService.getCaracteristicasArmadurasEEscudos();
            const filtrados = (catalogo || []).filter(i => i.tipo_item?.includes('armadura') || i.tipo_item?.includes('escudo'));
            setCaracteristicas(mesclarCaracteristicasCatalogo(filtrados));
        }
        carregarDados();
    }, []);

    const ehEscudoBase = isEscudo(itemBaseSelecionado);
    const statsBase = itemBaseSelecionado?.stats || itemBaseSelecionado?.stats_personalizados || {};
    const caracResolvida = resolverCaracteristicaParametrizada(caracteristicaSelecionada, paramsCaracteristica);

    const defBaseRaw = ehEscudoBase && typeof statsBase.defesa === 'string'
        ? (parseInt(statsBase.defesa.replace(/\+/g, ''), 10) || 0)
        : (statsBase.defesa ?? 0);
    const mdefBaseRaw = ehEscudoBase && typeof (statsBase.defesa_magica || statsBase['defesa magica']) === 'string'
        ? (parseInt(String(statsBase.defesa_magica || statsBase['defesa magica']).replace(/\+/g, ''), 10) || 0)
        : (statsBase.defesa_magica ?? statsBase['defesa magica'] ?? 0);
    const iniBaseRaw = parseInt(String(statsBase.iniciativa || 0), 10) || 0;

    const defesa = aplicarBonusDefensivoEquipamento(defBaseRaw, caracResolvida.bonusDefesa, 'DES');
    const defesaMagica = aplicarBonusDefensivoEquipamento(mdefBaseRaw, caracResolvida.bonusDefMagica, 'AST');
    const iniciativa = iniBaseRaw + caracResolvida.bonusIniciativa;
    const ehMarcial = statsBase.marcial === true || (itemBaseSelecionado?.tipo || '').toLowerCase().includes('marcial');

    const custoBase = itemBaseSelecionado?.custo || itemBaseSelecionado?.preco || 100;
    const precoTotal = custoBase + (caracteristicaSelecionada?.custo || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return showAlert(`Dê um nome para ${ehEscudoBase ? 'o escudo' : 'a armadura'}!`);
        if (!itemBaseSelecionado) return showAlert('Selecione um item base!');
        if (!caracResolvida.valido) return showAlert(caracResolvida.erroValidacao);

        setSalvando(true);
        const efeitosList = caracResolvida.efeitoFormatado ? [caracResolvida.efeitoFormatado] : [];
        const tipoFinal = ehEscudoBase ? 'escudo' : 'armadura';
        const slotFinal = ehEscudoBase ? 'mao_secundaria' : 'armadura';
        const categoriaFinal = ehEscudoBase ? 'Escudo' : (statsBase.categoria || 'Armadura');

        try {
            await onSalvarItem({
                nome: nomeItem,
                tipo: tipoFinal,
                custo: precoTotal,
                stats: {
                    slot: slotFinal,
                    categoria: categoriaFinal,
                    escudo: ehEscudoBase,
                    raridade: 'raro',
                    defesa,
                    defesa_magica: defesaMagica,
                    iniciativa,
                    marcial: ehMarcial,
                    custo: precoTotal,
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

    const nomeExibicao = nomeItem || itemBaseSelecionado?.nome || (ehEscudoBase ? 'Escudo Raro' : 'Armadura Rara');
    const rotuloDefesa = ehEscudoBase && typeof defesa === 'number' && defesa > 0 ? `+${defesa}` : defesa;
    const rotuloDefMagica = ehEscudoBase && typeof defesaMagica === 'number' && defesaMagica > 0 ? `+${defesaMagica}` : defesaMagica;

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.oficinaCard}>
                <h3 className={styles.titulo}>
                    <FaShieldAlt /> Forja de Armaduras e Escudos Raros
                </h3>

                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <Input
                        label={ehEscudoBase ? 'Nome do Escudo' : 'Nome da Armadura'}
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder={ehEscudoBase ? 'Ex: Égide Celestial' : 'Ex: Armadura Aethelgard'}
                        required
                    />

                    <div className={styles.gridDuasColunas}>
                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-armadura-base" className={styles.labelCampo}>Item Base Comum</label>
                            <select id="select-armadura-base" className={styles.selectCampo} onChange={e => setItemBaseSelecionado(itensBase[e.target.value])}>
                                {itensBase.map((i, idx) => (
                                    <option key={i.id || idx} value={idx}>[{isEscudo(i) ? 'Escudo' : 'Armadura'}] {i.nome} ({i.custo || 100}z)</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.campoGrupo}>
                            <label htmlFor="select-armadura-caracteristica" className={styles.labelCampo}>Característica Especial</label>
                            <select
                                id="select-armadura-caracteristica"
                                className={styles.selectCampo}
                                value={caracteristicaSelecionada?.id || 'nenhuma'}
                                onChange={e => {
                                    const val = e.target.value;
                                    setCaracteristicaSelecionada(val === 'nenhuma' ? null : caracteristicas.find(c => String(c.id) === val));
                                }}
                            >
                                {caracteristicas.map((c, idx) => (
                                    <option key={c.id || idx} value={c.id}>{c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {caracResolvida.efeitoFormatado && <p className={styles.efeitoDescricao}>Efeito: {caracResolvida.efeitoFormatado}</p>}

                    <SeletorParametrosCaracteristica
                        caracteristicaSelecionada={caracteristicaSelecionada}
                        paramsCaracteristica={paramsCaracteristica}
                        onChangeParams={setParamsCaracteristica}
                        styles={styles}
                    />

                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Defesa: <span className={styles.resumoDanoValor}>{rotuloDefesa}</span> | Def. Mágica: <span className={styles.resumoDanoValor}>{rotuloDefMagica}</span>
                                {iniciativa !== 0 && ` | Ini: ${iniciativa > 0 ? `+${iniciativa}` : iniciativa}`}
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {precoTotal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            <Button type="submit" variant="primary" size="md" disabled={salvando}>
                                <FaHammer /> {salvando ? 'Forjando...' : ehEscudoBase ? 'Forjar Escudo' : 'Forjar Armadura'}
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
                                {ehEscudoBase ? 'ESCUDO' : 'ARMADURA'} • {ehMarcial ? 'MARCIAL' : 'SIMPLES'}
                            </span>
                        </div>
                        <Badge variant="gold" size="sm"><FaCoins /> {precoTotal}z</Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant="ether" size="sm">Raro</Badge>
                        <Badge variant={ehMarcial ? 'crise' : 'default'} size="sm">
                            {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                        </Badge>
                        {ehEscudoBase && <Badge variant="info" size="sm">🛡️ Mão Secundária</Badge>}
                        {iniciativa !== 0 && (
                            <Badge variant="core" size="sm">
                                {iniciativa > 0 ? `+${iniciativa}` : iniciativa} Iniciativa
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
                            <span className={styles.cardStatLabel}>Defesa</span>
                            <span className={styles.cardStatValor}>{rotuloDefesa}</span>
                        </div>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Def. Mágica</span>
                            <span className={styles.cardStatValor}>{rotuloDefMagica}</span>
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
