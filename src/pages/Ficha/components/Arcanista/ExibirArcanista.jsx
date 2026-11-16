import React, { useState, useEffect } from 'react';
import { FaStar, FaPlus, FaBook } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { calcularBonusEscalaArcanista } from '../../../../domain/fabula/classRules';
import { calcularNivelTotal } from '../../../../domain/fabula/characterProgression';
import ArcanoAtivoPainel from './ArcanoAtivoPainel';
import ArcanosForms from './ArcanosForms';
import ArcanosLista from './ArcanosLista';

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

  // Carrega o catálogo oficial via fichaService
  useEffect(() => {
    async function carregarCatalogo() {
      const { data, error } = await fichaService.getCatalogoArcanos();
      if (!error && data) {
        setCatalogo(data);
        if (data.length > 0) setSelecionadoCatalogo(data[0].id);
      }
    }
    carregarCatalogo();
  }, []);

  // Nível total do personagem e escala de bônus (Nv. 20+ e Nv. 40+)
  const nivelTotal = calcularNivelTotal(classes) || 5;
  const bonusEscalaNivel = calcularBonusEscalaArcanista(nivelTotal);

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvEmergencial = getNivel('arcano emergencial');
  const nvCirculo = getNivel('circulo arcano');
  const nvRegeneracao = getNivel('regeneracao arcana');

  const custoInvocacao = Math.max(0, 40 - (emCrise ? nvEmergencial * 5 : 0));
  const curaRegeneracao = nvRegeneracao * 5;

  // Persiste os arcanos vinculados dentro do JSON da classe via fichaService
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

    const { error } = await fichaService.atualizarClassesPersonagem(fichaId, classesAtualizadas);
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
      <ArcanoAtivoPainel arcanoAtivo={arcanoAtivo} onDispensar={dispensarArcano} />

      {/* Seletor / Formulário de Adição */}
      <ArcanosForms
        modoAdicao={modoAdicao}
        onFecharModo={() => setModoAdicao(null)}
        catalogo={catalogo}
        selecionadoCatalogo={selecionadoCatalogo}
        setSelecionadoCatalogo={setSelecionadoCatalogo}
        onVincularCatalogo={vincularDoCatalogo}
        novoCustom={novoCustom}
        setNovoCustom={setNovoCustom}
        onVincularCustom={vincularCustom}
      />

      {/* Lista de Arcanos Vinculados */}
      <ArcanosLista
        arcanosVinculados={arcanosVinculados}
        arcanoAtivoIdx={arcanoAtivoIdx}
        custoInvocacao={custoInvocacao}
        onInvocarArcano={invocarArcano}
        onRemoverVinculo={removerVinculo}
      />
    </div>
  );
}
