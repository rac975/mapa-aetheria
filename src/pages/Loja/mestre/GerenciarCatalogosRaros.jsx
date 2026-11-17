import { FaTools, FaTrash, FaCoins } from 'react-icons/fa';
import { lojaService } from '../../../services/lojaService';
import { useToast } from '../../../contexts/ToastContext';
import { useAlert } from '../../../contexts/useAlert';
import { useBuscaItens } from '../hooks/useBuscaItens';
import BarraBuscaFiltros from '../components/comum/BarraBuscaFiltros';
import { Button, Badge } from '../../../components/ui';
import styles from './GerenciarCatalogosRaros.module.css';

export default function GerenciarCatalogoRaros({ itensCatalogo, recarregarDados }) {
  const { coldDelete } = useToast();
  const { showAlert } = useAlert();

  const itensRarosBase = itensCatalogo.filter(
    (item) => item.stats?.raridade === 'raro' || (item.tipo === 'arma' && item.stats?.dano)
  );

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
          showAlert('Erro ao excluir item: ' + error.message);
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

      <div className={styles.gridItens}>
        {itensFiltrados.length === 0 ? (
          <div className={styles.catalogoVazio}>Nenhum item raro ou customizado encontrado.</div>
        ) : (
          itensFiltrados.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemInfo}>
                <div className={styles.itemHeader}>
                  <h4 className={styles.itemNome}>{item.nome}</h4>
                  <Badge variant="gold" size="sm">
                    <FaCoins size={10} /> {item.custo} Z
                  </Badge>
                </div>
                <div className={styles.itemTags}>
                  <Badge variant="default" size="sm">{item.tipo}</Badge>
                  {item.stats?.categoria && (
                    <Badge variant="ether" size="sm">{item.stats.categoria}</Badge>
                  )}
                </div>
                <p className={styles.itemDescricao}>{item.descricao || 'Sem descrição.'}</p>
              </div>
              <div className={styles.itemAcoes}>
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
