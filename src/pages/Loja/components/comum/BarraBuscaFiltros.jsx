import { FaSearch, FaSortAmountDown, FaStar } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './BarraBuscaFiltros.module.css';

const CATEGORIAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'arma', label: 'Armas' },
  { id: 'armadura', label: 'Armaduras' },
  { id: 'escudo', label: 'Escudos' },
  { id: 'acessorio', label: 'Acessórios' },
  { id: 'consumivel', label: 'Consumíveis' }
];

export default function BarraBuscaFiltros({
  busca,
  setBusca,
  categoriaFiltro,
  setCategoriaFiltro,
  categoriaArmaFiltro = 'todas',
  setCategoriaArmaFiltro,
  categoriasArmas = [],
  ordenacao,
  setOrdenacao,
  apenasRaros,
  setApenasRaros,
  mostrarFiltroRaros = false
}) {
  return (
    <div className={styles.container}>
      <div className={styles.linhaBuscaOrdenacao}>
        <div className={styles.buscaWrapper}>
          <FaSearch className={styles.buscaIcone} size={14} />
          <input
            type="text"
            className={styles.buscaInput}
            placeholder="Pesquisar por nome, categoria, bônus ou efeito..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Campo de busca de itens"
          />
        </div>

        <div className={styles.ordenacaoWrapper}>
          <FaSortAmountDown className={styles.ordenacaoIcone} size={14} />
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            className={styles.ordenacaoSelect}
            aria-label="Ordenar itens por"
          >
            <option value="nome_asc" className={styles.ordenacaoOption}>Nome (A - Z)</option>
            <option value="preco_asc" className={styles.ordenacaoOption}>Menor Preço (Zênites)</option>
            <option value="preco_desc" className={styles.ordenacaoOption}>Maior Preço (Zênites)</option>
          </select>
        </div>
      </div>

      <div className={styles.linhaFiltros}>
        <div className={styles.chipsContainer} role="toolbar" aria-label="Filtro por categoria">
          {CATEGORIAS.map((cat) => {
            const ativo = categoriaFiltro === cat.id;
            return (
              <Button
                key={cat.id}
                variant={ativo ? 'secondary' : 'ghost'}
                size="sm"
                className={styles.filtroBtn}
                onClick={() => setCategoriaFiltro(cat.id)}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>

        {mostrarFiltroRaros && (
          <label className={styles.filtroRarosLabel}>
            <input
              type="checkbox"
              checked={apenasRaros}
              onChange={(e) => setApenasRaros(e.target.checked)}
              className={styles.filtroRarosCheckbox}
            />
            <FaStar size={12} /> Apenas Itens Raros
          </label>
        )}
      </div>

      {categoriaFiltro === 'arma' && setCategoriaArmaFiltro && categoriasArmas.length > 0 && (
        <div className={styles.subFiltrosArma} role="toolbar" aria-label="Subcategoria de arma">
          <span className={styles.subFiltroLabel}>Categoria de Arma:</span>
          <Button
            variant={categoriaArmaFiltro === 'todas' ? 'primary' : 'ghost'}
            size="sm"
            className={styles.filtroBtn}
            onClick={() => setCategoriaArmaFiltro('todas')}
          >
            Todas
          </Button>
          {categoriasArmas.map((subCat) => (
            <Button
              key={subCat}
              variant={categoriaArmaFiltro === subCat ? 'primary' : 'ghost'}
              size="sm"
              className={styles.filtroBtn}
              onClick={() => setCategoriaArmaFiltro(subCat)}
            >
              {subCat}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
