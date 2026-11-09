import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  FaChevronUp, FaChevronDown, FaTrash, FaShieldAlt, FaSkull, FaPlus, FaMinus, FaExclamationTriangle, FaSkullCrossbones,
  FaSpider,
  FaBolt,
  FaWeightHanging,
  FaHeartBroken,
  FaEyeSlash
} from 'react-icons/fa';
import './InitiativeTracker.css';

export default function InitiativeTracker({ isMestre }) {
  const [participantes, setParticipantes] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState('heroi');
  const [hpMaxInput, setHpMaxInput] = useState(30);
  const [mpMaxInput, setMpMaxInput] = useState(20);
  const [ipInput, setIpInput] = useState(6);
  const [fabulaInput, setFabulaInput] = useState(3);

  // Lista de condições oficiais de Fabula Ultima
  const CONDICOES_DISPONIVEIS = [
    { id: 'envenenado', label: 'Envenenado' },
    { id: 'atordoado', label: 'Atordoado' },
    { id: 'vulneravel', label: 'Vulnerável' },
    { id: 'lento', label: 'Lento' },
    { id: 'fraco', label: 'Fraco' },
    { id: 'dominado', label: 'Dominado' }
  ];

  const getCondicaoIcon = (id) => {
    switch (id) {
      case 'envenenado':
        return <FaSpider />;

      case 'atordoado':
        return <FaBolt />;

      case 'vulneravel':
        return <FaHeartBroken />;

      case 'lento':
        return <FaWeightHanging />;

      case 'fraco':
        return <FaSkull />;

      case 'dominado':
        return <FaEyeSlash />;

      default:
        return <FaExclamationTriangle />;
    }
  };

  useEffect(() => {
    async function fetchIniciativa() {
      const { data, error } = await supabase.from('iniciativa_combate').select('*').order('ordem', { ascending: true });
      if (!error && data) setParticipantes(data);
    }
    fetchIniciativa();

    const channel = supabase
      .channel('realtime_iniciativa')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'iniciativa_combate' },
        () => {
          fetchIniciativa();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleTurno = async (id, statusAtual) => {
    const novoStatus = !statusAtual;
    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, agiu: novoStatus } : p));
    await supabase.from('iniciativa_combate').update({ agiu: novoStatus }).eq('id', id);
  };

  const resetRodada = async () => {
    if (!isMestre) return;
    for (const p of participantes) {
      await supabase.from('iniciativa_combate').update({ agiu: false }).eq('id', p.id);
    }
  };

  const addParticipante = async (e) => {
    e.preventDefault();
    if (!novoNome.trim() || !isMestre) return;

    const novaOrdem = participantes.length > 0 ? participantes[participantes.length - 1].ordem + 1 : 0;
    const novoCombatente = {
      nome: novoNome,
      tipo: novoTipo,
      agiu: false,
      ordem: novaOrdem,
      hp_atual: Number(hpMaxInput),
      hp_max: Number(hpMaxInput),
      mp_atual: Number(mpMaxInput),
      mp_max: Number(mpMaxInput),
      ip: novoTipo === 'heroi' ? Number(ipInput) : 0,
      pontos_fabula: novoTipo === 'heroi' ? Number(fabulaInput) : 0,
      pontos_ultima: novoTipo === 'inimigo' ? 3 : 0,
      condicoes: [] // Array para guardar as condições ativas
    };

    await supabase.from('iniciativa_combate').insert([novoCombatente]);
    setNovoNome('');
  };

  const alterarRecurso = async (id, campo, valorAtual, delta, maximo = null) => {
    if (!isMestre) return;
    let novoValor = valorAtual + delta;
    if (maximo !== null) {
      novoValor = Math.max(0, Math.min(maximo, novoValor));
    } else {
      novoValor = Math.max(0, novoValor);
    }
    await supabase.from('iniciativa_combate').update({ [campo]: novoValor }).eq('id', id);
  };

  const toggleCondicao = async (p, condicaoId) => {
    if (!isMestre) return;
    let atuais = p.condicoes || [];
    if (atuais.includes(condicaoId)) {
      atuais = atuais.filter(c => c !== condicaoId);
    } else {
      atuais = [...atuais, condicaoId];
    }
    await supabase.from('iniciativa_combate').update({ condicoes: atuais }).eq('id', p.id);
  };

  const moverItem = async (index, direcao) => {
    if (!isMestre) return;
    const novaLista = [...participantes];
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= novaLista.length) return;

    const temp = novaLista[index];
    novaLista[index] = novaLista[targetIndex];
    novaLista[targetIndex] = temp;

    for (let idx = 0; idx < novaLista.length; idx++) {
      await supabase.from('iniciativa_combate').update({ ordem: idx }).eq('id', novaLista[idx].id);
    }
  };

  const deletarParticipante = async (id) => {
    if (!isMestre) return;
    await supabase.from('iniciativa_combate').delete().eq('id', id);
  };

  return (
    <div className="combat-box">
      <div className="box-header">
        <h2>Ordem de Ação & Combate</h2>
        {isMestre && <button className="btn-reset" onClick={resetRodada}>Nova Rodada</button>}
      </div>

      <p className="box-hint">
        {isMestre ? "Gerencie turnos, HP, MP, IP, Fábula, Condições e Estados." : "Acompanhe a ordem dos turnos, status e condições na cena."}
      </p>

      <div className="participantes-list">
        {participantes.length === 0 ? (
          <p className="empty-text">Nenhum combatente na cena.</p>
        ) : (
          participantes.map((p, index) => {
            const estaDerrotado = p.hp_atual === 0;
            const emCrise = !estaDerrotado && p.hp_atual <= p.hp_max / 2;
            const danoInimigo = p.hp_max - p.hp_atual;
            const condicoesAtivas = p.condicoes || [];

            return (
              <div
                key={p.id}
                className={`participante-item ${p.tipo} ${p.agiu ? 'turn-completed' : ''} ${estaDerrotado ? 'is-defeated' : ''}`}
                onClick={() => toggleTurno(p.id, p.agiu)}
              >
                <div className="item-main-row">
                  <input type="checkbox" checked={p.agiu} readOnly />
                  <span className="nome">{p.nome}</span>

                  {/* Status de Estado (Derrotado / Crise) */}
                  {estaDerrotado && <span className="badge-derrotado">CAÍDO / DERROTADO</span>}
                  {emCrise && <span className="badge-crise">CRISE</span>}

                  {/* Badges de Condições Ativas visíveis para todos */}
                  {condicoesAtivas.length > 0 && (
                    <div className="condicoes-strip">
                      {condicoesAtivas.map(cId => {
                        const condObj = CONDICOES_DISPONIVEIS.find(item => item.id === cId);

                        return (
                          <span key={cId} className={`condicao-chip cond-${cId}`}>
                            {getCondicaoIcon(cId)}
                            <span>{condObj?.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Informações Públicas do Herói */}
                  {p.tipo === 'heroi' && (
                    <div className="stats-badges-public">
                      <span className="badge-info hp-badge">❤️ {p.hp_atual}/{p.hp_max}</span>
                      <span className="badge-info mp-badge">💧 {p.mp_atual}/{p.mp_max}</span>
                      <span className="badge-info ip-badge">📦 IP: {p.ip}</span>
                      <span className="badge-info fabula-badge">✨ Fábula: {p.pontos_fabula}</span>
                    </div>
                  )}

                  {/* Informações Públicas do Inimigo */}
                  {p.tipo === 'inimigo' && (
                    <div className="stats-badges-public">
                      <span className="badge-info dano-badge">💥 Dano: {danoInimigo}</span>
                    </div>
                  )}

                  <span className="badge">
                    {p.tipo === 'heroi' ? <><FaShieldAlt /> Herói</> : <><FaSkull /> Inimigo</>}
                  </span>

                  {isMestre && (
                    <div className="item-controls" onClick={(e) => e.stopPropagation()}>
                      <button disabled={index === 0} onClick={() => moverItem(index, 'cima')} title="Subir"><FaChevronUp /></button>
                      <button disabled={index === participantes.length - 1} onClick={() => moverItem(index, 'baixo')} title="Descer"><FaChevronDown /></button>
                      <button className="btn-delete-part" onClick={() => deletarParticipante(p.id)} title="Remover"><FaTrash /></button>
                    </div>
                  )}
                </div>

                {/* PAINEL DE CONTROLE DO MESTRE (HP, MP, Recursos e Condições) */}
                {/* PAINEL DE CONTROLE DO MESTRE */}
                {isMestre && (
                  <div className="mestre-stats-bar" onClick={(e) => e.stopPropagation()}>
                    <div className="mestre-stats-bar-row">
                      <div className="stat-group">
                        <span className="stat-label">HP: {p.hp_atual}/{p.hp_max}</span>
                        <button onClick={() => alterarRecurso(p.id, 'hp_atual', p.hp_atual, -5, p.hp_max)}>-5</button>
                        <button onClick={() => alterarRecurso(p.id, 'hp_atual', p.hp_atual, -1, p.hp_max)}><FaMinus /></button>
                        <button onClick={() => alterarRecurso(p.id, 'hp_atual', p.hp_atual, 1, p.hp_max)}><FaPlus /></button>
                        <button onClick={() => alterarRecurso(p.id, 'hp_atual', p.hp_atual, 5, p.hp_max)}>+5</button>
                      </div>

                      <div className="stat-group">
                        <span className="stat-label">MP: {p.mp_atual}/{p.mp_max}</span>
                        <button onClick={() => alterarRecurso(p.id, 'mp_atual', p.mp_atual, -1, p.mp_max)}><FaMinus /></button>
                        <button onClick={() => alterarRecurso(p.id, 'mp_atual', p.mp_atual, 1, p.mp_max)}><FaPlus /></button>
                      </div>

                      {p.tipo === 'heroi' && (
                        <>
                          <div className="stat-group">
                            <span className="stat-label">IP: {p.ip}</span>
                            <button onClick={() => alterarRecurso(p.id, 'ip', p.ip, -1)}><FaMinus /></button>
                            <button onClick={() => alterarRecurso(p.id, 'ip', p.ip, 1)}><FaPlus /></button>
                          </div>
                          <div className="stat-group">
                            <span className="stat-label">✨ Fábula: {p.pontos_fabula}</span>
                            <button onClick={() => alterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, -1)}><FaMinus /></button>
                            <button onClick={() => alterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, 1)}><FaPlus /></button>
                          </div>
                        </>
                      )}

                      {p.tipo === 'inimigo' && (
                        <div className="stat-group ultima">
                          <span className="stat-label">⚡ Última: {p.pontos_ultima}</span>
                          <button onClick={() => alterarRecurso(p.id, 'pontos_ultima', p.pontos_ultima, -1)}><FaMinus /></button>
                          <button onClick={() => alterarRecurso(p.id, 'pontos_ultima', p.pontos_ultima, 1)}><FaPlus /></button>
                        </div>
                      )}
                    </div>

                    {/* SELETOR DE CONDIÇÕES DO MESTRE */}
                    <div className="condicoes-selector-group">
                      <span className="stat-label">Condições:</span>
                      <div className="condicoes-buttons">
                        {CONDICOES_DISPONIVEIS.map(c => {
                          const ativo = condicoesAtivas.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`cond-btn ${ativo ? 'active' : ''}`}
                              onClick={() => toggleCondicao(p, c.id)}
                            >
                              {getCondicaoIcon(c.id)}
                              <span>{c.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isMestre && (
        <form onSubmit={addParticipante} className="form-add-part">
          <input
            type="text"
            placeholder="Nome do Herói ou Inimigo"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            required
          />
          <div className="form-row-inline">
            <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}>
              <option value="heroi">Herói / Aliado</option>
              <option value="inimigo">Inimigo / NPC</option>
            </select>
            <input type="number" placeholder="HP Máx" value={hpMaxInput} onChange={(e) => setHpMaxInput(e.target.value)} />
            <input type="number" placeholder="MP Máx" value={mpMaxInput} onChange={(e) => setMpMaxInput(e.target.value)} />
            {novoTipo === 'heroi' && (
              <>
                <input type="number" placeholder="IP (Inventário)" value={ipInput} onChange={(e) => setIpInput(e.target.value)} />
                <input type="number" placeholder="Fábula" value={fabulaInput} onChange={(e) => setFabulaInput(e.target.value)} />
              </>
            )}
            <button type="submit">Adicionar</button>
          </div>
        </form>
      )}
    </div>
  );
}