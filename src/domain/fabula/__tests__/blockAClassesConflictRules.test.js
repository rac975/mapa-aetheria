import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesElementalista,
  calcularBonusCataclismo,
  gerarAcoesConflitoElementalista
} from '../elementalistRules.js';
import {
  extrairHabilidadesEntropista,
  gerarAcoesConflitoEntropista
} from '../entropistRules.js';
import {
  extrairHabilidadesEspiritualista,
  calcularCustoVismagus,
  gerarAcoesConflitoEspiritualista
} from '../spiritistRules.js';
import {
  extrairHabilidadesFurioso,
  calcularBonusDanoAdrenalina,
  gerarAcoesConflitoFurioso
} from '../furyRules.js';
import {
  extrairHabilidadesGuardiao,
  calcularReducaoMaestriaDefensiva,
  gerarAcoesConflitoGuardiao
} from '../guardianRules.js';
import {
  extrairHabilidadesGuerreiroSombrio,
  calcularDanoGolpeDasSombras,
  gerarAcoesConflitoGuerreiroSombrio
} from '../darkbladeRules.js';
import {
  extrairHabilidadesOrador,
  calcularEfeitoCondenar,
  calcularCuraEncorajar,
  gerarAcoesConflitoOrador
} from '../oratorRules.js';
import { obterPresetsBlocoA } from '../blockAPresetCatalog.js';
import { resolverAcaoCombate } from '../combatRules.js';

describe('Fabula Ultima - Classes do Bloco A em Conflito', () => {
  const atorBase = {
    id: 'hero-1',
    nome: 'Valente Herói',
    tipo: 'heroi',
    hp_atual: 45,
    hp_max: 50,
    mp_atual: 35,
    mp_max: 40,
    ip_atual: 6,
    pontos_fabula: 2
  };

  const alvoBase = {
    id: 'target-1',
    nome: 'Inimigo Oponente',
    tipo: 'inimigo',
    hp_atual: 50,
    hp_max: 60,
    mp_atual: 30,
    mp_max: 30,
    condicoes: []
  };

  it('Elementalista: extrai habilidades, calcula Cataclismo e gera ações', () => {
    const ficha = {
      classes: [{ nome_classe: 'Elementalista', habilidades: { 'artilharia magica': 2, cataclismo: 3, 'lamina magica': 1 } }]
    };
    const dados = extrairHabilidadesElementalista({ ficha });
    assert.equal(dados.temClasse, true);
    assert.equal(dados.habilidades.artilhariaMagica.bonusMagia, 4);
    assert.equal(dados.habilidades.cataclismo.maxPmAdicional, 30);
    assert.equal(calcularBonusCataclismo({ pmGastoExtra: 20 }), 10);

    const acoes = gerarAcoesConflitoElementalista({ ficha });
    assert.ok(acoes.some((a) => a.codigo === 'CATACLISMO'));
    assert.ok(acoes.some((a) => a.codigo === 'LAMINA_MAGICA'));
  });

  it('Entropista: gera Tempo Roubado, Absorver PM e resolve opções oficiais', () => {
    const ficha = {
      classes: [{ nome_classe: 'Entropista', habilidades: { 'tempo roubado': 2, 'absorver pm': 3, 'sete da sorte': 1 } }]
    };
    const dados = extrairHabilidadesEntropista({ ficha });
    assert.equal(dados.temClasse, true);
    assert.equal(dados.habilidades.tempoRoubado.danoInimigoLento, 20);

    const acoes = gerarAcoesConflitoEntropista({ ficha });
    assert.equal(acoes.length, 3);

    const presets = obterPresetsBlocoA('TEMPO_ROUBADO', 2, { alvo: alvoBase });
    assert.equal(presets.length, 5);

    const res = resolverAcaoCombate({
      acaoCodigo: 'TEMPO_ROUBADO',
      ator: atorBase,
      alvo: alvoBase,
      custoPm: 5,
      condicaoAlvo: 'lento'
    });
    assert.equal(res.valido, true);
    assert.equal(res.updatesAtor.mp_atual, 30);
    assert.ok(res.updatesAlvo.condicoes.includes('lento'));
  });

  it('Espiritualista: Vismagus calcula custo em PV e Poder Curativo amplia cura', () => {
    const ficha = {
      classes: [{ nome_classe: 'Espiritualista', habilidades: { 'poder curativo': 2, vismagus: 1 } }],
      lacos: [{ nome: 'Aliado', forca: 2 }]
    };
    const dados = extrairHabilidadesEspiritualista({ ficha });
    assert.equal(dados.temClasse, true);
    assert.equal(dados.habilidades.poderCurativo.curaExtra, 5); // 3 + (2 * 1)
    assert.equal(calcularCustoVismagus(15), 25);

    const acoes = gerarAcoesConflitoEspiritualista({ ficha });
    assert.ok(acoes.some((a) => a.codigo === 'VISMAGUS'));
  });

  it('Furioso: Adrenalina, Provocar e Resistir em Guarda', () => {
    const ficha = {
      classes: [{ nome_classe: 'Furioso', habilidades: { adrenalina: 3, provocar: 2, resistir: 2 } }],
      lacos: [{ forca: 3 }]
    };
    const dados = extrairHabilidadesFurioso({ ficha });
    assert.equal(dados.temClasse, true);
    assert.equal(calcularBonusDanoAdrenalina({ nivel: 3, emCrise: true }), 6);
    assert.equal(calcularBonusDanoAdrenalina({ nivel: 3, emCrise: false }), 0);

    const acoesFur = gerarAcoesConflitoFurioso({ ficha });
    assert.ok(acoesFur.some((a) => a.codigo === 'PROVOCAR'));

    const presets = obterPresetsBlocoA('PROVOCAR', 2, { alvo: alvoBase });
    assert.equal(presets[0].valores.condicaoAlvo, 'enfurecido');

    const resProv = resolverAcaoCombate({
      acaoCodigo: 'PROVOCAR',
      ator: atorBase,
      alvo: alvoBase,
      custoPm: 5,
      condicaoAlvo: 'enfurecido'
    });
    assert.equal(resProv.valido, true);
    assert.ok(resProv.updatesAlvo.condicoes.includes('enfurecido'));
    assert.equal(resProv.updatesAlvo.modificadores.provocado_por, atorBase.id);
  });

  it('Guardião: Maestria Defensiva reduz dano e Guarda-Costas protege aliado', () => {
    const ficha = {
      classes: [{ nome_classe: 'Guardião', habilidades: { fortaleza: 2, 'maestria defensiva': 3, 'guarda-costas': 1, proteger: 1, 'duplo escudeiro': 1 } }]
    };
    const dados = extrairHabilidadesGuardiao({ ficha });
    assert.equal(dados.temClasse, true);
    assert.equal(dados.habilidades.fortaleza.bonusPvMax, 6);
    assert.equal(calcularReducaoMaestriaDefensiva({ nivel: 3, temEscudoOuArmaduraMarcial: true }), 3);

    const acoes = gerarAcoesConflitoGuardiao({ ficha });
    assert.ok(acoes.some((a) => a.codigo === 'PROTEGER'));
    assert.ok(acoes.some((a) => a.codigo === 'GUARDA_COSTAS'));
    assert.ok(acoes.some((a) => a.codigo === 'ESCUDOS_GEMEOS'));
  });

  it('Guerreiro Sombrio: Golpe das Sombras gasta PV do ator e causa dano Sombrio', () => {
    const ficha = {
      classes: [{ nome_classe: 'Guerreiro Sombrio', habilidades: { 'golpe das sombras': 3, agonia: 2 } }]
    };
    const dados = extrairHabilidadesGuerreiroSombrio({ ficha });
    assert.equal(dados.temClasse, true);

    const acoesGue = gerarAcoesConflitoGuerreiroSombrio({ ficha });
    assert.ok(acoesGue.some((a) => a.codigo === 'GOLPE_DAS_SOMBRAS'));

    const calc = calcularDanoGolpeDasSombras({ nivel: 3, valorDadoVigor: 8 });
    assert.equal(calc.custoPv, 8);
    assert.equal(calc.bonusDano, 11);
    assert.equal(calc.tipoDano, 'sombrio');

    const res = resolverAcaoCombate({
      acaoCodigo: 'GOLPE_DAS_SOMBRAS',
      ator: atorBase,
      alvo: alvoBase,
      custoPv: 8,
      danoAplicado: 25,
      tipoDano: 'sombrio'
    });
    assert.equal(res.valido, true);
    assert.equal(res.updatesAtor.hp_atual, 37); // 45 - 8
    assert.equal(res.updatesAlvo.hp_atual, 25); // 50 - 25
    assert.match(res.logEntry.detalhes, /Golpe das Sombras/);
    assert.match(res.logEntry.detalhes, /-8 PV/);
  });

  it('Orador: Condenar drena PM e aplica vulnerabilidade; Encorajar cura aliado', () => {
    const ficha = {
      classes: [{ nome_classe: 'Orador', habilidades: { condenar: 2, encorajar: 3, 'confio em voce': 1 } }]
    };
    const dados = extrairHabilidadesOrador({ ficha });
    assert.equal(dados.temClasse, true);
    assert.equal(calcularCuraEncorajar({ nivel: 3 }), 15);

    const acoesOra = gerarAcoesConflitoOrador({ ficha });
    assert.ok(acoesOra.some((a) => a.codigo === 'CONDENAR'));

    const condEfeito = calcularEfeitoCondenar({ nivel: 2, opcaoCondicao: 'atordoado' });
    assert.equal(condEfeito.perdaPmAlvo, 20);
    assert.equal(condEfeito.condicaoAlvo, 'atordoado');
    assert.equal(condEfeito.bonusDanoSofridoAlvo, 2);

    const resCond = resolverAcaoCombate({
      acaoCodigo: 'CONDENAR',
      ator: atorBase,
      alvo: alvoBase,
      custoPm: 5,
      perdaPmAlvo: 20,
      condicaoAlvo: 'atordoado'
    });
    assert.equal(resCond.valido, true);
    assert.equal(resCond.updatesAtor.mp_atual, 30);
    assert.equal(resCond.updatesAlvo.mp_atual, 10); // 30 - 20
    assert.ok(resCond.updatesAlvo.condicoes.includes('atordoado'));
    assert.equal(resCond.updatesAlvo.modificadores.condenado, true);

    const resEnc = resolverAcaoCombate({
      acaoCodigo: 'ENCORAJAR',
      ator: atorBase,
      alvo: alvoBase,
      custoPm: 5,
      curaAplicada: 15,
      recursoCura: 'pv'
    });
    assert.equal(resEnc.valido, true);
    assert.equal(resEnc.updatesAlvo.hp_atual, 60); // 50 + 10 (clamp no max 60)
  });
});
