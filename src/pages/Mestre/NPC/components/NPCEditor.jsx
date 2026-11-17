import React, { useState, useEffect } from 'react';
import { 
  FaDice, 
  FaShieldAlt, 
  FaHeart, 
  FaPlus, 
  FaTrash, 
  FaFistRaised, 
  FaDragon, 
  FaMagic 
} from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
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
  calcularDefesaMagicaNpc,
  clampRecursoNpc
} from '../../../../domain/fabula/npcRules';
import { Card, Button, Badge } from '../../../../components/ui';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './NPCEditor.module.css';

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
  const { showAlert } = useAlert();
  const [catalogoEspeciesLocal, setCatalogoEspeciesLocal] = useState([]);

  useEffect(() => {
    if (catalogoEspeciesProp && catalogoEspeciesProp.length > 0) return;

    let ativo = true;
    async function carregarEspecies() {
      const { data, error } = await npcService.getCatalogoEspecies();
      if (!error && data && ativo) {
        setCatalogoEspeciesLocal(data);
      } else if (error) {
        console.error('❌ Erro ao carregar espécies:', error);
      }
    }
    carregarEspecies();
    return () => { ativo = false; };
  }, [catalogoEspeciesProp]);

  const catalogoEspecies = (catalogoEspeciesProp && catalogoEspeciesProp.length > 0)
    ? catalogoEspeciesProp
    : catalogoEspeciesLocal;

  const especieAtualObj = catalogoEspecies.find(e => e.id === (npc.especie || 'fera')) || {};
  const poderesIniciaisEspecie = especieAtualObj.poderes_iniciais || 2;
  const afinidadesPadraoEspecie = especieAtualObj.afinidades_padrao || {};

  const { extrasPorVulnerabilidade: poderesExtrasVulnerabilidade, totalPermitido: totalPoderesPermitidos } =
    calcularPoderesPermitidos(npc.afinidades || {}, afinidadesPadraoEspecie, poderesIniciaisEspecie);

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
    } else if (campo === 'pv_max') {
      const novoMax = Math.max(0, parseInt(valor, 10) || 0);
      const updates = { pv_max: novoMax, hp_max: novoMax, maxHp: novoMax };
      if (npc.pv_atual !== undefined) {
        updates.pv_atual = clampRecursoNpc(npc.pv_atual, novoMax, 0);
      }
      if (npc.hp_atual !== undefined) {
        updates.hp_atual = clampRecursoNpc(npc.hp_atual, novoMax, 0);
      }
      onUpdate({ ...npc, ...updates });
    } else if (campo === 'pm_max') {
      const novoMax = Math.max(0, parseInt(valor, 10) || 0);
      const updates = { pm_max: novoMax, mp_max: novoMax, maxMp: novoMax };
      if (npc.pm_atual !== undefined) {
        updates.pm_atual = clampRecursoNpc(npc.pm_atual, novoMax, 0);
      }
      if (npc.mp_atual !== undefined) {
        updates.mp_atual = clampRecursoNpc(npc.mp_atual, novoMax, 0);
      }
      onUpdate({ ...npc, ...updates });
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
      showAlert('⚠️ Companheiros Fiéis podem ter no máximo dois ataques básicos de acordo com as regras de Fabula Ultima.');
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

  function adicionarPoder(poderCatalogo) {
    const novosPoderes = [...(npc.poderes || []), poderCatalogo];
    const npcTemporario = { ...npc, poderes: novosPoderes };
    
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

  const getRankBadgeVariant = (rank) => {
    switch (rank) {
      case 'elite': return 'ether';
      case 'campeao': return 'crise';
      default: return 'gold';
    }
  };

  return (
    <div className={styles.editorContainer}>
      {/* 1. Cabeçalho do Editor */}
      <Card variant="default">
        <div className={styles.headerSection}>
          <div>
            <h2 className={styles.editorTitle}>
              {isCompanheiro ? 'Configuração do Companheiro Fiel' : 'Editor de NPC (Automático & Patentes)'}
            </h2>
            <p className={styles.editorSubtitle}>
              {isCompanheiro 
                ? `Nível Fixo em 5 | Bônus de Precisão/Magia igual ao NP (${nivelNP})` 
                : 'Regras de Soldado, Elite e Campeão integradas às regras de Fabula Ultima'}
            </p>
          </div>
          {!isCompanheiro && (
            <Badge variant={getRankBadgeVariant(npc.rank)} size="md">
              RANK: {npc.rank?.toUpperCase() || 'SOLDADO'}
            </Badge>
          )}
        </div>
      </Card>

      {/* 2. Dados Básicos e Patente */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaDragon /> Dados Básicos</h3>
        <div className={styles.formGrid}>
          <div className={styles.colSpan2}>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Nome do Companheiro / NPC</label>
              <input
                type="text"
                className={styles.input}
                value={npc.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Fera Guardiã, Golias de Pedra..."
              />
            </div>
          </div>

          <div>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Espécie {isCompanheiro && '(Restrito)'}</label>
              <select
                className={styles.select}
                value={npc.especie || 'fera'}
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
                <span className={styles.regrasEspeciais}>
                  📌 {especieAtualObj.regras_especiais}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Nível {isCompanheiro ? '(Fixo)' : '(5 a 60)'}</label>
              <input
                type="number"
                min={5}
                max={60}
                disabled={isCompanheiro}
                className={`${styles.input} ${isCompanheiro ? styles.inputDisabled : ''}`}
                value={isCompanheiro ? 5 : (npc.nivel || 5)}
                onChange={(e) => handleChange('nivel', parseInt(e.target.value, 10) || 5)}
              />
            </div>
          </div>
        </div>

        {/* Configuração de Patente */}
        {!isCompanheiro && (
          <div className={styles.patenteGrid}>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Patente / Rank do Inimigo</label>
              <select
                className={styles.select}
                value={npc.rank || 'soldado'}
                onChange={(e) => handleChange('rank', e.target.value)}
              >
                <option value="soldado">Soldado (Padrão)</option>
                <option value="elite">Elite (2x PV, +2 Iniciativa, 2 Turnos)</option>
                <option value="campeao">Campeão (Substitui Múltiplos Soldados)</option>
              </select>
            </div>

            {npc.rank === 'campeao' && (
              <div className={styles.fieldWrapper}>
                <label className={styles.label}>Soldados Substituídos (Multiplicador)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  className={styles.input}
                  value={npc.quantidade_soldados || 2}
                  onChange={(e) => handleChange('quantidade_soldados', parseInt(e.target.value, 10) || 2)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 3. Atributos Básicos */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaDice /> Atributos Básicos (Cálculo Automático)</h3>
        <div className={styles.atributosGrid}>
          {['des', 'ast', 'vig', 'von'].map((attr) => (
            <div key={attr} className={styles.fieldWrapper}>
              <label className={styles.label}>{attr.toUpperCase()}</label>
              <select
                className={styles.select}
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
      </Card>

      {/* 4. Estatísticas de Combate Calculadas */}
      <Card variant="default">
        <div className={styles.sectionHeaderFlex}>
          <h3><FaHeart /> Estatísticas Calculadas</h3>
          <span className={styles.sectionSubtext}>
            {isCompanheiro ? `Precisão & Magia: +${nivelNP}` : 'Ajustadas pelo Nível, Atributos e Patente'}
          </span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>PV Máx (Mín: {minPv})</label>
            <input
              type="number"
              min={minPv}
              className={styles.input}
              value={npc.pv_max !== undefined ? npc.pv_max : minPv}
              onChange={(e) => handleChange('pv_max', Math.max(minPv, parseInt(e.target.value, 10) || minPv))}
            />
          </div>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>PM Máx (Mín: {minPm})</label>
            <input
              type="number"
              min={minPm}
              className={styles.input}
              value={npc.pm_max !== undefined ? npc.pm_max : minPm}
              onChange={(e) => handleChange('pm_max', Math.max(minPm, parseInt(e.target.value, 10) || minPm))}
            />
          </div>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Defesa (Mín: {minDefesa})</label>
            <input
              type="number"
              min={minDefesa}
              className={styles.input}
              value={npc.defesa !== undefined ? npc.defesa : minDefesa}
              onChange={(e) => handleChange('defesa', Math.max(minDefesa, parseInt(e.target.value, 10) || minDefesa))}
            />
          </div>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Def. Mágica (Mín: {minDefMagica})</label>
            <input
              type="number"
              min={minDefMagica}
              className={styles.input}
              value={npc.defesa_magica !== undefined ? npc.defesa_magica : minDefMagica}
              onChange={(e) => handleChange('defesa_magica', Math.max(minDefMagica, parseInt(e.target.value, 10) || minDefMagica))}
            />
          </div>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Iniciativa (Mín: {minIniciativa})</label>
            <input
              type="number"
              min={minIniciativa}
              disabled={isCompanheiro}
              className={`${styles.input} ${isCompanheiro ? styles.inputDisabled : ''}`}
              value={isCompanheiro ? 0 : (npc.iniciativa !== undefined ? npc.iniciativa : minIniciativa)}
              onChange={(e) => handleChange('iniciativa', Math.max(minIniciativa, parseInt(e.target.value, 10) || minIniciativa))}
            />
          </div>
        </div>
      </Card>

      {/* 5. Afinidades a Danos */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaShieldAlt /> Afinidades a Danos</h3>
        <div className={styles.afinidadesGrid}>
          {tiposDano.map((tipo) => (
            <div key={tipo} className={styles.fieldWrapper}>
              <label className={styles.label}>{tipo}</label>
              <select
                className={styles.select}
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
      </Card>

      {/* 6. Traços da Criatura */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}>Traços do Companheiro / Criatura</h3>
        <div className={styles.tracosGrid}>
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              type="text"
              className={styles.input}
              placeholder={`Traço ${index + 1}`}
              value={npc.tracos?.[index] || ''}
              onChange={(e) => handleTraco(index, e.target.value)}
            />
          ))}
        </div>
      </Card>

      {/* 7. Ataques Básicos */}
      <Card variant="default">
        <div className={styles.sectionHeaderFlex}>
          <h3><FaFistRaised /> Ataques Básicos {isCompanheiro && `(${(npc.ataques_basicos || []).length}/2 Máximo)`}</h3>
          <Button variant="secondary" size="sm" onClick={adicionarAtaque}>
            <FaPlus /> Adicionar Ataque
          </Button>
        </div>
        <div className={styles.ataquesList}>
          {npc.ataques_basicos?.map((atk, index) => (
            <div key={index} className={styles.ataqueItem}>
              <input
                type="text"
                className={styles.input}
                placeholder="Nome do Ataque"
                value={atk.nome || ''}
                onChange={(e) => atualizarAtaque(index, 'nome', e.target.value)}
              />
              <select
                className={styles.select}
                value={atk.atributo_dado1 || 'des'}
                onChange={(e) => atualizarAtaque(index, 'atributo_dado1', e.target.value)}
              >
                {['des', 'ast', 'vig', 'von'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
              <select
                className={styles.select}
                value={atk.atributo_dado2 || 'vig'}
                onChange={(e) => atualizarAtaque(index, 'atributo_dado2', e.target.value)}
              >
                {['des', 'ast', 'vig', 'von'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
              <input
                type="text"
                className={styles.input}
                placeholder="Tipo (ex: fisico)"
                value={atk.tipo_dano || ''}
                onChange={(e) => atualizarAtaque(index, 'tipo_dano', e.target.value)}
              />
              <Button variant="danger" size="sm" onClick={() => removerAtaque(index)} title="Remover ataque">
                <FaTrash />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. Poderes e Feitiços */}
      <div className={styles.poderesFeiticosGrid}>
        <Card variant="default">
          <h3 className={styles.sectionTitle}>
            Poderes Especiais ({npc.poderes?.length || 0} / {totalPoderesPermitidos} máx)
          </h3>
          <div className={styles.catalogoBonusText}>
            <LuSparkles /> Base da espécie ({poderesIniciaisEspecie}) {poderesExtrasVulnerabilidade > 0 ? `+ ${poderesExtrasVulnerabilidade} bônus por vulnerabilidades` : ''}
          </div>
          <select
            className={styles.select}
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
          <div className={styles.listaScroll}>
            {npc.poderes?.map((p, i) => (
              <div key={i} className={styles.itemCatalogo}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{p.nome}</span>
                  <p className={styles.itemDesc}>{p.descricao}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => removerPoder(i)} title="Remover poder">
                  <FaTrash />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default">
          <h3 className={styles.sectionTitle}><FaMagic /> Feitiços e Magias</h3>
          <select
            className={styles.select}
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
          <div className={styles.listaScroll}>
            {npc.feiticos?.map((f, i) => (
              <div key={i} className={styles.itemCatalogo}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{f.nome} ({f.pm_custo} PM)</span>
                  <p className={styles.itemDesc}>{f.descricao}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => removerFeitico(i)} title="Remover feitiço">
                  <FaTrash />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
