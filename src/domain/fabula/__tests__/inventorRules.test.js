import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularLimiteMagiesferas,
  validarDisciplinaMagiesfera,
  extrairMagiesferasInventor,
  extrairHabilidadesInventor,
  calcularCustoPiComBolsosFundos,
  calcularCuraComFormulaSecreta,
  calcularDanoComFormulaSecreta,
  gerarAcoesConflitoInventor,
  CUSTO_PI_ATIVACAO_MAGIESFERA
} from '../inventorRules.js';

test('Fabula Ultima - Tecnomagia Superior: limite de magiesferas por nível', () => {
  assert.equal(calcularLimiteMagiesferas(5), 3, 'Nível 5: 3 magiesferas base');
  assert.equal(calcularLimiteMagiesferas(19), 3, 'Nível 19: 3 magiesferas base');
  assert.equal(calcularLimiteMagiesferas(20), 4, 'Nível 20: +1 magiesfera (total 4)');
  assert.equal(calcularLimiteMagiesferas(39), 4, 'Nível 39: 4 magiesferas');
  assert.equal(calcularLimiteMagiesferas(40), 5, 'Nível 40: +1 magiesfera (total 5)');
  assert.equal(calcularLimiteMagiesferas(60), 5, 'Nível 60: 5 magiesferas');
});

test('Fabula Ultima - Disciplinas permitidas para Magiesferas (Elementalista, Entropista, Espiritualista)', () => {
  assert.equal(validarDisciplinaMagiesfera('Elementalista'), true);
  assert.equal(validarDisciplinaMagiesfera('Entropista'), true);
  assert.equal(validarDisciplinaMagiesfera('Espiritualista'), true);
  assert.equal(validarDisciplinaMagiesfera('elementalista'), true);
  assert.equal(validarDisciplinaMagiesfera('espiritualista'), true);
  assert.equal(validarDisciplinaMagiesfera('Quimerista'), false);
  assert.equal(validarDisciplinaMagiesfera('Arcanista'), false);
  assert.equal(validarDisciplinaMagiesfera('Guerreiro'), false);
  assert.equal(validarDisciplinaMagiesfera(''), false);
  assert.equal(validarDisciplinaMagiesfera(null), false);
});

test('Fabula Ultima - Extração de Magiesferas sem Tecnomagia Superior', () => {
  const classesSemSuperior = [
    {
      nome_classe: 'Inventor',
      nivel: 10,
      habilidades: [{ nome: 'Engenhocas', nivel: 2, ramos: { tecnomagia: 'avancado' } }]
    }
  ];
  const res = extrairMagiesferasInventor({ classes: classesSemSuperior });
  assert.equal(res.temSuperiorTecnomagia, false);
  assert.equal(res.limite, 0);
  assert.equal(res.magiesferas.length, 0);
});

test('Fabula Ultima - Extração e ativação via Ação de Inventário (Custo 2 PI + PM)', () => {
  const classesComSuperior = [
    {
      nome_classe: 'Inventor',
      nivel: 25,
      habilidades: [
        {
          nome: 'Engenhocas',
          nivel: 5,
          ramos: { tecnomagia: 'superior' },
          magiesferas: [
            { id: 'm1', nome: 'Labareda', classe: 'Elementalista', pm_custo: 10, descricao: 'Dano de fogo' },
            { id: 'm2', nome: 'Acelerador', classe: 'Entropista', pm_custo: 15, descricao: 'Acelera alvo' }
          ]
        }
      ]
    }
  ];

  const res = extrairMagiesferasInventor({ classes: classesComSuperior });
  assert.equal(res.temSuperiorTecnomagia, true);
  assert.equal(res.limite, 4, 'Nível 25 concede limite de 4 magiesferas');
  assert.equal(res.magiesferas.length, 2);

  const labareda = res.magiesferas[0];
  assert.equal(labareda.nome, 'Labareda');
  assert.equal(labareda.custoPi, CUSTO_PI_ATIVACAO_MAGIESFERA, 'Custo de 2 PI da Ação Inventário');
  assert.equal(labareda.custoPm, 10, 'Mantém custo de 10 PM');
  assert.equal(labareda.tipo_acao, 'inventario');
  assert.equal(labareda.isMagiesfera, true);
});

test('Fabula Ultima - Inventor: Bolsos Fundos e Fórmula Secreta', () => {
  // Bolsos fundos reduz custo de PI em -1 (mínimo 1)
  assert.equal(calcularCustoPiComBolsosFundos({ custoPi: 3, temBolsosFundos: true }), 2);
  assert.equal(calcularCustoPiComBolsosFundos({ custoPi: 1, temBolsosFundos: true }), 1);
  assert.equal(calcularCustoPiComBolsosFundos({ custoPi: 2, temBolsosFundos: false }), 2);

  // Fórmula Secreta (+5 cura por NP, +1 dano por NP)
  assert.equal(calcularCuraComFormulaSecreta({ curaBase: 30, npFormulaSecreta: 4 }), 50); // 30 + (4 * 5)
  assert.equal(calcularDanoComFormulaSecreta({ danoBase: 20, npFormulaSecreta: 3 }), 23); // 20 + 3
});

test('Fabula Ultima - Inventor: extração de habilidades e geração de ações de conflito', () => {
  const fichaInventor = {
    nivel: 15,
    classes: [
      {
        nome_classe: 'Inventor',
        nivel: 5,
        habilidades: [
          { nome: 'Chuva de Poções', nivel: 2 },
          { nome: 'Engenhocas', nivel: 3, ramos: { alquimia: true, infusoes: true } },
          { nome: 'Fórmula Secreta', nivel: 3 },
          { nome: 'Item Emergencial', nivel: 1 }
        ]
      }
    ],
    poderes_heroicos: ['Bolsos Fundos']
  };

  const dados = extrairHabilidadesInventor({ ficha: fichaInventor });
  assert.equal(dados.temClasseInventor, true);
  assert.equal(dados.habilidades.chuvaPocoes.ativo, true);
  assert.equal(dados.habilidades.itemEmergencial.ativo, true);
  assert.equal(dados.habilidades.formulaSecreta.bonusCura, 15);
  assert.equal(dados.poderesHeroicos.bolsosFundos, true);

  // Fora de crise: Item Emergencial não gera ação
  const acoesSemCrise = gerarAcoesConflitoInventor({ ficha: fichaInventor, emCrise: false });
  const codigosSemCrise = acoesSemCrise.map((a) => a.codigo);
  assert.equal(codigosSemCrise.includes('ITEM_EMERGENCIAL'), false);
  assert.ok(codigosSemCrise.includes('CHUVA_POCOES'));
  assert.ok(codigosSemCrise.includes('TONICO_ALQUIMICO'));
  assert.ok(codigosSemCrise.includes('BOMBA_ALQUIMICA'));
  assert.ok(codigosSemCrise.includes('INFUSAO_ELEMENTAL'));

  // Em crise: Item Emergencial gera ação
  const acoesEmCrise = gerarAcoesConflitoInventor({ ficha: fichaInventor, emCrise: true });
  const codigosEmCrise = acoesEmCrise.map((a) => a.codigo);
  assert.ok(codigosEmCrise.includes('ITEM_EMERGENCIAL'));

  // Personagem sem a classe Inventor não gera ações
  const acoesGuerreiro = gerarAcoesConflitoInventor({ classes: [{ nome_classe: 'Guardião' }] });
  assert.equal(acoesGuerreiro.length, 0);
});

test('Fabula Ultima - Inventor: integração de combate e resolução de ações com PI', async () => {
  const { extrairPerfilRolagemCombatente, resolverAcaoCombate } = await import('../combatRules.js');

  const ficha = {
    nome_personagem: 'Cid',
    destreza: 8,
    astucia: 10,
    vigor: 8,
    vontade: 8,
    classes: [
      {
        nome_classe: 'Inventor',
        nivel: 10,
        habilidades: [
          { nome: 'Chuva de Poções', nivel: 2 },
          { nome: 'Engenhocas', nivel: 3, ramos: { alquimia: true, tecnomagia: 'superior' } },
          { nome: 'Fórmula Secreta', nivel: 2 },
          { nome: 'Item Emergencial', nivel: 1 }
        ],
        magiesferas: [
          { id: 'mag_1', nome: 'Labareda', classe: 'Elementalista', pm_custo: 10, ofensivo: true }
        ]
      }
    ],
    poderes_heroicos: ['Bolsos Fundos']
  };

  const combatenteCrise = {
    id: 'hero_cid',
    nome: 'Cid',
    tipo: 'heroi',
    hp_atual: 15, // Em crise (15 <= 22)
    hp_max: 45,
    mp_atual: 40,
    mp_max: 40,
    ip: 6
  };

  const perfil = extrairPerfilRolagemCombatente({ combatente: combatenteCrise, ficha });
  assert.equal(perfil.dadosInventor.temClasseInventor, true);

  // Magiesfera Labareda deve ter custo reduzido por Bolsos Fundos (2 PI - 1 = 1 PI)
  const esfera = perfil.magias.find((m) => m.nome.includes('Labareda'));
  assert.ok(esfera);
  assert.equal(esfera.custoPi, 1);

  // Ações de conflito de Inventor injetadas em habilidades
  const nomesHabs = perfil.habilidades.map((h) => h.codigo);
  assert.ok(nomesHabs.includes('ITEM_EMERGENCIAL'));
  assert.ok(nomesHabs.includes('CHUVA_POCOES'));
  assert.ok(nomesHabs.includes('TONICO_ALQUIMICO'));

  // Executa Tônico Alquímico (gasta 1 PI por Bolsos Fundos e cura 30 + 10 = 40 PV por Fórmula Secreta Nv 2)
  const resTonico = resolverAcaoCombate({
    acaoCodigo: 'TONICO_ALQUIMICO',
    ator: combatenteCrise,
    alvo: combatenteCrise,
    custoPi: 1,
    curaAplicada: 40,
    recursoCura: 'pv'
  });
  assert.equal(resTonico.valido, true);
  assert.equal(resTonico.updatesAtor.ip, 5); // 6 - 1 = 5 PI
  assert.equal(resTonico.updatesAtor.hp_atual, 45); // Curou 40 PV até o max (15 + 40 = 55 -> clamp 45)

  // Executa Item Emergencial (ação adicional sem encerrar o turno do herói)
  const resEmergencial = resolverAcaoCombate({
    acaoCodigo: 'ITEM_EMERGENCIAL',
    ator: combatenteCrise,
    marcarTurnoConcluido: false
  });
  assert.equal(resEmergencial.valido, true);
  assert.equal(resEmergencial.updatesAtor.agiu, undefined);
});
