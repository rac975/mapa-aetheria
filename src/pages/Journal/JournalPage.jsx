import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import './JournalPage.css';
import { FaScroll, FaCheckCircle, FaHourglassHalf, FaMapMarkerAlt, FaFilter, FaCoins } from 'react-icons/fa';

export default function JournalPage({ isMestre }) {
  const [contratos, setContratos] = useState([]);
  const [titans, setTitans] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'disponivel', 'em_andamento', 'concluido'
  const [filtroTitan, setFiltroTitan] = useState('todos');

  // Carregar contratos e dados dos Titãs para exibir o nome da região
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Busca contratos
        const { data: contratosData, error: contratosError } = await supabase
          .from('contratos')
          .select('*')
          .order('id', { ascending: true });

        if (contratosError) throw contratosError;

        // Busca titãs para mapear IDs aos nomes das regiões
        const { data: titansData, error: titansError } = await supabase
          .from('titans')
          .select('id, titulo, faccao');

        if (titansError) throw titansError;

        // Transforma o array de titãs em um objeto de lookup { id: { titulo, faccao } }
        const titansMap = {};
        if (titansData) {
          titansData.forEach(t => {
            titansMap[t.id] = t;
          });
        }

        setContratos(contratosData || []);
        setTitans(titansMap);
      } catch (err) {
        console.error("Erro ao carregar dados do Journal:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Mudar status do contrato direto pelo Journal (Mestre)
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

  // Filtragem dos contratos
  const contratosFiltrados = contratos.filter(c => {
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus;
    const matchTitan = filtroTitan === 'todos' || String(c.titan_id) === String(filtroTitan);
    return matchStatus && matchTitan;
  });

  if (loading) {
    return (
      <div className="journal-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#d4af37', height: '100vh' }}>
        Carregando Diário de Missões de Aetheria...
      </div>
    );
  }

  return (
    <div className="journal-wrapper">
      <header className="journal-header">
        <h1><FaScroll /> Diário de Missões</h1>
        <p>Acompanhe todas as missões, contratos e oportunidades espalhadas pelos Titãs de Aetheria.</p>
      </header>

      {/* Barra de Filtros */}
      <div className="journal-filters-bar">
        <div className="filter-group">
          <label><FaFilter /> Filtrar por Status:</label>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="todos">Todos os Status</option>
            <option value="disponivel">🟢 Disponíveis</option>
            <option value="em_andamento">🟡 Em Andamento</option>
            <option value="concluido">⚫ Concluídos</option>
          </select>
        </div>

        <div className="filter-group">
          <label><FaMapMarkerAlt /> Filtrar por Região / Titã:</label>
          <select value={filtroTitan} onChange={(e) => setFiltroTitan(e.target.value)}>
            <option value="todos">Todos os Titãs</option>
            {Object.keys(titans).map(id => (
              <option key={id} value={id}>
                {titans[id].titulo} ({titans[id].faccao})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listagem de Contratos */}
      <div className="journal-content">
        {contratosFiltrados.length === 0 ? (
          <div className="journal-empty">
            <p>Nenhuma missão encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="journal-grid">
            {contratosFiltrados.map((c) => {
              const titanInfo = titans[c.titan_id] || { titulo: 'Região Desconhecida', faccao: '' };

              return (
                <div key={c.id} className={`journal-card status-${c.status}`}>
                  <div className="journal-card-top">
                    <span className={`journal-badge ${c.status}`}>
                      {c.status === 'disponivel' && '🟢 Disponível'}
                      {c.status === 'em_andamento' && '🟡 Em Andamento'}
                      {c.status === 'concluido' && '⚫ Concluído'}
                    </span>
                    <span className="journal-recompensa"><FaCoins /> {c.recompensa || 'A combinar'}</span>
                  </div>

                  <h2>{c.titulo}</h2>
                  
                  <div className="journal-titan-location">
                    <FaMapMarkerAlt /> <strong>Local:</strong> {titanInfo.titulo} <span className="faccao-tag">({titanInfo.faccao})</span>
                  </div>

                  <p className="journal-descricao">{c.descricao || 'Nenhuma descrição detalhada fornecida para esta missão.'}</p>

                  {isMestre && (
                    <div className="journal-card-footer">
                      <button 
                        className="btn-journal-action"
                        onClick={() => handleStatusContrato(c.id, c.status)}
                      >
                        Avançar Status
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}