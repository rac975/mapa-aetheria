import { useState, useEffect } from 'react';
import {
    FaCoins,
    FaShoppingCart,
    FaShieldAlt,
    FaBoxOpen,
    FaStore,
    FaHandHoldingUsd
} from 'react-icons/fa';
import { lojaService } from '../../../services/lojaService';
import { useToast } from '../../../contexts/ToastContext';
import { useAlert } from '../../../contexts/useAlert';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from './comum/BarraBuscaFiltros';
import { Button, Card, Badge, Modal } from '../../../components/ui';
import styles from './LojaClienteTab.module.css';

export default function LojaClienteTab({ itensCatalogo, ficha, setFicha }) {
    const { coldDelete } = useToast();
    const { showAlert } = useAlert();
    const {
        busca,
        setBusca,
        categoriaFiltro,
        setCategoriaFiltro,
        categoriaArmaFiltro,
        setCategoriaArmaFiltro,
        categoriasArmasDisponiveis,
        ordenacao,
        setOrdenacao,
        apenasRaros,
        setApenasRaros,
        itensFiltrados
    } = useBuscaItens(itensCatalogo);

    const [abaAtiva, setAbaAtiva] = useState('comprar');
    const [itensInventario, setItensInventario] = useState([]);
    const [itemSelecionadoParaCompra, setItemSelecionadoParaCompra] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [destinoCompra, setDestinoCompra] = useState('mochila');
    const [slotEscolhido, setSlotEscolhido] = useState('mao_dominante');
    const [processando, setProcessando] = useState(false);
    const [descontoMercador50, setDescontoMercador50] = useState(false);

    const calcularCustoEfetivoItem = (custoBruto = 0) => {
        const base = Number(custoBruto) || 0;
        return descontoMercador50 ? Math.floor(base / 2) : base;
    };

    useEffect(() => {
        if (!ficha?.id) return;
        async function carregarInventarioPersonagem() {
            const { data, error } = await lojaService.getInventarioPersonagem(ficha.id);
            if (!error && data) {
                setItensInventario(data);
            }
        }
        carregarInventarioPersonagem();
    }, [ficha?.id]);

    const abrirModalCompra = (item) => {
        if (!ficha) {
            showAlert("Selecione uma ficha de personagem ativa na sessão para comprar itens!");
            return;
        }

        const zenitAtual = ficha.zenit || 0;
        const custoEfetivo = calcularCustoEfetivoItem(item.custo);
        if (zenitAtual < custoEfetivo) {
            showAlert(`Você precisa de ${custoEfetivo}z, mas só tem ${zenitAtual}z!`);
            return;
        }

        setItemSelecionadoParaCompra(item);
        setDestinoCompra('mochila');

        const tipoLower = (item.tipo || '').toLowerCase();
        if (tipoLower.includes('arma') && !tipoLower.includes('armadura')) setSlotEscolhido('mao_dominante');
        if (tipoLower.includes('escudo')) setSlotEscolhido('mao_secundaria');

        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setItemSelecionadoParaCompra(null);
    };

    const confirmarCompra = async () => {
        if (!ficha || !ficha.id || !itemSelecionadoParaCompra) return;

        const custo = calcularCustoEfetivoItem(itemSelecionadoParaCompra.custo || 0);
        const zenitAtual = ficha.zenit || 0;

        if (zenitAtual < custo) {
            showAlert("Zênites insuficientes para realizar esta compra!");
            return;
        }

        setProcessando(true);
        const novoZenit = zenitAtual - custo;
        const deveEquipar = destinoCompra === 'equipar';
        const tipoItem = (itemSelecionadoParaCompra.tipo || '').toLowerCase();

        let slotFinal = null;
        if (deveEquipar) {
            if (tipoItem.includes('armadura')) {
                slotFinal = 'armadura';
            } else if (tipoItem.includes('acessorio') || tipoItem.includes('acessório')) {
                slotFinal = 'acessorio';
            } else if (tipoItem.includes('escudo')) {
                slotFinal = 'mao_secundaria';
            } else if (tipoItem.includes('2h') || tipoItem.includes('duas mãos')) {
                slotFinal = 'mao_dominante';
            } else if (tipoItem.includes('arma') && !tipoItem.includes('armadura')) {
                slotFinal = slotEscolhido;
            }
        }

        const statsBase = itemSelecionadoParaCompra.stats || {};
        const statsPersonalizadosComSlot = {
            ...statsBase,
            ...(slotFinal ? { slot: slotFinal, equipado: true } : { equipado: false }),
            custo: custo
        };

        try {
            const { data: novoItemInserido, error: erroCompra } = await lojaService.comprarItemLoja({
                fichaId: ficha.id,
                novoZenit,
                slotFinal,
                itemCatalogo: itemSelecionadoParaCompra,
                deveEquipar,
                statsPersonalizados: statsPersonalizadosComSlot
            });

            if (erroCompra) throw erroCompra;

            setFicha(prev => ({
                ...prev,
                zenit: novoZenit
            }));

            setItensInventario(prev => [...prev, novoItemInserido]);

            showAlert(`✨ Compra realizada com sucesso! "${itemSelecionadoParaCompra.nome}" foi adquirido.`);
            fecharModal();
        } catch (err) {
            showAlert("Erro ao processar compra: " + err.message);
        } finally {
            setProcessando(false);
        }
    };

    const venderItem = async (itemInv) => {
        if (!ficha || !ficha.id) return;

        if (itemInv.stats_personalizados?.slot || itemInv.equipado) {
            showAlert("Você não pode vender um item que está equipado! Desequipe-o primeiro na sua aba de equipamentos.");
            return;
        }

        const custoOriginal =
            itemInv.stats_personalizados?.valor_zenites ||
            itemInv.stats_personalizados?.custo ||
            100;

        const valorVenda =
            custoOriginal ||
            Math.floor((custoOriginal || 100) / 2);
        const zenitAtual = ficha.zenit || 0;
        const novoZenit = zenitAtual + valorVenda;

        coldDelete({
            item: itemInv,
            message: <>Item <strong>{itemInv.nome}</strong> vendido por {valorVenda} zênites.</>,
            onRemove: () => {
                setFicha(prev => ({ ...prev, zenit: novoZenit }));
                setItensInventario(prev => prev.filter(i => i.id !== itemInv.id));
            },
            onCommit: async (it) => {
                try {
                    const { error } = await lojaService.venderItemFicha({
                        fichaId: ficha.id,
                        itemId: it.id,
                        novoZenit
                    });
                    if (error) throw error;
                } catch (err) {
                    console.error("Erro ao efetivar venda:", err);
                }
            },
            onRollback: (it) => {
                setFicha(prev => ({ ...prev, zenit: zenitAtual }));
                setItensInventario(prev => [...prev, it]);
            },
            duration: 6000
        });
    };

    const getRaridadeVariant = (raridade) => {
        switch (raridade?.toLowerCase()) {
            case 'raro': return 'ether';
            case 'epico':
            case 'épico': return 'core';
            case 'lendario':
            case 'lendário': return 'gold';
            default: return 'default';
        }
    };

    return (
        <div className={styles.container}>
            {/* Abas Superiores de Comprar / Vender */}
            <nav className={styles.abasNavegacao} aria-label="Navegação de compra e venda">
                <Button
                    variant={abaAtiva === 'comprar' ? 'primary' : 'ghost'}
                    size="md"
                    className={styles.abaBtn}
                    onClick={() => setAbaAtiva('comprar')}
                >
                    <FaStore /> Comprar na Loja
                </Button>
                <Button
                    variant={abaAtiva === 'vender' ? 'secondary' : 'ghost'}
                    size="md"
                    className={styles.abaBtn}
                    onClick={() => setAbaAtiva('vender')}
                >
                    <FaHandHoldingUsd /> Vender Seus Itens
                </Button>
                <Button
                    variant={descontoMercador50 ? 'core' : 'ghost'}
                    size="sm"
                    onClick={() => setDescontoMercador50((p) => !p)}
                    title="Por um Futuro Melhor (Mercador — Prosperidade 10+): Reduz custos em zênites pela metade"
                >
                    <FaCoins /> {descontoMercador50 ? 'Prosperidade 10+ (-50% Ativo)' : 'Mercador: Prosperidade (-50%)'}
                </Button>
            </nav>

            {abaAtiva === 'comprar' && (
                <>
                    <BarraBuscaFiltros
                        busca={busca}
                        setBusca={setBusca}
                        categoriaFiltro={categoriaFiltro}
                        setCategoriaFiltro={setCategoriaFiltro}
                        categoriaArmaFiltro={categoriaArmaFiltro}
                        setCategoriaArmaFiltro={setCategoriaArmaFiltro}
                        categoriasArmas={categoriasArmasDisponiveis}
                        ordenacao={ordenacao}
                        setOrdenacao={setOrdenacao}
                        apenasRaros={apenasRaros}
                        setApenasRaros={setApenasRaros}
                        mostrarFiltroRaros={true}
                    />

                    <div className={styles.lojaGrid}>
                        {itensFiltrados.map((item) => {
                            const ehMarcial = item.stats?.marcial === true;
                            const raridadeTexto = item.stats?.raridade;
                            const tipoDano = item.stats?.tipo_dano;
                            const vagasQualidade = item.stats?.vagas || item.stats?.vagas_qualidade;

                            return (
                                <Card key={item.id} variant="default" className={styles.itemCard}>
                                    <div className={styles.cardTopo}>
                                        <div className={styles.cardHeader}>
                                            <h4 className={styles.cardTitulo}>{item.nome}</h4>
                                            <Badge variant="gold" size="sm">
                                                <FaCoins /> {calcularCustoEfetivoItem(item.custo)}z
                                            </Badge>
                                        </div>

                                        <div className={styles.tagsRow}>
                                            <Badge variant="default" size="sm">{item.tipo}</Badge>
                                            {item.stats && 'marcial' in item.stats && (
                                                <Badge variant={ehMarcial ? 'crise' : 'default'} size="sm">
                                                    {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                                                </Badge>
                                            )}
                                            {raridadeTexto && (
                                                <Badge variant={getRaridadeVariant(raridadeTexto)} size="sm">
                                                    ⭐ {raridadeTexto}
                                                </Badge>
                                            )}
                                            {tipoDano && (
                                                <Badge variant="core" size="sm">
                                                    {tipoDano}
                                                </Badge>
                                            )}
                                            {vagasQualidade && (
                                                <Badge variant="ether" size="sm">
                                                    {vagasQualidade} Vagas
                                                </Badge>
                                            )}
                                        </div>

                                        <p className={styles.cardDescricao}>
                                            {item.descricao || 'Sem descrição cadastrada.'}
                                        </p>

                                        {item.stats && Object.keys(item.stats).length > 0 && (
                                            <div className={styles.statsBox}>
                                                {Object.entries(item.stats)
                                                    .filter(([chave]) => {
                                                        const chaveLower = chave.toLowerCase();
                                                        if (['slot', 'equipado', 'custo', 'raridade', 'marcial', 'tipo_dano', 'vagas'].includes(chaveLower)) return false;
                                                        if (chaveLower === 'efeitos') {
                                                            const val = item.stats[chave];
                                                            return Array.isArray(val) ? val.length > 0 : Boolean(val);
                                                        }
                                                        const valor = item.stats[chave];
                                                        return valor !== null && valor !== undefined && valor !== '';
                                                    })
                                                    .map(([chave, valor]) => {
                                                        const nomesFormatados = {
                                                            dano: 'Dano',
                                                            maos: 'Mãos',
                                                            alcance: 'Alcance',
                                                            precisao: 'Precisão',
                                                            categoria: 'Categoria',
                                                            defesa: 'Defesa',
                                                            defesa_magica: 'Defesa Mágica',
                                                            'defesa magica': 'Defesa Mágica',
                                                            iniciativa: 'Iniciativa',
                                                            efeitos: 'Efeitos'
                                                        };

                                                        const labelBonita = nomesFormatados[chave.toLowerCase()] || chave.replace('_', ' ');
                                                        const valorExibido = Array.isArray(valor) ? valor.join(', ') : String(valor);
                                                        const ehEfeitoOuLongo = chave.toLowerCase() === 'efeitos' || chave.toLowerCase() === 'efeito' || valorExibido.length > 35;

                                                        return (
                                                            <div key={chave} className={`${styles.statLinha} ${ehEfeitoOuLongo ? styles.statLinhaEfeito : ''}`}>
                                                                <span className={styles.statChave}>{labelBonita}:</span>
                                                                <span className={styles.statValor}>{valorExibido}</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.cardAcoes}>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className={styles.btnAcaoPrincipal}
                                            onClick={() => abrirModalCompra(item)}
                                        >
                                            <FaShoppingCart /> Comprar Item
                                        </Button>
                                        {/* <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.print()}
                                            title="Imprimir Carta de Equipamento"
                                        >
                                            <FaPrint />
                                        </Button> */}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {itensFiltrados.length === 0 && (
                        <div className={styles.lojaVazio}>
                            <p>Nenhum item encontrado com esses filtros ou termos de busca.</p>
                        </div>
                    )}
                </>
            )}

            {abaAtiva === 'vender' && (
                <div>
                    <div className={styles.infoVenda}>
                        <p className={styles.infoVendaTexto}>
                            💡 Você pode vender os itens guardados na sua mochila por <strong>metade do preço original</strong>. Itens equipados devem ser desequipados antes da venda.
                        </p>
                    </div>

                    <div className={styles.lojaGrid}>
                        {itensInventario.map((itemInv) => {
                            const custoOriginal =
                                itemInv.stats_personalizados?.valor_zenites ||
                                itemInv.stats_personalizados?.custo ||
                                100;
                            const valorVenda =
                                custoOriginal ||
                                Math.floor((custoOriginal || 100) / 2);
                            const estaEquipado = Boolean(itemInv.stats_personalizados?.slot || itemInv.equipado);

                            return (
                                <Card
                                    key={itemInv.id}
                                    variant="default"
                                    className={`${styles.itemCard} ${estaEquipado ? styles.itemCardEquipado : ''}`}
                                >
                                    <div className={styles.cardTopo}>
                                        <div className={styles.cardHeader}>
                                            <h4 className={styles.cardTitulo}>{itemInv.nome}</h4>
                                            <Badge variant="gold" size="sm">
                                                <FaCoins /> +{valorVenda}z (Venda)
                                            </Badge>
                                        </div>

                                        <div className={styles.tagsRow}>
                                            <Badge variant="default" size="sm">{itemInv.tipo}</Badge>
                                            {estaEquipado && (
                                                <Badge variant="gold" size="sm">🔒 Equipado</Badge>
                                            )}
                                        </div>

                                        {itemInv.stats_personalizados && Object.keys(itemInv.stats_personalizados).length > 0 && (
                                            <div className={styles.statsBox}>
                                                {Object.entries(itemInv.stats_personalizados)
                                                    .filter(([chave]) => {
                                                        const chaveLower = chave.toLowerCase();
                                                        if (['slot', 'equipado', 'custo'].includes(chaveLower)) return false;
                                                        const valor = itemInv.stats_personalizados[chave];
                                                        return valor !== null && valor !== undefined && valor !== '';
                                                    })
                                                    .map(([chave, valor]) => {
                                                        const valorStr = String(valor);
                                                        const ehEfeitoOuLongo = chave.toLowerCase() === 'efeitos' || chave.toLowerCase() === 'efeito' || valorStr.length > 35;
                                                        return (
                                                            <div key={chave} className={`${styles.statLinha} ${ehEfeitoOuLongo ? styles.statLinhaEfeito : ''}`}>
                                                                <span className={styles.statChave}>{chave.replace('_', ' ')}:</span>
                                                                <span className={styles.statValor}>{valorStr}</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.cardAcoes}>
                                        <Button
                                            variant={estaEquipado ? 'ghost' : 'secondary'}
                                            size="sm"
                                            fullWidth
                                            onClick={() => venderItem(itemInv)}
                                            disabled={estaEquipado}
                                        >
                                            <FaHandHoldingUsd /> {estaEquipado ? 'Desequipe para Vender' : `Vender por ${valorVenda}z`}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {itensInventario.length === 0 && (
                        <div className={styles.lojaVazio}>
                            <p>Sua mochila está vazia. Não há itens para vender.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Confirmação de Compra */}
            {modalAberto && itemSelecionadoParaCompra && (
                <Modal
                    isOpen={modalAberto}
                    onClose={fecharModal}
                    title="Adquirir Equipamento"
                    size="md"
                    footer={
                        <div className={styles.modalFooter}>
                            <Button variant="ghost" size="md" onClick={fecharModal} disabled={processando}>
                                Cancelar
                            </Button>
                            <Button variant="primary" size="md" onClick={confirmarCompra} disabled={processando}>
                                {processando ? 'Processando...' : 'Confirmar Compra'}
                            </Button>
                        </div>
                    }
                >
                    <div className={styles.modalConteudo}>
                        <div className={styles.modalItemResumo}>
                            <span className={styles.modalItemNome}>{itemSelecionadoParaCompra.nome}</span>
                            <Badge variant="gold" size="md">
                                <FaCoins /> {itemSelecionadoParaCompra.custo || 0} zênites
                            </Badge>
                        </div>

                        <div className={styles.modalOpcoesDestino}>
                            <span className={styles.modalLabel}>O que deseja fazer com o item?</span>
                            <div className={styles.modalDestinoBotoes}>
                                <Button
                                    variant={destinoCompra === 'mochila' ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setDestinoCompra('mochila')}
                                >
                                    <FaBoxOpen /> Guardar na Mochila
                                </Button>
                                <Button
                                    variant={destinoCompra === 'equipar' ? 'core' : 'ghost'}
                                    size="sm"
                                    onClick={() => setDestinoCompra('equipar')}
                                >
                                    <FaShieldAlt /> Equipar Imediatamente
                                </Button>
                            </div>
                        </div>

                        {destinoCompra === 'equipar' && (() => {
                            const tipo = (itemSelecionadoParaCompra.tipo || '').toLowerCase();
                            const ehArmaPura = tipo.includes('arma') && !tipo.includes('armadura');
                            const ehDuasMaos = tipo.includes('2h') || tipo.includes('duas mãos');
                            return ehArmaPura && !ehDuasMaos;
                        })() && (
                            <div className={styles.modalSelectGroup}>
                                <label htmlFor="slot-escolhido" className={styles.modalLabel}>
                                    Escolha o slot de mão:
                                </label>
                                <select
                                    id="slot-escolhido"
                                    value={slotEscolhido}
                                    onChange={(e) => setSlotEscolhido(e.target.value)}
                                    className={styles.modalSelect}
                                >
                                    <option value="mao_dominante">Mão Dominante</option>
                                    <option value="mao_secundaria">Mão Não Dominante</option>
                                </select>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
