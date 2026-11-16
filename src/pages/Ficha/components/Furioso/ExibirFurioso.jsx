import React, { useState } from 'react';
import { FaFire, FaShieldAlt, FaBolt } from 'react-icons/fa';

export default function ExibirFurioso({ ficha, handleAjustarRecurso, emCriseGlobal, atributosAtuais = {}, onElevarAtributoTemporario }) {
  const [atributoEscolhidoResistir, setAtributoEscolhidoResistir] = useState('vigor');

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel) || 0;
  };

  const nvAdrenalina = getNivel('adrenalina');
  const nvIndomavel = getNivel('espirito indomavel');
  const nvFrenesi = getNivel('frenesi');
  const nvProvocar = getNivel('provocar');
  const nvResistir = getNivel('resistir');

  if (nvAdrenalina + nvIndomavel + nvFrenesi + nvProvocar + nvResistir === 0) {
    return null;
  }

  const danoAdrenalina = nvAdrenalina * 2;
  const curaIndomavel = nvIndomavel * 5;

  const lacos = ficha?.lacos || [];
  const maiorLaco = lacos.length > 0 
    ? Math.max(...lacos.map(l => parseInt(l.forca || l.nivel || 1), 1)) 
    : 1;

  const curaResistir = nvResistir * maiorLaco;

  const usarIndomavel = (tipo) => {
    if (!handleAjustarRecurso) return;

    const fabulaAtual = Number(ficha?.fabula ?? 3);
    if (fabulaAtual <= 0) {
      window.alert("Você não possui Pontos de Fábula suficientes!");
      return;
    }

    let msg = tipo === 'pv' ? `Gastar 1 Ponto de Fábula para recuperar ${curaIndomavel} PV?`
      : tipo === 'pm' ? `Gastar 1 Ponto de Fábula para recuperar ${curaIndomavel} PM?`
      : `Gastar 1 Ponto de Fábula para se recuperar de uma condição?`;

    if (window.confirm(msg)) {
      handleAjustarRecurso('fabula', -1);
      if (tipo === 'pv') handleAjustarRecurso('hp_atual', curaIndomavel);
      if (tipo === 'pm') handleAjustarRecurso('mp_atual', curaIndomavel);
      window.alert(`✨ Espírito Indomável aplicado com sucesso!`);
    }
  };

  const usarProvocar = () => {
    if (!handleAjustarRecurso) return;

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < 5) {
      window.alert("MP insuficiente! Provocar exige 5 PM.");
      return;
    }

    const valorVig = atributosAtuais.vigor || 8;
    const valorVon = atributosAtuais.vontade || 8;

    const rolarD = (faces) => Math.floor(Math.random() * faces) + 1;
    const rVig = rolarD(valorVig);
    const rVon = rolarD(valorVon);
    const resultadoTeste = rVig + rVon + nvProvocar;

    if (window.confirm(`Usar Provocar (Custo: 5 PM)?\n\nRolagem: VIG (d${valorVig}: ${rVig}) + VON (d${valorVon}: ${rVon}) + NP (${nvProvocar}) = Total: ${resultadoTeste}\n\nDeseja confirmar o gasto de PM e realizar a provocação?`)) {
      handleAjustarRecurso('mp_atual', -5);
      window.alert(`🗣️ Criatura provocada com sucesso! Teste finalizado com resultado ${resultadoTeste}.`);
    }
  };

  const usarResistir = () => {
    if (!handleAjustarRecurso) return;

    if (window.confirm(`Executar Resistir com Ação Guarda?\n- Recuperação: +${curaResistir} PV\n- Atributo Elevado: ${atributoEscolhidoResistir.toUpperCase()} sobe um passo até o próximo turno.`)) {
      if (curaResistir > 0) {
        handleAjustarRecurso('hp_atual', curaResistir);
      }
      if (onElevarAtributoTemporario) {
        onElevarAtributoTemporario(atributoEscolhidoResistir);
      }
      window.alert(`🛡️ Resistir ativado! +${curaResistir} PV recuperados e ${atributoEscolhidoResistir.toUpperCase()} elevado.`);
    }
  };

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '0.75rem', color: '#f85149', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaFire /> Fúria Implacável — Furioso
        </div>

        {emCriseGlobal && nvAdrenalina > 0 && (
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: 'rgba(248, 81, 73, 0.2)', border: '1px solid #f85149', color: '#f85149', borderRadius: '4px' }}>
            ⚡ Adrenalina Ativa (Dano +{danoAdrenalina} em crise)
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem', marginBottom: '8px' }}>
        {nvFrenesi > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            🎯 Frenesi Ativo (Dados iguais em adagas, lutas, malhos e arremessos geram Crítico)
          </span>
        )}
        {nvProvocar > 0 && (
          <button
            type="button"
            onClick={usarProvocar}
            style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #58a6ff', color: '#58a6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            🗣️ Provocar (5 PM | VIG+VON+{nvProvocar})
          </button>
        )}
      </div>

      {nvIndomavel > 0 && (
        <div style={{ padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', marginBottom: '8px', fontSize: '0.78rem' }}>
          <div style={{ color: '#d2a8ff', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaBolt /> Espírito Indomável (Gasta 1 Ponto de Fábula):
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => usarIndomavel('pv')} style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#3fb950', border: '1px solid #3fb950', borderRadius: '4px', cursor: 'pointer' }}>
              Recuperar +{curaIndomavel} PV
            </button>
            <button type="button" onClick={() => usarIndomavel('pm')} style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#58a6ff', border: '1px solid #58a6ff', borderRadius: '4px', cursor: 'pointer' }}>
              Recuperar +{curaIndomavel} PM
            </button>
            <button type="button" onClick={() => usarIndomavel('condicao')} style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#d4af37', border: '1px solid #d4af37', borderRadius: '4px', cursor: 'pointer' }}>
              Remover Condição
            </button>
          </div>
        </div>
      )}

      {nvResistir > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', padding: '6px 8px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.78rem', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaShieldAlt /> Resistir (+{curaResistir} PV):
          </span>
          <select
            value={atributoEscolhidoResistir}
            onChange={(e) => setAtributoEscolhidoResistir(e.target.value)}
            style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem' }}
          >
            <option value="vigor">Elevar Vigor</option>
            <option value="vontade">Elevar Vontade</option>
          </select>
          <button
            type="button"
            onClick={usarResistir}
            style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#21262d', color: '#3fb950', border: '1px solid #3fb950', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto', fontWeight: 'bold' }}
          >
            Executar Guarda
          </button>
        </div>
      )}
    </div>
  );
}