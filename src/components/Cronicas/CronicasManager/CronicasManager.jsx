import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import CronicaCard from '../CronicasCard/CronicasCard';
import CronicaBusca from '../CronicasBusca/CronicasBusca';
import CronicasModal from '../CronicasModal/CronicasModal';
import UndoToast from '../../UndoToast/UndoToast';
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

  // Estados de Delete Frio (Undo) usando useRef para evitar perda de referência do timer
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [progressoKey, setProgressoKey] = useState(0);
  const timeoutRef = useRef(null);
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

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
      const { data, error } = await supabase
        .from('cronicas')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      const lista = data || [];
      setCronicas(lista);
      processarTagsUnicas(lista);
    } catch (error) {
      console.error('Erro ao buscar crônicas:', error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarCronicas();

    const channel = supabase
      .channel('realtime_cronicas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cronicas' },
        () => { buscarCronicas(); }
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [buscarCronicas]);

  const abrirModalCriacao = () => {
    setCronicaEditando(null);
    setSessao('');
    setTitulo('');

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    setData(`${ano}-${mes}-${dia}`);
    setConteudo('');
    setTags('');
    setModalAberto(true);
  };

  const abrirModalEdicao = (cronica) => {
    setCronicaEditando(cronica.id);
    setSessao(cronica.sessao || '');
    setTitulo(cronica.titulo || '');
    setData(cronica.data || '');
    setConteudo(cronica.conteudo || '');
    setTags(cronica.tags || '');
    setModalAberto(true);
  };

  const salvarCronica = async (e) => {
    e.preventDefault();
    if (!sessao || !titulo || !conteudo) return;

    try {
      if (cronicaEditando) {
        const { error } = await supabase
          .from('cronicas')
          .update({ sessao, titulo, data, conteudo, tags })
          .eq('id', cronicaEditando);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cronicas')
          .insert([{ sessao, titulo, data, conteudo, tags }]);
        if (error) throw error;
      }

      setModalAberto(false);
      buscarCronicas();
    } catch (error) {
      console.error('Erro ao salvar crônica:', error.message);
      // Correção aqui: acionar o state do alerta em vez de inserir JSX solto
      setAlerta({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar a crônica no banco de dados.'
      });
    }
  };

  // --- LÓGICA DE DELETE FRIO (UNDO) COM useRef ---
  const iniciarExclusao = (c) => {
    if (!isMestre) return;

    // Se já houver um timer pendente de outra exclusão anterior, executa o delete dela imediatamente antes de iniciar a nova
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setCronicas(prev => prev.filter(item => item.id !== c.id));
    setItemParaExcluir(c);
    setMostrarToast(true);
    setProgressoKey(prev => prev + 1);

    timeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('cronicas').delete().eq('id', c.id);
        if (error) throw error;
      } catch (error) {
        console.error('Erro ao excluir crônica permanentemente:', error.message);
      }
      setMostrarToast(false);
      setItemParaExcluir(null);
      timeoutRef.current = null;
    }, 6000);
  };

  const desfazerExclusao = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (itemParaExcluir) {
      setCronicas(prev => [itemParaExcluir, ...prev]);
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
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

      <UndoToast
        mostrar={mostrarToast}
        mensagem={<>Crônica <strong>{itemParaExcluir?.titulo}</strong> foi removida.</>}
        progressoKey={progressoKey}
        onUndo={desfazerExclusao}
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