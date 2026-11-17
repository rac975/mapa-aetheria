import { FaTools, FaTrash, FaCoins } from 'react-icons/fa';
import { lojaService } from '../../../services/lojaService';
import { useToast } from '../../../contexts/ToastContext';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from '../components/comum/BarraBuscaFiltros';
import { Button, Badge } from '../../../components/ui';
import styles from './GerenciarCatalogosRaros.module.css';

export default function GerenciarCatalogoRaros({ itensCatalogo, recarregarDados }) {
    const { coldDelete } = useToast();

    // Filtra previamente apenas os itens que são raros ou armas customizadas/forjadas
    const itensRarosBase = itensCatalogo.filter(
        item => item.stats?.raridade === 'raro' || (item.tipo === 'arma' && item.stats?.dano)
    );

    // Aplicação do hook de busca modular
    const {
        busca,
        setBusca,
        categoriaFiltro,
        setCategoriaFiltro,
        ordenacao,
        setOrdenacao,
        itensFiltrados
    } = useBuscaItens(itensRarosBase);

    const deletarItemCatalogo = (item) => {
        coldDelete({
            item,
            message: <>Item <strong>{item.nome}</strong> foi removido do catálogo.</>,
            onCommit: async (it) => {
                const { error } = await lojaService.excluirItemCatalogo(it.id);
                if (error) {
                    console.error('Erro ao excluir item do catálogo:', error);
                    alert('Erro ao excluir item: ' + error.message);
                } else if (recarregarDados) {
                    recarregarDados();
                }
            },
            onRollback: () => {
                if (recarregarDados) recarregarDados();
            },
            duration: 6000
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.cabecalho}>
                <h3 className={styles.titulo}>
                    <FaTools /> Itens Raros e Forjados no Catálogo
                </h3>
                <p className={styles.subtitulo}>
                    Lista de todas as criações personalizadas salvas no mundo. Você pode buscá-las ou removê-las se necessário.
                </p>
            </header>

            <BarraBuscaFiltros
                termoBusca={busca}
                aoMudarBusca={setBusca}
                categoriaAtiva={categoriaFiltro}
                aoMudarCategoria={setCategoriaFiltro}
                ordenacao={ordenacao}
                aoMudarOrdenacao={setOrdenacao}
            />

            <div className={styles.grid}>
                {itensFiltrados.length === 0 ? (
                    <div className={styles.vazio}>Nenhum item raro ou customizado encontrado.</div>
                ) : (
                    itensFiltrados.map(item => (
                        <div key={item.id} className={styles.card}>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardHeader}>
                                    <h4 className={styles.cardTitulo}>{item.nome}</h4>
                                    <Badge variant="gold" size="sm">
                                        <FaCoins size={10} /> {item.custo} Z
                                    </Badge>
                                </div>
                                <p className={styles.cardDescricao}>{item.descricao || 'Sem descrição.'}</p>
                            </div>
                            <div className={styles.cardAcoes}>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => deletarItemCatalogo(item)}
                                >
                                    <FaTrash size={12} /> Excluir
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
