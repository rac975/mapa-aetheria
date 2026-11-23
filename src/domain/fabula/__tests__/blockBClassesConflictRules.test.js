import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesMutante,
  calcularBonusAkromorphosis,
  calcularCustoTeriomorfose,
  gerarAcoesConflitoMutante
} from '../mutantRules.js';
import {
  extrairHabilidadesEsper,
  calcularCustoDomPsiquico,
  extrairDonsAprendidosFicha,
  gerarAcoesConflitoEsper
} from '../esperRules.js';
import {
  gerarTodasAcoesConflitoBlocoB,
  ACOES_BLOCO_B_OFICIAIS
} from '../blockBConflictIntegrator.js';
import { obterPresetsBlocoB } from '../blockBPresetCatalog.js';
import {
  isHabilidadeEleitaPreset,
  normalizarCodigoHabilidade,
  extrairHabilidadesEleitasCombatente,
  obterPresetsHabilidade
} from '../abilityPresetRules.js';
import {
  isHabilidadeAtiva,
  isHabilidadePassiva
} from '../abilityClassificationRules.js';
import {
  extrairPerfilRolagemCombatente,
  resolverAcaoCombate
} from '../combatRules.js';

describe('Fabula Ultima - Classes do Bloco B em Conflito (Mutante e Esper)', () => {
  const atorBase = {
    id: 'hero-b1',
    nome: 'Biotec Esper',
    tipo: 'heroi',
    hp_atual: 45,
    hp_max: 50,
    mp_atual: 35,
    mp_max: 40,
    ip_atual: 6,
    pontos_fabula: 2
  };

  const alvoBase = {
    id: 'target-b1',
    nome: 'Cyborg Inimigo',
    tipo: 'inimigo',
    hp_atual: 50,
    hp_max: 60,
    mp_atual: 30,
    mp_max: 30,
    condicoes: []
  };

  it('Mutante: extrai habilidades, calcula custos e gera ações ativas/reativas', () => {
    const classes = [
      {
        nome_classe: 'Mutante',
        habilidades: [
          { nome: 'Acromorfose', nivel: 2 },
          { nome: 'Biofagia', nivel: 3 },
          { nome: 'Écdise', nivel: 1 },
          { nome: 'Teriomorfose', nivel: 4 },
          { nome: 'Genoclepse', nivel: 2 }
        ]
      }
    ];

    const dados = extrairHabilidadesMutante(classes);
    assert.equal(dados.temMutante, true);
    assert.equal(dados.nvAcromorfose, 2);
    assert.equal(dados.nvBiofagia, 3);
    assert.equal(dados.nvEcdise, 1);
    assert.equal(dados.nvTeriomorfose, 4);
    assert.equal(dados.nvGenoclepse, 2);

    const bonusAkro = calcularBonusAkromorphosis(2);
    assert.equal(bonusAkro.bonusPrecisao, 2);
    assert.equal(bonusAkro.bonusDano, 10);

    const custoTerio = calcularCustoTeriomorfose(45);
    assert.equal(custoTerio, 15);

    const acoes = gerarAcoesConflitoMutante({ classes, pvAtual: 45 });
    assert.equal(acoes.length, 5);
    assert.ok(acoes.some((a) => a.codigo === 'TERIOMORFOSE' && a.custoPv === 15));
    assert.ok(acoes.some((a) => a.codigo === 'ECDISE' && a.custoPv === 10));
    assert.ok(acoes.some((a) => a.codigo === 'BIOFAGIA' && a.curaAplicada === 15));
    assert.ok(acoes.some((a) => a.codigo === 'ACROMORFOSE' && a.danoAplicado === 10));
    assert.ok(acoes.some((a) => a.codigo === 'GENOCLEPSE'));
  });

  it('Esper: extrai habilidades, calcula custos de dons e gera ações', () => {
    const classes = [
      {
        nome_classe: 'Esper',
        habilidades: [
          { nome: 'Dons Psíquicos', nivel: 3, dons_aprendidos: ['atmocinese', 'escudo_psiquico'] },
          { nome: 'Foco Cognitivo', nivel: 2 },
          { nome: 'Psicocinese', nivel: 1 },
          { nome: 'Hipercognição', nivel: 2 },
          { nome: 'Navegador', nivel: 1 }
        ]
      }
    ];

    const dados = extrairHabilidadesEsper(classes);
    assert.equal(dados.temEsper, true);
    assert.equal(dados.nvDonsPsiquicos, 3);
    assert.equal(dados.nvFocoCognitivo, 2);
    assert.equal(dados.nvPsicocinese, 1);
    assert.equal(dados.nvHipercognicao, 2);
    assert.equal(dados.nvNavegador, 1);

    assert.equal(calcularCustoDomPsiquico(0), 5);
    assert.equal(calcularCustoDomPsiquico(1), 5);
    assert.equal(calcularCustoDomPsiquico(2), 10);
    assert.equal(calcularCustoDomPsiquico(3), 15);
    assert.equal(calcularCustoDomPsiquico(4), 20);

    const dons = extrairDonsAprendidosFicha(null, classes);
    assert.deepEqual(dons, ['atmocinese', 'escudo_psiquico']);

    const acoes = gerarAcoesConflitoEsper({ classes, relogioSecoes: 2 });
    assert.equal(acoes.length, 5);
    assert.ok(acoes.some((a) => a.codigo === 'FOCO_COGNITIVO'));
    assert.ok(acoes.some((a) => a.codigo === 'DONS_PSIQUICOS' && a.custoPm === 10));
    assert.ok(acoes.some((a) => a.codigo === 'PSICOCINESE' && a.passiva === true));
    assert.ok(acoes.some((a) => a.codigo === 'HIPERCOGNICAO' && a.passiva === true));
    assert.ok(acoes.some((a) => a.codigo === 'NAVEGADOR' && a.passiva === true));
  });

  it('Integrador do Bloco B: gera todas as ações formatadas e catálogo de presets', () => {
    const classes = [
      { nome_classe: 'Mutante', habilidades: [{ nome: 'Écdise', nivel: 1 }, { nome: 'Teriomorfose', nivel: 2 }] },
      { nome_classe: 'Esper', habilidades: [{ nome: 'Foco Cognitivo', nivel: 3 }] }
    ];

    const todas = gerarTodasAcoesConflitoBlocoB({ classes, pvAtual: 30, relogioSecoes: 1 });
    assert.equal(todas.length, 3);
    assert.ok(ACOES_BLOCO_B_OFICIAIS.TERIOMORFOSE);
    assert.ok(ACOES_BLOCO_B_OFICIAIS.FOCO_COGNITIVO);

    const presetsFoco = obterPresetsBlocoB('FOCO_COGNITIVO', 3, { alvo: alvoBase });
    assert.equal(presetsFoco.length, 2);

    const presetsEcdise = obterPresetsBlocoB('ECDISE', 1, { combatente: atorBase });
    assert.equal(presetsEcdise.length, 8);
    assert.equal(presetsEcdise[0].valores.custoPv, 10);

    const presetsTerio = obterPresetsBlocoB('TERIOMORFOSE', 2);
    assert.ok(presetsTerio.length >= 5);

    const presetsDons = obterPresetsBlocoB('DONS_PSIQUICOS', 1);
    assert.ok(presetsDons.length >= 10);
  });

  it('Classificação e Presets de Habilidade: integra perfeitamente com os seletores', () => {
    assert.equal(isHabilidadeAtiva({ nome: 'Foco Cognitivo' }), true);
    assert.equal(isHabilidadeAtiva({ nome: 'Écdise' }), true);
    assert.equal(isHabilidadeAtiva({ nome: 'Teriomorfose' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Psicocinese' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Hipercognição' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Navegador' }), true);

    assert.equal(isHabilidadeEleitaPreset({ nome: 'Foco Cognitivo' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'ECDISE' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'TERIOMORFOSE' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'DONS_PSIQUICOS' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'ACROMORFOSE' }), true);

    assert.equal(normalizarCodigoHabilidade('Foco Cognitivo'), 'FOCO_COGNITIVO');
    assert.equal(normalizarCodigoHabilidade('Dons Psíquicos'), 'DONS_PSIQUICOS');
    assert.equal(normalizarCodigoHabilidade('Écdise'), 'ECDISE');

    const listaHabs = [
      { codigo: 'FOCO_COGNITIVO', nivel: 2 },
      { codigo: 'ECDISE', nivel: 1 }
    ];
    const eleitas = extrairHabilidadesEleitasCombatente(listaHabs);
    assert.equal(eleitas.length, 2);

    const presetsHab = obterPresetsHabilidade({ codigo: 'FOCO_COGNITIVO', nivel: 2 }, { alvo: alvoBase });
    assert.ok(presetsHab.length > 0);
  });

  it('extrairPerfilRolagemCombatente: injeta ações do Bloco B na ficha de personagem', () => {
    const ficha = {
      id: 'ficha-bloco-b',
      nome: 'Herói Mutante Esper',
      destreza: 'd8', astucia: 'd8', vigor: 'd8', vontade: 'd10',
      recursos: { pv: { atual: 40, max: 40 }, pm: { atual: 30, max: 30 } },
      classes: [
        { nome_classe: 'Mutante', habilidades: [{ nome: 'Écdise', nivel: 1 }, { nome: 'Teriomorfose', nivel: 3 }] },
        { nome_classe: 'Esper', habilidades: [{ nome: 'Foco Cognitivo', nivel: 2 }] }
      ]
    };

    const perfil = extrairPerfilRolagemCombatente({ combatente: atorBase, ficha });
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'ECDISE'));
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'TERIOMORFOSE'));
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'FOCO_COGNITIVO'));
  });

  it('resolverAcaoCombate: resolve Foco Cognitivo, Écdise, Teriomorfose e Biofagia com logs', () => {
    const resFoco = resolverAcaoCombate({
      acaoCodigo: 'FOCO_COGNITIVO',
      ator: atorBase,
      alvo: alvoBase,
      notaLivre: '🎯 Foco Cognitivo ativado'
    });
    assert.equal(resFoco.valido, true);
    assert.ok(resFoco.logEntry.detalhes.includes('Foco Cognitivo'));
    assert.equal(resFoco.updatesAtor.modificadores?.foco_cognitivo_id, alvoBase.id);

    const resEcdise = resolverAcaoCombate({
      acaoCodigo: 'ECDISE',
      ator: atorBase,
      custoPv: 10,
      notaLivre: 'Resistência a Fogo'
    });
    assert.equal(resEcdise.valido, true);
    assert.equal(resEcdise.updatesAtor.hp_atual, 35);
    assert.ok(resEcdise.logEntry.detalhes.includes('Écdise'));

    const resTerio = resolverAcaoCombate({
      acaoCodigo: 'TERIOMORFOSE',
      ator: atorBase,
      custoPv: 15,
      notaLivre: 'Placófora ativa'
    });
    assert.equal(resTerio.valido, true);
    assert.equal(resTerio.updatesAtor.hp_atual, 30);
    assert.ok(resTerio.logEntry.detalhes.includes('Teriomorfose'));

    const resBiofagia = resolverAcaoCombate({
      acaoCodigo: 'BIOFAGIA',
      ator: atorBase,
      curaAplicada: 15,
      recursoCura: 'pv'
    });
    assert.equal(resBiofagia.valido, true);
    assert.ok(resBiofagia.logEntry.detalhes.includes('Biofagia'));
  });
});
