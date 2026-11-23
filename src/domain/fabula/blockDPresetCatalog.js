/**
 * Fabula Ultima - CatÃ¡logo de Presets TÃ¡ticos do Bloco D
 * Floralista, Gourmet, Invocador e Mercador (Atlas Fantasia BucÃ³lica).
 * Clean Architecture: FunÃ§Ãµes puras sem dependÃªncias de UI.
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
          titulo: 'Espinhos (FÃ­sico)',
          badge: '20 PM',
          descricao: 'Planta Magissemente de Espinhos no jardim: Dano fÃ­sico e retaliaÃ§Ã£o.',
          valores: { custoPm: 20, tipoDano: 'fisico', notaLivre: 'ðŸŒ± Cloromancia: Magissemente de Espinhos plantada!' }
        },
        {
          id: 'cloromancia_rosa_fogo',
          titulo: 'Rosa de Fogo',
          badge: '20 PM',
          descricao: 'Planta Magissemente Rosa de Fogo: Dano contÃ­nuo de Fogo.',
          valores: { custoPm: 20, tipoDano: 'fogo', notaLivre: 'ðŸŒ¹ Cloromancia: Rosa de Fogo plantada!' }
        },
        {
          id: 'cloromancia_lirio',
          titulo: 'LÃ­rio Restaurador',
          badge: '20 PM',
          descricao: 'Planta Magissemente LÃ­rio Restaurador: RestauraÃ§Ã£o progressiva de PV.',
          valores: { custoPm: 20, curaAplicada: 20, recursoCura: 'pv', notaLivre: 'ðŸª· Cloromancia: LÃ­rio Restaurador plantado!' }
        },
        {
          id: 'cloromancia_orquidea',
          titulo: 'OrquÃ­dea Silenciosa',
          badge: '20 PM',
          descricao: 'Planta OrquÃ­dea Silenciosa: Dreno de PM e debuff Abalado/Atordoado.',
          valores: { custoPm: 20, perdaPmAlvo: 10, notaLivre: 'ðŸ’œ Cloromancia: OrquÃ­dea Silenciosa plantada!' }
        }
      ];

    case 'JARDINAGEM_MARCIAL':
      return [
        {
          id: 'jardinagem_ataque_livre',
          titulo: 'Ataque Livre (RA = 0)',
          badge: 'Sem AÃ§Ã£o',
          descricao: 'Ataque livre com arma equipada imediatamente apÃ³s plantar (RA = 0 no dano).',
          valores: { danoAplicado: 0, custoPm: 0, notaLivre: `ðŸŒ¸ Jardinagem Marcial: Ataque livre imediato contra ${alvoNome} (RA = 0).` }
        },
        {
          id: 'jardinagem_feitico_livre',
          titulo: `FeitiÃ§o (atÃ© ${5 + np * 5} PM)`,
          badge: 'Sem AÃ§Ã£o',
          descricao: `Conjura um feitiÃ§o conhecido de atÃ© ${5 + np * 5} PM sem gastar aÃ§Ã£o (RA = 0 no dano).`,
          valores: { danoAplicado: 0, custoPm: 5 + np * 5, notaLivre: `ðŸŒ¸ Jardinagem Marcial: FeitiÃ§o sem aÃ§Ã£o lanÃ§ado (RA = 0).` }
        }
      ];

    case 'CULINARIA':
      return [
        {
          id: 'culinaria_vitalidade',
          titulo: 'Iguaria da Vitalidade',
          badge: 'Cura PV',
          descricao: 'Doce + Salgado: Restaura PV e confere resistÃªncia em vocÃª e 1 aliado visÃ­vel.',
          valores: { curaAplicada: 30, recursoCura: 'pv', notaLivre: `ðŸ µ CulinÃ¡ria: Iguaria da Vitalidade partilhada com ${alvoNome}.` }
        },
        {
          id: 'culinaria_vigor_mental',
          titulo: 'Iguaria Mente Serena',
          badge: 'Cura PM',
          descricao: 'Umami + Doce: Restaura 20 PM e cura status mental em vocÃª e 1 aliado.',
          valores: { curaAplicada: 20, recursoCura: 'pm', notaLivre: `ðŸ µ CulinÃ¡ria: Mente Serena restaura 20 PM para vocÃª e ${alvoNome}.` }
        },
        {
          id: 'culinaria_escudo_salgado',
          titulo: 'Iguaria Crosta de Sal',
          badge: 'Defesa',
          descricao: 'Salgado + Salgado: +2 na Defesa fÃ­sica atÃ© o inÃ­cio do prÃ³ximo turno.',
          valores: { danoAplicado: 0, notaLivre: `ðŸ µ CulinÃ¡ria: Crosta de Sal confere bÃ´nus de Defesa a vocÃª e ${alvoNome}.` }
        }
      ];

    case 'SAL_E_PIMENTA':
      return [
        { id: 'sal_pimenta_amargo', titulo: 'Sabor Amargo', badge: '2 PI', descricao: 'Altera sabor para Amargo (Veneno / Debuff).', valores: { custoPi: 2, notaLivre: 'ðŸ§‚ Sal e Pimenta (2 PI): Sabor alterado para Amargo.' } },
        { id: 'sal_pimenta_salgado', titulo: 'Sabor Salgado', badge: '2 PI', descricao: 'Altera sabor para Salgado (Defesa / ResistÃªncia).', valores: { custoPi: 2, notaLivre: 'ðŸ§‚ Sal e Pimenta (2 PI): Sabor alterado para Salgado.' } },
        { id: 'sal_pimenta_doce', titulo: 'Sabor Doce', badge: '2 PI', descricao: 'Altera sabor para Doce (Cura PV / RegeneraÃ§Ã£o).', valores: { custoPi: 2, notaLivre: 'ðŸ§‚ Sal e Pimenta (2 PI): Sabor alterado para Doce.' } },
        { id: 'sal_pimenta_umami', titulo: 'Sabor Umami', badge: '2 PI', descricao: 'Altera sabor para Umami (Cura PM / FeitiÃ§os).', valores: { custoPi: 2, notaLivre: 'ðŸ§‚ Sal e Pimenta (2 PI): Sabor alterado para Umami.' } }
      ];

    case 'INVOCACAO': {
      const bonusEscala = nivelPers >= 40 ? 10 : (nivelPers >= 20 ? 5 : 0);
      const danoBase = 20 + bonusEscala;
      const curaBase = 30 + (nivelPers >= 40 ? 20 : (nivelPers >= 20 ? 10 : 0));

      return [
        {
          id: 'invocacao_explosao_fogo',
          titulo: `ExplosÃ£o de Chamas (${danoBase} Dano)`,
          badge: '5 PM',
          descricao: `Acerto automÃ¡tico: Causa ${danoBase} de dano de Fogo a ${alvoNome}.`,
          valores: { custoPm: 5, danoAplicado: danoBase, tipoDano: 'fogo', notaLivre: `âš„ï¸  InvocaÃ§Ã£o: ExplosÃ£o de Chamas causa ${danoBase} dano de Fogo em ${alvoNome}.` }
        },
        {
          id: 'invocacao_explosao_gelo',
          titulo: `ExplosÃ£o Glacial (${danoBase} Dano)`,
          badge: '5 PM',
          descricao: `Acerto automÃ¡tico: Causa ${danoBase} de dano de Gelo a ${alvoNome}.`,
          valores: { custoPm: 5, danoAplicado: danoBase, tipoDano: 'gelo', notaLivre: `âš„ï¸  InvocaÃ§Ã£o: ExplosÃ£o Glacial causa ${danoBase} dano de Gelo em ${alvoNome}.` }
        },
        {
          id: 'invocacao_praga_elemental',
          titulo: 'Praga Elemental (+5 Dano)',
          badge: '5 PM',
          descricao: `Afeta ${alvoNome} com Praga Elemental (+5 dano de fontes aliadas).`,
          valores: { custoPm: 5, danoAplicado: 0, notaLivre: `âš„ï¸  InvocaÃ§Ã£o: Praga Elemental aplicada em ${alvoNome}.` }
        },
        {
          id: 'invocacao_bencao_vida',
          titulo: `BÃªnÃ§Ã£o do Manancial (${curaBase} PV)`,
          badge: '5 PM',
          descricao: `Restaura ${curaBase} PV de ${alvoNome} sem rolagem de dados.`,
          valores: { custoPm: 5, curaAplicada: curaBase, recursoCura: 'pv', notaLivre: `âš„ï¸  InvocaÃ§Ã£o: BÃªnÃ§Ã£o do Manancial restaura ${curaBase} PV de ${alvoNome}.` }
        }
      ];
    }

    case 'ESTOQUE_PESSOAL':
      return [
        {
          id: 'estoque_pessoal_anular_pi',
          titulo: `Anular atÃ© ${np + 2} PI`,
          badge: '1 PC',
          descricao: `Gasta 1 Ponto de ComÃ©rcio para anular custo de atÃ© ${np + 2} PI de ${alvoNome}.`,
          valores: { custoPm: 0, notaLivre: `ðŸ“¦ Estoque Pessoal: 1 Ponto de ComÃ©rcio gasto para anular custo de PI de ${alvoNome}!` }
        }
      ];

    case 'JA_OUVI_FALAR':
      return [
        {
          id: 'ja_ouvi_falar_bonus',
          titulo: `+${np + 2} no Exame`,
          badge: '1 PC',
          descricao: `Gasta 1 Ponto de ComÃ©rcio para conceder +${np + 2} no teste de exame/Estudo de ${alvoNome}.`,
          valores: { bonusTeste: np + 2, notaLivre: `ðŸ—³ï¸  JÃ¡ Ouvi Falar: +${np + 2} no teste de exame de ${alvoNome} com 1 Ponto de ComÃ©rcio!` }
        }
      ];

    case 'DATA_DE_VALIDADE': {
      const danoVeneno = Math.floor(nivelPers / 2) + np * 10;
      return [
        {
          id: 'data_validade_veneno',
          titulo: `Converter em ${danoVeneno} Veneno`,
          badge: 'Veneno',
          descricao: `Converte a cura da poÃ§Ã£o/iguaria em ${danoVeneno} de dano de veneno em ${alvoNome}.`,
          valores: { danoAplicado: danoVeneno, tipoDano: 'veneno', curaAplicada: 0, notaLivre: `â˜  Data de Validade: Cura convertida em ${danoVeneno} dano de veneno contra ${alvoNome}!` }
        }
      ];
    }

    default:
      return [];
  }
}
