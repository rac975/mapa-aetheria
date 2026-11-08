import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaScroll } from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import './CronicasPage.css';

export default function CronicasPage({ isMestre }) {
  const [cronicas, setCronicas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [cronicaEditando, setCronicaEditando] = useState(null);
  
  // Campos do formulário
  const [sessao, setSessao] = useState('');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tags, setTags] = useState('');

  // Buscar crônicas do Supabase ao carregar a página
  useEffect(() => {
    buscarCronicas();
  }, []);

  const buscarCronicas = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('cronicas')
        .select('*')
        .order('data', { ascending: false }); // Já ordena pelas mais recentes por causa do tipo 'date'!

      if (error) throw error;
      setCronicas(data || []);
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
    setData(new Date().toISOString().split('T')[0]); // Data atual no formato YYYY-MM-DD
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
        // Atualizar crônica existente
        const { error } = await supabase
          .from('cronicas')
          .update({ sessao, titulo, data, conteudo, tags })
          .eq('id', cronicaEditando);

        if (error) throw error;
      } else {
        // Criar nova crônica
        const { error } = await supabase
          .from('cronicas')
          .insert([{ sessao, titulo, data, conteudo, tags }]);

        if (error) throw error;
      }

      setModalAberto(false);
      buscarCronicas(); // Recarrega a lista do banco
    } catch (error) {
      console.error('Erro ao salvar crônica:', error.message);
      alert('Erro ao salvar no banco de dados.');
    }
  };

  const excluirCronica = async (id) => {
    if (window.confirm("Deseja realmente apagar esta crônica dos anjos?")) {
      try {
        const { error } = await supabase
          .from('cronicas')
          .delete()
          .eq('id', id);

        if (error) throw error;
        buscarCronicas();
      } catch (error) {
        console.error('Erro ao excluir:', error.message);
      }
    }
  };

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

      <div className="cronicas-list">
        {carregando ? (
          <p className="sem-cronicas">Carregando crônicas da nuvem...</p>
        ) : cronicas.length === 0 ? (
          <p className="sem-cronicas">Nenhuma crônica registrada até o momento.</p>
        ) : (
          cronicas.map((cronica) => (
            <div key={cronica.id} className="cronica-card">
              <div className="cronica-card-header">
                <span className="cronica-sessao">{cronica.sessao}</span>
                <span className="cronica-data">{cronica.data ? new Date(cronica.data).toLocaleDateString('pt-BR') : ''}</span>
              </div>
              <h2>{cronica.titulo}</h2>
              <p className="cronica-texto">{cronica.conteudo}</p>
              {cronica.tags && <span className="cronica-tag-badge">#{cronica.tags}</span>}

              {isMestre && (
                <div className="cronica-actions">
                  <button onClick={() => abrirModalEdicao(cronica)} title="Editar Crônica">
                    <FaEdit /> Editar
                  </button>
                  <button className="btn-delete" onClick={() => excluirCronica(cronica.id)} title="Excluir Crônica">
                    <FaTrash /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Criar / Editar Crônica */}
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
                <label>Tag (ex: politica, combate)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="tag principal" />
              </div>

              <button type="submit" className="btn-salvar-cronica">Salvar na Nuvem</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}