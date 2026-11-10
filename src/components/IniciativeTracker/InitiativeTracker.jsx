import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  FaChevronUp, FaChevronDown, FaTrash, FaShieldAlt, FaSkull, FaPlus, FaMinus, FaExclamationTriangle,
  FaSpider, FaBolt, FaWeightHanging, FaHeartBroken, FaEyeSlash, FaEdit, FaCheck, FaTimes, FaUndoAlt
} from 'react-icons/fa';
import UndoToast from '../UndoToast/UndoToast';
import CustomAlert from '../CustomAlert/CustomAlert';
import './InitiativeTracker.css';

const CONDICOES_DISPONIVEIS = [
  { id: 'envenenado', label: 'Envenenado', icon: <FaSpider /> },
  { id: 'atordoado', label: 'Atordoado', icon: <FaBolt /> },
  { id: 'vulneravel', label: 'Vulnerável', icon: <FaHeartBroken /> },
  { id: 'lento', label: 'Lento', icon: <FaWeightHanging /> },
  { id: 'fraco', label: 'Fraco', icon: <FaSkull /> },
  { id: 'dominado', label: 'Dominado', icon: <FaEyeSlash /> }
];

export default function InitiativeTracker({ isMestre }) {
  const [participantes, setParticipantes] = useState([]);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);

  const [novoTipo, setNovoTipo] = useState('heroi');
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState('');

  const [nomeInimigo, setNomeInimigo] = useState('');
  const [hpMaxInput, setHpMaxInput] = useState(30);
  const [mpMaxInput, setMpMaxInput] = useState(20);

  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [progressoKey, setProgressoKey] = useState(0);

  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', hp_max: 0, mp_max: 0, ip: 0, pontos_fabula: 0 });

  const getCondicaoIcon = (id) => {
    const cond = CONDICOES_DISPONIVEIS.find(c => c.id === id);
    return cond ? cond.icon : <FaExclamationTriangle />;
  };

  useEffect(() => {
    async function carregarDadosIniciais() {
      // Busca fichas primeiro para cruzar dados visuais se necessário
      const { data: fichasData } = await supabase
        .from('fichas_personagens')
        .select('id, nome_personagem, hp_max, mp_max, ip_max, fabula, avatar_url, defesa, mdef');
      
      if (fichasData) {
        setFichasDisponiveis(fichasData);
        if (fichasData.length > 0) setFichaSelecionadaId(fichasData[0].id);
      }

      const { data: iniciativaData } = await supabase.from('iniciativa_combate').select('*').order('ordem', { ascending: true });
      if (iniciativaData) {
        setParticipantes(iniciativaData);
      }
    }
    carregarDadosIniciais();

    const channel = supabase
      .channel('realtime_iniciativa')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'iniciativa_combate' },
        async () => {
          const { data } = await supabase.from('iniciativa_combate').select('*').order('ordem', { ascending: true });
          if (data) setParticipantes(data);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const restaurarTudoCena = async () => {
    if (!isMestre) return;

    const atualizados = participantes.map(p => ({
      ...p,
      agiu: false,
      hp_atual: p.hp_max,
      mp_atual: p.mp_max
    }));

    setParticipantes(atualizados);

    for (const p of atualizados) {
      await supabase.from('iniciativa_combate').update({
        agiu: false,
        hp_atual: p.hp_max,
        mp_atual: p.mp_max
      }).eq('id', p.id);
    }
  };

  const addParticipante = async (e) => {
    e.preventDefault();
    if (!isMestre) return;

    let novoCombatente = {};
    const novaOrdem = participantes.length > 0 ? participantes[participantes.length - 1].ordem + 1 : 0;

    if (novoTipo === 'heroi') {
      const fichaEncontrada = fichasDisponiveis.find(f => f.id === fichaSelecionadaId);
      if (!fichaEncontrada) {
        setAlerta({ isOpen: true, title: 'Atenção', message: 'Selecione uma ficha válida.' });
        return;
      }

      const jaExiste = participantes.some(p => p.nome.toLowerCase() === fichaEncontrada.nome_personagem.toLowerCase());
      if (jaExiste) {
        setAlerta({
          isOpen: true,
          title: 'Herói Duplicado',
          message: `O herói "${fichaEncontrada.nome_personagem}" já está na ordem de combate!`
        });
        return;
      }

      // Objeto limpo compatível estritamente com as colunas da sua tabela iniciativa_combate
      novoCombatente = {
        nome: fichaEncontrada.nome_personagem,
        tipo: 'heroi',
        agiu: false,
        ordem: novaOrdem,
        hp_atual: fichaEncontrada.hp_max || 40,
        hp_max: fichaEncontrada.hp_max || 40,
        mp_atual: fichaEncontrada.mp_max || 40,
        mp_max: fichaEncontrada.mp_max || 40,
        ip: fichaEncontrada.ip_max || 6,
        pontos_fabula: fichaEncontrada.fabula || 3,
        pontos_ultima: 0,
        dano_acumulado: 0,
        condicoes: [],
        ficha_id: fichaEncontrada.id
      };
    } else {
      if (!nomeInimigo.trim()) {
        setAlerta({ isOpen: true, title: 'Campo Vazio', message: 'Digite o nome do inimigo.' });
        return;
      }

      novoCombatente = {
        nome: nomeInimigo.trim(),
        tipo: 'inimigo',
        agiu: false,
        ordem: novaOrdem,
        hp_atual: Number(hpMaxInput),
        hp_max: Number(hpMaxInput),
        mp_atual: Number(mpMaxInput),
        mp_max: Number(mpMaxInput),
        ip: 0,
        pontos_fabula: 0,
        pontos_ultima: 3,
        dano_acumulado: 0,
        condicoes: [],
        ficha_id: null
      };
    }

    const { data, error } = await supabase.from('iniciativa_combate').insert([novoCombatente]).select();
    if (!error && data) {
      setParticipantes(prev => [...prev, data[0]]);
    }
    setNomeInimigo('');
  };

  const iniciarExclusao = (p) => {
    if (!isMestre) return;
    if (timeoutId) clearTimeout(timeoutId);

    setParticipantes(prev => prev.filter(item => item.id !== p.id));
    setItemParaExcluir(p);
    setMostrarToast(true);
    setProgressoKey(prev => prev + 1);

    const timer = setTimeout(async () => {
      await supabase.from('iniciativa_combate').delete().eq('id', p.id);
      setMostrarToast(false);
      setItemParaExcluir(null);
    }, 6000);

    setTimeoutId(timer);
  };

  const desfazerExclusao = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (itemParaExcluir) {
      setParticipantes(prev => [...prev, itemParaExcluir].sort((a, b) => a.ordem - b.ordem));
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
  };

  const iniciarEdicao = (p) => {
    setEditandoId(p.id);
    setEditForm({
      nome: p.nome,
      hp_max: p.hp_max,
      mp_max: p.mp_max,
      ip: p.ip,
      pontos_fabula: p.pontos_fabula
    });
  };

  const salvarEdicao = async (id) => {
    const payload = {
      nome: editForm.nome,
      hp_max: Number(editForm.hp_max),
      mp_max: Number(editForm.mp_max),
      ip: Number(editForm.ip),
      pontos_fabula: Number(editForm.pontos_fabula)
    };

    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    setEditandoId(null);

    await supabase.from('iniciativa_combate').update(payload).eq('id', id);
  };

  const alterarRecurso = async (id, campo, valorAtual, delta, maximo = null) => {
    if (!isMestre) return;
    let novoValor = valorAtual + delta;
    novoValor = maximo !== null ? Math.max(0, Math.min(maximo, novoValor)) : Math.max(0, novoValor);

    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, [campo]: novoValor } : p));
    await supabase.from('iniciativa_combate').update({ [campo]: novoValor }).eq('id', id);

    const participanteAtual = participantes.find(p => p.id === id);
    if (participanteAtual && participanteAtual.tipo === 'heroi') {
      let campoFicha = campo === 'pontos_fabula' ? 'fabula' : campo;
      await supabase
        .from('fichas_personagens')
        .update({ [campoFicha]: novoValor })
        .eq('nome_personagem', participanteAtual.nome);
    }
  };

  const toggleCondicao = async (p, condicaoId) => {
    if (!isMestre) return;
    let atuais = p.condicoes || [];
    atuais = atuais.includes(condicaoId) ? atuais.filter(c => c !== condicaoId) : [...atuais, condicaoId];

    setParticipantes(prev => prev.map(item => item.id === p.id ? { ...item, condicoes: atuais } : item));
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

    setParticipantes(novaLista);

    for (let idx = 0; idx < novaLista.length; idx++) {
      await supabase.from('iniciativa_combate').update({ ordem: idx }).eq('id', novaLista[idx].id);
    }
  };

  return (
    <div className="combat-box">
      <div className="box-header">
        <h2>Ordem de Ação & Combate</h2>
        {isMestre && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-reset" onClick={restaurarTudoCena} title="Cura total e limpa turnos">
              <FaUndoAlt /> Restaurar Cena
            </button>
            <button className="btn-reset" onClick={resetRodada}>Nova Rodada</button>
          </div>
        )}
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
            const isEditando = editandoId === p.id;

            // Busca os dados da ficha correspondente (avatar e defesas) dinamicamente
            const fichaCorrespondente = fichasDisponiveis.find(f => f.id === p.ficha_id || f.nome_personagem.toLowerCase() === p.nome.toLowerCase());
            const avatarUrl = fichaCorrespondente?.avatar_url;
            const defesaHeroi = fichaCorrespondente?.defesa || 10;
            const mdefHeroi = fichaCorrespondente?.mdef || 10;

            return (
              <div
                key={p.id}
                className={`participante-item ${p.tipo} ${p.agiu ? 'turn-completed' : ''} ${estaDerrotado ? 'is-defeated' : ''}`}
                onClick={() => !isEditando && toggleTurno(p.id, p.agiu)}
              >
                <div className="item-main-row">
                  <input type="checkbox" checked={p.agiu} readOnly />

                  {/* Exibição do Avatar do Herói / Ícone */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={p.nome}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #d4af37', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a2230', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', flexShrink: 0, border: '1px solid #332914' }}>
                      {p.tipo === 'heroi' ? <FaShieldAlt size={14} /> : <FaSkull size={14} />}
                    </div>
                  )}

                  {isEditando ? (
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: '#161b22', border: '1px solid #d4af37', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}
                    />
                  ) : (
                    <span className="nome">{p.nome}</span>
                  )}

                  {estaDerrotado && <span className="badge-derrotado">CAÍDO / DERROTADO</span>}
                  {emCrise && <span className="badge-crise">CRISE</span>}

                  {condicoesAtivas.length > 0 && !isEditando && (
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

                  {!isEditando && p.tipo === 'heroi' && (
                    <div className="stats-badges-public">
                      <span className="badge-info hp-badge">❤️ {p.hp_atual}/{p.hp_max}</span>
                      <span className="badge-info mp-badge">💧 {p.mp_atual}/{p.mp_max}</span>
                      <span className="badge-info ip-badge">📦 IP: {p.ip}</span>
                      <span className="badge-info" style={{ background: 'rgba(212, 175, 55, 0.12)', color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.35)' }}>
                        🛡️ DEF: {defesaHeroi}
                      </span>
                      <span className="badge-info" style={{ background: 'rgba(155, 89, 182, 0.12)', color: '#d5b8ff', borderColor: 'rgba(155, 89, 182, 0.35)' }}>
                        🔮 M.DEF: {mdefHeroi}
                      </span>
                      <span className="badge-info fabula-badge">✨ Fábula: {p.pontos_fabula}</span>
                    </div>
                  )}

                  {!isEditando && p.tipo === 'inimigo' && (
                    <div className="stats-badges-public">
                      <span className="badge-info dano-badge">💥 Dano: {danoInimigo}</span>
                    </div>
                  )}

                  <span className="badge">
                    {p.tipo === 'heroi' ? <><FaShieldAlt /> Herói</> : <><FaSkull /> Inimigo</>}
                  </span>

                  {isMestre && (
                    <div className="item-controls" onClick={(e) => e.stopPropagation()}>
                      {isEditando ? (
                        <>
                          <button className="btn-save-edit" onClick={() => salvarEdicao(p.id)} title="Salvar"><FaCheck /></button>
                          <button className="btn-cancel-edit" onClick={() => setEditandoId(null)} title="Cancelar"><FaTimes /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => iniciarEdicao(p)} title="Editar Cartão"><FaEdit /></button>
                          <button disabled={index === 0} onClick={() => moverItem(index, 'cima')} title="Subir"><FaChevronUp /></button>
                          <button disabled={index === participantes.length - 1} onClick={() => moverItem(index, 'baixo')} title="Descer"><FaChevronDown /></button>
                          <button className="btn-delete-part" onClick={() => iniciarExclusao(p)} title="Remover"><FaTrash /></button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isMestre && !isEditando && (
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
                        <button onClick={() => alterarRecurso(p.id, 'mp_atual', p.mp_atual, -5, p.mp_max)}>-5</button>
                        <button onClick={() => alterarRecurso(p.id, 'mp_atual', p.mp_atual, -1, p.mp_max)}><FaMinus /></button>
                        <button onClick={() => alterarRecurso(p.id, 'mp_atual', p.mp_atual, 1, p.mp_max)}><FaPlus /></button>
                        <button onClick={() => alterarRecurso(p.id, 'mp_atual', p.mp_atual, 5, p.mp_max)}>+5</button>
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
                    </div>

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
                              {c.icon}
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
          <div className="form-row-inline">
            <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}>
              <option value="heroi">Herói (Selecionar Ficha)</option>
              <option value="inimigo">Inimigo / NPC</option>
            </select>

            {novoTipo === 'heroi' ? (
              <select
                value={fichaSelecionadaId}
                onChange={(e) => setFichaSelecionadaId(e.target.value)}
                style={{ flex: 2 }}
              >
                {fichasDisponiveis.map(f => (
                  <option key={f.id} value={f.id}>{f.nome_personagem}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Nome do Inimigo / NPC"
                value={nomeInimigo}
                onChange={(e) => setNomeInimigo(e.target.value)}
              />
            )}

            {novoTipo === 'inimigo' && (
              <>
                <input type="number" placeholder="HP Máx" value={hpMaxInput} onChange={(e) => setHpMaxInput(e.target.value)} />
                <input type="number" placeholder="MP Máx" value={mpMaxInput} onChange={(e) => setMpMaxInput(e.target.value)} />
              </>
            )}

            <button type="submit">Adicionar à Cena</button>
          </div>
        </form>
      )}

      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />

      <UndoToast
        mostrar={mostrarToast}
        mensagem={<><strong>{itemParaExcluir?.nome}</strong> foi removido.</>}
        progressoKey={progressoKey}
        onUndo={desfazerExclusao}
      />
    </div>
  );
}