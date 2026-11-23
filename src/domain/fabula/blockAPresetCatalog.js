/**
 * Fabula Ultima - Catálogo de Presets das Classes do Bloco A
 * Elementalista, Entropista, Espiritualista, Furioso, Guardião, Guerreiro Sombrio, Orador.
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

export function obterPresetsBlocoA(codigo, np = 1, { alvo = null, combatente = null } = {}) {
  const alvoNome = alvo?.nome || 'o alvo';
  const atorNome = combatente?.nome || 'O combatente';

  switch (codigo) {
    case 'CONDENAR':
      return [
        {
          id: 'condenar_abalado',
          titulo: `Abalado (-${np * 10} PM)`,
          badge: '5 PM',
          descricao: `Alvo perde ${np * 10} PM, fica Abalado (AST ↓) e sofre +${np} de dano de todas as fontes.`,
          valores: {
            custoPm: 5,
            perdaPmAlvo: np * 10,
            condicaoAlvo: 'abalado',
            notaLivre: `⚡ Condenar: ${alvoNome} perde ${np * 10} PM, fica Abalado e sofre +${np} de dano de todas as fontes!`
          }
        },
        {
          id: 'condenar_atordoado',
          titulo: `Atordoado (-${np * 10} PM)`,
          badge: '5 PM',
          descricao: `Alvo perde ${np * 10} PM, fica Atordoado (DES ↓) e sofre +${np} de dano de todas as fontes.`,
          valores: {
            custoPm: 5,
            perdaPmAlvo: np * 10,
            condicaoAlvo: 'atordoado',
            notaLivre: `⚡ Condenar: ${alvoNome} perde ${np * 10} PM, fica Atordoado e sofre +${np} de dano de todas as fontes!`
          }
        }
      ];

    case 'ENCORAJAR': {
      const cura = np * 5;
      return ['Destreza', 'Vigor', 'Astúcia', 'Vontade'].map((attr) => ({
        id: `encorajar_${attr.toLowerCase()}`,
        titulo: `+${cura} PV • ${attr} ↑`,
        badge: '5 PM',
        descricao: `Aliado recupera +${cura} PV e aumenta dado de ${attr} em 1 passo até seu próximo turno.`,
        valores: {
          custoPm: 5,
          curaAplicada: cura,
          recursoCura: 'pv',
          notaLivre: `🗣️ Encorajar: ${alvoNome} recupera +${cura} PV e dado de ${attr} sobe 1 passo!`
        }
      }));
    }

    case 'GOLPE_DAS_SOMBRAS': {
      const presets = [];
      const dadosVigor = [6, 8, 10, 12];
      dadosVigor.forEach((v) => {
        presets.push({
          id: `golpe_sombras_d${v}`,
          titulo: `VIG d${v} (+${np + v} Dano Sombrio)`,
          badge: `-${v} PV`,
          descricao: `Perde ${v} PV (auto-dano do dado de VIG) para causar +${np + v} de Dano Sombrio.`,
          valores: {
            custoPv: v,
            danoAplicado: np + v,
            tipoDano: 'sombrio',
            notaLivre: `🌑 Golpe das Sombras: ${atorNome} rolou ${v} no Vigor (-${v} PV) e causou +${np + v} de Dano Sombrio em ${alvoNome}!`
          }
        });
      });
      return presets;
    }

    case 'TEMPO_ROUBADO': {
      const danoLento = 10 + (np * 5);
      return [
        {
          id: 'tempo_roubado_lento',
          titulo: 'Aplicar Lento',
          badge: '5 PM',
          descricao: 'Deixa o alvo com a condição Lento (DES ↓).',
          valores: { custoPm: 5, condicaoAlvo: 'lento', notaLivre: `⏳ Tempo Roubado (5 PM): ${alvoNome} ficou Lento.` }
        },
        {
          id: 'tempo_roubado_curar_lento',
          titulo: 'Remover Lento',
          badge: '5 PM',
          descricao: 'Remove a condição Lento de um alvo.',
          valores: { custoPm: 5, notaLivre: `⏳ Tempo Roubado (5 PM): Removeu a condição Lento de ${alvoNome}.` }
        },
        {
          id: 'tempo_roubado_dreno_lento',
          titulo: `Dreno (${danoLento} PV)`,
          badge: '5 PM',
          descricao: `Inimigo que já esteja Lento perde ${danoLento} PV imediatamente.`,
          valores: { custoPm: 5, danoAplicado: danoLento, tipoDano: 'fisico', notaLivre: `⏳ Tempo Roubado (5 PM): Inimigo Lento perdeu ${danoLento} PV.` }
        },
        {
          id: 'tempo_roubado_troca_rapida',
          titulo: 'Equipamento Livre',
          badge: '5 PM',
          descricao: 'Permite trocar de equipamento sem consumir ação.',
          valores: { custoPm: 5, notaLivre: '⏳ Tempo Roubado (5 PM): Ação Equipamento realizada sem gastar ação.' }
        },
        {
          id: 'tempo_roubado_acelerar',
          titulo: 'Acelerar Turno Aliado',
          badge: '5 PM',
          descricao: 'Aliado que ainda não agiu nesta rodada tem seu turno adiantado para agir logo a seguir.',
          valores: { custoPm: 5, notaLivre: `⏳ Tempo Roubado (5 PM): Turno de ${alvoNome} acontecerá imediatamente a seguir!` }
        }
      ];
    }

    case 'CATACLISMO': {
      const presets = [
        {
          id: 'cataclismo_10pm',
          titulo: '+5 Dano (+10 PM)',
          badge: '+10 PM',
          descricao: 'Gasta +10 PM adicionais para somar +5 no dano do feitiço instantâneo.',
          valores: { custoPm: 10, danoAplicado: 5, notaLivre: '🌋 Cataclismo (+10 PM): +5 de dano no feitiço instantâneo.' }
        }
      ];
      if (np >= 2) {
        presets.push({
          id: 'cataclismo_20pm',
          titulo: '+10 Dano (+20 PM)',
          badge: '+20 PM',
          descricao: 'Gasta +20 PM adicionais para somar +10 no dano do feitiço instantâneo.',
          valores: { custoPm: 20, danoAplicado: 10, notaLivre: '🌋 Cataclismo (+20 PM): +10 de dano no feitiço instantâneo.' }
        });
      }
      if (np >= 3) {
        presets.push({
          id: 'cataclismo_30pm',
          titulo: '+15 Dano (+30 PM)',
          badge: '+30 PM',
          descricao: 'Gasta +30 PM adicionais para somar +15 no dano do feitiço instantâneo.',
          valores: { custoPm: 30, danoAplicado: 15, notaLivre: '🌋 Cataclismo (+30 PM): +15 de dano no feitiço instantâneo.' }
        });
      }
      return presets;
    }

    case 'PROVOCAR':
      return [
        {
          id: 'provocar_foco',
          titulo: 'Enfurecido (Compelir)',
          badge: '5 PM',
          descricao: `Teste oposto [VIG + VON] + ${np}. Alvo fica Enfurecido e é compelido a focar o Furioso.`,
          valores: {
            custoPm: 5,
            condicaoAlvo: 'enfurecido',
            notaLivre: `💢 Provocar (5 PM): ${alvoNome} fica Enfurecido e é compelido a atacar ${atorNome}!`
          }
        }
      ];

    case 'RESISTIR':
      return [
        {
          id: 'resistir_vigor',
          titulo: 'Guarda (Vigor ↑)',
          badge: 'Guarda',
          descricao: 'Recupera PV igual ao NP × Laço e dado de Vigor sobe 1 passo até o próximo turno.',
          valores: { notaLivre: `🛡️ Resistir: Recupera PV na Guarda e dado de Vigor sobe 1 passo até o próximo turno.` }
        },
        {
          id: 'resistir_vontade',
          titulo: 'Guarda (Vontade ↑)',
          badge: 'Guarda',
          descricao: 'Recupera PV igual ao NP × Laço e dado de Vontade sobe 1 passo até o próximo turno.',
          valores: { notaLivre: `🛡️ Resistir: Recupera PV na Guarda e dado de Vontade sobe 1 passo até o próximo turno.` }
        }
      ];

    default:
      return [];
  }
}
