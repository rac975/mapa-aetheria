import { FaTools, FaTrash, FaCoins } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from '../components/comum/BarraBuscaFiltros';
import { Button, Badge } from '../../../components/ui';
import styles from './GerenciarCatalogosRaros.module.css';

export default function GerenciarCatalogoRaros({ itensCatalogo, recarregarDados }) {
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

    const deletarItemCatalogo = async (item) => {
        if (!confirm(`Deseja realmente excluir "${item.nome}" do catálogo?`)) return;
        
        const { error } = await supabase
            .from('itens_catalogo')
            .delete()
            .eq('id', item.id);

        if (error) {
            alert('Erro ao excluir item: ' + error.message);
        } else {
            if (recarregarDados) recarregarDados();
        }
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

            {/* Barra de Busca e Filtros Modular Integrada */}
            <BarraBuscaFiltros
                busca={busca}
                setBusca={setBusca}
                categoriaFiltro={categoriaFiltro}
                setCategoriaFiltro={setCategoriaFiltro}
                ordenacao={ordenacao}
                setOrdenacao={setOrdenacao}
            />

            <div className={styles.gridItens}>
                {itensFiltrados.map(item => (
                    <div key={item.id} className={styles.itemCard}>
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
                            onClick={() => deletarItemCatalogo(item)}
                            title="Deletar item do catálogo"
                        >
                            <FaTrash size={12} /> Deletar
                        </Button>
                    </div>
                ))}
                {itensFiltrados.length === 0 && (
                    <div className={styles.catalogoVazio}>
                        Nenhum item raro encontrado no catálogo.
                    </div>
                )}
            </div>
        </div>
    );
}
