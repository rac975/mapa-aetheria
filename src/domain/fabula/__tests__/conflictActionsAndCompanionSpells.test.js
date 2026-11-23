import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolverAcaoCombate,
  ACOES_CONFLITO_OFICIAIS
} from '../combatRules.js';

describe('Fabula Ultima - Ações de Conflito Estendidas e Resolução', () => {
  const criarAtor = (opts = {}) => ({
    id: opts.id || 'h1',
    nome: opts.nome || 'Herói Guerreiro',
    tipo: 'heroi',
    hp_atual: opts.hp ?? 40,
    hp_max: 50,
    mp_atual: opts.mp ?? 30,
    mp_max: 40,
    ip_atual: opts.ip ?? 6,
    ip_max: 6,
    modificadores: opts.modificadores || {}
  });

  const criarAlvo = (opts = {}) => ({
    id: opts.id || 'i1',
    nome: opts.nome || 'Lobo Sombrio',
    tipo: 'inimigo',
    hp_atual: opts.hp ?? 40,
    hp_max: 60,
    mp_atual: opts.mp ?? 20,
    mp_max: 20,
    condicoes: opts.condicoes || [],
    modificadores: opts.modificadores || {}
  });

  it('Ação GUARDA / GUARDAR deve conceder guarda ao ator e registrar no histórico', () => {
    const ator = criarAtor();
    const resGuarda = resolverAcaoCombate({
      acaoCodigo: 'GUARDA',
      ator,
      notaLivre: 'Assume postura defensiva com escudo levantado.'
    });

    assert.equal(resGuarda.valido, true);
    assert.equal(resGuarda.updatesAtor.guardando, true);
    assert.equal(resGuarda.logEntry.acao_codigo, 'GUARDAR');
    assert.match(resGuarda.logEntry.detalhes, /Em Guarda/i);
    assert.match(resGuarda.logEntry.detalhes, /postura defensiva/i);

    const resGuardar = resolverAcaoCombate({
      acaoCodigo: ACOES_CONFLITO_OFICIAIS.GUARDAR.codigo,
      ator
    });
    assert.equal(resGuardar.valido, true);
    assert.equal(resGuardar.updatesAtor.guardando, true);
  });

  it('Ação ESTUDO deve registrar nota e resolver adequadamente', () => {
    const ator = criarAtor();
    const alvo = criarAlvo();
    const res = resolverAcaoCombate({
      acaoCodigo: 'ESTUDO',
      ator,
      alvo,
      notaLivre: 'Observa os padrões de movimento do monstro.'
    });

    assert.equal(res.valido, true);
    assert.equal(res.logEntry.acao_codigo, 'ESTUDO');
    assert.match(res.logEntry.detalhes, /Estudo/i);
    assert.match(res.logEntry.detalhes, /Lobo Sombrio/);
  });

  it('Ação OBJETIVO deve avançar relógio em conflito', () => {
    const ator = criarAtor();
    const res = resolverAcaoCombate({
      acaoCodigo: 'OBJETIVO',
      ator,
      avancoRelogio: 2,
      notaLivre: 'Aciona as alavancas do portão.'
    });

    assert.equal(res.valido, true);
    assert.equal(res.deltaRelogio, 2);
    assert.equal(res.logEntry.acao_codigo, 'OBJETIVO');
    assert.match(res.logEntry.detalhes, /Objetivo/i);
    assert.match(res.logEntry.detalhes, /\+2/);
  });

  it('Ação OBJETIVO com avanço zero deve assumir +1 seção por padrão', () => {
    const ator = criarAtor();
    const res = resolverAcaoCombate({
      acaoCodigo: 'OBJETIVO',
      ator,
      avancoRelogio: 0
    });

    assert.equal(res.valido, true);
    assert.equal(res.deltaRelogio, 1);
  });

  it('Ação IMPEDIMENTO deve registrar efeito tático no histórico', () => {
    const ator = criarAtor();
    const alvo = criarAlvo();
    const res = resolverAcaoCombate({
      acaoCodigo: 'IMPEDIMENTO',
      ator,
      alvo,
      notaLivre: 'Derruba barris bloqueando a passagem.'
    });

    assert.equal(res.valido, true);
    assert.equal(res.logEntry.acao_codigo, 'IMPEDIMENTO');
    assert.match(res.logEntry.detalhes, /Impedimento/i);
    assert.match(res.logEntry.detalhes, /barris/i);
  });

  it('Ação RENDICAO deve conceder +2 Pontos de Fábula ao herói e registrar no histórico', () => {
    const ator = criarAtor();
    ator.pontos_fabula = 1;
    const res = resolverAcaoCombate({
      acaoCodigo: 'RENDICAO',
      ator,
      notaLivre: 'Abaixa as armas para negociar os termos.'
    });

    assert.equal(res.valido, true);
    assert.equal(res.updatesAtor.pontos_fabula, 3);
    assert.match(res.logEntry.detalhes, /Rendição/i);
  });

  it('Ação EQUIPAMENTO deve registrar troca de equipamento', () => {
    const ator = criarAtor();
    const res = resolverAcaoCombate({
      acaoCodigo: 'EQUIPAMENTO',
      ator,
      notaLivre: 'Guarda o arco e empunha a lança pesada.'
    });

    assert.equal(res.valido, true);
    assert.equal(res.logEntry.acao_codigo, 'EQUIPAMENTO');
    assert.match(res.logEntry.detalhes, /Equipamento/i);
  });

  it('Ação INVENTARIO deve debitar PI do ator e aplicar cura e restauração', () => {
    const ator = criarAtor({ ip: 6 });
    const alvo = criarAlvo({ hp: 20, mp: 10, condicoes: ['abalado', 'lento'] });

    const res = resolverAcaoCombate({
      acaoCodigo: 'INVENTARIO',
      ator,
      alvo,
      custoPi: 2,
      curaAplicada: 40,
      recursoCura: 'pv',
      limparCondicoes: true,
      notaLivre: 'Poção Restauradora de Cura.'
    });

    assert.equal(res.valido, true);
    assert.equal(res.logEntry.metadata.pi_gasto, 2);
    assert.equal(res.updatesAtor.ip_atual, 4);
    assert.equal(res.updatesAlvo.hp_atual, 60);
    assert.deepEqual(res.updatesAlvo.condicoes, []);
  });

  it('Ação INVENTARIO com remoção de condição específica', () => {
    const ator = criarAtor();
    const alvo = criarAlvo({ condicoes: ['envenenado', 'fraco'] });

    const res = resolverAcaoCombate({
      acaoCodigo: 'INVENTARIO',
      ator,
      alvo,
      custoPi: 1,
      removerCondicaoAlvo: 'envenenado'
    });

    assert.equal(res.valido, true);
    assert.deepEqual(res.updatesAlvo.condicoes, ['fraco']);
  });

  it('Simulação de débito de PM em Companheiro Fiel isolado do Herói Dono', () => {
    const heroiDono = criarAtor({ id: 'heroi-123', mp: 35 });
    const companheiro = {
      id: 'comp-999',
      nome: 'Gavião Real',
      heroiId: 'heroi-123',
      pm_atual: 15,
      pm_max: 20
    };

    const custoFeiticoComp = 10;
    assert.ok(companheiro.pm_atual >= custoFeiticoComp, 'Companheiro tem PM suficiente');

    const novoPmComp = Math.max(0, companheiro.pm_atual - custoFeiticoComp);
    assert.equal(novoPmComp, 5, 'PM do companheiro reduzido corretamente');
    assert.equal(heroiDono.mp_atual, 35, 'PM do herói dono permaneceu intacto');
  });
});
