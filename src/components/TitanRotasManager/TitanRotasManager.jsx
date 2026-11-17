import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';
import { 
  FaPlus, 
  FaTrash, 
  FaWind, 
  FaShip, 
  FaUserSecret, 
  FaCompass, 
  FaScroll, 
  FaExclamationTriangle, 
  FaDiceD20,
  FaExchangeAlt
} from 'react-icons/fa';
import './TitanRotasManager.css';

export default function TitanRotasManager({ titan, isMestre }) {
  const [rotas, setRotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarCriar, setMostrarCriar] = useState(false);
  const [todosTitans, setTodosTitans] = useState([]);

  // Estados do formulário de nova rota
  const [destinoId, setDestinoId] = useState('');
  const [nomeRota, setNomeRota] = useState('');
  const [tipoRota, setTipoRota] = useState('comercial');
  const [dias, setDias] = useState(2);
  const [nivelAmeaca, setNivelAmeaca] = useState('baixo');
  const [descricao, setDescricao] = useState('');

  const { coldDelete } = useToast();

  // Mapeia o Dado e IP base com base na Ameaça escolhida
  const getDadosPorAmeaca = (ameaca) => {
    switch (ameaca) {
      case 'minimo': return { dado: 'd6', ip: 1 };
      case 'baixo': return { dado: 'd8', ip: 1 };
      case 'medio': return { dado: 'd10', ip: 1 };
      case 'alto': return { dado: 'd12', ip: 2 };
      case 'muito_alto': return { dado: 'd20', ip: 2 };
      default: return { dado: 'd8', ip: 1 };
    }
  };

  useEffect(() => {
    if (!titan) return;

    async function fetchDadosBidirecionais() {
      setLoading(true);
      try {
        const { data: rotasData, error: rotasError } = await supabase
          .from('rotas_titas')
          .select(`
            *,
            origem:tita_origem_id(id, titulo),
            destino:tita_destino_id(id, titulo)
          `)
          .or(`tita_origem_id.eq.${titan.id},tita_destino_id.eq.${titan.id}`);

        if (rotasError) throw rotasError;
        setRotas(rotasData || []);

        const { data: titansData, error: titansError } = await supabase
          .from('titans')
          .select('id, titulo');

        if (titansError) throw titansError;
        setTodosTitans(titansData || []);

      } catch (err) {
        console.error("Erro ao buscar rotas bidirecionais:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDadosBidirecionais();
  }, [titan]);

  const handleAddRota = async (e) => {
    e.preventDefault();
    if (!destinoId) return;

    const { dado, ip } = getDadosPorAmeaca(nivelAmeaca);
    const destinoObj = todosTitans.find(t => t.id === Number(destinoId));
    const nomeDestino = destinoObj ? destinoObj.titulo : 'Destino';

    const payload = {
      tita_origem_id: titan.id,
      tita_destino_id: Number(destinoId),
      nome_rota: nomeRota || `Rota ${titan.titulo} ➔ ${nomeDestino}`,
      tipo_rota: tipoRota,
      dias_viagem: Number(dias),
      dado_viagem: dado,
      nivel_ameaca: nivelAmeaca,
      custo_ip_diario: ip,
      descricao: descricao
    };

    try {
      const { data, error } = await supabase
        .from('rotas_titas')
        .insert([payload])
        .select(`
          *,
          origem:tita_origem_id(id, titulo),
          destino:tita_destino_id(id, titulo)
        `);

      if (error) throw error;
      if (data) setRotas(prev => [...prev, data[0]]);

      // Limpar formulário
      setDestinoId('');
      setNomeRota('');
      setDescricao('');
      setMostrarCriar(false);
    } catch (err) {
      console.error("Erro ao criar rota:", err.message);
    }
  };

  // --- LÓGICA DE DELETE FRIO (UNDO) GLOBAL ---
  const iniciarExclusao = (r) => {
    if (!isMestre) return;

    coldDelete({
      item: r,
      message: <>Rota <strong>{r.nome_rota}</strong> foi removida.</>,
      onRemove: (it) => {
        setRotas(prev => prev.filter(item => item.id !== it.id));
      },
      onCommit: async (it) => {
        try {
          const { error } = await supabase.from('rotas_titas').delete().eq('id', it.id);
          if (error) console.error("Erro ao deletar rota permanentemente:", error.message);
        } catch (err) {
          console.error("Erro na requisição de delete:", err);
        }
      },
      onRollback: (it) => {
        setRotas(prev => [...prev, it]);
      },
      duration: 6000
    });
  };

  const getTipoRotaInfo = (tipo) => {
    switch (tipo) {
      case 'comercial': return { label: 'Comercial', icon: <FaShip /> };
      case 'contrabando': return { label: 'Contrabando', icon: <FaUserSecret /> };
      case 'secreta': return { label: 'Secreta', icon: <FaCompass /> };
      case 'tradicional': return { label: 'Tradicional', icon: <FaScroll /> };
      case 'corrompida': return { label: 'Corrompida', icon: <FaExclamationTriangle /> };
      default: return { label: 'Aérea', icon: <FaWind /> };
    }
  };

  return (
    <div className="mural-contratos-section rotas-section">
      <div className="contratos-header-row">
        <h3><FaWind /> Rotas Aéreas Conectadas</h3>
        {isMestre && (
          <button className="btn-add-contrato" onClick={() => setMostrarCriar(!mostrarCriar)}>
            <FaPlus /> {mostrarCriar ? 'Cancelar' : 'Nova Rota'}
          </button>
        )}
      </div>

      {isMestre && mostrarCriar && (
        <form className="form-novo-contrato" onSubmit={handleAddRota}>
          <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required>
            <option value="">Selecione o Titã de Destino...</option>
            {todosTitans
              .filter(t => t.id !== titan.id)
              .map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
          </select>

          <input 
            type="text" 
            placeholder="Nome da Rota (Ex: Atalho dos Ventos)" 
            value={nomeRota} 
            onChange={(e) => setNomeRota(e.target.value)} 
          />

          <div className="rotas-row-inline">
            <select value={tipoRota} onChange={(e) => setTipoRota(e.target.value)} className="rotas-flex-field">
              <option value="comercial">Comercial</option>
              <option value="contrabando">Contrabando</option>
              <option value="secreta">Secreta</option>
              <option value="tradicional">Tradicional</option>
              <option value="corrompida">Corrompida</option>
            </select>

            <select value={nivelAmeaca} onChange={(e) => setNivelAmeaca(e.target.value)} className="rotas-flex-field">
              <option value="minimo">Mínimo (d6)</option>
              <option value="baixo">Baixo (d8)</option>
              <option value="medio">Médio (d10)</option>
              <option value="alto">Alto (d12)</option>
              <option value="muito_alto">Muito Alto (d20)</option>
            </select>
          </div>

          <div className="rotas-row-inline">
            <input 
              type="number" 
              placeholder="Dias de Viagem" 
              value={dias} 
              onChange={(e) => setDias(e.target.value)} 
              min="1" 
              className="rotas-flex-field" 
              required
            />
          </div>

          <textarea 
            placeholder="Detalhes ou perigos da rota..." 
            value={descricao} 
            onChange={(e) => setDescricao(e.target.value)} 
          />

          <button type="submit" className="btn-salvar-contrato">Cadastrar Rota Aérea</button>
        </form>
      )}

      {loading ? (
        <p className="loading-text">Carregando rotas...</p>
      ) : rotas.length === 0 ? (
        <p className="sem-contratos">Nenhuma rota aérea conectada a este Titã.</p>
      ) : (
        <div className="contratos-lista">
          {rotas.map((r) => {
            const tipoInfo = getTipoRotaInfo(r.tipo_rota);
            
            const nomeOrigem = r.origem?.titulo || 'Origem Desconhecida';
            const nomeDestino = r.destino?.titulo || 'Destino Desconhecido';

            return (
              <div key={r.id} className={`contrato-card tipo-${r.tipo_rota} rota-card`}>
                <div className="rota-card-header">
                  <strong className="rota-card-title">{r.nome_rota}</strong>
                  <span className="rota-tipo-badge">
                    {tipoInfo.icon} {tipoInfo.label}
                  </span>
                </div>

                <p className="rota-conexoes">
                  <span>{nomeOrigem}</span> <FaExchangeAlt className="rota-exchange-icon" /> <span>{nomeDestino}</span>
                </p>

                {r.descricao && <p className="rota-descricao">{r.descricao}</p>}

                <div className="rota-footer">
                  <span>⏳ {r.dias_viagem} {r.dias_viagem === 1 ? 'Dia' : 'Dias'}</span>
                  <span><FaDiceD20 /> {r.dado_viagem.toUpperCase()}</span>
                  <span>📦 {r.dias_viagem * r.custo_ip_diario} IP Total</span>

                  {isMestre && (
                    <button 
                      onClick={() => iniciarExclusao(r)} 
                      className="rota-delete-btn"
                      title="Excluir Rota"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}