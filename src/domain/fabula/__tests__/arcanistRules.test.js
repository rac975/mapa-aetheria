import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesArcanista,
  calcularBonusEscalaDispensa,
  calcularEfeitoDispensaArcano,
  gerarAcoesConflitoArcanista,
  CATALOGO_ARCANOS_OFICIAIS,
  identificarArcanoOficial
} from '../arcanistRules.js';

test('Fabula Ultima - Arcanista: identificação de classe, habilidades e Arcano Emergencial em Crise', () => {
  const classesArcanista = [
    {
      nome_classe: 'Arcanista',
      nivel: 10,
      arcanos_vinculados: [
        {
          nome: 'Arcano da Torre',
          fundir: 'Resistência a elemento escolhido',
          dispensar_nome: 'Julgamento',
          dispensar_efeito: 'Causa 30 pontos de dano de luz'
        }
      ],
      habilidades: [
        { nome: 'Vincular e Invocar', nivel: 1 },
        { nome: 'Arcano Emergencial', nivel: 3 },
        { nome: 'Regeneração Arcana', nivel: 2 },
        { nome: 'Círculo Arcano', nivel: 2 }
      ]
    }
  ];

  const foraCrise = extrairHabilidadesArcanista({ classes: classesArcanista, emCrise: false });
  assert.equal(foraCrise.temClasseArcanista, true);
  assert.equal(foraCrise.habilidades.arcanoEmergencial.nivel, 3);
  assert.equal(foraCrise.habilidades.regeneracaoArcana.nivel, 2);
  assert.equal(foraCrise.custoInvocacaoPadrao, 40, 'Fora de crise custa 40 PM');
  assert.equal(foraCrise.curaRegeneracao, 10, 'Regeneração Arcana Nv 2 = 10 PV');
  assert.equal(foraCrise.arcanosVinculados.length, 1);

  const emCrise = extrairHabilidadesArcanista({ classes: classesArcanista, emCrise: true });
  assert.equal(emCrise.custoInvocacaoPadrao, 25, 'Em crise: 40 - 15 = 25 PM');
});

test('Fabula Ultima - Arcanista: cálculo oficial de escala de dispensa (+10 no nv 20+, +20 no nv 40+)', () => {
  assert.equal(calcularBonusEscalaDispensa(5), 0);
  assert.equal(calcularBonusEscalaDispensa(19), 0);
  assert.equal(calcularBonusEscalaDispensa(20), 10);
  assert.equal(calcularBonusEscalaDispensa(35), 10);
  assert.equal(calcularBonusEscalaDispensa(40), 20);
  assert.equal(calcularBonusEscalaDispensa(50), 20);

  const dispensaNv10 = calcularEfeitoDispensaArcano({
    arcano: { dispensar_nome: 'Julgamento', dispensar_efeito: 'Causa 30 pontos de dano de luz' },
    nivelTotal: 10
  });
  assert.equal(dispensaNv10.danoTotal, 30);
  assert.equal(dispensaNv10.tipoDano, 'luz');
  assert.equal(dispensaNv10.ignoraResistencia, true);

  const dispensaNv25 = calcularEfeitoDispensaArcano({
    arcano: { dispensar_nome: 'Julgamento', dispensar_efeito: 'Causa 30 pontos de dano de luz' },
    nivelTotal: 25
  });
  assert.equal(dispensaNv25.danoTotal, 40, '30 base + 10 escala = 40');

  const dispensaNv45 = calcularEfeitoDispensaArcano({
    arcano: { dispensar_nome: 'Julgamento', dispensar_efeito: 'Causa 30 pontos de dano de luz' },
    nivelTotal: 45
  });
  assert.equal(dispensaNv45.danoTotal, 50, '30 base + 20 escala = 50');
});

test('Fabula Ultima - Arcanista: catálogo oficial dos 9 Arcanos (Espada, Forja, Geada, Roda, Torre, Carvalho, Céu, Grimório, Portão)', () => {
  const chaves = Object.keys(CATALOGO_ARCANOS_OFICIAIS);
  assert.equal(chaves.length, 9, 'Deve conter os 9 Arcanos oficiais do Livro Básico');

  // 1. Espada: Fundir (+5 dano sem tipo, ignora afinidades) e Golpe Multi que dispensa automaticamente (não conta como dispensa voluntária)
  const espada = identificarArcanoOficial('Arcano da Espada');
  assert.equal(espada.chave, 'espada');
  assert.equal(espada.beneficiosFundir.bonusDanoAtaque, 5);
  assert.equal(espada.beneficiosFundir.ignoraAfinidades, true);
  const dispEspada = calcularEfeitoDispensaArcano({ arcano: { nome: 'Espada' }, nivelTotal: 20 });
  assert.equal(dispEspada.isGolpeFundirEspada, true);
  assert.equal(dispEspada.danoTotal, 0, 'Espada não causa 30 de dano fixo de dispensa; aplica Multi ao ataque');
  assert.equal(dispEspada.isDispensaVoluntaria, false, 'Dispensa automática da Espada não ativa Círculo Arcano');

  // 2. Carvalho: Florescer cura 40 PV (50 no nv 20+, 60 no nv 40+) e remove Envenenado
  const dispCarvalhoNv10 = calcularEfeitoDispensaArcano({ arcano: { nome: 'Arcano do Carvalho' }, nivelTotal: 10 });
  assert.equal(dispCarvalhoNv10.danoTotal, 0);
  assert.equal(dispCarvalhoNv10.curaTotal, 40);
  assert.equal(dispCarvalhoNv10.removerCondicaoAlvo, 'envenenado');

  const dispCarvalhoNv40 = calcularEfeitoDispensaArcano({ arcano: { nome: 'Carvalho' }, nivelTotal: 40 });
  assert.equal(dispCarvalhoNv40.curaTotal, 60);

  // 3. Roda: Congelar o Tempo aplica Lento (ou -1 ação se já Lento) com 0 dano
  const dispRoda = calcularEfeitoDispensaArcano({ arcano: { nome: 'Arcano da Roda' }, nivelTotal: 20 });
  assert.equal(dispRoda.danoTotal, 0);
  assert.equal(dispRoda.condicaoAlvo, 'lento');
  assert.equal(dispRoda.reduzAcaoSeJaLento, true);

  // 4. Geada, Céu, Grimório e Portão
  const dispGeada = calcularEfeitoDispensaArcano({ arcano: { nome: 'Geada' }, nivelTotal: 20 });
  assert.equal(dispGeada.danoTotal, 40);
  assert.equal(dispGeada.tipoDano, 'gelo');
  assert.equal(dispGeada.ignoraResistencia, true);

  const dispCeu = calcularEfeitoDispensaArcano({ arcano: { nome: 'Arcano do Céu' }, nivelTotal: 10 });
  assert.equal(dispCeu.danoTotal, 30);
  assert.equal(dispCeu.tipoDano, 'raio');
  assert.equal(dispCeu.ignoraResistencia, true);

  const dispGrimorio = calcularEfeitoDispensaArcano({ arcano: { nome: 'Grimório' }, nivelTotal: 30 });
  assert.equal(dispGrimorio.danoTotal, 0);
  assert.equal(dispGrimorio.nomeEfeito, 'Oráculo');

  const dispPortaoOblivio = calcularEfeitoDispensaArcano({ arcano: { nome: 'Portão' }, nivelTotal: 20, opcaoSubcodigo: 'OBLIVIO' });
  assert.equal(dispPortaoOblivio.danoTotal, 40);
  assert.equal(dispPortaoOblivio.tipoDano, 'trevas');
  assert.equal(dispPortaoOblivio.ignoraResistencia, true);

  const dispPortaoTranslocar = calcularEfeitoDispensaArcano({ arcano: { nome: 'Portão' }, nivelTotal: 20, opcaoSubcodigo: 'TRANSLOCAR' });
  assert.equal(dispPortaoTranslocar.danoTotal, 0);
  assert.equal(dispPortaoTranslocar.nomeEfeito, 'Translocar');
});

test('Fabula Ultima - Arcanista: geração de ações de conflito (Invocação, Dispensa dupla na Forja e Círculo Arcano)', () => {
  const classes = [
    {
      nome_classe: 'Arcanista',
      nivel: 20,
      arcanos_vinculados: [
        {
          nome: 'Arcano da Forja',
          fundir: 'Resistência a fogo',
          dispensar_nome: 'Inferno',
          dispensar_efeito: 'Causa 30 pontos de dano de fogo'
        }
      ],
      habilidades: [
        { nome: 'Vincular e Invocar', nivel: 1 },
        { nome: 'Arcano Emergencial', nivel: 2 },
        { nome: 'Regeneração Arcana', nivel: 1 },
        { nome: 'Círculo Arcano', nivel: 3 }
      ]
    }
  ];

  const acoes = gerarAcoesConflitoArcanista({ classes, emCrise: true });

  const acaoInvocar = acoes.find((a) => a.codigo === 'INVOCAR_ARCANO');
  assert.ok(acaoInvocar, 'Deve gerar ação de Invocação de Arcano');
  assert.equal(acaoInvocar.custoPm, 30, '40 - (2*5) = 30 PM em crise');
  assert.equal(acaoInvocar.curaRegeneracao, 5, 'Regeneração Arcana Nv 1 cura 5 PV');
  assert.equal(acaoInvocar.isArcano, true);

  const acaoDispensar = acoes.find((a) => a.codigo === 'DISPENSAR_ARCANO');
  assert.ok(acaoDispensar, 'Deve gerar ação de Dispensa de Arcano (Inferno)');
  assert.equal(acaoDispensar.danoTotal, 40, 'Nível 20: 30 base + 10 escala = 40');
  assert.equal(acaoDispensar.tipoDano, 'fogo');
  assert.equal(acaoDispensar.ignoraResistencia, true);
  assert.ok(acaoDispensar.circuloArcanoTexto.includes('15 PM'), 'Círculo Arcano Nv 3 permite feitiço de até 15 PM');

  const acaoForjaEquip = acoes.find((a) => a.subcodigoDispensa === 'FORJA_EQUIPAMENTO');
  assert.ok(acaoForjaEquip, 'Arcano da Forja também deve oferecer a opção Forja (Criar Equipamento Ígneo)');
  assert.equal(acaoForjaEquip.danoTotal, 0);

  const acaoCirculo = acoes.find((a) => a.codigo === 'CIRCULO_ARCANO');
  assert.ok(acaoCirculo, 'Deve gerar ação de Círculo Arcano');
});

test('Fabula Ultima - Arcanista: combatente sem a classe não gera ações de Arcanista', () => {
  const classesLadino = [
    { nome_classe: 'Ladino', nivel: 5, habilidades: [{ nome: 'Alta Velocidade', nivel: 1 }] }
  ];

  const acoes = gerarAcoesConflitoArcanista({ classes: classesLadino });
  assert.equal(acoes.length, 0);
});
