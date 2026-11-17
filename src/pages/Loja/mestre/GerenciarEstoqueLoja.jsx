import { useState, useEffect, useCallback } from 'react';
import { FaBoxOpen, FaPlus, FaCoins, FaTrash, FaCheck } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { lojaService } from '../../../services/lojaService';
import { useToast } from '../../../contexts/ToastContext';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from '../components/comum/BarraBuscaFiltros';
import { Button, Badge, Modal, Card } from '../../../components/ui';
import styles from './GerenciarEstoqueLoja.module.css';

export default function GerenciarEstoqueLoja({ lojas, itensCatalogo }) {
    const { coldDelete } = useToast();
    const [lojaSelecionadaEstoqueId, setLojaSelecionadaEstoqueId] = useState(() => {
        return lojas[0]?.id ?? null;
    });

    const [itensDaLojaEstoque, setItensDaLojaEstoque] = useState([]);
    const [modalEstoqueAberto, setModalEstoqueAberto] = useState(false);

    // Hook de busca aplicado para o modal de estoque do Mestre
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
        itensFiltrados: itensFiltradosModal
    } = useBuscaItens(itensCatalogo);

    const carregarEstoqueLoja = useCallback(async (lojaId) => {
        if (!lojaId) {
            setItensDaLojaEstoque([]);
            return;
        }
        const { data } = await supabase
            .from('loja_itens')
            .select('item_id, itens_catalogo(*)')
            .eq('loja_id', lojaId);

        if (data) {
            setItensDaLojaEstoque(data.map(d => d.itens_catalogo).filter(Boolean));
        } else {
            setItensDaLojaEstoque([]);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchEstoque() {
            if (lojaSelecionadaEstoqueId) {
                const { data } = await supabase
                    .from('loja_itens')
                    .select('item_id, itens_catalogo(*)')
                    .eq('loja_id', lojaSelecionadaEstoqueId);

                if (isMounted) {
                    if (data) {
                        setItensDaLojaEstoque(data.map(d => d.itens_catalogo).filter(Boolean));
                    } else {
                        setItensDaLojaEstoque([]);
                    }
                }
            }
        }

        fetchEstoque();

        return () => {
            isMounted = false;
        };
    }, [lojaSelecionadaEstoqueId]);

    const lojaAtivaId = lojaSelecionadaEstoqueId || (lojas.length > 0 ? lojas[0]?.id : null);
    const lojaAtualObj = lojas.find(l => l.id === lojaAtivaId);

    const adicionarItemNaLoja = async (itemId) => {
        if (!lojaAtivaId) return;
        await supabase.from('loja_itens').insert([{ loja_id: lojaAtivaId, item_id: itemId }]);
        carregarEstoqueLoja(lojaAtivaId);
    };

    const removerItemDaLoja = (item) => {
        if (!lojaAtivaId) return;
        coldDelete({
            item,
            message: <>Item <strong>{item.nome}</strong> removido do estoque da loja.</>,
            onRemove: (it) => {
                setItensDaLojaEstoque(prev => prev.filter(i => i.id !== it.id));
            },
            onCommit: async (it) => {
                await lojaService.removerItemLoja(lojaAtivaId, it.id);
                carregarEstoqueLoja(lojaAtivaId);
            },
            onRollback: () => {
                carregarEstoqueLoja(lojaAtivaId);
            },
            duration: 6000
        });
    };

    const adicionarItensEmLote = async (itensIds) => {
        if (!lojaAtivaId || itensIds.length === 0) return;
        const idsExistentes = new Set(itensDaLojaEstoque.map(i => i.id));
        const novosIds = itensIds.filter(id => !idsExistentes.has(id));

        if (novosIds.length === 0) return;

        const payload = novosIds.map(itemId => ({
            loja_id: lojaAtivaId,
            item_id: itemId
        }));

        await supabase.from('loja_itens').insert(payload);
        carregarEstoqueLoja(lojaAtivaId);
    };

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.painelEstoque}>
                <header className={styles.cabecalho}>
                    <div className={styles.tituloArea}>
                        <h3 className={styles.titulo}>
                            <FaBoxOpen /> Estoque da Loja:{' '}
                            <span className={styles.nomeLojaDestaque}>
                                {lojaAtualObj ? lojaAtualObj.nome : 'Selecione uma loja'}
                            </span>
                        </h3>
                        <p className={styles.subtitulo}>
                            Adicione ou remova itens do catálogo global disponíveis neste estabelecimento.
                        </p>
                    </div>

                    <div className={styles.acoesCabecalho}>
                        <select
                            value={lojaAtivaId || ''}
                            onChange={e => setLojaSelecionadaEstoqueId(e.target.value)}
                            className={styles.selectLoja}
                            aria-label="Selecionar Loja para Gerenciar Estoque"
                        >
                            {lojas.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.nome} ({l.cidade || 'Geral'})
                                </option>
                            ))}
                        </select>

                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setModalEstoqueAberto(true)}
                            disabled={!lojaAtivaId}
                        >
                            <FaPlus /> Adicionar ao Estoque
                        </Button>
                    </div>
                </header>

                <div className={styles.gridEstoque}>
                    {itensDaLojaEstoque.map(item => (
                        <div key={item.id} className={styles.itemEstoqueCard}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemNome}>{item.nome}</span>
                                <div className={styles.itemTags}>
                                    <Badge variant="default" size="sm">{item.tipo}</Badge>
                                    <Badge variant="gold" size="sm">
                                        <FaCoins /> {item.custo}z
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removerItemDaLoja(item)}
                                title="Retirar item desta loja"
                            >
                                <FaTrash /> Retirar
                            </Button>
                        </div>
                    ))}
                    {itensDaLojaEstoque.length === 0 && (
                        <div className={styles.estoqueVazio}>
                            Esta loja ainda não possui itens cadastrados no estoque.
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de Catálogo para Estoque */}
            {modalEstoqueAberto && (
                <Modal
                    isOpen={modalEstoqueAberto}
                    onClose={() => setModalEstoqueAberto(false)}
                    title={`Estoque: ${lojaAtualObj?.nome || 'Estabelecimento'}`}
                    size="lg"
                    footer={
                        <div className={styles.modalFooter}>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setModalEstoqueAberto(false)}
                            >
                                Concluir
                            </Button>
                        </div>
                    }
                >
                    <div className={styles.modalHeaderLote}>
                        <Button
                            variant="core"
                            size="sm"
                            onClick={() => adicionarItensEmLote(itensCatalogo.map(i => i.id))}
                        >
                            ✨ Adicionar Todos do Catálogo
                        </Button>
                    </div>

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
                    />

                    <div className={styles.modalListaItens}>
                        {itensFiltradosModal.map(item => {
                            const jaTemNaLoja = itensDaLojaEstoque.some(i => i.id === item.id);
                            return (
                                <div key={item.id} className={styles.modalItemLinha}>
                                    <div className={styles.modalItemTexto}>
                                        <span className={styles.modalItemNome}>{item.nome}</span>
                                        <div className={styles.modalItemDetalhe}>
                                            <Badge variant="default" size="sm">{item.tipo}</Badge>
                                            <Badge variant="gold" size="sm">
                                                <FaCoins /> {item.custo}z
                                            </Badge>
                                        </div>
                                    </div>
                                    {jaTemNaLoja ? (
                                        <Badge variant="core" size="md">
                                            <FaCheck /> No Estoque
                                        </Badge>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => adicionarItemNaLoja(item.id)}
                                        >
                                            <FaPlus /> Adicionar
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {itensFiltradosModal.length === 0 && (
                            <p className={styles.modalVazioTexto}>
                                Nenhum item encontrado no catálogo.
                            </p>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
