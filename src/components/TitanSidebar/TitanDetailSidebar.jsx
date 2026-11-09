import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import './TitanDetailSidebar.css';
import { FaTimes, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

export default function TitanDetailSidebar({ titan, isMestre, onClose, onStatusChange }) {
  const [contratos, setContratos] = useState([]);
  const [loadingContratos, setLoadingContratos] = useState(true);

  // Estado para criar um novo contrato
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaRecompensa, setNovaRecompensa] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [mostrarcriar, setMostrarCriar] = useState(false);

  // Estados para edição de contrato
  const [contratoEditandoId, setContratoEditandoId] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editRecompensa, setEditRecompensa] = useState('');
  const [editDescricao, setEditDescricao] = useState('');

  // Busca os contratos do Titã selecionado
  useEffect(() => {
    if (!titan) return;

    async function fetchContratos() {
      setLoadingContratos(true);
      try {
        const { data, error } = await supabase
          .from('contratos')
          .select('*')
          .eq('titan_id', titan.id);

        if (error) throw error;
        setContratos(data || []);
      } catch (err) {
        console.error("Erro ao buscar contratos:", err.message);
      } finally {
        setLoadingContratos(false);
      }
    }

    fetchContratos();
  }, [titan]);

  // Função para alterar o status de um contrato (Mestre)
  const handleStatusContrato = async (id, statusAtual) => {
    const proximosStatus = {
      'disponivel': 'em_andamento',
      'em_andamento': 'concluido',
      'concluido': 'disponivel'
    };
    const novoStatus = proximosStatus[statusAtual] || 'disponivel';

    try {
      const { error } = await supabase
        .from('contratos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      setContratos(prev => prev.map(c => c.id === id ? { ...c, status: novoStatus } : c));
    } catch (err) {
      console.error("Erro ao atualizar contrato:", err.message);
    }
  };

  // Função para criar novo contrato
  const handleAddContrato = async (e) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    try {
      const { data, error } = await supabase
        .from('contratos')
        .insert([{
          titan_id: titan.id,
          titulo: novoTitulo,
          recompensa: novaRecompensa || 'A combinar',
          descricao: novaDescricao,
          status: 'disponivel'
        }])
        .select();

      if (error) throw error;
      if (data) setContratos(prev => [...prev, data[0]]);

      // Limpa formulário
      setNovoTitulo('');
      setNovaRecompensa('');
      setNovaDescricao('');
      setMostrarCriar(false);
    } catch (err) {
      console.error("Erro ao criar contrato:", err.message);
    }
  };

  // Função para deletar contrato
  const handleDeleteContrato = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este contrato?")) return;

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setContratos(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Erro ao deletar contrato:", err.message);
    }
  };

  // Iniciar modo de edição
  const iniciarEdicao = (c) => {
    setContratoEditandoId(c.id);
    setEditTitulo(c.titulo);
    setEditRecompensa(c.recompensa);
    setEditDescricao(c.descricao || '');
  };

  // Salvar contrato editado
  const handleSalvarEdicao = async (e, id) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('contratos')
        .update({
          titulo: editTitulo,
          recompensa: editRecompensa,
          descricao: editDescricao
        })
        .eq('id', id);

      if (error) throw error;

      setContratos(prev => prev.map(c => c.id === id ? {
        ...c,
        titulo: editTitulo,
        recompensa: editRecompensa,
        descricao: editDescricao
      } : c));

      setContratoEditandoId(null);
    } catch (err) {
      console.error("Erro ao salvar edição do contrato:", err.message);
    }
  };

  if (!titan) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pacifico': return { label: '🟢 Pacífico / Ativo', class: 'status-pacifico' };
      case 'perigo': return { label: '🔴 Sob Cerco / Perigo', class: 'status-perigo' };
      case 'corrompido': return { label: '🟣 Corrompido / Mágico', class: 'status-corrompido' };
      case 'caido': return { label: '⚫ Caído / Destruído', class: 'status-caido' };
      default: return { label: '🟢 Pacífico', class: 'status-pacifico' };
    }
  };

  return (
    <aside className="titan-sidebar">
      <div className="titan-sidebar-header">
        <span className="modal-faccao">{titan.faccao}</span>
        <button className="sidebar-close-btn" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="titan-sidebar-content">
        {/* Status Geopolítico */}
        <div className="titan-status-section">
          {isMestre ? (
            <select
              className={`modal-status-select ${getStatusBadge(titan.status).class}`}
              value={titan.status}
              onChange={(e) => onStatusChange(titan.id, e.target.value)}
            >
              <option value="pacifico">🟢 Pacífico / Ativo</option>
              <option value="perigo">🔴 Sob Cerco / Perigo</option>
              <option value="corrompido">🟣 Corrompido / Mágico</option>
              <option value="caido">⚫ Caído / Destruído</option>
            </select>
          ) : (
            <span className={`modal-status-tag ${getStatusBadge(titan.status).class}`}>
              {getStatusBadge(titan.status).label}
            </span>
          )}
        </div>

        <h2>{titan.titulo}</h2>
        <p className="titan-descricao">{titan.descricao}</p>

        <div className="titan-lore-details">
          {titan.industria && <p><strong>Indústria:</strong> {titan.industria}</p>}
          {titan.habitantes && <p><strong>Habitantes:</strong> {titan.habitantes}</p>}
          {titan.sociedade && <p><strong>Sociedade:</strong> {titan.sociedade}</p>}
          {titan.funcao && <p><strong>Função:</strong> {titan.funcao}</p>}
          {titan.seguranca && <p><strong>Segurança:</strong> {titan.seguranca}</p>}
          {titan.cultura && <p><strong>Cultura:</strong> {titan.cultura}</p>}
          {titan.destaque && <p><strong>Destaque:</strong> {titan.destaque}</p>}
        </div>

        <hr className="titan-divider" />

        {/* --- SEÇÃO DO MURAL DE CONTRATOS --- */}
        <div className="mural-contratos-section">
          <div className="contratos-header-row">
            <h3>📜 Mural de Contratos</h3>
            {isMestre && (
              <button className="btn-add-contrato" onClick={() => setMostrarCriar(!mostrarcriar)}>
                <FaPlus /> {mostrarcriar ? 'Cancelar' : 'Novo Contrato'}
              </button>
            )}
          </div>

          {/* Formulário de Novo Contrato */}
          {isMestre && mostrarcriar && (
            <form className="form-novo-contrato" onSubmit={handleAddContrato}>
              <input 
                type="text" 
                placeholder="Título da Missão / Contrato" 
                value={novoTitulo} 
                onChange={(e) => setNovoTitulo(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Recompensa (ex: 500 Zels, 1x Éter)" 
                value={novaRecompensa} 
                onChange={(e) => setNovaRecompensa(e.target.value)} 
              />
              <textarea 
                placeholder="Descrição e objetivos..." 
                value={novaDescricao} 
                onChange={(e) => setNovaDescricao(e.target.value)} 
              />
              <button type="submit" className="btn-salvar-contrato">Publicar no Mural</button>
            </form>
          )}

          {loadingContratos ? (
            <p className="loading-text">Carregando contratos...</p>
          ) : contratos.length === 0 ? (
            <p className="sem-contratos">Nenhum contrato ativo neste Titã.</p>
          ) : (
            <div className="contratos-lista">
              {contratos.map((c) => (
                <details key={c.id} className={`contrato-card status-${c.status}`}>
                  <summary className="contrato-summary">
                    <span className={`contrato-status-dot ${c.status}`} />
                    <span className="contrato-titulo">{c.titulo}</span>
                    <span className="contrato-recompensa">💰 {c.recompensa}</span>
                  </summary>

                  <div className="contrato-body">
                    {contratoEditandoId === c.id ? (
                      /* Formulário de Edição Inline */
                      <form className="form-novo-contrato" onSubmit={(e) => handleSalvarEdicao(e, c.id)}>
                        <input 
                          type="text" 
                          value={editTitulo} 
                          onChange={(e) => setEditTitulo(e.target.value)} 
                          required 
                        />
                        <input 
                          type="text" 
                          value={editRecompensa} 
                          onChange={(e) => setEditRecompensa(e.target.value)} 
                        />
                        <textarea 
                          value={editDescricao} 
                          onChange={(e) => setEditDescricao(e.target.value)} 
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn-salvar-contrato">Salvar</button>
                          <button type="button" className="btn-mudar-status" onClick={() => setContratoEditandoId(null)}>Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      /* Exibição normal do Contrato */
                      <>
                        <p>{c.descricao || 'Nenhuma descrição detalhada fornecida.'}</p>
                        <div className="contrato-footer-info">
                          <span className={`badge-status-text ${c.status}`}>
                            {c.status === 'disponivel' && '🟢 Disponível'}
                            {c.status === 'em_andamento' && '🟡 Em Andamento'}
                            {c.status === 'concluido' && '⚫ Concluído'}
                          </span>

                          {isMestre && (
                            <div className="contrato-acoes-mestre" style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className="btn-mudar-status"
                                onClick={() => handleStatusContrato(c.id, c.status)}
                                title="Avançar Status"
                              >
                                Avançar Status
                              </button>
                              <button 
                                className="btn-mudar-status"
                                onClick={() => iniciarEdicao(c)}
                                title="Editar Contrato"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="btn-mudar-status"
                                style={{ color: '#e74c3c' }}
                                onClick={() => handleDeleteContrato(c.id)}
                                title="Excluir Contrato"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}