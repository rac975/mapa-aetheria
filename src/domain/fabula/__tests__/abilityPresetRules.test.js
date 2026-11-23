import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isHabilidadeEleitaPreset,
  extrairHabilidadesEleitasCombatente,
  obterPresetsHabilidade
} from '../abilityPresetRules.js';
import { resolverAcaoCombate } from '../combatRules.js';

test('Fabula Ultima - Presets: identificação estrita de habilidades eleitas', () => {
  // Habilidades eleitas
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'QUEBRA_OSSOS' }), true);
  assert.equal(isHabilidadeEleitaPreset({ nome: 'Análise Rápida' }), true);
  assert.equal(isHabilidadeEleitaPreset({ nome: 'Palavras de Sabedoria' }), true);
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'CORACAO_NO_MOTOR' }), true);
  assert.equal(isHabilidadeEleitaPreset({ nome: 'Configuração Flexível' }), true);
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'TIRO_DE_AVISO' }), true);
  assert.equal(isHabilidadeEleitaPreset({ nome: 'Barragem' }), true);
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'OLHOS_DE_AGUIA' }), true);

  // Habilidades com fluxo próprio ou passivas (DEVEM RETORNAR FALSE)
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'GOLPE_BAIXO' }), false);
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'ROUBO_DE_ALMA' }), false);
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'VEJO_VOCE_MAIS_TARDE' }), false);
  assert.equal(isHabilidadeEleitaPreset({ codigo: 'CHUVA_DE_LAMINAS' }), false);
  assert.equal(isHabilidadeEleitaPreset({ nome: 'Concentrado' }), false);
  assert.equal(isHabilidadeEleitaPreset(null), false);
});

test('Fabula Ultima - Presets: Quebra-Ossos gera 3 opções oficiais com Dano 0', () => {
  const presets = obterPresetsHabilidade({ codigo: 'QUEBRA_OSSOS', nivel: 3 }, { alvo: { nome: 'Chefe Goblin' } });
  assert.equal(presets.length, 3);
  assert.equal(presets[0].valores.danoAplicado, 0);
  assert.equal(presets[0].valores.condicaoAlvo, 'atordoado');
  assert.equal(presets[1].valores.danoAplicado, 0);
  assert.equal(presets[1].valores.condicaoAlvo, 'fraco');
  assert.equal(presets[2].valores.danoAplicado, 0);
  assert.equal(presets[2].valores.perdaPmAlvo, 30);
  assert.ok(presets[2].valores.notaLivre.includes('30 PM'));
});

test('Fabula Ultima - Presets: Atirador (Tiro de Aviso, Barragem e Olhos de Águia)', () => {
  // 1. Tiro de Aviso (NP 3) -> Dano 0 em todas as 3 opções
  const presetsAviso = obterPresetsHabilidade({ codigo: 'TIRO_DE_AVISO', nivel: 3 }, { alvo: { nome: 'Franco-Atirador' } });
  assert.equal(presetsAviso.length, 3);
  assert.equal(presetsAviso[0].valores.danoAplicado, 0);
  assert.equal(presetsAviso[0].valores.condicaoAlvo, 'abalado');
  assert.equal(presetsAviso[1].valores.danoAplicado, 0);
  assert.equal(presetsAviso[1].valores.condicaoAlvo, 'lento');
  assert.equal(presetsAviso[2].valores.danoAplicado, 0);
  assert.equal(presetsAviso[2].valores.perdaPmAlvo, 30);
  assert.ok(presetsAviso[2].valores.notaLivre.includes('30 PM'));

  // 2. Barragem (10 PM)
  const presetsBarragem = obterPresetsHabilidade({ codigo: 'BARRAGEM' });
  assert.equal(presetsBarragem.length, 2);
  assert.equal(presetsBarragem[0].valores.custoPm, 10);
  assert.ok(presetsBarragem[0].valores.notaLivre.includes('Multi (2)'));
  assert.equal(presetsBarragem[1].valores.custoPm, 10);
  assert.ok(presetsBarragem[1].valores.notaLivre.includes('+1'));

  // 3. Olhos de Águia (NP 4) -> +12 Dano ou Disparo RA 0
  const presetsAguia = obterPresetsHabilidade({ codigo: 'OLHOS_DE_AGUIA', nivel: 4 });
  assert.equal(presetsAguia.length, 2);
  assert.equal(presetsAguia[0].valores.danoAplicado, 12);
  assert.equal(presetsAguia[1].valores.danoAplicado, 0);
});

test('Fabula Ultima - Presets: Análise Rápida e Palavras de Sabedoria (Erudito)', () => {
  const presetsAnalise = obterPresetsHabilidade({ codigo: 'ANALISE_RAPIDA' });
  assert.equal(presetsAnalise.length, 2);
  assert.equal(presetsAnalise[0].valores.custoPm, 5);

  const presetsPalavras = obterPresetsHabilidade({ codigo: 'PALAVRAS_SABEDORIA' });
  assert.equal(presetsPalavras.length, 4);
  assert.equal(presetsPalavras[0].valores.curaAplicada, 20);
  assert.equal(presetsPalavras[0].valores.recursoCura, 'pm');
  assert.equal(presetsPalavras[3].valores.avancoRelogio, 1);
});

test('Fabula Ultima - Presets: Piloto (Coração no Motor e Configuração Flexível)', () => {
  const presetsMotor = obterPresetsHabilidade({ codigo: 'CORACAO_NO_MOTOR', nivel: 2 });
  assert.equal(presetsMotor.length, 3);
  assert.equal(presetsMotor[0].valores.danoAplicado, 4);
  assert.equal(presetsMotor[0].valores.custoPm, 10);

  const presetsFlex = obterPresetsHabilidade({ codigo: 'CONFIGURACAO_FLEXIVEL', nivel: 3 });
  assert.equal(presetsFlex.length, 1);
  assert.ok(presetsFlex[0].valores.notaLivre.includes('3'));
});

test('Fabula Ultima - Presets: deduplicação e normalização na extração do perfil', () => {
  const perfil = {
    habilidades: [
      { codigo: 'GOLPE_BAIXO', nome: 'Golpe Baixo' },
      { codigo: 'QUEBRA_OSSOS', nome: 'Quebra-Ossos' },
      { codigo: 'OLHOS_DE_AGUIA_DANO', nome: 'Olhos de Águia: Dano' },
      { codigo: 'OLHOS_DE_AGUIA_TIRO_LIVRE', nome: 'Olhos de Águia: Tiro Livre' },
      { nome: 'Tiro de Aviso' }
    ]
  };

  const eleitas = extrairHabilidadesEleitasCombatente(perfil);
  assert.equal(eleitas.length, 3);
  const codigos = eleitas.map((h) => h.codigo);
  assert.deepEqual(codigos, ['QUEBRA_OSSOS', 'OLHOS_DE_AGUIA', 'TIRO_DE_AVISO']);
});

test('Fabula Ultima - Resolução: Preset Tiro de Aviso drena PM e Dano 0 no alvo', () => {
  const ator = { id: 'san_holo', nome: 'San Holo', hp_atual: 45, hp_max: 45, mp_atual: 35, mp_max: 35 };
  const alvo = { id: 'mago_imperial', nome: 'Mago Imperial', hp_atual: 35, hp_max: 35, mp_atual: 40, mp_max: 40 };

  const presets = obterPresetsHabilidade({ codigo: 'TIRO_DE_AVISO', nivel: 3 }, { alvo });
  const presetDrenar = presets[2]; // Drenar 30 PM

  const res = resolverAcaoCombate({
    acaoCodigo: 'TIRO_DE_AVISO',
    ator,
    alvo,
    danoAplicado: presetDrenar.valores.danoAplicado,
    perdaPmAlvo: presetDrenar.valores.perdaPmAlvo,
    notaLivre: presetDrenar.valores.notaLivre,
    marcarTurnoConcluido: true
  });

  assert.equal(res.valido, true);
  assert.equal(res.updatesAlvo.hp_atual, undefined); // Dano 0 não reduz PV
  assert.equal(res.updatesAlvo.mp_atual, 10); // 40 - 30 = 10 PM
  assert.equal(res.updatesAtor.agiu, true);
  assert.ok(res.logEntry.detalhes.includes('perdeu 30 PM'));
});

test('Fabula Ultima - Resolução: Preset Quebra-Ossos aplica condição e Dano 0 sem erro', () => {
  const ator = { id: 'mestre', nome: 'Garet', hp_atual: 50, hp_max: 50, mp_atual: 40, mp_max: 40 };
  const alvo = { id: 'goblin', nome: 'Chefe Goblin', hp_atual: 30, hp_max: 30, condicoes: [] };
  const presets = obterPresetsHabilidade({ codigo: 'QUEBRA_OSSOS', nivel: 2 }, { alvo });

  const res = resolverAcaoCombate({
    acaoCodigo: 'QUEBRA_OSSOS',
    ator,
    alvo,
    danoAplicado: presets[0].valores.danoAplicado,
    condicaoAlvo: presets[0].valores.condicaoAlvo,
    notaLivre: presets[0].valores.notaLivre,
    marcarTurnoConcluido: true
  });

  assert.equal(res.valido, true);
  assert.equal(res.updatesAlvo.hp_atual, undefined);
  assert.deepEqual(res.updatesAlvo.condicoes, ['atordoado']);
  assert.equal(res.updatesAtor.agiu, true);
});

test('Fabula Ultima - Resolução: ACAO_LIVRE e fallback dinâmico', () => {
  const ator = { id: 'vaan', nome: 'Vaan', hp_atual: 40, hp_max: 40, mp_atual: 30, mp_max: 30 };
  const res = resolverAcaoCombate({
    acaoCodigo: 'ACAO_LIVRE',
    ator,
    notaLivre: 'Manobra livre',
    marcarTurnoConcluido: true
  });
  assert.equal(res.valido, true);
  assert.equal(res.updatesAtor.agiu, true);

  const resDyn = resolverAcaoCombate({
    acaoCodigo: 'CUSTOM_HABILIDADE',
    ator,
    custoPm: 5,
    marcarTurnoConcluido: true
  });
  assert.equal(resDyn.valido, true);
  assert.equal(resDyn.updatesAtor.mp_atual, 25);
});
