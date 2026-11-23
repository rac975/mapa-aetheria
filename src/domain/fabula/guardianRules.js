/**
 * Fabula Ultima - Regras da Classe Guardião (Guardian)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesGuardiao({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('guardiao') || nome.includes('guardian');
  });

  const nvFortaleza = obterNivelHabilidade(listaClasses, 'guardiao', 'fortaleza');
  const nvMaestriaDefensiva = obterNivelHabilidade(listaClasses, 'guardiao', 'maestria defensiva');
  const nvDuploEscudeiro = obterNivelHabilidade(listaClasses, 'guardiao', 'duplo escudeiro');
  const nvGuardaCostas = obterNivelHabilidade(listaClasses, 'guardiao', 'guarda-costas');
  const nvProteger = obterNivelHabilidade(listaClasses, 'guardiao', 'proteger');

  return {
    temClasse,
    habilidades: {
      fortaleza: {
        nivel: nvFortaleza,
        ativo: nvFortaleza > 0,
        bonusPvMax: nvFortaleza * 3
      },
      maestriaDefensiva: {
        nivel: nvMaestriaDefensiva,
        ativo: nvMaestriaDefensiva > 0,
        reducaoDano: nvMaestriaDefensiva
      },
      duploEscudeiro: {
        nivel: nvDuploEscudeiro,
        ativo: nvDuploEscudeiro > 0
      },
      guardaCostas: {
        nivel: nvGuardaCostas,
        ativo: nvGuardaCostas > 0
      },
      proteger: {
        nivel: nvProteger,
        ativo: nvProteger > 0
      }
    }
  };
}

export function calcularReducaoMaestriaDefensiva({ nivel = 1, temEscudoOuArmaduraMarcial = true } = {}) {
  if (!temEscudoOuArmaduraMarcial) return 0;
  const np = Math.max(0, parseInt(nivel, 10) || 0);
  return np;
}

export function gerarAcoesConflitoGuardiao({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesGuardiao({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  // 1. Proteger
  if (dados.habilidades.proteger.ativo) {
    acoes.push({
      id: 'guardiao_proteger',
      codigo: 'PROTEGER',
      nome: '🛡️ Proteger (Reação • Tomar o Lugar de Aliado)',
      nomeCurto: 'Proteger',
      tipo: 'reacao_combate',
      classe: 'Guardião',
      isAcaoExtra: true,
      descricao: 'Quando outro aliado for ameaçado por um ataque, feitiço ou perigo: tome o lugar dele e sofra todos os testes e danos no lugar dele (1x por rodada).'
    });
  }

  // 2. Guarda-Costas
  if (dados.habilidades.guardaCostas.ativo) {
    acoes.push({
      id: 'guardiao_guarda_costas',
      codigo: 'GUARDA_COSTAS',
      nome: '🤝 Guarda-Costas (Aliado Coberto Ganha Resistência)',
      nomeCurto: 'Guarda-Costas',
      tipo: 'modificador_guarda',
      classe: 'Guardião',
      isAcaoExtra: true,
      descricao: 'Ao realizar a ação Guarda dando cobertura a um aliado: aquele aliado torna-se Resistente a todos os tipos de dano até o início do seu próximo turno.'
    });
  }

  // 3. Duplo Escudeiro
  if (dados.habilidades.duploEscudeiro.ativo) {
    const bonusDano = dados.habilidades.maestriaDefensiva.reducaoDano || 0;
    acoes.push({
      id: 'guardiao_escudos_gemeos',
      codigo: 'ESCUDOS_GEMEOS',
      nome: `⚔️ Escudos Gêmeos ([VIG+VIG] • RA+${5 + bonusDano} Físico)`,
      nomeCurto: 'Escudos Gêmeos',
      tipo: 'acao_combate',
      classe: 'Guardião',
      attr1: 'vig',
      attr2: 'vig',
      danoBase: 5 + bonusDano,
      tipoDano: 'fisico',
      descricao: `Ataque corpo a corpo de duas mãos empunhando dois escudos: Precisão [VIG + VIG], Dano [RA + ${5 + bonusDano}] físico (inclui +${bonusDano} de Maestria Defensiva).`
    });
  }

  return acoes;
}
