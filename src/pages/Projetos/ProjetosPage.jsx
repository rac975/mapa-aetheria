import { useState, useMemo } from 'react';
import {
  FaDraftingCompass,
  FaPlus,
  FaPrint,
  FaSearch,
  FaShieldAlt
} from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';
import { useProjetos } from '../../hooks/useProjetos';
import { Button, Badge, Card, Input, LoadingScreen } from '../../components/ui';
import { POTENCIAS_PROJETO, STATUS_PROJETO } from '../../domain/fabula/projetoRules';
import ProjetoCard from './components/ProjetoCard';
import ProjetoFormModal from './components/ProjetoFormModal';
import ProjetoTesteModal from './components/ProjetoTesteModal';
import styles from './ProjetosPage.module.css';

export default function ProjetosPage({ isMestre }) {
  const {
    projetos,
    personagens,
    isLoading,
    isSaving,
    error,
    criarProjeto,
    atualizarProjeto,
    avancarProgresso,
    alternarVisibilidade,
    removerLocal,
    restaurarLocal,
    excluirProjeto
  } = useProjetos(isMestre);

  const { coldDelete } = useToast();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPotencia, setFiltroPotencia] = useState('todas');

  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [projetoEditando, setProjetoEditando] = useState(null);
  const [projetoTeste, setProjetoTeste] = useState(null);

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return projetos.filter((p) => {
      if (!isMestre && !p.visivel) return false;
      const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus;
      const matchPotencia = filtroPotencia === 'todas' || p.potencia === filtroPotencia;
      const matchTexto = !termo ||
        (p.titulo || '').toLowerCase().includes(termo) ||
        (p.responsavel_nome || '').toLowerCase().includes(termo) ||
        (p.descricao || '').toLowerCase().includes(termo);
      return matchStatus && matchPotencia && matchTexto;
    });
  }, [projetos, isMestre, busca, filtroStatus, filtroPotencia]);

  const resumoStats = useMemo(() => {
    const visiveis = isMestre ? projetos : projetos.filter((p) => p.visivel);
    return {
      total: visiveis.length,
      ativos: visiveis.filter((p) => p.status === 'em_andamento').length,
      concluidos: visiveis.filter((p) => p.status === 'concluido').length
    };
  }, [projetos, isMestre]);

  const abrirCriacao = () => { setProjetoEditando(null); setModalFormAberto(true); };
  const abrirEdicao = (projeto) => { setProjetoEditando(projeto); setModalFormAberto(true); };

  const handleSalvarProjeto = async (payload) => {
    const resultado = projetoEditando
      ? await atualizarProjeto(projetoEditando.id, payload)
      : await criarProjeto(payload);

    if (!resultado.error) {
      setModalFormAberto(false);
      setProjetoEditando(null);
    }
  };

  const handleExcluir = (projeto) => {
    if (!isMestre || !projeto?.id) return;
    coldDelete({
      item: projeto,
      message: <>Projeto <strong>{projeto.titulo}</strong> foi removido.</>,
      onRemove: (it) => removerLocal(it.id),
      onCommit: async (it) => {
        await excluirProjeto(it.id);
      },
      onRollback: (it) => restaurarLocal(it),
      duration: 6000
    });
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingScreen
          mensagem="Sincronizando projetos da Oficina e Aventura..."
          subtitulo="Oficina Arcanotécnica"
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            <FaDraftingCompass /> Oficina de Projetos
          </h1>
          <p className={styles.subtitle}>
            Acompanhe invenções, engenhocas e grandes obras segundo as regras oficiais de Fabula Ultima.
          </p>
        </div>

        <div className={`${styles.headerActions} ${styles.noPrint}`}>
          <Badge variant="gold" size="md">Total: {resumoStats.total}</Badge>
          <Badge variant="ether" size="md">Ativos: {resumoStats.ativos}</Badge>
          <Badge variant="core" size="md">Concluídos: {resumoStats.concluidos}</Badge>

          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <FaPrint /> Imprimir A4
          </Button>

          {isMestre && (
            <Button variant="primary" size="sm" onClick={abrirCriacao}>
              <FaPlus /> Novo Projeto
            </Button>
          )}
        </div>
      </header>

      {isMestre && (
        <div className={`${styles.masterBanner} ${styles.noPrint}`}>
          <FaShieldAlt />
          <span>
            <strong>Painel do Mestre ativo:</strong> crie projetos, calcule custos com Visionário, avance relógios e controle a visibilidade dos jogadores.
          </span>
        </div>
      )}

      <Card className={`${styles.filtersCard} ${styles.noPrint}`} ornamented={false}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por projeto, autor ou efeito..."
              className={styles.searchInput}
            />
          </div>

          <select
            className={styles.select}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="todos">Todos os Status</option>
            {Object.values(STATUS_PROJETO).map((s) => (
              <option key={s.key} value={s.key}>{s.nome}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={filtroPotencia}
            onChange={(e) => setFiltroPotencia(e.target.value)}
            aria-label="Filtrar por potência"
          >
            <option value="todas">Todas as Potências</option>
            {Object.values(POTENCIAS_PROJETO).map((p) => (
              <option key={p.key} value={p.key}>{p.nome}</option>
            ))}
          </select>
        </div>
      </Card>

      {error && (
        <Card variant="crise" className={styles.feedbackBox} ornamented={false}>
          <p>{error}</p>
        </Card>
      )}

      {projetosFiltrados.length === 0 ? (
        <Card className={styles.emptyState} ornamented={false}>
          <FaDraftingCompass className={styles.emptyIcon} />
          <p>
            {projetos.length === 0
              ? 'Nenhum projeto registrado na campanha até o momento.'
              : 'Nenhum projeto encontrado com os filtros aplicados.'}
          </p>
          {isMestre && projetos.length === 0 && (
            <Button variant="primary" size="sm" onClick={abrirCriacao}>
              <FaPlus /> Iniciar Primeiro Projeto
            </Button>
          )}
        </Card>
      ) : (
        <div className={styles.grid}>
          {projetosFiltrados.map((projeto) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              isMestre={isMestre}
              onAvancarProgresso={avancarProgresso}
              onAbrirTeste={(p) => setProjetoTeste(p)}
              onEditar={abrirEdicao}
              onAlternarVisibilidade={alternarVisibilidade}
              onExcluir={handleExcluir}
            />
          ))}
        </div>
      )}

      {isMestre && (
        <ProjetoFormModal
          key={projetoEditando?.id || (modalFormAberto ? 'novo' : 'fechado')}
          isOpen={modalFormAberto}
          onClose={() => {
            setModalFormAberto(false);
            setProjetoEditando(null);
          }}
          projetoInicial={projetoEditando}
          personagens={personagens}
          onSalvar={handleSalvarProjeto}
          isSaving={isSaving}
        />
      )}

      <ProjetoTesteModal
        isOpen={Boolean(projetoTeste)}
        onClose={() => setProjetoTeste(null)}
        projeto={projetoTeste}
        isMestre={isMestre}
        onAplicarProgresso={avancarProgresso}
      />

      <div className={styles.bottomSpacer} aria-hidden="true" />
    </div>
  );
}
