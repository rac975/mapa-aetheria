import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaScroll } from 'react-icons/fa';
import './CronicasPage.css';

export default function CronicasPage({ isMestre }) {
  // Carrega do localStorage ou inicia com um exemplo padrão
  const [cronicas, setCronicas] = useState(() => {
    const salvo = localStorage.getItem('aetheria_cronicas');
    return salvo ? JSON.parse(salvo) : [
      {
        id: 1,
        sessao: "Sessão 01",
        titulo: "O Despertar na Névoa",
        data: "10/05/2026",
        conteudo: "Os heróis se conheceram no Titã 3 (Centro de Diplomacia) durante um tenso banquete político. Um atentado iminente forçou o grupo a fugir em direção ao território de Kunlun-Nuvem."
      }
    ];
  });

  const [modalAberto, setModalAberto] = useState(false);
  const [cronicaEditando, setCronicaEditando] = useState(null);
  
  // Campos do formulário
  const [sessao, setSessao] = useState('');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [conteudo, setConteudo] = useState('');

  useEffect(() => {
    localStorage.setItem('aetheria_cronicas', JSON.stringify(cronicas));
  }, [cronicas]);

  const abrirModalCriacao = () => {
    setCronicaEditando(null);
    setSessao('');
    setTitulo('');
    setData('');
    setConteudo('');
    setModalAberto(true);
  };

  const abrirModalEdicao = (cronica) => {
    setCronicaEditando(cronica.id);
    setSessao(cronica.sessao);
    setTitulo(cronica.titulo);
    setData(cronica.data);
    setConteudo(cronica.conteudo);
    setModalAberto(true);
  };

  const salvarCronica = (e) => {
    e.preventDefault();
    if (!sessao || !titulo || !conteudo) return;

    if (cronicaEditando) {
      setCronicas(cronicas.map(c => c.id === cronicaEditando ? { ...c, sessao, titulo, data, conteudo } : c));
    } else {
      const nova = {
        id: Date.now(),
        sessao,
        titulo,
        data: data || new Date().toLocaleDateString(),
        conteudo
      };
      setCronicas([nova, ...cronicas]);
    }

    setModalAberto(false);
  };

  const excluirCronica = (id) => {
    if (window.confirm("Deseja realmente apagar esta crônica dos anjos?")) {
      setCronicas(cronicas.filter(c => c.id !== id));
    }
  };

  return (
    <div className="cronicas-wrapper">
      <header className="cronicas-header">
        <div>
          <h1><FaScroll /> Crônicas de Aetheria</h1>
          <p>Os registros oficiais das campanhas, memórias e segredos desvendados pelos heróis.</p>
        </div>
        {isMestre && (
          <button className="btn-nova-cronica" onClick={abrirModalCriacao}>
            <FaPlus /> Nova Crônica
          </button>
        )}
      </header>

      <div className="cronicas-list">
        {cronicas.length === 0 ? (
          <p className="sem-cronicas">Nenhuma crônica registrada até o momento.</p>
        ) : (
          cronicas.map((cronica) => (
            <div key={cronica.id} className="cronica-card">
              <div className="cronica-card-header">
                <span className="cronica-sessao">{cronica.sessao}</span>
                <span className="cronica-data">{cronica.data}</span>
              </div>
              <h2>{cronica.titulo}</h2>
              <p className="cronica-texto">{cronica.conteudo}</p>

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
                  <input type="text" value={data} onChange={e => setData(e.target.value)} placeholder="DD/MM/AAAA" />
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

              <button type="submit" className="btn-salvar-cronica">Salvar nos Registros</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}