import React, { useState } from 'react';
import { FaFire, FaBolt, FaMountain } from 'react-icons/fa';

export default function ExibirElementalista({ ficha, handleAjustarRecurso }) {
  const [custoExtraCataclismo, setCustoExtraCataclismo] = useState(10);
  const [tipoArmaLamina, setTipoArmaLamina] = useState('des'); // 'des' ou 'outro'

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel) || 0;
  };

  const nvArtilharia = getNivel('artilharia magica');
  const nvCataclismo = getNivel('cataclismo');
  const nvRitualista = getNivel('elementalismo ritualista');
  const nvLamina = getNivel('lamina magica');
  const nvMagiaElemental = getNivel('magia elemental');

  if (nvArtilharia + nvCataclismo + nvRitualista + nvLamina + nvMagiaElemental === 0) {
    return null;
  }

  // Cálculos baseados no Nível do Poder (NP)
  const bonusArtilharia = nvArtilharia * 2;
  const maxPmCataclismo = nvCataclismo * 10; // NP x 10 (Máximo 50 no Nv 5)
  const danoExtraCataclismo = Math.floor(custoExtraCataclismo / 10) * 5; // +5 de dano para cada 10 PM
  
  const maxPmLamina = nvLamina * 20; // NP x 20
  const bonusAtributoLamina = tipoArmaLamina === 'des' ? nvLamina : 0; // Se DEX, soma NP ao teste

  const usarCataclismo = () => {
    if (!handleAjustarRecurso) return;

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < custoExtraCataclismo) {
      window.alert(`MP insuficiente! O custo extra selecionado é de ${custoExtraCataclismo} PM.`);
      return;
    }

    if (window.confirm(`Aplicar Cataclismo (+${custoExtraCataclismo} PM)?\n\nIsso aumentará o dano do feitiço instantâneo em +${danoExtraCataclismo} pontos de dano elemental.`)) {
      handleAjustarRecurso('mp_atual', -custoExtraCataclismo);
      window.alert(`💥 Cataclismo aplicado com sucesso! ${custoExtraCataclismo} PM consumidos e +${danoExtraCataclismo} de dano adicionado.`);
    }
  };

  // Gera dinamicamente as opções do Cataclismo baseadas no nível da habilidade (10 em 10 até maxPmCataclismo)
  const opcoesCataclismo = [];
  for (let pm = 10; pm <= maxPmCataclismo; pm += 10) {
    const dano = (pm / 10) * 5;
    opcoesCataclismo.push(
      <option key={pm} value={pm}>
        {pm} PM (+{dano} Dano)
      </option>
    );
  }

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '0.75rem', color: '#58a6ff', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaFire /> Domínio Elemental — Elementalista
        </div>

        {nvRitualista > 0 && (
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: 'rgba(88, 166, 255, 0.1)', border: '1px solid #58a6ff', color: '#58a6ff', borderRadius: '4px' }}>
            ✨ Ritualismo Elemental Ativo (AST + VON)
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem', marginBottom: '8px' }}>
        {nvArtilharia > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #3fb950', color: '#3fb950' }}>
            🎯 Artilharia Mágica Ativa (+{bonusArtilharia} em Testes de Magia Ofensiva com Arma Arcana)
          </span>
        )}
      </div>

      {/* Seção de Cataclismo */}
      {nvCataclismo > 0 && (
        <div style={{ padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', marginBottom: '8px', fontSize: '0.78rem' }}>
          <div style={{ color: '#f85149', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaBolt /> Cataclismo (Até +{maxPmCataclismo} PM):
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ color: '#9da3af', fontSize: '0.74rem' }}>PM Extra a Gastar:</label>
            <select
              value={custoExtraCataclismo}
              onChange={(e) => setCustoExtraCataclismo(Number(e.target.value))}
              style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem' }}
            >
              {opcoesCataclismo}
            </select>
            <button
              type="button"
              onClick={usarCataclismo}
              style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#f85149', border: '1px solid #f85149', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Lançar Cataclismo (+{danoExtraCataclismo} Dano)
            </button>
          </div>
        </div>
      )}

      {/* Seção de Lâmina Mágica */}
      {nvLamina > 0 && (
        <div style={{ padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.78rem' }}>
          <div style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaMountain /> Lâmina Mágica (Limite máx. feitiço: {maxPmLamina} PM):
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#9da3af', fontSize: '0.74rem' }}>Tipo de Arma Equipada:</span>
            <select
              value={tipoArmaLamina}
              onChange={(e) => setTipoArmaLamina(e.target.value)}
              style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem' }}
            >
              <option value="des">Usa Destreza (Bônus de Atributo: +{bonusAtributoLamina})</option>
              <option value="outro">Outro Atributo (Sem bônus extra de DES)</option>
            </select>
          </div>
          <div style={{ color: '#8b949e', fontSize: '0.72rem', marginTop: '4px' }}>
            ℹ️ Permite usar a fórmula de Precisão da arma física no teste de Magia para feitiços de alvo único. Se incluir Destreza, ganha bônus igual ao nível da habilidade (+{nvLamina}).
          </div>
        </div>
      )}
    </div>
  );
}