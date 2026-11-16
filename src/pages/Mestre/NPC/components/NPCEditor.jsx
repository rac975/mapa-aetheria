import React, { useState, useEffect } from 'react';
import { npcService } from '../../../../services/npcService';
import { 
  dadoParaNumero, 
  calcularPoderesPermitidos, 
  recalcularEstatisticasNpc,
  extrairBonusPoderes,
  calcularPvMaxNpc,
  calcularPmMaxNpc,
  calcularIniciativaNpc,
  calcularDefesaNpc,
  calcularDefesaMagicaNpc
} from '../../../../domain/fabula/npcRules';

export default function NPCEditor({ 
    npc, 
    onUpdate, 
    catalogoFeiticos = [], 
    catalogoPoderes = [], 
    catalogoEspecies: catalogoEspeciesProp,
    isCompanheiro = false, 
    nivelNP = 5, 
    nivelPersonagem = 1 
}) {
  const [catalogoEspeciesLocal, setCatalogoEspeciesLocal] = useState([]);

  // Se não foi passado via props (ex: uso fora de FichaNPCPage), carrega uma única vez
  useEffect(() => {
    if (catalogoEspeciesProp && catalogoEspeciesProp.length > 0) return;

    let ativo = true;
    async function carregarEspecies() {
      const { data, error } = await npcService.getCatalogoEspecies();
      if (!error && data && ativo) {
        setCatalogoEspeciesLocal(data);
      } else if (error) {
        console.error("❌ Erro ao carregar espécies:", error);
      }
    }
    carregarEspecies();
    return () => { ativo = false; };
  }, [catalogoEspeciesProp]);

  const catalogoEspecies = (catalogoEspeciesProp && catalogoEspeciesProp.length > 0)
    ? catalogoEspeciesProp
    : catalogoEspeciesLocal;

  // Encontra a espécie atual no catálogo carregado (Fallback para 'fera' caso não venha nada)
  const especieAtualObj = catalogoEspecies.find(e => e.id === (npc.especie || 'fera')) || {};
  const poderesIniciaisEspecie = especieAtualObj.poderes_iniciais || 2;
  const afinidadesPadraoEspecie = especieAtualObj.afinidades_padrao || {};

  // Calcula quantos poderes extras o NPC ganhou por ter vulnerabilidades adicionais via domain
  const { extrasPorVulnerabilidade: poderesExtrasVulnerabilidade, totalPermitido: totalPoderesPermitidos } =
    calcularPoderesPermitidos(npc.afinidades || {}, afinidadesPadraoEspecie, poderesIniciaisEspecie);

  // Recalcular as estatísticas baseadas nas regras do Fabula Ultima e na Patente (Rank)
  function recalcularEstatisticas(novosAtributos, novoNivel, novoRank, novaQtdSoldados) {
    return recalcularEstatisticasNpc({
      npc,
      novosAtributos,
      novoNivel,
      novoRank,
      novaQtdSoldados,
      isCompanheiro,
      nivelNP,
      nivelPersonagem
    });
  }

  function handleChange(campo, valor) {
    if (campo === 'nivel') {
      const atualizado = recalcularEstatisticas(null, valor, undefined, undefined);
      onUpdate({ ...atualizado, [campo]: valor });
    } else if (campo === 'rank') {
      const qtd = valor === 'elite' ? 2 : (npc.quantidade_soldados || 3);
      const atualizado = recalcularEstatisticas(null, undefined, valor, qtd);
      onUpdate(atualizado);
    } else if (campo === 'quantidade_soldados') {
      const atualizado = recalcularEstatisticas(null, undefined, undefined, valor);
      onUpdate(atualizado);
    } else if (campo === 'especie') {
      const novaEspObj = catalogoEspecies.find(e => e.id === valor) || {};
      const novasAfinidades = novaEspObj.afinidades_padrao || {};
      onUpdate({ ...npc, especie: valor, afinidades: novasAfinidades });
    } else {
      onUpdate({ ...npc, [campo]: valor });
    }
  }

  function handleAtributo(attr, valor) {
    const novosAtributos = { ...(npc.atributos || { des: 'd8', ast: 'd6', vig: 'd10', von: 'd8' }), [attr]: valor };
    const atualizado = recalcularEstatisticas(novosAtributos, undefined, undefined, undefined);
    onUpdate(atualizado);
  }

  function handleAfinidade(tipoDano, valor) {
    const afinidadesAtuais = npc.afinidades || {};
    const novasAfinidades = { ...afinidadesAtuais, [tipoDano]: valor };
    onUpdate({ ...npc, afinidades: novasAfinidades });
  }

  function handleTraco(index, valor) {
    const novosTracos = [...(npc.tracos || ['', '', '', ''])];
    novosTracos[index] = valor;
    onUpdate({ ...npc, tracos: novosTracos });
  }

  function adicionarAtaque() {
    if (isCompanheiro && (npc.ataques_basicos || []).length >= 2) {
      alert("⚠️ Companheiros Fiéis podem ter no máximo dois ataques básicos de acordo com as regras de Fabula Ultima.");
      return;
    }
    const novoAtaque = { 
      nome: 'Ataque Básico', 
      atributo_dado1: 'des', 
      atributo_dado2: 'vig', 
      bonus_precisao: 0, 
      bonus_dano: 0, 
      tipo_dano: 'fisico'
    };
    onUpdate({ ...npc, ataques_basicos: [...(npc.ataques_basicos || []), novoAtaque] });
  }

  function atualizarAtaque(index, campo, valor) {
    const atualizados = [...npc.ataques_basicos];
    atualizados[index][campo] = valor;
    onUpdate({ ...npc, ataques_basicos: atualizados });
  }

  function removerAtaque(index) {
    const atualizados = npc.ataques_basicos.filter((_, i) => i !== index);
    onUpdate({ ...npc, ataques_basicos: atualizados });
  }

  // Adiciona o poder e já recalcula atributos caso ele tenha bônus estatísticos (ex: Mais Iniciativa, Mais PV)
  function adicionarPoder(poderCatalogo) {
    const novosPoderes = [...(npc.poderes || []), poderCatalogo];
    const npcTemporario = { ...npc, poderes: novosPoderes };
    
    // Recalcula as estatísticas considerando o novo poder adicionado
    const npcAtualizado = recalcularEstatisticasNpc({
      npc: npcTemporario,
      isCompanheiro,
      nivelNP,
      nivelPersonagem
    });
    onUpdate({ ...npcAtualizado, poderes: novosPoderes });
  }

  function removerPoder(index) {
    const novosPoderes = (npc.poderes || []).filter((_, i) => i !== index);
    const npcTemporario = { ...npc, poderes: novosPoderes };
    
    const npcAtualizado = recalcularEstatisticasNpc({
      npc: npcTemporario,
      isCompanheiro,
      nivelNP,
      nivelPersonagem
    });
    onUpdate({ ...npcAtualizado, poderes: novosPoderes });
  }

  function adicionarFeitico(feiticoCatalogo) {
    onUpdate({ ...npc, feiticos: [...(npc.feiticos || []), feiticoCatalogo] });
  }

  function removerFeitico(index) {
    const atualizados = npc.feiticos.filter((_, i) => i !== index);
    onUpdate({ ...npc, feiticos: atualizados });
  }

  const tiposDano = ['fisico', 'fogo', 'gelo', 'raio', 'sombrio', 'luz', 'veneno', 'terra'];
  const tiposAfinidade = [
    { label: 'Normal', valor: '' },
    { label: 'Vulnerável (vul)', valor: 'vul' },
    { label: 'Resistente (res)', valor: 'res' },
    { label: 'Imune (imu)', valor: 'imu' },
    { label: 'Absorve (abs)', valor: 'abs' }
  ];

  const nivelAtual = isCompanheiro ? 5 : (npc.nivel || 5);
  const desNum = dadoParaNumero(npc.atributos?.des);
  const astNum = dadoParaNumero(npc.atributos?.ast);
  const vigNum = dadoParaNumero(npc.atributos?.vig);
  const vonNum = dadoParaNumero(npc.atributos?.von);
  const rankAtual = npc.rank || 'soldado';
  const qtdSoldadosAtual = npc.quantidade_soldados || 2;

  const { bonusPv: bonusPvMin, bonusIniciativa: bonusIniciativaMin } = extrairBonusPoderes(npc.poderes || []);

  const minPv = calcularPvMaxNpc({
    nivel: nivelAtual,
    vigNum,
    rank: rankAtual,
    quantidadeSoldados: qtdSoldadosAtual,
    isCompanheiro,
    nivelNP,
    nivelPersonagem,
    bonusPoderes: bonusPvMin
  });

  const minPm = calcularPmMaxNpc({
    nivel: nivelAtual,
    vonNum,
    rank: rankAtual,
    isCompanheiro
  });

  const minDefesa = calcularDefesaNpc(desNum);
  const minDefMagica = calcularDefesaMagicaNpc(astNum);
  const minIniciativa = calcularIniciativaNpc({
    desNum,
    astNum,
    rank: rankAtual,
    quantidadeSoldados: qtdSoldadosAtual,
    isCompanheiro,
    bonusPoderes: bonusIniciativaMin
  });

  const afinidadesSeguras = npc.afinidades || {};
  const especiesPermitidas = isCompanheiro
    ? ['construto', 'elemental', 'fera', 'planta'] 
    : ['construto', 'demonio', 'elemental', 'fera', 'humanoide', 'monstro', 'morto-vivo', 'planta'];

  return (
    <div className="npc-editor">
      <div className="header-section">
        <div>
          <h2>{isCompanheiro ? 'Configuração do Companheiro Fiel' : 'Editor de NPC (Automático & Patentes)'}</h2>
          <p>{isCompanheiro ? `Nível Fixo em 5 | Bônus de Precisão/Magia igual ao NP (${nivelNP})` : 'Regras de Soldado, Elite e Campeão integradas'}</p>
        </div>
        {!isCompanheiro && (
          <span>Rank: {npc.rank || 'soldado'}</span>
        )}
      </div>

      {/* 1. Dados Básicos e Patente */}
      <div className="form-grid">
        <div className="col-span-2">
          <label>Nome do Companheiro / NPC</label>
          <input
            type="text"
            value={npc.nome || ''}
            onChange={(e) => handleChange('nome', e.target.value)}
            placeholder="Ex: Fera Guardiã, Golias de Pedra..."
          />
        </div>

        <div>
          <label>Espécie {isCompanheiro && '(Restrito)'}</label>
          <select
            value={npc.especie || (isCompanheiro ? 'fera' : 'fera')}
            onChange={(e) => handleChange('especie', e.target.value)}
          >
            {especiesPermitidas.map((espId) => {
              const dadosEsp = catalogoEspecies.find(e => e.id === espId);
              return (
                <option key={espId} value={espId}>
                  {dadosEsp ? dadosEsp.nome.toUpperCase() : espId.toUpperCase()}
                </option>
              );
            })}
          </select>
          {especieAtualObj.regras_especiais && (
            <p style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '4px' }}>
              📌 {especieAtualObj.regras_especiais}
            </p>
          )}
        </div>

        <div>
          <label>Nível {isCompanheiro ? '(Fixo em 5)' : '(5 a 60)'}</label>
          <input
            type="number"
            min={5}
            max={60}
            disabled={isCompanheiro}
            value={isCompanheiro ? 5 : (npc.nivel || 5)}
            onChange={(e) => handleChange('nivel', parseInt(e.target.value, 10) || 5)}
            style={isCompanheiro ? { background: '#161b22', opacity: 0.7, cursor: 'not-allowed' } : {}}
          />
        </div>
      </div>

      {/* Configuração de Patente (Apenas para NPCs normais) */}
      {!isCompanheiro && (
        <div className="patente-section">
          <div>
            <label>Patente / Rank do Inimigo</label>
            <select
              value={npc.rank || 'soldado'}
              onChange={(e) => handleChange('rank', e.target.value)}
            >
              <option value="soldado">Soldado (Padrão)</option>
              <option value="elite">Elite (2x PV, +2 Iniciativa, 2 Turnos)</option>
              <option value="campeao">Campeão (Substitui Múltiplos Soldados)</option>
            </select>
          </div>

          {npc.rank === 'campeao' && (
            <div>
              <label>Soldados Substituídos (Qtd. Turnos/Multiplicador)</label>
              <input
                type="number"
                min={2}
                max={10}
                value={npc.quantidade_soldados || 2}
                onChange={(e) => handleChange('quantidade_soldados', parseInt(e.target.value, 10) || 2)}
              />
            </div>
          )}
        </div>
      )}

      {/* 2. Atributos Básicos */}
      <div className="atributos-section">
        <h3>Atributos Básicos (Alimentam o Cálculo Automático)</h3>
        <div className="atributos-grid">
          {['des', 'ast', 'vig', 'von'].map((attr) => (
            <div key={attr}>
              <label>{attr.toUpperCase()}</label>
              <select
                value={npc.atributos?.[attr] || 'd8'}
                onChange={(e) => handleAtributo(attr, e.target.value)}
              >
                {['d6', 'd8', 'd10', 'd12'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Estatísticas de Combate Calculadas */}
      <div className="stats-section">
        <div className="stats-header">
          <h3>Estatísticas Calculadas {isCompanheiro ? '(Regra do Companheiro Fiel)' : '(Mínimo definido pelas regras)'}</h3>
          <span>{isCompanheiro ? `Bônus de Precisão e Magia: +${nivelNP}` : 'Ajustadas automaticamente pelo Nível, Atributos e Patente'}</span>
        </div>
        <div className="stats-grid">
          <div>
            <label>PV Máx (Mín: {minPv})</label>
            <input
              type="number"
              min={minPv}
              value={npc.pv_max !== undefined ? npc.pv_max : minPv}
              onChange={(e) => handleChange('pv_max', Math.max(minPv, parseInt(e.target.value, 10) || minPv))}
            />
          </div>
          <div>
            <label>PM Máx (Mín: {minPm})</label>
            <input
              type="number"
              min={minPm}
              value={npc.pm_max !== undefined ? npc.pm_max : minPm}
              onChange={(e) => handleChange('pm_max', Math.max(minPm, parseInt(e.target.value, 10) || minPm))}
            />
          </div>
          <div>
            <label>Defesa (Mín: {minDefesa})</label>
            <input
              type="number"
              min={minDefesa}
              value={npc.defesa !== undefined ? npc.defesa : minDefesa}
              onChange={(e) => handleChange('defesa', Math.max(minDefesa, parseInt(e.target.value, 10) || minDefesa))}
            />
          </div>
          <div>
            <label>Def. Mágica (Mín: {minDefMagica})</label>
            <input
              type="number"
              min={minDefMagica}
              value={npc.defesa_magica !== undefined ? npc.defesa_magica : minDefMagica}
              onChange={(e) => handleChange('defesa_magica', Math.max(minDefMagica, parseInt(e.target.value, 10) || minDefMagica))}
            />
          </div>
          <div>
            <label>Iniciativa {isCompanheiro && '(Não possui)'} (Mín: {minIniciativa})</label>
            <input
              type="number"
              min={minIniciativa}
              disabled={isCompanheiro}
              value={isCompanheiro ? 0 : (npc.iniciativa !== undefined ? npc.iniciativa : minIniciativa)}
              onChange={(e) => handleChange('iniciativa', Math.max(minIniciativa, parseInt(e.target.value, 10) || minIniciativa))}
              style={isCompanheiro ? { background: '#161b22', opacity: 0.7, cursor: 'not-allowed' } : {}}
            />
          </div>
        </div>
      </div>

      {/* 4. Afinidades a Danos */}
      <div className="afinidades-section">
        <h3>Afinidades a Danos</h3>
        <div className="afinidades-grid">
          {tiposDano.map((tipo) => (
            <div key={tipo}>
              <label>{tipo}</label>
              <select
                value={afinidadesSeguras[tipo] || ''}
                onChange={(e) => handleAfinidade(tipo, e.target.value)}
              >
                {tiposAfinidade.map((af) => (
                  <option key={af.valor} value={af.valor}>{af.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Traços da Criatura */}
      <div className="tracos-section">
        <h3>Traços do Companheiro / Criatura</h3>
        <div className="tracos-grid">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              type="text"
              placeholder={`Traço ${index + 1}`}
              value={npc.tracos?.[index] || ''}
              onChange={(e) => handleTraco(index, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* 6. Ataques Básicos */}
      <div className="ataques-section">
        <div className="ataques-header">
          <h3>Ataques Básicos {isCompanheiro && `(${(npc.ataques_basicos || []).length}/2 Máximo)`}</h3>
          <button type="button" onClick={adicionarAtaque}>+ Adicionar Ataque</button>
        </div>
        <div className="ataques-list">
          {npc.ataques_basicos?.map((atk, index) => (
            <div key={index} className="ataque-item">
              <input
                type="text"
                placeholder="Nome do Ataque"
                value={atk.nome || ''}
                onChange={(e) => atualizarAtaque(index, 'nome', e.target.value)}
              />
              <select
                value={atk.atributo_dado1 || 'des'}
                onChange={(e) => atualizarAtaque(index, 'atributo_dado1', e.target.value)}
              >
                {['des', 'ast', 'vig', 'von'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={atk.atributo_dado2 || 'vig'}
                onChange={(e) => atualizarAtaque(index, 'atributo_dado2', e.target.value)}
              >
                {['des', 'ast', 'vig', 'von'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input
                type="text"
                placeholder="Tipo (ex: fisico)"
                value={atk.tipo_dano || ''}
                onChange={(e) => atualizarAtaque(index, 'tipo_dano', e.target.value)}
              />
              <button type="button" onClick={() => removerAtaque(index)}>Remover</button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Poderes e Feitiços */}
      <div className="poderes-feiticos-grid">
        <div className="card-secao">
          <h3>
            Poderes Especiais ({npc.poderes?.length || 0} / {totalPoderesPermitidos} máx)
          </h3>
          <div style={{ fontSize: '0.75rem', color: '#3fb950', marginBottom: '8px' }}>
            ✨ Base da espécie ({poderesIniciaisEspecie}) {poderesExtrasVulnerabilidade > 0 ? `+ ${poderesExtrasVulnerabilidade} bônus por vulnerabilidades` : ''}
          </div>
          <select
            onChange={(e) => {
              const p = catalogoPoderes.find(item => item.id === e.target.value);
              if (p) adicionarPoder(p);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Selecionar poder...</option>
            {catalogoPoderes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <div className="lista-scroll">
            {npc.poderes?.map((p, i) => (
              <div key={i} className="item-catalogo">
                <div>
                  <strong>{p.nome}</strong>
                  <p>{p.descricao}</p>
                </div>
                <button type="button" onClick={() => removerPoder(i)}>Remover</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card-secao">
          <h3>Feitiços e Magias</h3>
          <select
            onChange={(e) => {
              const f = catalogoFeiticos.find(item => item.id === e.target.value);
              if (f) adicionarFeitico(f);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Selecionar feitiço...</option>
            {catalogoFeiticos.map(f => <option key={f.id} value={f.id}>{f.nome} ({f.pm_custo} PM)</option>)}
          </select>
          <div className="lista-scroll">
            {npc.feiticos?.map((f, i) => (
              <div key={i} className="item-catalogo">
                <div>
                  <strong>{f.nome}</strong>
                  <span>({f.pm_custo} PM)</span>
                  <p>{f.descricao}</p>
                </div>
                <button type="button" onClick={() => removerFeitico(i)}>Remover</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
