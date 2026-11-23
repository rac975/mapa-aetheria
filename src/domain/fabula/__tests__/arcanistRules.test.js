import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesArcanista,
  calcularBonusEscalaDispensa,
  calcularEfeitoDispensaArcano,
  gerarAcoesConflitoArcanista
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

  // Fora de crise: custo 40 PM
  const foraCrise = extrairHabilidadesArcanista({ classes: classesArcanista, emCrise: false });
  assert.equal(foraCrise.temClasseArcanista, true);
  assert.equal(foraCrise.habilidades.arcanoEmergencial.nivel, 3);
  assert.equal(foraCrise.habilidades.regeneracaoArcana.nivel, 2);
  assert.equal(foraCrise.custoInvocacaoPadrao, 40, 'Fora de crise custa 40 PM');
  assert.equal(foraCrise.curaRegeneracao, 10, 'Regeneração Arcana Nv 2 = 10 PV');
  assert.equal(foraCrise.arcanosVinculados.length, 1);

  // Em crise: desconto de 3 * 5 = 15 PM -> 40 - 15 = 25 PM
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

test('Fabula Ultima - Arcanista: geração de ações de conflito (Invocação, Dispensa e Círculo Arcano)', () => {
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
  assert.ok(acaoDispensar, 'Deve gerar ação de Dispensa de Arcano');
  assert.equal(acaoDispensar.danoTotal, 40, 'Nível 20: 30 base + 10 escala = 40');
  assert.equal(acaoDispensar.tipoDano, 'fogo');
  assert.ok(acaoDispensar.circuloArcanoTexto.includes('15 PM'), 'Círculo Arcano Nv 3 permite feitiço de até 15 PM');

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
