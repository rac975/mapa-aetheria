/**
 * Fabula Ultima - Catálogo de Presets Táticos do Bloco D
 * Floralista, Gourmet, Invocador e Mercador (Atlas Fantasia Bucólica).
 * Clean Architecture: Funções puras sem dependências de UI.
 */

import { normalizarTextoCore } from './coreClassRules.js';

export function obterPresetsBlocoD(codigo = '', np = 1, { alvo = null, combatente = null } = {}) {
  const codigoNorm = normalizarTextoCore(codigo).toUpperCase().replace(/\s+/g, '_');
  const alvoNome = alvo?.nome || 'o alvo';
  const nivelPers = Number(combatente?.nivel || 5);

  switch (codigoNorm) {
    case 'CLOROMANCIA':
      return [
        {
          id: 'cloromancia_espinhos',
          titulo: 'Espinhos (Físico)',
          badge: '20 PM',
          descricao: 'Planta Magissemente de Espinhos no jardim: Dano físico e retaliação.',
          valores: { custoPm: 20, tipoDano: 'fisico', notaLivre: '🌱 Cloromancia: Magissemente de Espinhos plantada!' }
        },
        {
          id: 'cloromancia_rosa_fogo',
          titulo: 'Rosa de Fogo',
          badge: '20 PM',
          descricao: 'Planta Magissemente Rosa de Fogo: Dano contínuo de Fogo.',
          valores: { custoPm: 20, tipoDano: 'fogo', notaLivre: '🌹 Cloromancia: Rosa de Fogo plantada!' }
        },
        {
          id: 'cloromancia_lirio',
          titulo: 'Lírio Restaurador',
          badge: '20 PM',
          descricao: 'Planta Magissemente Lírio Restaurador: Restauração progressiva de PV.',
          valores: { custoPm: 20, curaAplicada: 20, recursoCura: 'pv', notaLivre: '🪷 Cloromancia: Lírio Restaurador plantado!' }
        },
        {
          id: 'cloromancia_orquidea',
          titulo: 'Orquídea Silenciosa',
          badge: '20 PM',
          descricao: 'Planta Orquídea Silenciosa: Dreno de PM e debuff Abalado/Atordoado.',
          valores: { custoPm: 20, perdaPmAlvo: 10, notaLivre: '💜 Cloromancia: Orquídea Silenciosa plantada!' }
        }
      ];

    case 'JARDINAGEM_MARCIAL':
      return [
        {
          id: 'jardinagem_ataque_livre',
          titulo: 'Ataque Livre (RA = 0)',
          badge: 'Sem Ação',
          descricao: 'Ataque livre com arma equipada imediatamente após plantar (RA = 0 no dano).',
          valores: { danoAplicado: 0, custoPm: 0, notaLivre: `🌸 Jardinagem Marcial: Ataque livre imediato contra ${alvoNome} (RA = 0).` }
        },
        {
          id: 'jardinagem_feitico_livre',
          titulo: `Feitiço (até ${5 + np * 5} PM)`,
          badge: 'Sem Ação',
          descricao: `Conjura um feitiço conhecido de até ${5 + np * 5} PM sem gastar ação (RA = 0 no dano).`,
          valores: { danoAplicado: 0, custoPm: 5 + np * 5, notaLivre: '🌸 Jardinagem Marcial: Feitiço sem ação lançado (RA = 0).' }
        }
      ];

    case 'CULINARIA':
      return [
        {
          id: 'culinaria_vitalidade',
          titulo: 'Iguaria da Vitalidade',
          badge: 'Cura PV',
          descricao: 'Doce + Salgado: Restaura PV e confere resistência em você e 1 aliado visível.',
          valores: { curaAplicada: 30, recursoCura: 'pv', notaLivre: `🥣 Culinária: Iguaria da Vitalidade partilhada com ${alvoNome}.` }
        },
        {
          id: 'culinaria_vigor_mental',
          titulo: 'Iguaria Mente Serena',
          badge: 'Cura PM',
          descricao: 'Umami + Doce: Restaura 20 PM e cura status mental em você e 1 aliado.',
          valores: { curaAplicada: 20, recursoCura: 'pm', notaLivre: `🥣 Culinária: Mente Serena restaura 20 PM para você e ${alvoNome}.` }
        },
        {
          id: 'culinaria_escudo_salgado',
          titulo: 'Iguaria Crosta de Sal',
          badge: 'Defesa',
          descricao: 'Salgado + Salgado: +2 na Defesa física até o início do próximo turno.',
          valores: { danoAplicado: 0, notaLivre: `🥣 Culinária: Crosta de Sal confere bônus de Defesa a você e ${alvoNome}.` }
        }
      ];

    case 'SAL_E_PIMENTA':
      return [
        { id: 'sal_pimenta_amargo', titulo: 'Sabor Amargo', badge: '2 PI', descricao: 'Altera sabor para Amargo (Veneno / Debuff).', valores: { custoPi: 2, notaLivre: '🧂 Sal e Pimenta (2 PI): Sabor alterado para Amargo.' } },
        { id: 'sal_pimenta_salgado', titulo: 'Sabor Salgado', badge: '2 PI', descricao: 'Altera sabor para Salgado (Defesa / Resistência).', valores: { custoPi: 2, notaLivre: '🧂 Sal e Pimenta (2 PI): Sabor alterado para Salgado.' } },
        { id: 'sal_pimenta_doce', titulo: 'Sabor Doce', badge: '2 PI', descricao: 'Altera sabor para Doce (Cura PV / Regeneração).', valores: { custoPi: 2, notaLivre: '🧂 Sal e Pimenta (2 PI): Sabor alterado para Doce.' } },
        { id: 'sal_pimenta_umami', titulo: 'Sabor Umami', badge: '2 PI', descricao: 'Altera sabor para Umami (Cura PM / Feitiços).', valores: { custoPi: 2, notaLivre: '🧂 Sal e Pimenta (2 PI): Sabor alterado para Umami.' } }
      ];

    case 'INVOCACAO': {
      const bonusEscala = nivelPers >= 40 ? 10 : (nivelPers >= 20 ? 5 : 0);
      const danoBase = 20 + bonusEscala;
      const curaBase = 30 + (nivelPers >= 40 ? 20 : (nivelPers >= 20 ? 10 : 0));

      return [
        {
          id: 'invocacao_explosao_fogo',
          titulo: `Explosão de Chamas (${danoBase} Dano)`,
          badge: '5 PM',
          descricao: `Acerto automático: Causa ${danoBase} de dano de Fogo a ${alvoNome}.`,
          valores: { custoPm: 5, danoAplicado: danoBase, tipoDano: 'fogo', notaLivre: `☄️ Invocação: Explosão de Chamas causa ${danoBase} dano de Fogo em ${alvoNome}.` }
        },
        {
          id: 'invocacao_explosao_gelo',
          titulo: `Explosão Glacial (${danoBase} Dano)`,
          badge: '5 PM',
          descricao: `Acerto automático: Causa ${danoBase} de dano de Gelo a ${alvoNome}.`,
          valores: { custoPm: 5, danoAplicado: danoBase, tipoDano: 'gelo', notaLivre: `☄️ Invocação: Explosão Glacial causa ${danoBase} dano de Gelo em ${alvoNome}.` }
        },
        {
          id: 'invocacao_praga_elemental',
          titulo: 'Praga Elemental (+5 Dano)',
          badge: '5 PM',
          descricao: `Afeta ${alvoNome} com Praga Elemental (+5 dano de fontes aliadas).`,
          valores: { custoPm: 5, danoAplicado: 0, notaLivre: `☄️ Invocação: Praga Elemental aplicada em ${alvoNome}.` }
        },
        {
          id: 'invocacao_bencao_vida',
          titulo: `Bênção do Manancial (${curaBase} PV)`,
          badge: '5 PM',
          descricao: `Restaura ${curaBase} PV de ${alvoNome} sem rolagem de dados.`,
          valores: { custoPm: 5, curaAplicada: curaBase, recursoCura: 'pv', notaLivre: `☄️ Invocação: Bênção do Manancial restaura ${curaBase} PV de ${alvoNome}.` }
        }
      ];
    }

    case 'ESTOQUE_PESSOAL':
      return [
        {
          id: 'estoque_pessoal_anular_pi',
          titulo: `Anular até ${np + 2} PI`,
          badge: '1 PC',
          descricao: `Gasta 1 Ponto de Comércio para anular custo de até ${np + 2} PI de ${alvoNome}.`,
          valores: { custoPm: 0, notaLivre: `📦 Estoque Pessoal: 1 Ponto de Comércio gasto para anular custo de PI de ${alvoNome}!` }
        }
      ];

    case 'JA_OUVI_FALAR':
      return [
        {
          id: 'ja_ouvi_falar_bonus',
          titulo: `+${np + 2} no Exame`,
          badge: '1 PC',
          descricao: `Gasta 1 Ponto de Comércio para conceder +${np + 2} no teste de exame/Estudo de ${alvoNome}.`,
          valores: { bonusTeste: np + 2, notaLivre: `🗳️ Já Ouvi Falar: +${np + 2} no teste de exame de ${alvoNome} com 1 Ponto de Comércio!` }
        }
      ];

    case 'DATA_DE_VALIDADE': {
      const danoVeneno = Math.floor(nivelPers / 2) + np * 10;
      return [
        {
          id: 'data_validade_veneno',
          titulo: `Converter em ${danoVeneno} Veneno`,
          badge: 'Veneno',
          descricao: `Converte a cura da poção/iguaria em ${danoVeneno} de dano de veneno em ${alvoNome}.`,
          valores: { danoAplicado: danoVeneno, tipoDano: 'veneno', curaAplicada: 0, notaLivre: `☠️ Data de Validade: Cura convertida em ${danoVeneno} dano de veneno contra ${alvoNome}!` }
        }
      ];
    }

    default:
      return [];
  }
}
