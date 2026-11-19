import { useState, useImperativeHandle, forwardRef } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import CronicaCard from '../CronicasCard/CronicasCard';
import CronicaBusca from '../CronicasBusca/CronicasBusca';
import CronicasModal from '../CronicasModal/CronicasModal';
import CustomAlert from '../../CustomAlert/CustomAlert';
import { LoadingScreen } from '../../ui';

const CronicasManager = forwardRef(({
  isMestre = false,
  cronicas = [],
  setCronicas,
  tagsDisponiveis = [],
  carregandoPontual = false,
  onSalvarCronica,
  onExcluirCronica
}, ref) => {
  const [termoBusca, setTermoBusca] = useState('');
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

  useImperativeHandle(ref, () => ({
    abrirModalCriacao
  }));

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

      if (onSalvarCronica) {
        const res = await onSalvarCronica(dados, cronicaEditando?.id);
        if (!res?.success) throw res?.error || new Error('Falha ao salvar crônica');
      }

      setModalAberto(false);
    } catch (error) {
      console.error('[CronicasManager] Erro ao salvar crônica:', error.message);
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
        setCronicas?.((prev) => prev.filter((x) => x.id !== item.id));
      },
      onCommit: async (item) => {
        try {
          if (onExcluirCronica) {
            const res = await onExcluirCronica(item.id);
            if (!res?.success) throw res?.error || new Error('Falha ao excluir crônica');
          }
        } catch (error) {
          console.error('[CronicasManager] Erro ao excluir crônica permanentemente:', error.message);
        }
      },
      onRollback: (item) => {
        setCronicas?.((prev) => [item, ...prev]);
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
        {carregandoPontual && (
          <LoadingScreen
            subblock
            mensagem="Atualizando crônicas..."
            subtitulo="Memória da Campanha"
          />
        )}

        {cronicasFiltradas.length === 0 && !carregandoPontual ? (
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
        sessao={sessao}
        setSessao={setSessao}
        data={data}
        setData={setData}
        titulo={titulo}
        setTitulo={setTitulo}
        conteudo={conteudo}
        setConteudo={setConteudo}
        tags={tags}
        setTags={setTags}
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
