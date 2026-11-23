import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extrairHabilidadesFloralista, gerarAcoesConflitoFloralista } from '../floristRules.js';
import { extrairHabilidadesGourmet, gerarAcoesConflitoGourmet } from '../gourmetRules.js';
import { extrairHabilidadesInvocador, gerarAcoesConflitoInvocador } from '../invokerRules.js';
import { extrairHabilidadesMercador, gerarAcoesConflitoMercador } from '../merchantRules.js';
import { obterPresetsBlocoD } from '../blockDPresetCatalog.js';
import { extrairPerfilRolagemCombatente, resolverAcaoCombate } from '../combatRules.js';

describe('Fabula Ultima - Classes do Bloco D em Conflito (Natural Fantasy)', () => {
  it('Floralista: extrai habilidades, respeita custos de Cloromancia e Enxerto', () => {
    const classes = [{
      nome: 'Floralista',
      habilidades: [
        { nome: 'Cloromancia', nivel: 4 },
        { nome: 'Enxerto', nivel: 1 },
        { nome: 'Jardinagem Marcial', nivel: 2 },
        { nome: 'Arvore da Vida', nivel: 3 }
      ]
    }];

    const habs = extrairHabilidadesFloralista(classes);
    assert.equal(habs.cloromancia, 4);
    assert.equal(habs.enxerto, 1);
    assert.equal(habs.jardinagemMarcial, 2);
    assert.equal(habs.arvoreDaVida, 3);

    // Sem seções no relógio, Enxerto fica bloqueada
    const acoesSemRelogio = gerarAcoesConflitoFloralista({ classes, relogioGerminacao: 0 });
    const enxertoSem = acoesSemRelogio.find((a) => a.codigo === 'ENXERTO');
    assert.ok(enxertoSem.bloqueada);

    // Com seções, Enxerto é desbloqueada
    const acoesComRelogio = gerarAcoesConflitoFloralista({ classes, relogioGerminacao: 2 });
    const enxertoCom = acoesComRelogio.find((a) => a.codigo === 'ENXERTO');
    assert.equal(enxertoCom.bloqueada, false);

    const cloro = acoesComRelogio.find((a) => a.codigo === 'CLOROMANCIA');
    assert.equal(cloro.custoPm, 20);

    const jard = acoesComRelogio.find((a) => a.codigo === 'JARDINAGEM_MARCIAL');
    assert.ok(jard.isAcaoExtra);
  });

  it('Gourmet: valida Culinaria com ingredientes, Feito com Amor e Sal e Pimenta (2 PI)', () => {
    const classes = [{
      nome: 'Gourmet',
      habilidades: [
        { nome: 'Culinaria', nivel: 3 },
        { nome: 'Feito com Amor', nivel: 2 },
        { nome: 'Sal e Pimenta', nivel: 1 },
        { nome: 'Garfo e Faca', nivel: 1 }
      ]
    }];

    const habs = extrairHabilidadesGourmet(classes);
    assert.equal(habs.culinaria, 3);
    assert.equal(habs.feitoComAmor, 2);
    assert.equal(habs.salEPimenta, 1);

    const acoes = gerarAcoesConflitoGourmet({ classes, ingredientes: 5 });
    const culinariaSuporte = acoes.find((a) => a.codigo === 'CULINARIA');
    assert.ok(culinariaSuporte);
    assert.equal(culinariaSuporte.bloqueada, false);

    const salPimenta = acoes.find((a) => a.codigo === 'SAL_E_PIMENTA');
    assert.equal(salPimenta.custoPi, 2);

    const amor = acoes.find((a) => a.codigo === 'FEITO_COM_AMOR');
    assert.equal(amor.custoPm, 10);

    // Se estiver sem ingredientes, Culinaria fica bloqueada
    const acoesSemIng = gerarAcoesConflitoGourmet({ classes, ingredientes: 1 });
    assert.ok(acoesSemIng.find((a) => a.codigo === 'CULINARIA').bloqueada);
  });

  it('Invocador: Invocacao tem custo de 5 PM, acerto automatico e dano escalonado', () => {
    const classes = [{
      nome: 'Invocador',
      habilidades: [
        { nome: 'Invocacao', nivel: 3 },
        { nome: 'Invocacoes Conectadas', nivel: 2 },
        { nome: 'Expandir Manancial', nivel: 3 },
        { nome: 'Cascata', nivel: 2 }
      ]
    }];

    const habs = extrairHabilidadesInvocador(classes);
    assert.equal(habs.invocacao, 3);
    assert.equal(habs.expandirManancial, 3);

    // Nível 25 com Expandir Manancial Nv 3: 20 base + 5 nível + 3 expansão = 28 dano
    const acoesNv25 = gerarAcoesConflitoInvocador({ classes, nivelPersonagem: 25 });
    const inv = acoesNv25.find((a) => a.codigo === 'INVOCACAO');
    assert.equal(inv.custoPm, 5);
    assert.equal(inv.danoAplicado, 28);
    assert.equal(inv.curaAplicada, 40); // 30 + 10 por nível 20+

    const cascata = acoesNv25.find((a) => a.codigo === 'CASCATA');
    assert.equal(cascata.bonusTeste, 2);
  });

  it('Mercador: Estoque Pessoal anula PI com 1 PC e Data de Validade gera dano de veneno', () => {
    const classes = [{
      nome: 'Mercador',
      habilidades: [
        { nome: 'Estoque Pessoal', nivel: 3 },
        { nome: 'Ja Ouvi Falar', nivel: 2 },
        { nome: 'Data de Validade', nivel: 2 },
        { nome: 'Ventos do Comercio', nivel: 2 }
      ]
    }];

    const habs = extrairHabilidadesMercador(classes);
    assert.equal(habs.estoquePessoal, 3);
    assert.equal(habs.jaOuviFalar, 2);
    assert.equal(habs.dataDeValidade, 2);

    const acoes = gerarAcoesConflitoMercador({ classes, nivelPersonagem: 20, pontosComercio: 2 });
    const estoque = acoes.find((a) => a.codigo === 'ESTOQUE_PESSOAL');
    assert.ok(estoque);
    assert.equal(estoque.bloqueada, false);

    const exame = acoes.find((a) => a.codigo === 'JA_OUVI_FALAR');
    assert.equal(exame.bonusTeste, 4); // 2 + 2

    const validade = acoes.find((a) => a.codigo === 'DATA_DE_VALIDADE');
    // Math.floor(20/2) + 2 * 10 = 10 + 20 = 30 dano de veneno
    assert.equal(validade.danoAplicado, 30);
    assert.equal(validade.tipoDano, 'veneno');

    // Se estiver sem Pontos de Comercio, acoes dependentes sao bloqueadas
    const acoesSemPc = gerarAcoesConflitoMercador({ classes, nivelPersonagem: 20, pontosComercio: 0 });
    assert.ok(acoesSemPc.find((a) => a.codigo === 'ESTOQUE_PESSOAL').bloqueada);
  });

  it('Presets do Bloco D: Cloromancia, Culinaria, Invocacao e Estoque Pessoal retornam opcoes ricas', () => {
    const presetsCloro = obterPresetsBlocoD('CLOROMANCIA', 3);
    assert.ok(presetsCloro.length >= 4);
    assert.ok(presetsCloro.some((p) => p.id === 'cloromancia_espinhos'));

    const presetsCulinaria = obterPresetsBlocoD('CULINARIA', 3);
    assert.ok(presetsCulinaria.some((p) => p.valores.curaAplicada > 0));

    const presetsSal = obterPresetsBlocoD('SAL_E_PIMENTA', 1);
    assert.ok(presetsSal.some((p) => p.valores.custoPi === 2));

    const presetsInv = obterPresetsBlocoD('INVOCACAO', 2, { combatente: { nivel: 25 } });
    assert.ok(presetsInv.some((p) => p.valores.tipoDano === 'fogo'));

    const presetsEstoque = obterPresetsBlocoD('ESTOQUE_PESSOAL', 3);
    assert.ok(presetsEstoque.length > 0);
  });

  it('Integracao do Bloco D em extrairPerfilRolagemCombatente e resolverAcaoCombate', () => {
    const ficha = {
      id: 'f_bucolica_1',
      nome: 'Sylvanus',
      nivel: 15,
      atributos: { des: 8, int: 10, ast: 10, vig: 8 },
      classes: [
        {
          nome_classe: 'Invocador',
          habilidades: [{ nome: 'Invocacao', nivel: 2 }, { nome: 'Cascata', nivel: 2 }]
        },
        {
          nome_classe: 'Floralista',
          habilidades: [{ nome: 'Cloromancia', nivel: 3 }]
        }
      ]
    };

    const combatente = {
      id: 'c_sylvanus',
      nome: 'Sylvanus',
      hp_atual: 45,
      hp_max: 50,
      mp_atual: 40,
      mp_max: 40,
      ip_atual: 6,
      ip_max: 6,
      tipo: 'pj',
      relogio_germinacao: 1,
      ficha
    };

    const perfil = extrairPerfilRolagemCombatente(combatente);
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'INVOCACAO'));
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'CLOROMANCIA'));

    // Resolucao de Invocacao
    const alvo = { id: 'inimigo_1', nome: 'Goblin', hp_atual: 30, hp_max: 30, tipo: 'vilao' };
    const resultado = resolverAcaoCombate({
      acaoCodigo: 'INVOCACAO',
      custoPm: 5,
      danoAplicado: 20,
      tipoDano: 'fogo',
      ator: combatente,
      alvo
    });

    assert.equal(resultado.valido, true);
    assert.equal(resultado.updatesAtor.mp_atual, 35);
    assert.equal(resultado.updatesAlvo.hp_atual, 10);
    assert.equal(resultado.logEntry.metadata.pm_gasto, 5);
    assert.ok(resultado.logEntry.detalhes.includes('Invocação Elemental'));
  });
});
