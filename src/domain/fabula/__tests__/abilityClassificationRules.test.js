import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isHabilidadePassiva,
  isHabilidadeAtiva,
  separarHabilidadesAtivasEPassivas
} from '../abilityClassificationRules.js';

test('Fabula Ultima - Classificação: Piloto em Conflito', () => {
  // Ativas
  const coracao = { nome: 'Coração no Motor', nivel: 2, custoPm: 10 };
  const flexivel = { nome: 'Configuração Flexível', nivel: 1, tipo: 'acao_suporte' };
  assert.equal(isHabilidadeAtiva(coracao), true);
  assert.equal(isHabilidadePassiva(coracao), false);
  assert.equal(isHabilidadeAtiva(flexivel), true);
  assert.equal(isHabilidadePassiva(flexivel), false);

  // Passivas / Narrativas
  const pulsoFirme = { nome: 'Pulso Firme', nivel: 1, descricao: 'Substitui atributo por Vigor em testes de armas do veículo.' };
  const compressao = { nome: 'Compressão Tecnológica', nivel: 1, descricao: 'Fora de conflito, compacta o veículo em um objeto minúsculo.' };
  const veiculo = { nome: 'Veículo Pessoal', nivel: 3, descricao: 'Define estrutura, módulos e armamento do veículo.' };
  assert.equal(isHabilidadePassiva(pulsoFirme), true);
  assert.equal(isHabilidadeAtiva(pulsoFirme), false);
  assert.equal(isHabilidadePassiva(compressao), true);
  assert.equal(isHabilidadePassiva(veiculo), true);
});

test('Fabula Ultima - Classificação: Ladino e Mestre de Armas', () => {
  const golpeBaixo = { nome: 'Golpe Baixo', nivel: 2, tipo: 'modificador_ataque' };
  const rouboDeAlma = { nome: 'Roubo de Alma', nivel: 1 };
  const esquiva = { nome: 'Esquiva', nivel: 1, descricao: 'Aumenta permanentemente sua DEF.' };
  const cacador = { nome: 'Caçador de Tesouros', nivel: 1 };

  assert.equal(isHabilidadeAtiva(golpeBaixo), true);
  assert.equal(isHabilidadeAtiva(rouboDeAlma), true);
  assert.equal(isHabilidadePassiva(esquiva), true);
  assert.equal(isHabilidadePassiva(cacador), true);

  const quebraOssos = { nome: 'Quebra-Ossos', nivel: 1 };
  const maestriaArmas = { nome: 'Maestria com Armas', nivel: 2 };
  assert.equal(isHabilidadeAtiva(quebraOssos), true);
  assert.equal(isHabilidadePassiva(maestriaArmas), true);
});

test('Fabula Ultima - Classificação: flags e custos genéricos', () => {
  const habComCusto = { nome: 'Poder Misterioso', custoPm: 15 };
  assert.equal(isHabilidadeAtiva(habComCusto), true);

  const habPassivaExplicita = { nome: 'Resiliência Antiga', passiva: true };
  assert.equal(isHabilidadePassiva(habPassivaExplicita), true);

  const habTipoPassiva = { nome: 'Foco Mental', tipo: 'passiva' };
  assert.equal(isHabilidadePassiva(habTipoPassiva), true);
});

test('Fabula Ultima - separarHabilidadesAtivasEPassivas: divisão e deduplicação', () => {
  const lista = [
    { id: '1', nome: 'Coração no Motor', custoPm: 10 },
    { id: '2', nome: 'Pulso Firme', descricao: 'Passiva de veículo' },
    { id: '3', nome: 'Coração no Motor', custoPm: 10 }, // Duplicata
    { id: '4', nome: 'Veículo Pessoal' },
    { id: '5', nome: 'Configuração Flexível', tipo: 'acao_suporte' },
    { id: '6', nome: 'Esquiva' }
  ];

  const { ativas, passivas } = separarHabilidadesAtivasEPassivas(lista);

  assert.equal(ativas.length, 2);
  assert.deepEqual(ativas.map((a) => a.nome), ['Coração no Motor', 'Configuração Flexível']);

  assert.equal(passivas.length, 3);
  assert.deepEqual(passivas.map((p) => p.nome), ['Pulso Firme', 'Veículo Pessoal', 'Esquiva']);
});
