import React, { useState, useEffect } from 'react';
import { FaDice, FaDragon } from 'react-icons/fa';
import { npcService } from '../../../../services/npcService';
import {
  dadoParaNumero, calcularPoderesPermitidos, recalcularEstatisticasNpc, extrairBonusPoderes,
  calcularPvMaxNpc, calcularPmMaxNpc, calcularIniciativaNpc, calcularDefesaNpc,
  calcularDefesaMagicaNpc, clampRecursoNpc, ajustarPoderesNpc
} from '../../../../domain/fabula/npcRules';
import { Card, Badge } from '../../../../components/ui';
import { useAlert } from '../../../../contexts/useAlert';
import NPCVillainEditorSection from './NPCVillainEditorSection';
import NPCEstatisticasCalculadasCard from './NPCEstatisticasCalculadasCard';
import NPCCombatCatalogsEditor from './NPCCombatCatalogsEditor';
import styles from './NPCEditor.module.css';

export default function NPCEditor({
  npc, onUpdate, catalogoFeiticos = [], catalogoPoderes = [],
  catalogoEspecies: catalogoEspeciesProp, isCompanheiro = false, nivelNP = 5, nivelPersonagem = 1
}) {
  const { showAlert } = useAlert();
  const [catalogoEspeciesLocal, setCatalogoEspeciesLocal] = useState([]);

  useEffect(() => {
    if (catalogoEspeciesProp && catalogoEspeciesProp.length > 0) return;
    let ativo = true;
    npcService.getCatalogoEspecies().then(({ data, error }) => {
      if (!error && data && ativo) setCatalogoEspeciesLocal(data);
    });
    return () => { ativo = false; };
  }, [catalogoEspeciesProp]);

  const catalogoEspecies = (catalogoEspeciesProp && catalogoEspeciesProp.length > 0) ? catalogoEspeciesProp : catalogoEspeciesLocal;
  const especieAtualObj = catalogoEspecies.find((e) => e.id === (npc.especie || 'fera')) || {};
  const poderesIniciaisEspecie = especieAtualObj.poderes_iniciais || 2;
  const afinidadesPadraoEspecie = especieAtualObj.afinidades_padrao || {};

  const { extrasPorVulnerabilidade: poderesExtrasVulnerabilidade, totalPermitido: totalPoderesPermitidos } =
    calcularPoderesPermitidos(npc.afinidades || {}, afinidadesPadraoEspecie, poderesIniciaisEspecie);

  const recalcularEstatisticas = (novosAtributos, novoNivel, novoRank, novaQtdSoldados) =>
    recalcularEstatisticasNpc({ npc, novosAtributos, novoNivel, novoRank, novaQtdSoldados, isCompanheiro, nivelNP, nivelPersonagem });

  function handleChange(campo, valor) {
    if (campo === 'nivel') {
      onUpdate({ ...recalcularEstatisticas(null, valor, undefined, undefined), [campo]: valor });
    } else if (campo === 'rank') {
      const qtd = valor === 'elite' ? 2 : (npc.quantidade_soldados || 3);
      onUpdate(recalcularEstatisticas(null, undefined, valor, qtd));
    } else if (campo === 'quantidade_soldados') {
      onUpdate(recalcularEstatisticas(null, undefined, undefined, valor));
    } else if (campo === 'especie') {
      const novaEspObj = catalogoEspecies.find((e) => e.id === valor) || {};
      onUpdate({ ...npc, especie: valor, afinidades: novaEspObj.afinidades_padrao || {} });
    } else if (campo === 'pv_max' || campo === 'pm_max') {
      const isPv = campo === 'pv_max';
      if (valor === '') {
        onUpdate({ ...npc, [campo]: '' });
        return;
      }
      const parsed = parseInt(valor, 10);
      const novoMax = isNaN(parsed) ? (isPv ? 1 : 0) : Math.max(isPv ? 1 : 0, parsed);
      const updates = isPv ? { pv_max: novoMax } : { pm_max: novoMax };
      if (isPv) {
        const antigoMax = Number(npc.pv_max) || minPv;
        const delta = novoMax - antigoMax;
        const atual = npc.pv_atual !== undefined ? Number(npc.pv_atual) : (npc.hp_atual !== undefined ? Number(npc.hp_atual) : novoMax);
        const novoAtual = delta > 0 ? atual + delta : Math.min(atual, novoMax);
        updates.pv_atual = clampRecursoNpc(novoAtual, novoMax, 0);
      } else {
        const atual = npc.pm_atual !== undefined ? npc.pm_atual : (npc.mp_atual !== undefined ? npc.mp_atual : novoMax);
        updates.pm_atual = clampRecursoNpc(atual, novoMax, 0);
      }
      onUpdate({ ...npc, ...updates });
    } else {
      onUpdate({ ...npc, [campo]: valor });
    }
  }

  function adicionarAtaque() {
    if (isCompanheiro && (npc.ataques_basicos || []).length >= 2) {
      showAlert('⚠️ Companheiros Fiéis podem ter no máximo dois ataques básicos.');
      return;
    }
    const novoAtaque = {
      nome: 'Ataque Básico',
      alcance: 'corpo_a_corpo',
      atributo_dado1: 'des',
      atributo_dado2: 'vig',
      bonus_precisao: 0,
      bonus_dano: 5,
      tipo_dano: 'fisico',
      condicao: '',
      efeito: ''
    };
    onUpdate({ ...npc, ataques_basicos: [...(npc.ataques_basicos || []), novoAtaque] });
  }

  const nivelAtual = isCompanheiro ? 5 : (npc.nivel || 5);
  const desNum = dadoParaNumero(npc.atributos?.des);
  const astNum = dadoParaNumero(npc.atributos?.ast);
  const vigNum = dadoParaNumero(npc.atributos?.vig);
  const vonNum = dadoParaNumero(npc.atributos?.von);
  const rankAtual = npc.rank || 'soldado';
  const qtdSoldadosAtual = npc.quantidade_soldados || 2;
  const { bonusPv: bonusPvMin, bonusIniciativa: bonusIniciativaMin } = extrairBonusPoderes(npc.poderes || []);

  const minPv = calcularPvMaxNpc({ nivel: nivelAtual, vigNum, rank: rankAtual, quantidadeSoldados: qtdSoldadosAtual, isCompanheiro, nivelNP, nivelPersonagem, bonusPoderes: bonusPvMin });
  const minPm = calcularPmMaxNpc({ nivel: nivelAtual, vonNum, rank: rankAtual, isCompanheiro });
  const minDefesa = calcularDefesaNpc(desNum);
  const minDefMagica = calcularDefesaMagicaNpc(astNum);
  const minIniciativa = calcularIniciativaNpc({ desNum, astNum, rank: rankAtual, quantidadeSoldados: qtdSoldadosAtual, isCompanheiro, bonusPoderes: bonusIniciativaMin });

  const especiesPermitidas = isCompanheiro
    ? ['construto', 'elemental', 'fera', 'planta']
    : ['construto', 'demonio', 'elemental', 'fera', 'humanoide', 'monstro', 'morto-vivo', 'planta'];

  return (
    <div className={styles.editorContainer}>
      <Card variant="default">
        <div className={styles.headerSection}>
          <div>
            <h2 className={styles.editorTitle}>
              {isCompanheiro ? 'Configuração do Companheiro Fiel' : 'Editor de NPC (Automático & Mecânicas de Vilão)'}
            </h2>
            <p className={styles.editorSubtitle}>
              {isCompanheiro
                ? `Nível Fixo em 5 | Bônus de Precisão/Magia igual ao NP (${nivelNP})`
                : 'Regras de Soldado, Elite, Campeão e Vilões Épicos de Fabula Ultima'}
            </p>
          </div>
          {!isCompanheiro && (
            <Badge variant={npc.rank === 'elite' ? 'ether' : npc.rank === 'campeao' ? 'crise' : 'gold'} size="md">
              RANK: {npc.rank?.toUpperCase() || 'SOLDADO'}
            </Badge>
          )}
        </div>
      </Card>

      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaDragon /> Dados Básicos</h3>
        <div className={styles.formGrid}>
          <div className={styles.colSpan2}>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Nome do Companheiro / NPC</label>
              <input type="text" className={styles.input} value={npc.nome || ''} onChange={(e) => handleChange('nome', e.target.value)} placeholder="Ex: Fera Guardiã, Golias de Pedra..." />
            </div>
          </div>

          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Espécie {isCompanheiro && '(Restrito)'}</label>
            <select className={styles.select} value={npc.especie || 'fera'} onChange={(e) => handleChange('especie', e.target.value)}>
              {especiesPermitidas.map((espId) => {
                const dadosEsp = catalogoEspecies.find((e) => e.id === espId);
                return <option key={espId} value={espId}>{dadosEsp ? dadosEsp.nome.toUpperCase() : espId.toUpperCase()}</option>;
              })}
            </select>
            {especieAtualObj.regras_especiais && <span className={styles.regrasEspeciais}>📌 {especieAtualObj.regras_especiais}</span>}
          </div>

          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Nível {isCompanheiro ? '(Fixo)' : '(5 a 60)'}</label>
            <input type="number" min={5} max={60} disabled={isCompanheiro} className={`${styles.input} ${isCompanheiro ? styles.inputDisabled : ''}`} value={isCompanheiro ? 5 : (npc.nivel || 5)} onChange={(e) => handleChange('nivel', parseInt(e.target.value, 10) || 5)} />
          </div>

          <div className={styles.checkboxFieldWrapper}>
            <label className={styles.checkboxLabel} title="Marcar criatura como voadora">
              <input type="checkbox" checked={Boolean(npc.voador)} onChange={(e) => handleChange('voador', e.target.checked)} className={styles.checkbox} />
              <span>🦅 Criatura Voadora</span>
            </label>
          </div>
        </div>

        {!isCompanheiro && (
          <div className={styles.patenteGrid}>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Patente / Rank do Inimigo</label>
              <select className={styles.select} value={npc.rank || 'soldado'} onChange={(e) => handleChange('rank', e.target.value)}>
                <option value="soldado">Soldado (Padrão)</option>
                <option value="elite">Elite (2x PV, +2 Iniciativa, 2 Turnos)</option>
                <option value="campeao">Campeão (Substitui Múltiplos Soldados)</option>
              </select>
            </div>
            {npc.rank === 'campeao' && (
              <div className={styles.fieldWrapper}>
                <label className={styles.label}>Soldados Substituídos (Multiplicador)</label>
                <input type="number" min={2} max={10} className={styles.input} value={npc.quantidade_soldados || 2} onChange={(e) => handleChange('quantidade_soldados', parseInt(e.target.value, 10) || 2)} />
              </div>
            )}
          </div>
        )}
      </Card>

      <NPCVillainEditorSection npc={npc} onUpdate={onUpdate} isCompanheiro={isCompanheiro} />

      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaDice /> Atributos Básicos (Cálculo Automático)</h3>
        <div className={styles.atributosGrid}>
          {['des', 'ast', 'vig', 'von'].map((attr) => (
            <div key={attr} className={styles.fieldWrapper}>
              <label className={styles.label}>{attr.toUpperCase()}</label>
              <select className={styles.select} value={npc.atributos?.[attr] || 'd8'} onChange={(e) => onUpdate(recalcularEstatisticas({ ...(npc.atributos || { des: 'd8', ast: 'd6', vig: 'd10', von: 'd8' }), [attr]: e.target.value }, undefined, undefined, undefined))}>
                {['d6', 'd8', 'd10', 'd12'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <NPCEstatisticasCalculadasCard
        npc={npc}
        minPv={minPv}
        minPm={minPm}
        minDefesa={minDefesa}
        minDefMagica={minDefMagica}
        minIniciativa={minIniciativa}
        isCompanheiro={isCompanheiro}
        nivelNP={nivelNP}
        onChangeCampo={handleChange}
      />

      <NPCCombatCatalogsEditor
        npc={npc}
        isCompanheiro={isCompanheiro}
        totalPoderesPermitidos={totalPoderesPermitidos}
        poderesIniciaisEspecie={poderesIniciaisEspecie}
        poderesExtrasVulnerabilidade={poderesExtrasVulnerabilidade}
        catalogoPoderes={catalogoPoderes}
        catalogoFeiticos={catalogoFeiticos}
        onUpdateNpc={onUpdate}
        onAdicionarAtaque={adicionarAtaque}
        onAtualizarAtaque={(idx, campo, valor) => {
          const atualizados = [...(npc.ataques_basicos || [])];
          atualizados[idx] = { ...atualizados[idx], [campo]: valor };
          onUpdate({ ...npc, ataques_basicos: atualizados });
        }}
        onRemoverAtaque={(idx) => onUpdate({ ...npc, ataques_basicos: (npc.ataques_basicos || []).filter((_, i) => i !== idx) })}
        onAdicionarPoder={(p) => onUpdate(ajustarPoderesNpc({ npc, novosPoderes: [...(npc.poderes || []), p], isCompanheiro, nivelNP, nivelPersonagem }))}
        onAtualizarPoder={(idx, p) => { const np = [...(npc.poderes || [])]; np[idx] = p; onUpdate(ajustarPoderesNpc({ npc, novosPoderes: np, isCompanheiro, nivelNP, nivelPersonagem })); }}
        onRemoverPoder={(idx) => onUpdate(ajustarPoderesNpc({ npc, novosPoderes: (npc.poderes || []).filter((_, i) => i !== idx), isCompanheiro, nivelNP, nivelPersonagem }))}
        onAdicionarFeitico={(f) => onUpdate({ ...npc, feiticos: [...(npc.feiticos || []), f] })}
        onRemoverFeitico={(idx) => onUpdate({ ...npc, feiticos: (npc.feiticos || []).filter((_, i) => i !== idx) })}
      />
    </div>
  );
}
