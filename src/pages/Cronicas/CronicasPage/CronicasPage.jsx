import { useState, useEffect } from 'react';
import { FaPlus, FaScroll } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import CronicaCard from '../CronicasCard/CronicasCard';
import CronicaBusca from '../CronicasBusca/CronicasBusca';
import './CronicasPage.css';

export default function CronicasPage({ isMestre }) {
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

  useEffect(() => {
    buscarCronicas();
  }, []);

  const buscarCronicas = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('cronicas')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      
      const lista = data || [];
      setCronicas(lista);

      // Extrai tags únicas para reuso
      const todasTags = lista
        .map(c => c.tags)
        .filter(Boolean)
        .flatMap(t => t.split(',').map(tag => tag.trim()))
        .filter(t => t.length > 0);
      
      setTagsDisponiveis([...new Set(todasTags)]);
    } catch (error) {
      console.error('Erro ao buscar crônicas:', error.message);
    } finally {
      setCarregando(false);
    }
  };

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
      alert('Erro ao salvar no banco de dados.');
    }
  };

  const excluirCronica = async (id) => {
    if (window.confirm("Deseja realmente apagar esta crônica dos anjos?")) {
      try {
        const { error } = await supabase.from('cronicas').delete().eq('id', id);
        if (error) throw error;
        buscarCronicas();
      } catch (error) {
        console.error('Erro ao excluir:', error.message);
      }
    }
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
    <div className="cronicas-wrapper">
      <header className="cronicas-header">
        <div>
          <h1><FaScroll /> Crônicas de Aetheria</h1>
          <p>Os registros oficiais das campanhas na nuvem de Aetheria.</p>
        </div>
        {isMestre && (
          <button className="btn-nova-cronica" onClick={abrirModalCriacao}>
            <FaPlus /> Nova Crônica
          </button>
        )}
      </header>

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
              onExcluir={excluirCronica}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-content cronica-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalAberto(false)}>&times;</button>
            <h2>{cronicaEditando ? 'Editar Crônica' : 'Escrever Nova Crônica'}</h2>

            <form onSubmit={salvarCronica}>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Sessão (ex: Sessão 01)</label>
                  <input type="text" value={sessao} onChange={e => setSessao(e.target.value)} required placeholder="Sessão 01" />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input type="date" value={data} onChange={e => setData(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Título do Capítulo / Acontecimento</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ex: A Queda da Cidadela" />
              </div>

              <div className="form-group">
                <label>Resumo / Conteúdo da Sessão</label>
                <textarea rows="6" value={conteudo} onChange={e => setConteudo(e.target.value)} required placeholder="Descreva os acontecimentos..." />
              </div>

              <div className="form-group">
                <label>Tags (separadas por vírgula)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="ex: combate, lore, missao" />
                
                {tagsDisponiveis.length > 0 && (
                  <div className="tags-sugestoes">
                    <small>Tags existentes (clique para adicionar):</small>
                    <div className="tags-chips">
                      {tagsDisponiveis.map((tagExistente, idx) => (
                        <button
                          type="button"
                          key={idx}
                          className="tag-chip"
                          onClick={() => {
                            const atuais = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                            if (!atuais.includes(tagExistente)) {
                              setTags([...atuais, tagExistente].join(', '));
                            }
                          }}
                        >
                          +{tagExistente}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-salvar-cronica">Salvar na Nuvem</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}