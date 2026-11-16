import React, { useState } from 'react';
import { FaDragon, FaPlus, FaTrash, FaFlask } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';

export default function ExibirQuimerista({ fichaId, ficha, classes, handleAjustarRecurso }) {
  const [magiasImitadas, setMagiasImitadas] = useState(() => ficha?.magias_imitadas || []);
  const [atributoEscolhido, setAtributoEscolhido] = useState(() => ficha?.atributo_quimerista || 'AST + VON');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [novaMagia, setNovaMagia] = useState({
    nome: '',
    custo_mp: '',
    especie: 'fera',
    descricao: '',
  });

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel) || 0;
  };

  const nvImitacao = getNivel('imitacao magica');
  const nvConsumir = getNivel('consumir');
  const nvPatogenese = getNivel('patogenese');
  const nvLingua = getNivel('lingua das feras');

  // Limite de feitiços memorizados: NP + 2 (se não tiver Imitação Mágica, limite é 0 ou 2)
  const limiteFeiticos = nvImitacao > 0 ? nvImitacao + 2 : 2;

  const salvarNoBanco = async (novasMagias, novoAtributo) => {
    setMagiasImitadas(novasMagias);
    if (!fichaId || !classes) return;

    const classesAtualizadas = classes.map((c) => {
      const norm = (c.nome_classe || '').toLowerCase();
      if (norm.includes('quimerista')) {
        return {
          ...c,
          magias_imitadas: novasMagias,
          atributo_quimerista: novoAtributo !== undefined ? novoAtributo : atributoEscolhido,
        };
      }
      return c;
    });

    const { error } = await fichaService.atualizarClassesPersonagem(fichaId, classesAtualizadas);

    if (error) console.error('Erro ao salvar dados do Quimerista:', error.message);
  };

  const alterarAtributo = (e) => {
    const val = e.target.value;
    setAtributoEscolhido(val);
    salvarNoBanco(magiasImitadas, val);
  };

  const adicionarMagia = (e) => {
    e.preventDefault();
    if (!novaMagia.nome.trim()) return;

    if (magiasImitadas.length >= limiteFeiticos) {
      alert(`⛔ Você já atingiu o limite de ${limiteFeiticos} feitiços memorizados (NP + 2). Esqueça um feitiço antigo para adicionar um novo.`);
      return;
    }

    const atualizadas = [...magiasImitadas, { ...novaMagia, id: `quim-${Date.now()}` }];
    salvarNoBanco(atualizadas);
    setNovaMagia({ nome: '', custo_mp: '', especie: 'fera', descricao: '' });
    setMostrarForm(false);
  };

  const removerMagia = (idx) => {
    if (!window.confirm('Esquecer este feitiço de Quimerista?')) return;
    const atualizadas = magiasImitadas.filter((_, i) => i !== idx);
    salvarNoBanco(atualizadas);
  };

  const usarConsumir = () => {
    const recuperacao = nvConsumir * 2;
    if (recuperacao <= 0) return;
    if (window.confirm(`Recuperar ${recuperacao} PM com a habilidade Consumir (NP × 2)?`)) {
      if (handleAjustarRecurso) handleAjustarRecurso('mp_atual', recuperacao);
    }
  };

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '0.75rem', color: '#3fb950', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaDragon /> Grimório Quimérico
        </div>

        <button
          type="button"
          onClick={() => setMostrarForm(!mostrarForm)}
          style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #30363d', background: '#21262d', color: '#3fb950', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <FaPlus size={10} /> Imitar Feitiço ({magiasImitadas.length}/{limiteFeiticos})
        </button>
      </div>

      {/* Configuração de Atributos Oficiais de Magia */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: '#0d1117', padding: '6px 8px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.78rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#8b949e' }}>Atributos de Magia/Quimerismo:</span>
        <select
          value={atributoEscolhido}
          onChange={alterarAtributo}
          style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '3px 6px', fontSize: '0.78rem' }}
        >
          <option value="AST + VON">AST + VON (Astúcia + Vontade)</option>
          <option value="VIG + VON">VIG + VON (Vigor + Vontade)</option>
        </select>
      </div>

      {/* Resumo de Habilidades Passivas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem', marginBottom: '8px' }}>
        {nvConsumir > 0 && (
          <button
            type="button"
            onClick={usarConsumir}
            style={{ background: '#0d1117', padding: '3px 8px', borderRadius: '4px', border: '1px solid #3fb950', color: '#3fb950', cursor: 'pointer' }}
            title="Clique para recuperar PM"
          >
            ⚡ Consumir: Recuperar <strong>+{nvConsumir * 2} PM</strong>
          </button>
        )}
        {nvPatogenese > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            🧪 Patogênese ativa (envenena espécie correspondente)
          </span>
        )}
        {nvLingua > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #58a6ff', color: '#58a6ff' }}>
            🗣️ Língua das Feras
          </span>
        )}
      </div>

      {/* Formulário para Adicionar Feitiço Imitado */}
      {mostrarForm && (
        <form onSubmit={adicionarMagia} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Nome do Feitiço Imitado"
              value={novaMagia.nome}
              onChange={(e) => setNovaMagia({ ...novaMagia, nome: e.target.value })}
              required
              style={{ flex: 2, background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }}
            />
            <input
              type="number"
              placeholder="MP"
              value={novaMagia.custo_mp}
              onChange={(e) => setNovaMagia({ ...novaMagia, custo_mp: e.target.value })}
              style={{ flex: 0.5, background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }}
            />
            <select
              value={novaMagia.especie}
              onChange={(e) => setNovaMagia({ ...novaMagia, especie: e.target.value })}
              style={{ flex: 1, background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }}
            >
              <option value="fera">Fera</option>
              <option value="monstro">Monstro</option>
              <option value="planta">Planta</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Descrição / Efeito do feitiço"
            value={novaMagia.descricao}
            onChange={(e) => setNovaMagia({ ...novaMagia, descricao: e.target.value })}
            style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button type="button" onClick={() => setMostrarForm(false)} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Memorizar</button>
          </div>
        </form>
      )}

      {/* Lista de Feitiços Imitados */}
      {magiasImitadas.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: '#8b949e' }}>
          Nenhum feitiço imitado memorizado ainda. Use <strong>Imitação Mágica</strong> para registrar feitiços aprendidos de feras, monstros ou plantas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {magiasImitadas.map((mag, idx) => (
            <div key={mag.id || idx} style={{ padding: '7px 9px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#f0f6fc' }}>{mag.nome}</strong>
                  <span style={{ fontSize: '0.72rem', color: '#3fb950', marginLeft: '6px' }}>(MP: {mag.custo_mp || '—'})</span>
                  <span style={{ fontSize: '0.72rem', color: '#d4af37', marginLeft: '6px', textTransform: 'uppercase' }}>[{mag.especie}]</span>
                </div>
                <button
                  type="button"
                  onClick={() => removerMagia(idx)}
                  style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer' }}
                  title="Esquecer feitiço"
                >
                  <FaTrash size={11} />
                </button>
              </div>
              {mag.descricao && <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '2px' }}>{mag.descricao}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}