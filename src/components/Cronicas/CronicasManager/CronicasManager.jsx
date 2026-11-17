import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { cronicaService } from '../../../services/cronicaService';
import { useToast } from '../../../contexts/ToastContext';
import CronicaCard from '../CronicasCard/CronicasCard';
import CronicaBusca from '../CronicasBusca/CronicasBusca';
import CronicasModal from '../CronicasModal/CronicasModal';
import CustomAlert from '../../CustomAlert/CustomAlert';

const CronicasManager = forwardRef(({ isMestre }, ref) => {
  const [cronicas, setCronicas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [cronicaEditando, setCronicaEditando] = useState(null);

  // Campos do formulário
  const [sessao, setSessao] = useState('');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tags, setTags] = useState('');

  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
  const { coldDelete } = useToast();

  useImperativeHandle(ref, () => ({
    abrirModalCriacao
  }));

  const processarTagsUnicas = (lista) => {
    const todasTags = lista
      .map(c => c.tags)
      .filter(Boolean)
      .flatMap(t => t.split(',').map(tag => tag.trim()))
      .filter(t => t.length > 0);
    setTagsDisponiveis([...new Set(todasTags)]);
  };

  const buscarCronicas = useCallback(async () => {
    try {
      const { data: lista, error } = await cronicaService.getCronicas();

      if (error) throw error;
      const res = lista || [];
      setCronicas(res);
      processarTagsUnicas(res);
    } catch (error) {
      console.error('Erro ao buscar crônicas:', error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarCronicas();

    const channel = cronicaService.subscribeCronicas(() => {
      buscarCronicas();
    });

    return () => {
      cronicaService.removeChannel(channel);
    };
  }, [buscarCronicas]);

  const abrirModalCriacao = () => {
    setCronicaEditando(null);
    setSessao('');
    setTitulo('');
    setData(new Date().toISOString().split('T')[0]);
    setConteudo('');
    setTags('');
    setModalAberto(true);
  };

  const abrirModalEdicao = (cronica) => {
    setCronicaEditando(cronica);
    setSessao(cronica.sessao || '');
    setTitulo(cronica.titulo || '');
    setData(cronica.data ? cronica.data.split('T')[0] : '');
    setConteudo(cronica.conteudo || '');
    setTags(cronica.tags || '');
    setModalAberto(true);
  };

  const salvarCronica = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) {
      setAlerta({
        isOpen: true,
        title: 'Campos Obrigatórios',
        message: 'Por favor, preencha o Título e o Conteúdo.'
      });
      return;
    }

    try {
      const dados = {
        sessao: sessao.trim() || null,
        titulo: titulo.trim(),
        data: data || new Date().toISOString(),
        conteudo: conteudo.trim(),
        tags: tags.trim() || null
      };

      if (cronicaEditando) {
        const { error } = await cronicaService.atualizarCronica(cronicaEditando.id, dados);
        if (error) throw error;
      } else {
        const { error } = await cronicaService.criarCronica(dados);
        if (error) throw error;
      }

      setModalAberto(false);
      buscarCronicas();
    } catch (error) {
      console.error('Erro ao salvar crônica:', error.message);
      setAlerta({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar a crônica. Tente novamente.'
      });
    }
  };

  // --- LÓGICA DE DELETE FRIO (UNDO) GLOBAL ---
  const iniciarExclusao = (c) => {
    if (!isMestre) return;

    coldDelete({
      item: c,
      message: (
        <>
          Crônica <strong>{c.titulo}</strong> foi removida.
        </>
      ),
      onRemove: (item) => {
        setCronicas(prev => prev.filter(x => x.id !== item.id));
      },
      onCommit: async (item) => {
        try {
          const { error } = await cronicaService.excluirCronica(item.id);
          if (error) throw error;
        } catch (error) {
          console.error('Erro ao excluir crônica permanentemente:', error.message);
        }
      },
      onRollback: (item) => {
        setCronicas(prev => [item, ...prev]);
      },
      duration: 6000
    });
  };

  const cronicasFiltradas = cronicas.filter((cronica) => {
    const termo = termoBusca.toLowerCase();
    return (
      cronica.titulo?.toLowerCase().includes(termo) ||
      cronica.conteudo?.toLowerCase().includes(termo) ||
      cronica.sessao?.toLowerCase().includes(termo) ||
      cronica.tags?.toLowerCase().includes(termo)
    );
  });

  return (
    <>
      <CronicaBusca termoBusca={termoBusca} setTermoBusca={setTermoBusca} />

      <div className="cronicas-list">
        {carregando ? (
          <p className="sem-cronicas">Carregando crônicas da nuvem...</p>
        ) : cronicasFiltradas.length === 0 ? (
          <p className="sem-cronicas">Nenhuma crônica encontrada.</p>
        ) : (
          cronicasFiltradas.map((cronica) => (
            <CronicaCard
              key={cronica.id}
              cronica={cronica}
              isMestre={isMestre}
              onEditar={abrirModalEdicao}
              onExcluir={iniciarExclusao}
            />
          ))
        )}
      </div>

      <CronicasModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        onSubmit={salvarCronica}
        isEdicao={!!cronicaEditando}
        sessao={sessao} setSessao={setSessao}
        data={data} setData={setData}
        titulo={titulo} setTitulo={setTitulo}
        conteudo={conteudo} setConteudo={setConteudo}
        tags={tags} setTags={setTags}
        tagsDisponiveis={tagsDisponiveis}
      />

      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </>
  );
});

CronicasManager.displayName = 'CronicasManager';
export default CronicasManager;
