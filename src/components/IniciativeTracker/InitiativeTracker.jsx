import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FaUndoAlt } from 'react-icons/fa';
import UndoToast from '../UndoToast/UndoToast';
import CustomAlert from '../CustomAlert/CustomAlert';
import CombatantItem from './CombatantItem';
import AddParticipantForm from './AddPArticipantForm';
import './InitiativeTracker.css';

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

  useEffect(() => {
    async function carregarDadosIniciais() {
      const { data: fichasData } = await supabase
        .from('fichas_personagens')
        .select('id, nome_personagem, hp_max, mp_max, pi_max, fabula, avatar_url, defesa, mdef');

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

      novoCombatente = {
        nome: fichaEncontrada.nome_personagem,
        tipo: 'heroi',
        agiu: false,
        ordem: novaOrdem,
        hp_atual: fichaEncontrada.hp_max || 40,
        hp_max: fichaEncontrada.hp_max || 40,
        mp_atual: fichaEncontrada.mp_max || 40,
        mp_max: fichaEncontrada.mp_max || 40,
        ip: fichaEncontrada.pi_max || 6,
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

  // const iniciarEdicao = (p) => {
  //   setEditandoId(p.id);
  //   setEditForm({
  //     nome: p.nome,
  //     hp_max: p.hp_max,
  //     mp_max: p.mp_max,
  //     ip: p.ip,
  //     pontos_fabula: p.pontos_fabula
  //   });
  // };

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
    if (participanteAtual && participanteAtual.tipo === 'heroi' && participanteAtual.ficha_id) {
      let campoFicha = campo;
      if (campo === 'pontos_fabula') campoFicha = 'fabula';

      await supabase
        .from('fichas_personagens')
        .update({ [campoFicha]: novoValor })
        .eq('id', participanteAtual.ficha_id);
    }
  };

  const toggleCondicao = async (p, condicaoId) => {
    if (!isMestre) return;
    let atuais = p.condicoes || [];
    atuais = atuais.includes(condicaoId) ? atuais.filter(c => c !== condicaoId) : [...atuais, condicaoId];

    setParticipantes(prev => prev.map(item => item.id === p.id ? { ...item, condicoes: atuais } : item));

    const { error } = await supabase
      .from('iniciativa_combate')
      .update({ condicoes: atuais })
      .eq('id', p.id);

    if (error) {
      console.error("Erro ao atualizar condições no Supabase:", error.message);
    }
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
          participantes.map((p, index) => (
            <CombatantItem
              key={p.id}
              p={p}
              index={index}
              totalParticipantes={participantes.length}
              isMestre={isMestre}
              isEditando={editandoId === p.id}
              editForm={editForm}
              setEditForm={setEditForm}
              fichasDisponiveis={fichasDisponiveis}
              onToggleTurno={toggleTurno}
              // onIniciarEdicao={iniciarEdicao}
              onSalvarEdicao={salvarEdicao}
              onCancelarEdicao={() => setEditandoId(null)}
              onMoverItem={moverItem}
              onIniciarExclusao={iniciarExclusao}
              onAlterarRecurso={alterarRecurso}
              onToggleCondicao={toggleCondicao}
            />
          ))
        )}
      </div>

      {isMestre && (
        <AddParticipantForm
          novoTipo={novoTipo}
          setNovoTipo={setNovoTipo}
          fichaSelecionadaId={fichaSelecionadaId}
          setFichaSelecionadaId={setFichaSelecionadaId}
          fichasDisponiveis={fichasDisponiveis}
          nomeInimigo={nomeInimigo}
          setNomeInimigo={setNomeInimigo}
          hpMaxInput={hpMaxInput}
          setHpMaxInput={setHpMaxInput}
          mpMaxInput={mpMaxInput}
          setMpMaxInput={setMpMaxInput}
          onAddParticipante={addParticipante}
        />
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