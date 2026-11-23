/**
 * Fabula Ultima - Catálogo de Presets das Classes do Bloco C
 * Comandante, Dançarino, Simbolista e Virtuoso (Atlas High Fantasy).
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

export function obterPresetsBlocoC(codigo, np = 1, { alvo = null, combatente = null } = {}) {
  const alvoNome = alvo?.nome || 'o alvo';
  const atorNome = combatente?.nome || 'O combatente';

  switch (codigo) {
    case 'CARGA_CAVALARIA':
      return [
        {
          id: 'carga_cavalaria_ataque',
          titulo: `Ataque Livre (+${np} Precisão)`,
          badge: '10 PM',
          descricao: `Aliado ${alvoNome} realiza ataque livre imediato com +${np} na Precisão (RA = 0 no dano).`,
          valores: {
            custoPm: 10,
            notaLivre: `🐎 Carga de Cavalaria (10 PM): ${alvoNome} realiza ataque livre com +${np} na Precisão (RA = 0)!`
          }
        }
      ];

    case 'DECRETO_DO_BISPO':
      return [
        {
          id: 'decreto_bispo_pm_dobrado',
          titulo: 'Custos de PM Dobrados',
          badge: '10 PM',
          descricao: 'Até início do seu próximo turno, todos os custos de PM de todas as criaturas são dobrados.',
          valores: {
            custoPm: 10,
            notaLivre: '📜 Decreto do Bispo (10 PM): Todos os custos em PM são dobrados até seu próximo turno!'
          }
        },
        {
          id: 'decreto_bispo_dano_extra',
          titulo: `+${np * 3} Dano em Todas Fontes`,
          badge: '10 PM',
          descricao: `Até início do seu próximo turno, todas as fontes de dano causam +${np * 3} de dano adicional.`,
          valores: {
            custoPm: 10,
            danoAplicado: np * 3,
            notaLivre: `📜 Decreto do Bispo (10 PM): Todas as fontes causam +${np * 3} de dano adicional!`
          }
        }
      ];

    case 'ROQUE_DO_REI':
      return [
        {
          id: 'roque_rei_bloquear_cura',
          titulo: 'Bloquear Toda Cura',
          badge: '10 PM',
          descricao: 'Até início do seu próximo turno, nenhuma criatura pode recuperar PV ou PM.',
          valores: {
            custoPm: 10,
            notaLivre: '🏰 Roque do Rei (10 PM): Nenhuma criatura pode recuperar PV ou PM até seu próximo turno!'
          }
        },
        {
          id: 'roque_rei_ampliar_cura_pm',
          titulo: `+${np * 5} PM em Restaurações`,
          badge: '10 PM',
          descricao: `Até início do seu próximo turno, qualquer efeito que restaure PM recupera +${np * 5} PM adicionais.`,
          valores: {
            custoPm: 10,
            curaAplicada: np * 5,
            recursoCura: 'pm',
            notaLivre: `🏰 Roque do Rei (10 PM): Efeitos que restauram PM concedem +${np * 5} PM adicionais!`
          }
        }
      ];

    case 'GAMBITO_DA_DAMA': {
      const curaPv = 5 + (np * 5);
      return [
        {
          id: 'gambito_dama_cura',
          titulo: `Ataque + Cura (+${curaPv} PV)`,
          badge: 'Ataque Livre',
          descricao: `Ataque livre (RA = 0 no dano). Após o ataque, ${alvoNome} recupera +${curaPv} PV.`,
          valores: {
            curaAplicada: curaPv,
            recursoCura: 'pv',
            notaLivre: `👑 Gambito da Dama: Ataque livre (RA = 0) e ${alvoNome} recupera +${curaPv} PV!`
          }
        },
        {
          id: 'gambito_dama_ordem',
          titulo: 'Ataque + Ordem Imediata',
          badge: 'Ataque Livre',
          descricao: 'Ataque livre (RA = 0 no dano). Após o ataque, usa Carga, Decreto ou Roque sem gastar ação.',
          valores: {
            notaLivre: '👑 Gambito da Dama: Ataque livre (RA = 0) e ativa ordem tática sem consumir ação!'
          }
        }
      ];
    }

    case 'DANCA':
      return [
        { id: 'danca_flamingo', titulo: 'Flamingo (Fogo)', badge: 'Dança', descricao: 'Resistência a Fogo ou converte dano em Fogo.', valores: { tipoDano: 'fogo', notaLivre: '💃 Dança do Flamingo: Afinidade/dano de Fogo até o próximo turno!' } },
        { id: 'danca_garca', titulo: 'Garça (Gelo)', badge: 'Dança', descricao: 'Resistência a Gelo ou converte dano em Gelo.', valores: { tipoDano: 'gelo', notaLivre: '💃 Dança da Garça: Afinidade/dano de Gelo até o próximo turno!' } },
        { id: 'danca_falcao', titulo: 'Falcão (Raio)', badge: 'Dança', descricao: 'Resistência a Raio ou converte dano em Raio.', valores: { tipoDano: 'raio', notaLivre: '💃 Dança do Falcão: Afinidade/dano de Raio até o próximo turno!' } },
        { id: 'danca_rouxinol', titulo: 'Rouxinol (Ar)', badge: 'Dança', descricao: 'Resistência a Ar ou converte dano em Ar.', valores: { tipoDano: 'ar', notaLivre: '💃 Dança do Rouxinol: Afinidade/dano de Ar até o próximo turno!' } },
        { id: 'danca_serpente', titulo: 'Serpente (Terra)', badge: 'Dança', descricao: 'Resistência a Terra ou converte dano em Terra.', valores: { tipoDano: 'terra', notaLivre: '💃 Dança da Serpente: Afinidade/dano de Terra até o próximo turno!' } },
        { id: 'danca_cisne', titulo: 'Cisne (Luz)', badge: 'Dança', descricao: 'Resistência a Luz ou converte dano em Luz.', valores: { tipoDano: 'luz', notaLivre: '💃 Dança do Cisne: Afinidade/dano de Luz até o próximo turno!' } },
        { id: 'danca_corvo', titulo: 'Corvo (Trevas)', badge: 'Dança', descricao: 'Resistência a Trevas ou converte dano em Trevas.', valores: { tipoDano: 'trevas', notaLivre: '💃 Dança do Corvo: Afinidade/dano de Trevas até o próximo turno!' } },
        { id: 'danca_unicornio', titulo: 'Unicórnio (Cura PV)', badge: 'Dança', descricao: 'Recupera PV em si e em aliado com Laço.', valores: { curaAplicada: 8, recursoCura: 'pv', notaLivre: '💃 Dança do Unicórnio: Recupera PV em você e aliado com Laço!' } },
        { id: 'danca_menade', titulo: 'Mênade (Perda de PM)', badge: 'Dança', descricao: `Alvo perde PM igual ao dado de Destreza.`, valores: { perdaPmAlvo: 8, notaLivre: `💃 Dança da Mênade: ${alvoNome} perde PM!` } },
        { id: 'danca_borboleta', titulo: 'Borboleta (Imunidade)', badge: 'Dança', descricao: 'Imunidade a condições de status até o próximo turno.', valores: { notaLivre: '💃 Dança da Borboleta: Imunidade a condições de status até o próximo turno!' } }
      ];

    case 'SIMBOLISMO':
      return [
        { id: 'simbolo_protecao', titulo: 'Símbolo da Proteção', badge: '2 PI', descricao: 'Concede Resistência a um tipo de dano escolhido.', valores: { custoPi: 2, notaLivre: `🖋️ Símbolo da Proteção (2 PI) aplicado em ${alvoNome}!` } },
        { id: 'simbolo_desespero', titulo: 'Símbolo do Desespero', badge: '2 PI', descricao: 'Curas recebidas pelo alvo são reduzidas pela metade (÷2).', valores: { custoPi: 2, notaLivre: `🖋️ Símbolo do Desespero (2 PI): Curas de ${alvoNome} reduzidas pela metade (÷2)!` } },
        { id: 'simbolo_fraqueza', titulo: 'Símbolo da Fraqueza', badge: '2 PI', descricao: 'Torna o alvo Vulnerável a um tipo de dano escolhido.', valores: { custoPi: 2, notaLivre: `🖋️ Símbolo da Fraqueza (2 PI) aplicado em ${alvoNome}!` } },
        { id: 'simbolo_proibicao', titulo: 'Símbolo da Proibição', badge: '2 PI', descricao: 'Alvo perde PV e PM ao realizar a ação proibida.', valores: { custoPi: 2, notaLivre: `🖋️ Símbolo da Proibição (2 PI) aplicado em ${alvoNome}!` } },
        { id: 'simbolo_amarras', titulo: 'Símbolo das Amarras', badge: '2 PI', descricao: 'Alvo não pode se mover e voadores aterrissam.', valores: { custoPi: 2, condicaoAlvo: 'lento', notaLivre: `🖋️ Símbolo das Amarras (2 PI): ${alvoNome} imobilizado!` } },
        { id: 'simbolo_criacao', titulo: 'Símbolo da Criação', badge: '2 PI', descricao: 'Pode ser destruído para criar outro símbolo por 0 PI.', valores: { custoPi: 2, notaLivre: '🖋️ Símbolo da Criação (2 PI) aplicado!' } },
        { id: 'simbolo_rebeliao', titulo: 'Símbolo da Rebelião', badge: '2 PI', descricao: 'Aumenta dano contra criaturas com símbolos.', valores: { custoPi: 2, notaLivre: '🖋️ Símbolo da Rebelião (2 PI) ativo!' } }
      ];

    case 'MAGICANTO':
      return [
        { id: 'magicanto_fraco', titulo: 'Volume Fraco (1 Alvo)', badge: '10 PM', descricao: 'Gasta 10 PM. Alvo: Você ou 1 criatura visível que possa ouvi-lo.', valores: { custoPm: 10, notaLivre: `🎵 Magicanto Fraco (10 PM) cantado para ${alvoNome}!` } },
        { id: 'magicanto_medio', titulo: 'Volume Médio (Aliados)', badge: '20 PM', descricao: 'Gasta 20 PM. Alvo: Todos os aliados capazes de ouvi-lo.', valores: { custoPm: 20, notaLivre: '🎵 Magicanto Médio (20 PM) cantado para todos os aliados!' } },
        { id: 'magicanto_forte', titulo: 'Volume Forte (Inimigos)', badge: '30 PM', descricao: 'Gasta 30 PM. Alvo: Todos os inimigos capazes de ouvi-lo.', valores: { custoPm: 30, notaLivre: '🎵 Magicanto Forte (30 PM) cantado contra todos os inimigos!' } }
      ];

    case 'HARMONIA':
      return [
        {
          id: 'harmonia_dano_aliados',
          titulo: `Aliados causam +${np} Dano`,
          badge: 'Harmonia',
          descricao: `Aliados causam +${np} pontos de dano adicional a esses inimigos até seu próximo turno.`,
          valores: { danoAplicado: np, notaLivre: `🎼 Harmonia: Aliados causam +${np} de dano contra os inimigos atingidos!` }
        },
        {
          id: 'harmonia_recuperar_pm',
          titulo: `Recuperar +${np} PM por dano`,
          badge: 'Harmonia',
          descricao: `Você recupera +${np} PM cada vez que esses inimigos sofrerem dano até seu próximo turno.`,
          valores: { curaAplicada: np, recursoCura: 'pm', notaLivre: `🎼 Harmonia: ${atorNome} recupera +${np} PM toda vez que os inimigos sofrerem dano!` }
        }
      ];

    default:
      return [];
  }
}
