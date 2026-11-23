import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extrairHabilidadesComandante, gerarAcoesConflitoComandante } from '../commanderRules.js';
import { extrairHabilidadesDancarino, gerarAcoesConflitoDancarino, extrairDancasAprendidasFicha } from '../dancerRules.js';
import { extrairHabilidadesSimbolista, gerarAcoesConflitoSimbolista, extrairSimbolosAprendidosFicha } from '../symbolistRules.js';
import { extrairHabilidadesVirtuoso, gerarAcoesConflitoVirtuoso } from '../virtuosoRules.js';
import { gerarTodasAcoesConflitoBlocoC, ACOES_BLOCO_C_OFICIAIS } from '../blockCConflictIntegrator.js';
import { obterPresetsBlocoC } from '../blockCPresetCatalog.js';
import { isHabilidadeEleitaPreset, normalizarCodigoHabilidade, extrairHabilidadesEleitasCombatente, obterPresetsHabilidade } from '../abilityPresetRules.js';
import { isHabilidadeAtiva, isHabilidadePassiva } from '../abilityClassificationRules.js';
import { extrairPerfilRolagemCombatente, resolverAcaoCombate } from '../combatRules.js';

describe('Fabula Ultima - Classes do Bloco C em Conflito (High Fantasy)', () => {
  const atorBase = {
    id: 'hero-c1',
    nome: 'Comandante Nobre',
    tipo: 'heroi',
    hp_atual: 45,
    hp_max: 50,
    mp_atual: 35,
    mp_max: 40,
    ip_atual: 6,
    pontos_fabula: 2
  };

  const alvoBase = {
    id: 'target-c1',
    nome: 'Guerreiro Imperial',
    tipo: 'inimigo',
    hp_atual: 50,
    hp_max: 60,
    mp_atual: 30,
    mp_max: 30,
    condicoes: []
  };

  it('Comandante: extrai habilidades e gera ações de ordem tática', () => {
    const classes = [{
      nome_classe: 'Comandante',
      habilidades: [
        { nome: 'Carga de Cavalaria', nivel: 3 }, { nome: 'Decreto do Bispo', nivel: 2 },
        { nome: 'Roque do Rei', nivel: 1 }, { nome: 'Gambito da Dama', nivel: 2 },
        { nome: 'Carruagem Devastadora', nivel: 1 }
      ]
    }];

    const dados = extrairHabilidadesComandante(classes);
    assert.equal(dados.temComandante, true);
    assert.equal(dados.nvCargaCavalaria, 3);
    assert.equal(dados.nvDecretoBispo, 2);
    assert.equal(dados.nvRoqueRei, 1);
    assert.equal(dados.nvGambitoDama, 2);
    assert.equal(dados.nvCarruagemDevastadora, 1);

    const acoes = gerarAcoesConflitoComandante({ classes });
    assert.equal(acoes.length, 5);
    assert.ok(acoes.some((a) => a.codigo === 'CARGA_CAVALARIA' && a.custoPm === 10));
    assert.ok(acoes.some((a) => a.codigo === 'DECRETO_DO_BISPO' && a.danoAplicado === 6));
    assert.ok(acoes.some((a) => a.codigo === 'ROQUE_DO_REI' && a.custoPm === 10));
    assert.ok(acoes.some((a) => a.codigo === 'GAMBITO_DA_DAMA' && a.curaAplicada === 15));
    assert.ok(acoes.some((a) => a.codigo === 'CARRUAGEM_DEVASTADORA' && a.isAcaoExtra === true));
  });

  it('Dançarino: extrai habilidades, gerencia custos de dança e gera ações', () => {
    const classes = [{
      nome_classe: 'Dançarino',
      habilidades: [
        { nome: 'Dança', nivel: 4, dancas_aprendidas: ['flamingo', 'garca'] },
        { nome: 'Dançarino de Guerra', nivel: 2 }, { nome: 'Me Acompanhe', nivel: 1 },
        { nome: 'Sapateado Frenético', nivel: 1 }, { nome: 'Troca de Figurino', nivel: 1 }
      ]
    }];

    const dados = extrairHabilidadesDancarino(classes);
    assert.equal(dados.temDancarino, true);
    assert.equal(dados.nvDanca, 4);
    assert.equal(dados.nvDancarinoGuerra, 2);
    assert.equal(dados.nvMeAcompanhe, 1);

    const dancas = extrairDancasAprendidasFicha(null, classes);
    assert.deepEqual(dancas, ['flamingo', 'garca']);

    const acoes = gerarAcoesConflitoDancarino({ classes, ultimaDancaKey: 'garca' });
    assert.equal(acoes.length, 5);
    assert.ok(acoes.some((a) => a.codigo === 'DANCA' && a.custoPm === 5));
    assert.ok(acoes.some((a) => a.codigo === 'DANCARINO_DE_GUERRA' && a.passiva === true));
    assert.ok(acoes.some((a) => a.codigo === 'ME_ACOMPANHE' && a.custoPm === 10));
    assert.ok(acoes.some((a) => a.codigo === 'SAPATEADO_FRENETICO' && a.passiva === true));
    assert.ok(acoes.some((a) => a.codigo === 'TROCA_FIGURINO' && a.isAcaoExtra === true));
  });

  it('Simbolista: extrai habilidades, limite de símbolos e gera ações', () => {
    const classes = [{
      nome_classe: 'Simbolista',
      habilidades: [
        { nome: 'Simbolismo', nivel: 3, simbolos_aprendidos: ['protecao', 'desespero'] },
        { nome: 'Toque Pessoal', nivel: 2 }, { nome: 'Símbolos Mágicos', nivel: 1 },
        { nome: 'Conexão Simbólica', nivel: 1 }, { nome: 'Miragem', nivel: 1 }
      ]
    }];

    const dados = extrairHabilidadesSimbolista(classes);
    assert.equal(dados.temSimbolista, true);
    assert.equal(dados.nvSimbolismo, 3);
    assert.equal(dados.nvToquePessoal, 2);
    assert.equal(dados.nvSimbolosMagicos, 1);

    const simbolos = extrairSimbolosAprendidosFicha(null, classes);
    assert.deepEqual(simbolos, ['protecao', 'desespero']);

    const acoes = gerarAcoesConflitoSimbolista({ classes });
    assert.equal(acoes.length, 5);
    assert.ok(acoes.some((a) => a.codigo === 'SIMBOLISMO' && a.custoPi === 2));
    assert.ok(acoes.some((a) => a.codigo === 'TOQUE_PESSOAL' && a.isAcaoExtra === true));
    assert.ok(acoes.some((a) => a.codigo === 'SIMBOLOS_MAGICOS'));
    assert.ok(acoes.some((a) => a.codigo === 'CONEXAO_SIMBOLICA' && a.passiva === true));
    assert.ok(acoes.some((a) => a.codigo === 'MIRAGEM' && a.passiva === true));
  });

  it('Virtuoso: extrai habilidades sonoras e gera ações em conflito', () => {
    const classes = [{
      nome_classe: 'Virtuoso',
      habilidades: [
        { nome: 'Magicanto', nivel: 3 }, { nome: 'Harmonia', nivel: 2 },
        { nome: 'Barreira Sonora', nivel: 2 }, { nome: 'Vibrato', nivel: 1 },
        { nome: 'Canto da Sereia', nivel: 1 }
      ]
    }];

    const dados = extrairHabilidadesVirtuoso(classes);
    assert.equal(dados.temVirtuoso, true);
    assert.equal(dados.nvMagicanto, 3);
    assert.equal(dados.nvHarmonia, 2);
    assert.equal(dados.nvBarreiraSonora, 2);
    assert.equal(dados.nvVibrato, 1);
    assert.equal(dados.nvCantoSereia, 1);

    const acoes = gerarAcoesConflitoVirtuoso({ classes });
    assert.equal(acoes.length, 5);
    assert.ok(acoes.some((a) => a.codigo === 'MAGICANTO' && a.custoPm === 10));
    assert.ok(acoes.some((a) => a.codigo === 'HARMONIA' && a.isAcaoExtra === true));
    assert.ok(acoes.some((a) => a.codigo === 'BARREIRA_SONORA' && a.passiva === true));
    assert.ok(acoes.some((a) => a.codigo === 'VIBRATO' && a.isAcaoExtra === true));
    assert.ok(acoes.some((a) => a.codigo === 'CANTO_DA_SEREIA' && a.passiva === true));
  });

  it('Integrador e Presets do Bloco C: catálogos oficiais funcionam corretamente', () => {
    const classes = [
      { nome_classe: 'Comandante', habilidades: [{ nome: 'Carga de Cavalaria', nivel: 2 }] },
      { nome_classe: 'Dançarino', habilidades: [{ nome: 'Dança', nivel: 3 }] },
      { nome_classe: 'Simbolista', habilidades: [{ nome: 'Simbolismo', nivel: 2 }] },
      { nome_classe: 'Virtuoso', habilidades: [{ nome: 'Magicanto', nivel: 2 }] }
    ];

    const todas = gerarTodasAcoesConflitoBlocoC({ classes });
    assert.equal(todas.length, 4);
    assert.ok(ACOES_BLOCO_C_OFICIAIS.CARGA_CAVALARIA);
    assert.ok(ACOES_BLOCO_C_OFICIAIS.DANCA);
    assert.ok(ACOES_BLOCO_C_OFICIAIS.SIMBOLISMO);
    assert.ok(ACOES_BLOCO_C_OFICIAIS.MAGICANTO);

    const presetsCarga = obterPresetsBlocoC('CARGA_CAVALARIA', 2, { alvo: alvoBase });
    assert.equal(presetsCarga.length, 1);

    const presetsDecreto = obterPresetsBlocoC('DECRETO_DO_BISPO', 2);
    assert.equal(presetsDecreto.length, 2);

    const presetsRoque = obterPresetsBlocoC('ROQUE_DO_REI', 1);
    assert.equal(presetsRoque.length, 2);

    const presetsDanca = obterPresetsBlocoC('DANCA', 1, { alvo: alvoBase });
    assert.equal(presetsDanca.length, 10);

    const presetsSimbolo = obterPresetsBlocoC('SIMBOLISMO', 2, { alvo: alvoBase });
    assert.equal(presetsSimbolo.length, 7);

    const presetsMag = obterPresetsBlocoC('MAGICANTO', 2, { alvo: alvoBase });
    assert.equal(presetsMag.length, 3);
  });

  it('Classificação e Presets de Habilidade: integração transparente', () => {
    assert.equal(isHabilidadeAtiva({ nome: 'Carga de Cavalaria' }), true);
    assert.equal(isHabilidadeAtiva({ nome: 'Dança' }), true);
    assert.equal(isHabilidadeAtiva({ nome: 'Simbolismo' }), true);
    assert.equal(isHabilidadeAtiva({ nome: 'Magicanto' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Carruagem Devastadora' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Dançarino de Guerra' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Conexão Simbólica' }), true);
    assert.equal(isHabilidadePassiva({ nome: 'Barreira Sonora' }), true);

    assert.equal(isHabilidadeEleitaPreset({ codigo: 'CARGA_CAVALARIA' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'DECRETO_DO_BISPO' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'DANCA' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'SIMBOLISMO' }), true);
    assert.equal(isHabilidadeEleitaPreset({ codigo: 'MAGICANTO' }), true);

    assert.equal(normalizarCodigoHabilidade('Carga de Cavalaria'), 'CARGA_CAVALARIA');
    assert.equal(normalizarCodigoHabilidade('Decreto do Bispo'), 'DECRETO_DO_BISPO');
    assert.equal(normalizarCodigoHabilidade('Dança'), 'DANCA');
    assert.equal(normalizarCodigoHabilidade('Simbolismo'), 'SIMBOLISMO');
    assert.equal(normalizarCodigoHabilidade('Magicanto'), 'MAGICANTO');

    const lista = [{ codigo: 'CARGA_CAVALARIA', nivel: 2 }, { codigo: 'DANCA', nivel: 1 }];
    const eleitas = extrairHabilidadesEleitasCombatente(lista);
    assert.equal(eleitas.length, 2);

    const presets = obterPresetsHabilidade({ codigo: 'CARGA_CAVALARIA', nivel: 2 }, { alvo: alvoBase });
    assert.ok(presets.length > 0);
  });

  it('extrairPerfilRolagemCombatente e resolverAcaoCombate: fluxo integrado do Bloco C', () => {
    const ficha = {
      id: 'ficha-bloco-c',
      nome: 'Herói Polímata',
      destreza: 'd8', astucia: 'd8', vigor: 'd8', vontade: 'd10',
      recursos: { pv: { atual: 40, max: 40 }, pm: { atual: 30, max: 30 }, pi: { atual: 6, max: 6 } },
      classes: [
        { nome_classe: 'Comandante', habilidades: [{ nome: 'Carga de Cavalaria', nivel: 2 }] }, { nome_classe: 'Dançarino', habilidades: [{ nome: 'Dança', nivel: 1 }] },
        { nome_classe: 'Simbolista', habilidades: [{ nome: 'Simbolismo', nivel: 1 }] }, { nome_classe: 'Virtuoso', habilidades: [{ nome: 'Magicanto', nivel: 1 }] }
      ]
    };

    const perfil = extrairPerfilRolagemCombatente({ combatente: atorBase, ficha });
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'CARGA_CAVALARIA'));
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'DANCA'));
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'SIMBOLISMO'));
    assert.ok(perfil.habilidades.some((h) => h.codigo === 'MAGICANTO'));

    const resCarga = resolverAcaoCombate({ acaoCodigo: 'CARGA_CAVALARIA', ator: atorBase, alvo: alvoBase, custoPm: 10 });
    assert.equal(resCarga.valido, true);
    assert.equal(resCarga.updatesAtor.mp_atual, 25);
    assert.ok(resCarga.logEntry.detalhes.includes('Carga de Cavalaria'));

    const resSimbolo = resolverAcaoCombate({ acaoCodigo: 'SIMBOLISMO', ator: atorBase, alvo: alvoBase, custoPi: 2 });
    assert.equal(resSimbolo.valido, true);
    assert.equal(resSimbolo.updatesAtor.ip_atual, 4);
    assert.ok(resSimbolo.logEntry.detalhes.includes('Simbolismo'));

    const resDanca = resolverAcaoCombate({ acaoCodigo: 'DANCA', ator: atorBase, custoPm: 10 });
    assert.equal(resDanca.valido, true);
    assert.ok(resDanca.logEntry.detalhes.includes('Dança'));

    const resMag = resolverAcaoCombate({ acaoCodigo: 'MAGICANTO', ator: atorBase, alvo: alvoBase, custoPm: 20 });
    assert.equal(resMag.valido, true);
    assert.ok(resMag.logEntry.detalhes.includes('Magicanto'));
  });
});
