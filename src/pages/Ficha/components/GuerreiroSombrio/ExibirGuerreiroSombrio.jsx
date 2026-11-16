// import React, { useState } from 'react';
import { FaMoon, FaSkull, FaHeartbeat } from 'react-icons/fa';
import { processarGolpeDasSombras } from './processarGolpeDasSombras';

export default function ExibirGuerreiroSombrio({ ficha, handleAjustarRecurso, vigorValor = 8, emCriseGlobal, classes = [], onAtivarGolpe }) {
  // const [dadoVigorRolado, setDadoVigorRolado] = useState(8);

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel) || 0;
  };

  const nvAgonia = getNivel('agonia');
  const nvCoracao = getNivel('coracao da escuridao');
  const nvGolpe = getNivel('golpe das sombras');
  const nvLicao = getNivel('licao dolorosa');
  const nvSangue = getNivel('sangue das trevas');

  if (nvAgonia + nvCoracao + nvGolpe + nvLicao + nvSangue === 0) {
    return null;
  }

  const recAgonia = nvAgonia * 2;
  // const danoExtraGolpe = nvGolpe + dadoVigorRolado;

  const usarAgonia = () => {
    if (!handleAjustarRecurso) return;

    const valorRecuperacao = nvAgonia * 2;

    if (window.confirm(`Ativar Agonia? Recuperar ${valorRecuperacao} PV e ${valorRecuperacao} MP.`)) {
      handleAjustarRecurso('hp_atual', valorRecuperacao);
      handleAjustarRecurso('mp_atual', valorRecuperacao);
    }
  };

  const acionarGolpeDasSombras = () => {
    if (!handleAjustarRecurso) return;

    const resultado = processarGolpeDasSombras(ficha, classes, vigorValor);

    if (!resultado.sucesso) {
      window.alert(resultado.mensagem);
      return;
    }

    if (window.confirm(`${resultado.mensagem}\n\nDeseja executar o golpe e perder ${resultado.custoPv} PV?`)) {
      // 1. Deduz o PV atual
      handleAjustarRecurso('hp_atual', -resultado.custoPv);

      // 2. Cria o objeto de opções do golpe
      const opcoesDanoExtra = {
        usandoGolpeDasSombras: true,
        resultadoVigorRolado: resultado.custoPv // O PV perdido é o valor exato do dVigor
      };

      // 3. Comunica o componente pai (FichaClassesSecao ou FichaPage) que o golpe está armado!
      if (onAtivarGolpe) {
        onAtivarGolpe(opcoesDanoExtra);
      }

      window.alert(`💥 Golpe das Sombras Armado para o próximo ataque!\n- PV Sacrificados: -${resultado.custoPv}\n- Dano de Trevas Adicional: +${resultado.danoAdicional}`);
    }
  };

  if (nvGolpe === 0) return null;

  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '0.75rem', color: '#bc8cff', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaMoon /> Disciplina Sombria — Guerreiro Sombrio
        </div>

        {emCriseGlobal && nvSangue > 0 && (
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: 'rgba(63, 185, 80, 0.2)', border: '1px solid #3fb950', color: '#3fb950', borderRadius: '4px' }}>
            🛡️ Sangue das Trevas Ativo (Resistência a Trevas e Veneno)
          </span>
        )}
      </div>

      {/* Resumo Passivo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.75rem', marginBottom: '8px' }}>
        {nvCoracao > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #bc8cff', color: '#bc8cff' }}>
            🖤 Coração da Escuridão disponível (1x/cena)
          </span>
        )}
        {nvLicao > 0 && (
          <span style={{ background: '#0d1117', padding: '3px 7px', borderRadius: '4px', border: '1px solid #d4af37', color: '#d4af37' }}>
            👁️ Lição Dolorosa: Bônus de <strong>+{nvLicao}</strong> ao Estudar após sofrer dano
          </span>
        )}
      </div>

      {/* Ação Agonia */}
      {nvAgonia > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <button
            type="button"
            onClick={usarAgonia}
            style={{ width: '100%', padding: '5px', fontSize: '0.78rem', background: '#21262d', color: '#bc8cff', border: '1px solid #bc8cff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <FaHeartbeat /> Acionar Agonia (Recuperar +{recAgonia} PV e +{recAgonia} MP)
          </button>
        </div>
      )}

      {/* Ação Golpe das Sombras */}
      {nvGolpe > 0 && (
        <div style={{ padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.78rem' }}>
          <div style={{ color: '#bc8cff', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSkull /> Golpe das Sombras (Sacrifício de Vigor)
          </div>
          <button
            type="button"
            onClick={acionarGolpeDasSombras}
            style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#da3633', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Executar Golpe das Sombras (Rolar d{vigorValor})
          </button>
        </div>
      )}
    </div>
  );
}