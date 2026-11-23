import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesAndarilho,
  calcularEfeitoCochiloPoderoso,
  gerarAcoesConflitoAndarilho,
  calcularBonusDanoCompanheiro,
  calcularPvMaxCompanheiro
} from '../wayfarerRules.js';

test('Fabula Ultima - Andarilho: identificação e extração de habilidades da ficha', () => {
  const classesAndarilho = [
    {
      nome_classe: 'Andarilho',
      nivel: 15,
      habilidades: [
        { nome: 'Companheiro Fiel', nivel: 3 },
        { nome: 'Prático', nivel: 2 },
        { nome: 'Caçador de Tesouros', nivel: 1 }
      ]
    }
  ];

  const poderesHeroicos = [
    { key: 'lado_a_lado', nome: 'Lado a Lado' },
    { key: 'cochilo_poderoso', nome: 'Cochilo Poderoso' }
  ];

  const res = extrairHabilidadesAndarilho({
    classes: classesAndarilho,
    poderesHeroicos,
    ficha: { nivel: 15 }
  });

  assert.equal(res.temClasseAndarilho, true);
  assert.equal(res.habilidades.companheiroFiel.nivel, 3);
  assert.equal(res.habilidades.companheiroFiel.ativo, true);
  assert.equal(res.habilidades.pratico.nivel, 2);
  assert.equal(res.habilidades.cacadorTesouros.nivel, 1);
  assert.equal(res.habilidades.papoTaverna.ativo, false);
  assert.equal(res.poderesHeroicos.ladoALado, true);
  assert.equal(res.poderesHeroicos.cochiloPoderoso, true);
  assert.equal(res.poderesHeroicos.companheiroHeroico, false);
});

test('Fabula Ultima - Andarilho: cálculo oficial de Cochilo Poderoso (20 + metade do nível)', () => {
  const efeitoNv10 = calcularEfeitoCochiloPoderoso(10);
  assert.equal(efeitoNv10.valorCura, 20 + 5, 'Nível 10: 20 + 5 = 25 PV e PM');
  assert.equal(efeitoNv10.defesaTemporaria, 5);
  assert.equal(efeitoNv10.encerraTurno, true);

  const efeitoNv30 = calcularEfeitoCochiloPoderoso(30);
  assert.equal(efeitoNv30.valorCura, 20 + 15, 'Nível 30: 20 + 15 = 35 PV e PM');
});

test('Fabula Ultima - Andarilho: geração de ações de conflito', () => {
  const companheiroMock = {
    id: 'comp-77',
    nome: 'Gavião Real',
    pv_atual: 25,
    pv_max: 25
  };

  const classesAndarilho = [
    {
      nome_classe: 'Andarilho',
      nivel: 20,
      habilidades: [
        { nome: 'Companheiro Fiel', nivel: 4 },
        { nome: 'Prático', nivel: 2 }
      ]
    }
  ];

  const poderes = [{ key: 'lado_a_lado', nome: 'Lado a Lado' }, { key: 'cochilo_poderoso', nome: 'Cochilo Poderoso' }];

  const acoes = gerarAcoesConflitoAndarilho({
    classes: classesAndarilho,
    poderesHeroicos: poderes,
    ficha: { nivel: 20 },
    companheiroFiel: companheiroMock
  });

  const cmdComp = acoes.find((a) => a.codigo === 'COMANDAR_COMPANHEIRO');
  assert.ok(cmdComp, 'Ação de comandar companheiro deve ser gerada');
  assert.equal(cmdComp.nivel, 4);
  assert.equal(cmdComp.temLadoALado, true);

  const ladoALado = acoes.find((a) => a.codigo === 'LADO_A_LADO_PM');
  assert.ok(ladoALado, 'Ação de Lado a Lado para recuperar PM deve ser gerada');

  const cochilo = acoes.find((a) => a.codigo === 'COCHILO_PODEROSO');
  assert.ok(cochilo, 'Ação de Cochilo Poderoso deve ser gerada');
  assert.equal(cochilo.valorCura, 20 + 10, 'Nível 20 cura 30');

  const pratico = acoes.find((a) => a.codigo === 'PRATICO_SUPORTE');
  assert.ok(pratico, 'Ação de Suporte Prático deve ser gerada');
  assert.equal(pratico.nivel, 2);
});

test('Fabula Ultima - Andarilho: herói sem a classe não gera ações de Andarilho', () => {
  const classesOutras = [
    { nome_classe: 'Guardião', nivel: 10, habilidades: [{ nome: 'Fortaleza', nivel: 2 }] }
  ];

  const acoes = gerarAcoesConflitoAndarilho({
    classes: classesOutras,
    poderesHeroicos: [],
    ficha: { nivel: 10 },
    companheiroFiel: null
  });

  assert.equal(acoes.length, 0, 'Nenhuma ação de Andarilho para herói sem a classe');
});

test('Fabula Ultima - Andarilho: cálculo de bônus de dano e PV máx com poderes heroicos', () => {
  const dadosSemHeroico = { poderesHeroicos: { ladoALado: false, companheiroHeroico: false } };
  assert.equal(calcularBonusDanoCompanheiro(dadosSemHeroico), 0);
  assert.equal(calcularPvMaxCompanheiro(25, dadosSemHeroico), 25);

  const dadosComLadoALado = { poderesHeroicos: { ladoALado: true, companheiroHeroico: false } };
  assert.equal(calcularBonusDanoCompanheiro(dadosComLadoALado), 5);

  const dadosCompanheiroHeroico = { poderesHeroicos: { ladoALado: true, companheiroHeroico: true } };
  assert.equal(calcularBonusDanoCompanheiro(dadosCompanheiroHeroico), 10);
  assert.equal(calcularPvMaxCompanheiro(25, dadosCompanheiroHeroico), 35);
});
