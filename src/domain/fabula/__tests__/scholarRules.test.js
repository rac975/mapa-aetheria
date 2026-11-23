import test from 'node:test';
import assert from 'node:assert';
import {
  extrairHabilidadesErudito,
  calcularResultadoEstudo,
  gerarAcoesConflitoErudito,
  PATAMARES_ESTUDO
} from '../scholarRules.js';

test('Fabula Ultima - Erudito: extração de habilidades da ficha e cálculo de Concentrado', () => {
  const fichaErudito = {
    classes: [
      {
        nome_classe: 'Erudito',
        nivel: 5,
        habilidades: [
          { nome: 'Concentrado', nivel: 3 },
          { nome: 'Análise Rápida', nivel: 2 },
          { nome: 'Conhecimento é Poder', nivel: 1 },
          { nome: 'Lampejo de Saber', nivel: 2 },
          { nome: 'Memória Treinada', nivel: 1 }
        ]
      }
    ],
    poderes_heroicos: ['Varredura Rápida', 'Previsível!']
  };

  const dados = extrairHabilidadesErudito({ ficha: fichaErudito });
  assert.strictEqual(dados.temClasseErudito, true);
  assert.strictEqual(dados.habilidades.concentrado.nivel, 3);
  assert.strictEqual(dados.habilidades.concentrado.bonusPm, 9);
  assert.strictEqual(dados.habilidades.concentrado.bonusAstAst, 3);
  assert.strictEqual(dados.habilidades.analiseRapida.nivel, 2);
  assert.strictEqual(dados.habilidades.analiseRapida.custoPmMaximo, 10);
  assert.strictEqual(dados.habilidades.conhecimentoEPoder.ativo, true);
  assert.strictEqual(dados.habilidades.lampejoDeSaber.nivel, 2);
  assert.strictEqual(dados.habilidades.memoriaTreinada.ativo, true);
  assert.strictEqual(dados.poderesHeroicos.varreduraRapida, true);
  assert.strictEqual(dados.poderesHeroicos.previsivel, true);
  assert.strictEqual(dados.poderesHeroicos.matemagica, false);
});

test('Fabula Ultima - Erudito: patamares de Estudo e ativação de Lampejo de Saber', () => {
  // 1. Falha (< 10)
  const resFalha = calcularResultadoEstudo({ d1: 3, d2: 4, bonusAstAst: 2, temLampejo: true, npLampejo: 2 });
  assert.strictEqual(resFalha.total, 9);
  assert.strictEqual(resFalha.sucesso, false);
  assert.strictEqual(resFalha.patamar, PATAMARES_ESTUDO.FALHA);
  assert.strictEqual(resFalha.ativouLampejo, false);

  // 2. Básico (10-12)
  const resBasico = calcularResultadoEstudo({ d1: 4, d2: 5, bonusAstAst: 2, temLampejo: true, npLampejo: 2 });
  assert.strictEqual(resBasico.total, 11);
  assert.strictEqual(resBasico.sucesso, true);
  assert.strictEqual(resBasico.patamar, PATAMARES_ESTUDO.BASICO);
  assert.strictEqual(resBasico.ativouLampejo, false);

  // 3. Avançado (13+) ativa Lampejo de Saber (até NP perguntas)
  const resAvancado = calcularResultadoEstudo({
    d1: 6, d2: 5, bonusAstAst: 3, temLampejo: true, npLampejo: 2, temVarreduraRapida: true
  });
  assert.strictEqual(resAvancado.total, 14);
  assert.strictEqual(resAvancado.patamar, PATAMARES_ESTUDO.AVANCADO);
  assert.strictEqual(resAvancado.ativouLampejo, true);
  assert.strictEqual(resAvancado.perguntasPermitidas, 2);
  assert.strictEqual(resAvancado.temVarreduraRapida, true);

  // 4. Completo (16+)
  const resCompleto = calcularResultadoEstudo({ d1: 8, d2: 6, bonusAstAst: 3, temLampejo: true, npLampejo: 3 });
  assert.strictEqual(resCompleto.total, 17);
  assert.strictEqual(resCompleto.patamar, PATAMARES_ESTUDO.COMPLETO);
  assert.strictEqual(resCompleto.ativouLampejo, true);
  assert.strictEqual(resCompleto.perguntasPermitidas, 3);

  // 5. Sucesso Crítico (duplos >= 6)
  const resCritico = calcularResultadoEstudo({ d1: 6, d2: 6, bonusAstAst: 1, temLampejo: true, npLampejo: 1 });
  assert.strictEqual(resCritico.isCritico, true);
  assert.strictEqual(resCritico.patamar, PATAMARES_ESTUDO.CRITICO);
  assert.strictEqual(resCritico.ativouLampejo, true);

  // 6. Desastre Crítico (1 e 1)
  const resDesastre = calcularResultadoEstudo({ d1: 1, d2: 1, bonusAstAst: 4, temLampejo: true, npLampejo: 2 });
  assert.strictEqual(resDesastre.isFumble, true);
  assert.strictEqual(resDesastre.sucesso, false);
  assert.strictEqual(resDesastre.patamar, PATAMARES_ESTUDO.DESASTRE);
  assert.strictEqual(resDesastre.ativouLampejo, false);

  // 7. Herói sem Lampejo de Saber não ativa mesmo tirando 14
  const resSemLampejo = calcularResultadoEstudo({ d1: 6, d2: 8, bonusAstAst: 0, temLampejo: false });
  assert.strictEqual(resSemLampejo.total, 14);
  assert.strictEqual(resSemLampejo.ativouLampejo, false);
  assert.strictEqual(resSemLampejo.perguntasPermitidas, 0);
});

test('Fabula Ultima - Erudito: geração de ações de conflito', () => {
  const classes = [
    {
      nome_classe: 'Erudito',
      nivel: 5,
      habilidades: [
        { nome: 'Concentrado', nivel: 2 },
        { nome: 'Análise Rápida', nivel: 3 },
        { nome: 'Lampejo de Saber', nivel: 2 }
      ]
    }
  ];
  const poderesHeroicos = ['Previsível!'];

  const acoes = gerarAcoesConflitoErudito({ classes, poderesHeroicos });
  assert.strictEqual(acoes.length, 3);

  const acaoEstudo = acoes.find((a) => a.codigo === 'ESTUDO_ERUDITO');
  assert.ok(acaoEstudo);
  assert.strictEqual(acaoEstudo.attr1, 'ast');
  assert.strictEqual(acaoEstudo.attr2, 'ast');
  assert.strictEqual(acaoEstudo.bonusTeste, 2);
  assert.strictEqual(acaoEstudo.temLampejo, true);
  assert.strictEqual(acaoEstudo.npLampejo, 2);

  const acaoAnalise = acoes.find((a) => a.codigo === 'ANALISE_RAPIDA');
  assert.ok(acaoAnalise);
  assert.strictEqual(acaoAnalise.custoPmMaximo, 15);

  const acaoPrevisivel = acoes.find((a) => a.codigo === 'PREVISIVEL');
  assert.ok(acaoPrevisivel);
  assert.strictEqual(acaoPrevisivel.custoPm, 20);
});

test('Fabula Ultima - Erudito: combatente sem a classe não gera ações de Erudito', () => {
  const classes = [{ nome_classe: 'Furioso', nivel: 5, habilidades: [] }];
  const acoes = gerarAcoesConflitoErudito({ classes });
  assert.strictEqual(acoes.length, 0);
});

test('Fabula Ultima - Erudito: Conhecimento é Poder substitui atributo mais fraco por Astúcia na arma', async () => {
  const { extrairPerfilRolagemCombatente } = await import('../combatRules.js');
  const fichaEruditoGuerreiro = {
    destreza: 6,
    astucia: 10,
    vigor: 8,
    vontade: 8,
    classes: [
      {
        nome_classe: 'Erudito',
        nivel: 3,
        habilidades: [{ nome: 'Conhecimento é Poder', nivel: 1 }]
      }
    ],
    itens: [
      {
        id: 'espada1',
        nome: 'Espada de Ferro',
        tipo: 'espada',
        equipado: true,
        slot: 'mao_dominante',
        precisao: 1,
        dano: 6,
        tipo_dano: 'fisico'
      }
    ]
  };

  const perfil = extrairPerfilRolagemCombatente({
    combatente: { id: 10, tipo: 'heroi' },
    ficha: fichaEruditoGuerreiro
  });

  const arma = perfil.armas[0];
  assert.ok(arma);
  assert.strictEqual(arma.substituiuAstucia, true, 'Deve substituir o atributo menor por Astúcia');
  assert.strictEqual(arma.attr1, 'ast', 'DES d6 foi substituído por AST d10');
  assert.strictEqual(arma.attr2, 'vig', 'VIG d8 permaneceu no 2º atributo');
});

test('Fabula Ultima - Erudito: Análise Rápida na pré-rodada e resolução de ações em combate', async () => {
  const { resolverAcaoPrePrimeiraRodada } = await import('../combatPreConflictRules.js');
  const { resolverAcaoCombate } = await import('../combatRules.js');

  const heroi = { id: 10, nome: 'Atlas', mp_atual: 25, mp_max: 30 };
  const alvo = { id: 99, nome: 'Goblin Xamã', condicoes: [] };

  const resPre = resolverAcaoPrePrimeiraRodada({
    heroi,
    tipoAcaoPre: 'ANALISE_RAPIDA',
    pmGasto: 10,
    tipoRevelacao: 'afinidade',
    alvo
  });

  assert.strictEqual(resPre.valido, true);
  assert.strictEqual(resPre.updatesHeroi.mp_atual, 15, 'Gasta 10 PM');
  assert.ok(resPre.logEntry.detalhes.includes('Afinidade'));

  const resPrevisivel = resolverAcaoCombate({
    acaoCodigo: 'PREVISIVEL',
    ator: heroi,
    alvo,
    custoPm: 20
  });

  assert.strictEqual(resPrevisivel.valido, true);
  assert.strictEqual(resPrevisivel.updatesAtor.mp_atual, 5, 'Gasta 20 PM');
  assert.ok(resPrevisivel.logEntry.detalhes.includes('Previsível!'));
});
