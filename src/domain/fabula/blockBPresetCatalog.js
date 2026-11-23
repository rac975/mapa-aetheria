/**
 * Fabula Ultima - Catálogo de Presets das Classes do Bloco B
 * Mutante e Esper (Atlas Techno Fantasy).
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

export function obterPresetsBlocoB(codigo, np = 1, { alvo = null, combatente = null } = {}) {
  const alvoNome = alvo?.nome || 'o alvo';
  const atorNome = combatente?.nome || 'O combatente';

  switch (codigo) {
    case 'FOCO_COGNITIVO':
      return [
        {
          id: 'foco_aliado',
          titulo: `Foco Aliado (+${np * 2} Cura)`,
          badge: 'Suporte',
          descricao: `Designa ${alvoNome} como Foco. Concede +${np} em exames e +${np * 2} em curas de PV/PM aplicadas a ele.`,
          valores: {
            custoPm: 0,
            notaLivre: `🎯 Foco Cognitivo: ${alvoNome} é seu Foco! +${np} em exames e +${np * 2} em curas concedidas.`
          }
        },
        {
          id: 'foco_inimigo',
          titulo: `Foco Inimigo (+${np} Precisão/Magia)`,
          badge: 'Ofensivo',
          descricao: `Designa ${alvoNome} (visível e Abalado/Atordoado/Enfurecido) como Foco. Concede +${np} em testes de ataque e magia ofensiva contra ele.`,
          valores: {
            custoPm: 0,
            notaLivre: `🎯 Foco Cognitivo: ${alvoNome} é seu Foco! +${np} em testes de Precisão e Magia contra ele.`
          }
        }
      ];

    case 'ECDISE': {
      const elementos = ['Fogo', 'Gelo', 'Raio', 'Ar', 'Terra', 'Luz', 'Trevas', 'Veneno'];
      return elementos.map((elem) => ({
        id: `ecdise_${elem.toLowerCase()}`,
        titulo: `Resistência a ${elem}`,
        badge: '10 PV',
        descricao: `Gasta 10 PV após sofrer dano para receber Resistência a ${elem} até o próximo uso de Écdise.`,
        valores: {
          custoPv: 10,
          notaLivre: `🛡️ Écdise (10 PV): ${atorNome} ganha Resistência a dano do tipo ${elem.toUpperCase()}!`
        }
      }));
    }

    case 'ACROMORFOSE':
      return [
        {
          id: 'acromorfose_arco',
          titulo: 'Arco (À Distância)',
          badge: 'Distância',
          descricao: 'Ataques desarmados contam como Arco (à distância) até seu próximo turno.',
          valores: { notaLivre: '🦾 Acromorfose: Ataques desarmados contam como categoria Arco (à distância).' }
        },
        {
          id: 'acromorfose_fogo',
          titulo: 'Arma de Fogo (À Distância)',
          badge: 'Distância',
          descricao: 'Ataques desarmados contam como Arma de Fogo (à distância) até seu próximo turno.',
          valores: { notaLivre: '🦾 Acromorfose: Ataques desarmados contam como Arma de Fogo (à distância).' }
        },
        {
          id: 'acromorfose_espada',
          titulo: 'Espada (Corpo a Corpo)',
          badge: 'C. a C.',
          descricao: 'Ataques desarmados contam como categoria Espada até seu próximo turno.',
          valores: { notaLivre: '🦾 Acromorfose: Ataques desarmados contam como categoria Espada.' }
        },
        {
          id: 'acromorfose_adaga',
          titulo: 'Adaga (Corpo a Corpo)',
          badge: 'C. a C.',
          descricao: 'Ataques desarmados contam como categoria Adaga até seu próximo turno.',
          valores: { notaLivre: '🦾 Acromorfose: Ataques desarmados contam como categoria Adaga.' }
        }
      ];

    case 'TERIOMORFOSE':
      return [
        {
          id: 'teriomorfose_placofora',
          titulo: 'Placófora (Defesa Carapaça)',
          badge: '1/3 PV',
          descricao: `Manifesta Placófora: trata Defesa como ${13 + Math.floor(np / 2)} até o fim da cena.`,
          valores: { notaLivre: `🧬 Teriomorfose: Placófora ativa! Defesa fixada em ${13 + Math.floor(np / 2)}.` }
        },
        {
          id: 'teriomorfose_neurofagoide',
          titulo: 'Neurofagóide (Biofagia PM)',
          badge: '1/3 PV',
          descricao: `Manifesta Neurofagóide: Biofagia agora também regenera +${4 + np} PM.`,
          valores: { notaLivre: `🧬 Teriomorfose: Neurofagóide ativa! Biofagia recuperará +${4 + np} PM.` }
        },
        {
          id: 'teriomorfose_tachytheria',
          titulo: 'Tachytheria (Destreza ↑)',
          badge: '1/3 PV',
          descricao: 'Manifesta Tachytheria: aumenta o dado de Destreza em 1 passo (máx d12).',
          valores: { notaLivre: '🧬 Teriomorfose: Tachytheria ativa! Dado de Destreza subiu 1 passo.' }
        },
        {
          id: 'teriomorfose_arpaktida',
          titulo: 'Arpaktida (Astúcia ↑)',
          badge: '1/3 PV',
          descricao: 'Manifesta Arpaktida: aumenta o dado de Astúcia em 1 passo (máx d12).',
          valores: { notaLivre: '🧬 Teriomorfose: Arpaktida ativa! Dado de Astúcia subiu 1 passo.' }
        },
        {
          id: 'teriomorfose_dynamotheria',
          titulo: 'Dynamotheria (Vigor ↑)',
          badge: '1/3 PV',
          descricao: 'Manifesta Dynamotheria: aumenta o dado de Vigor em 1 passo (máx d12).',
          valores: { notaLivre: '🧬 Teriomorfose: Dynamotheria ativa! Dado de Vigor subiu 1 passo.' }
        }
      ];

    case 'DONS_PSIQUICOS':
      return [
        {
          id: 'dom_atmocinese_ar',
          titulo: 'Atmocinese (Ar)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Ar com +(2 + Relógio) de dano adicional.',
          valores: { tipoDano: 'ar', danoAplicado: 2, notaLivre: '🔮 Atmocinese: Dano convertido para Ar com bônus pelo Relógio Mental!' }
        },
        {
          id: 'dom_atmocinese_raio',
          titulo: 'Atmocinese (Raio)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Raio com +(2 + Relógio) de dano adicional.',
          valores: { tipoDano: 'raio', danoAplicado: 2, notaLivre: '🔮 Atmocinese: Dano convertido para Raio com bônus pelo Relógio Mental!' }
        },
        {
          id: 'dom_termocinese_fogo',
          titulo: 'Termocinese (Fogo)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Fogo com +(2 + Relógio) de dano adicional.',
          valores: { tipoDano: 'fogo', danoAplicado: 2, notaLivre: '🔮 Termocinese: Dano convertido para Fogo com bônus pelo Relógio Mental!' }
        },
        {
          id: 'dom_termocinese_gelo',
          titulo: 'Termocinese (Gelo)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Gelo com +(2 + Relógio) de dano adicional.',
          valores: { tipoDano: 'gelo', danoAplicado: 2, notaLivre: '🔮 Termocinese: Dano convertido para Gelo com bônus pelo Relógio Mental!' }
        },
        {
          id: 'dom_fotocinese_luz',
          titulo: 'Fotocinese (Luz)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Luz com +(2 + Relógio) de dano adicional.',
          valores: { tipoDano: 'luz', danoAplicado: 2, notaLivre: '🔮 Fotocinese: Dano convertido para Luz com bônus pelo Relógio Mental!' }
        },
        {
          id: 'dom_fotocinese_trevas',
          titulo: 'Fotocinese (Trevas)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Trevas com +(2 + Relógio) de dano adicional.',
          valores: { tipoDano: 'trevas', danoAplicado: 2, notaLivre: '🔮 Fotocinese: Dano convertido para Trevas com bônus pelo Relógio Mental!' }
        },
        {
          id: 'dom_gravitocinese',
          titulo: 'Gravitocinese (Terra / Pousar)',
          badge: 'Dom Psíquico',
          descricao: 'Converte dano para Terra; criaturas voadoras atingidas pousam imediatamente.',
          valores: { tipoDano: 'terra', danoAplicado: 2, notaLivre: '🔮 Gravitocinese: Dano de Terra e criaturas voadoras forçadas a aterrissar!' }
        },
        {
          id: 'dom_escudo_psiquico',
          titulo: 'Escudo Psíquico',
          badge: 'Defesa',
          descricao: 'Defesa e Defesa Mágica tratadas como VON + (2 × Relógio) contra este teste.',
          valores: { notaLivre: '🔮 Escudo Psíquico: Defesa e Def. Mágica tratadas como VON + (2 × Relógio)!' }
        },
        {
          id: 'dom_retaliacao_abalado',
          titulo: 'Retaliação (Abalado)',
          badge: 'Reação',
          descricao: `Inimigo que o feriu perde PM e fica Abalado (AST ↓).`,
          valores: { condicaoAlvo: 'abalado', notaLivre: `🔮 Retaliação Psíquica: ${alvoNome} perde PM e fica Abalado!` }
        },
        {
          id: 'dom_retaliacao_atordoado',
          titulo: 'Retaliação (Atordoado)',
          badge: 'Reação',
          descricao: `Inimigo que o feriu perde PM e fica Atordoado (DES ↓).`,
          valores: { condicaoAlvo: 'atordoado', notaLivre: `🔮 Retaliação Psíquica: ${alvoNome} perde PM e fica Atordoado!` }
        },
        {
          id: 'dom_presenca_reconfortante',
          titulo: 'Presença Reconfortante',
          badge: 'Suporte',
          descricao: `Aliado protegido na Guarda recupera PM (e cura condição mental se for Foco).`,
          valores: { notaLivre: `🔮 Presença Reconfortante: ${alvoNome} recupera PM e cura condição mental se for Foco!` }
        },
        {
          id: 'dom_transferencia_vital',
          titulo: 'Transferência de Vida',
          badge: 'Cura Crise',
          descricao: 'Ao ferir inimigo, recupera PV em si ou no aliado Foco que esteja em Crise.',
          valores: { notaLivre: `🔮 Transferência de Vida: Recupera PV em si ou no aliado Foco em Crise!` }
        }
      ];

    default:
      return [];
  }
}
