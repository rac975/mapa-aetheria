import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import UndoToast from '../UndoToast/UndoToast';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

export default function TitanContratosManager({ titan, isMestre }) {
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

  // Estados para controle do Delete Frio (Undo)
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [progressoKey, setProgressoKey] = useState(0);

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

      setNovoTitulo('');
      setNovaRecompensa('');
      setNovaDescricao('');
      setMostrarCriar(false);
    } catch (err) {
      console.error("Erro ao criar contrato:", err.message);
    }
  };

  // --- LÓGICA DE DELETE FRIO (UNDO) ---
  const iniciarExclusao = (c) => {
    if (!isMestre) return;
    if (timeoutId) clearTimeout(timeoutId);

    // Remove temporariamente da tela imediatamente
    setContratos(prev => prev.filter(item => item.id !== c.id));
    setItemParaExcluir(c);
    setMostrarToast(true);
    setProgressoKey(prev => prev + 1);

    // Agenda a exclusão definitiva no banco para daqui a 6 segundos
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase.from('contratos').delete().eq('id', c.id);
        if (error) console.error("Erro ao deletar contrato permanentemente:", error.message);
      } catch (err) {
        console.error("Erro na requisição de delete:", err);
      }
      setMostrarToast(false);
      setItemParaExcluir(null);
    }, 6000);

    setTimeoutId(timer);
  };

  const desfazerExclusao = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (itemParaExcluir) {
      setContratos(prev => [...prev, itemParaExcluir]);
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
  };

  const iniciarEdicao = (c) => {
    setContratoEditandoId(c.id);
    setEditTitulo(c.titulo);
    setEditRecompensa(c.recompensa);
    setEditDescricao(c.descricao || '');
  };

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

  return (
    <div className="mural-contratos-section">
      <div className="contratos-header-row">
        <h3>📜 Mural de Contratos</h3>
        {isMestre && (
          <button className="btn-add-contrato" onClick={() => setMostrarCriar(!mostrarcriar)}>
            <FaPlus /> {mostrarcriar ? 'Cancelar' : 'Novo Contrato'}
          </button>
        )}
      </div>

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
                            onClick={() => iniciarExclusao(c)}
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

      {/* Componente Genérico de Delete Frio */}
      <UndoToast
        mostrar={mostrarToast}
        mensagem={<>Contrato <strong>{itemParaExcluir?.titulo}</strong> foi removido.</>}
        progressoKey={progressoKey}
        onUndo={desfazerExclusao}
      />
    </div>
  );
}