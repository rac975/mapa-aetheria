import React, { useState, useEffect } from 'react';
import { FaStar, FaPlus, FaTrash, FaBolt, FaTimesCircle, FaBook } from 'react-icons/fa';
import { supabase } from '../../../../services/supabase';

export default function ExibirArcanista({ fichaId, ficha, classes, handleAjustarRecurso }) {
  const [catalogo, setCatalogo] = useState([]);
  const [arcanosVinculados, setArcanosVinculados] = useState(() => ficha?.arcanos_vinculados || []);
  const [arcanoAtivoIdx, setArcanoAtivoIdx] = useState(null);
  const [emCrise, setEmCrise] = useState(false);
  const [modoAdicao, setModoAdicao] = useState(null); // 'catalogo' | 'custom' | null
  const [selecionadoCatalogo, setSelecionadoCatalogo] = useState('');

  const [novoCustom, setNovoCustom] = useState({
    nome: '',
    dominios: '',
    fundir: '',
    dispensar_nome: '',
    dispensar_efeito: '',
  });

  // Carrega o catálogo oficial do Supabase
  useEffect(() => {
    async function carregarCatalogo() {
      const { data, error } = await supabase
        .from('catalogo_arcanos')
        .select('*')
        .order('nome', { ascending: true });
      if (!error && data) {
        setCatalogo(data);
        if (data.length > 0) setSelecionadoCatalogo(data[0].id);
      }
    }
    carregarCatalogo();
  }, []);

  // Nível total do personagem (para bônus de Nv. 20+ e Nv. 40+ nos efeitos de dispensa)
  const nivelTotal = (classes || []).reduce((acc, c) => acc + (parseInt(c.nivel) || 0), 0) || 5;
  const bonusEscalaNivel = nivelTotal >= 40 ? 20 : nivelTotal >= 20 ? 10 : 0;

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel) || 0;
  };

  const nvEmergencial = getNivel('arcano emergencial');
  const nvCirculo = getNivel('circulo arcano');
  const nvRegeneracao = getNivel('regeneracao arcana');

  const custoInvocacao = Math.max(0, 40 - (emCrise ? nvEmergencial * 5 : 0));
  const curaRegeneracao = nvRegeneracao * 5;

  // Persiste os arcanos vinculados dentro do JSON da classe no Supabase
  const salvarNoBanco = async (novaLista) => {
    setArcanosVinculados(novaLista);
    if (!fichaId || !classes) return;

    const classesAtualizadas = classes.map((c) => {
      const norm = (c.nome_classe || '').toLowerCase();
      if (norm.includes('arcanista')) {
        return { ...c, arcanos_vinculados: novaLista };
      }
      return c;
    });

    const { error } = await supabase
      .from('personagens')
      .update({ classes: classesAtualizadas })
      .eq('id', fichaId);

    if (error) console.error('Erro ao salvar Arcanos vinculados:', error.message);
  };

  const vincularDoCatalogo = () => {
    const item = catalogo.find((a) => a.id === selecionadoCatalogo);
    if (!item) return;
    if (arcanosVinculados.some((a) => a.nome === item.nome)) {
      alert('Este Arcano já está vinculado!');
      return;
    }
    salvarNoBanco([...arcanosVinculados, item]);
    setModoAdicao(null);
  };

  const vincularCustom = (e) => {
    e.preventDefault();
    if (!novoCustom.nome.trim()) return;
    salvarNoBanco([...arcanosVinculados, { ...novoCustom, id: `custom-${Date.now()}` }]);
    setNovoCustom({ nome: '', dominios: '', fundir: '', dispensar_nome: '', dispensar_efeito: '' });
    setModoAdicao(null);
  };

  const removerVinculo = (idx) => {
    if (!window.confirm('Remover este Arcano da lista vinculada?')) return;
    const novaLista = arcanosVinculados.filter((_, i) => i !== idx);
    salvarNoBanco(novaLista);
    if (arcanoAtivoIdx === idx) setArcanoAtivoIdx(null);
  };

  const invocarArcano = (idx) => {
    if (arcanoAtivoIdx !== null) {
      alert('Você já está fundido a um Arcano! Dispense o atual antes de invocar outro.');
      return;
    }
    const arcano = arcanosVinculados[idx];
    const msgCura = curaRegeneracao > 0 ? ` e recuperar ${curaRegeneracao} PV (Regeneração Arcana)` : '';
    if (!window.confirm(`Gastar ${custoInvocacao} PM para invocar ${arcano.nome}${msgCura}?`)) return;

    if (handleAjustarRecurso) {
      if (custoInvocacao > 0) handleAjustarRecurso('mp_atual', -custoInvocacao);
      if (curaRegeneracao > 0) handleAjustarRecurso('hp_atual', curaRegeneracao);
    }
    setArcanoAtivoIdx(idx);
  };

  const dispensarArcano = (voluntario = true) => {
    if (voluntario && nvCirculo > 0) {
      alert(`Círculo Arcano: Após resolver o efeito de dispensa, você pode lançar um Feitiço grátis (pagando até ${nvCirculo * 5} PM) sem gastar ação!`);
    }
    setArcanoAtivoIdx(null);
  };

  const arcanoAtivo = arcanoAtivoIdx !== null ? arcanosVinculados[arcanoAtivoIdx] : null;

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      {/* Cabeçalho e Controles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '0.75rem', color: '#d2a8ff', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaStar /> Grimório de Arcanos
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {nvEmergencial > 0 && (
            <button
              type="button"
              onClick={() => setEmCrise(!emCrise)}
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: '1px solid #da3633',
                background: emCrise ? '#da3633' : '#0d1117',
                color: '#f0f6fc',
                cursor: 'pointer',
              }}
            >
              {emCrise ? `Em Crise (-${nvEmergencial * 5} PM)` : 'Simular Crise'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setModoAdicao(modoAdicao === 'catalogo' ? null : 'catalogo')}
            style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #30363d', background: '#21262d', color: '#d2a8ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FaBook size={10} /> + Catálogo
          </button>

          <button
            type="button"
            onClick={() => setModoAdicao(modoAdicao === 'custom' ? null : 'custom')}
            style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #30363d', background: '#21262d', color: '#58a6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FaPlus size={10} /> + Custom
          </button>
        </div>
      </div>

      {/* Resumo de Custos e Escala */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem', marginBottom: '8px' }}>
        <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #30363d', color: '#c9d1d9' }}>
          Invocação: <strong>{custoInvocacao} PM</strong>
        </span>
        {nvRegeneracao > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #3fb950', color: '#3fb950' }}>
            Regeneração: <strong>+{curaRegeneracao} PV</strong> ao invocar
          </span>
        )}
        {bonusEscalaNivel > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            Dano de Dispensa (Nv. {nivelTotal}): <strong>+{bonusEscalaNivel}</strong>
          </span>
        )}
      </div>

      {/* Painel do Arcano Atualmente Fundido */}
      {arcanoAtivo && (
        <div style={{ padding: '10px', marginBottom: '10px', background: '#1f1635', border: '1px solid #8957e5', borderRadius: '6px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ color: '#d2a8ff', fontWeight: 'bold', fontSize: '0.88rem' }}>
              ✨ Fundido: {arcanoAtivo.nome}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => dispensarArcano(true)}
                style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#8957e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Ativa o efeito de dispensa (se desejar) e Círculo Arcano"
              >
                <FaTimesCircle /> Dispensar (Voluntário)
              </button>
              <button
                type="button"
                onClick={() => dispensarArcano(false)}
                style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
                title="Fim de cena, inconsciência ou efeito automático (sem efeito de dispensa)"
              >
                Encerrar Cena
              </button>
            </div>
          </div>

          <div style={{ color: '#e6edf3', marginBottom: '4px' }}>
            <strong style={{ color: '#a5d6ff' }}>Benefício de Fundição:</strong> {arcanoAtivo.fundir}
          </div>

          {arcanoAtivo.dispensar_efeito && (
            <div style={{ color: '#c9d1d9', paddingTop: '4px', borderTop: '1px solid #30363d' }}>
              <strong style={{ color: '#d2a8ff' }}>
                Dispensa{arcanoAtivo.dispensar_nome ? ` (${arcanoAtivo.dispensar_nome})` : ''}:
              </strong>{' '}
              {arcanoAtivo.dispensar_efeito}
            </div>
          )}
        </div>
      )}

      {/* Seletor do Catálogo Oficial */}
      {modoAdicao === 'catalogo' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', flexWrap: 'wrap' }}>
          <select
            value={selecionadoCatalogo}
            onChange={(e) => setSelecionadoCatalogo(e.target.value)}
            style={{ flex: 1, minWidth: '180px', background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }}
          >
            {catalogo.map((arc) => (
              <option key={arc.id} value={arc.id}>
                {arc.nome} ({arc.dominios})
              </option>
            ))}
          </select>
          <button type="button" onClick={vincularDoCatalogo} style={{ padding: '5px 12px', fontSize: '0.78rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Vincular
          </button>
        </div>
      )}

      {/* Formulário de Arcano Customizado */}
      {modoAdicao === 'custom' && (
        <form onSubmit={vincularCustom} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
          <input type="text" placeholder="Nome do Arcano" value={novoCustom.nome} onChange={(e) => setNovoCustom({ ...novoCustom, nome: e.target.value })} required style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
          <input type="text" placeholder="Domínios (ex: sombra, segredos, noite)" value={novoCustom.dominios} onChange={(e) => setNovoCustom({ ...novoCustom, dominios: e.target.value })} style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
          <textarea placeholder="Benefício ao Fundir" rows={2} value={novoCustom.fundir} onChange={(e) => setNovoCustom({ ...novoCustom, fundir: e.target.value })} required style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
          <input type="text" placeholder="Nome do Efeito de Dispensa (opcional)" value={novoCustom.dispensar_nome} onChange={(e) => setNovoCustom({ ...novoCustom, dispensar_nome: e.target.value })} style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
          <textarea placeholder="Efeito de Dispensa (opcional)" rows={2} value={novoCustom.dispensar_efeito} onChange={(e) => setNovoCustom({ ...novoCustom, dispensar_efeito: e.target.value })} style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button type="button" onClick={() => setModoAdicao(null)} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
          </div>
        </form>
      )}

      {/* Lista de Arcanos Vinculados */}
      {arcanosVinculados.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: '#8b949e' }}>
          Nenhum Arcano vinculado à alma ainda. Clique em <strong>+ Catálogo</strong> ou <strong>+ Custom</strong> para adicionar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {arcanosVinculados.map((arc, idx) => (
            <div key={arc.id || idx} style={{ padding: '8px', background: '#0d1117', borderRadius: '4px', border: arcanoAtivoIdx === idx ? '1px solid #8957e5' : '1px solid #30363d', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                <div>
                  <strong style={{ color: '#f0f6fc' }}>{arc.nome}</strong>
                  <span style={{ fontSize: '0.73rem', color: '#8b949e', marginLeft: '6px' }}>({arc.dominios})</span>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {arcanoAtivoIdx === null && (
                    <button
                      type="button"
                      onClick={() => invocarArcano(idx)}
                      style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#d2a8ff', border: '1px solid #8957e5', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FaBolt size={10} /> Invocar (-{custoInvocacao} PM)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removerVinculo(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer' }}
                    title="Desvincular Arcano"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#c9d1d9', marginTop: '4px' }}>
                <strong style={{ color: '#58a6ff' }}>Fundir:</strong> {arc.fundir}
              </div>
              {arc.dispensar_efeito && (
                <div style={{ fontSize: '0.76rem', color: '#9da3af', marginTop: '2px' }}>
                  <strong style={{ color: '#d2a8ff' }}>Dispensar{arc.dispensar_nome ? ` (${arc.dispensar_nome})` : ''}:</strong> {arc.dispensar_efeito}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}