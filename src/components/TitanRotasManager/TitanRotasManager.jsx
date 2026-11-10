import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import UndoToast from '../UndoToast/UndoToast';
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

  // Estados para controle do Delete Frio (Undo)
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [progressoKey, setProgressoKey] = useState(0);

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

  // --- LÓGICA DE DELETE FRIO (UNDO) ---
  const iniciarExclusao = (r) => {
    if (!isMestre) return;
    if (timeoutId) clearTimeout(timeoutId);

    // Remove temporariamente da tela imediatamente
    setRotas(prev => prev.filter(item => item.id !== r.id));
    setItemParaExcluir(r);
    setMostrarToast(true);
    setProgressoKey(prev => prev + 1);

    // Agenda a exclusão definitiva no banco para daqui a 6 segundos
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase.from('rotas_titas').delete().eq('id', r.id);
        if (error) console.error("Erro ao deletar rota permanentemente:", error.message);
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
      setRotas(prev => [...prev, itemParaExcluir]);
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
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
    <div className="mural-contratos-section" style={{ marginTop: '20px' }}>
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={tipoRota} onChange={(e) => setTipoRota(e.target.value)} style={{ flex: 1 }}>
              <option value="comercial">Comercial</option>
              <option value="contrabando">Contrabando</option>
              <option value="secreta">Secreta</option>
              <option value="tradicional">Tradicional</option>
              <option value="corrompida">Corrompida</option>
            </select>

            <select value={nivelAmeaca} onChange={(e) => setNivelAmeaca(e.target.value)} style={{ flex: 1 }}>
              <option value="minimo">Mínimo (d6)</option>
              <option value="baixo">Baixo (d8)</option>
              <option value="medio">Médio (d10)</option>
              <option value="alto">Alto (d12)</option>
              <option value="muito_alto">Muito Alto (d20)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              placeholder="Dias de Viagem" 
              value={dias} 
              onChange={(e) => setDias(e.target.value)} 
              min="1" 
              style={{ flex: 1 }} 
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
              <div key={r.id} className={`contrato-card tipo-${r.tipo_rota}`} style={{ padding: '12px', background: '#161b22', border: '1px solid #332914', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#d4af37', fontSize: '14px' }}>{r.nome_rota}</strong>
                  <span style={{ fontSize: '11px', background: '#0d0f18', padding: '2px 6px', borderRadius: '4px', color: '#5dade2', border: '1px solid #332914' }}>
                    {tipoInfo.icon} {tipoInfo.label}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#9da3af', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{nomeOrigem}</span> <FaExchangeAlt style={{ fontSize: '10px', color: '#d4af37' }} /> <span>{nomeDestino}</span>
                </p>

                {r.descricao && <p style={{ fontSize: '11px', color: '#8b949e', margin: '4px 0' }}>{r.descricao}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #222a38', color: '#f0f0f0' }}>
                  <span>⏳ {r.dias_viagem} {r.dias_viagem === 1 ? 'Dia' : 'Dias'}</span>
                  <span><FaDiceD20 /> {r.dado_viagem.toUpperCase()}</span>
                  <span>📦 {r.dias_viagem * r.custo_ip_diario} IP Total</span>

                  {isMestre && (
                    <button 
                      onClick={() => iniciarExclusao(r)} 
                      style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
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

      {/* Componente Genérico de Delete Frio */}
      <UndoToast
        mostrar={mostrarToast}
        mensagem={<>Rota <strong>{itemParaExcluir?.nome_rota}</strong> foi removida.</>}
        progressoKey={progressoKey}
        onUndo={desfazerExclusao}
      />
    </div>
  );
}