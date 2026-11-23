/**
 * Fabula Ultima - Catálogo Oficial dos 9 Arcanos do Livro Básico (pp. 180-183)
 * Especificações próprias de Domínios, Benefícios de Fundir e Efeitos de Dispensar.
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { normalizarTextoCore } from './coreClassRules.js';

export const CATALOGO_ARCANOS_OFICIAIS = Object.freeze({
  espada: {
    chave: 'espada',
    nome: 'Arcano da Espada',
    dominios: 'Conquista, heroísmo, liderança',
    fundir: 'Seus ataques causam +5 de dano adicional e todo o dano dos ataques perde seu tipo (ignora todas as Afinidades). Ao atacar, pode conceder Multi (qualquer número de alvos), dispensando a Espada automaticamente após o ataque (não ativa Círculo Arcano).',
    beneficiosFundir: { bonusDanoAtaque: 5, danoSemTipo: true, ignoraAfinidades: true, permiteMultiIlimitadoComDispensa: true },
    opcoesDispensar: [
      {
        subcodigo: 'GOLPE_ESPADA_MULTI', nomeEfeito: 'Lâmina Soberana (Ataque Multi da Espada)',
        efeitoTexto: 'Concede Multi (qualquer quantidade de alvos) e +5 de dano sem tipo (ignora Afinidades) ao seu ataque, dispensando o Arcano da Espada automaticamente após o golpe (não conta como dispensa voluntária).',
        danoBase: 0, curaBase: 0, tipoDano: 'sem_tipo', isGolpeFundirEspada: true, ignoraAfinidades: true, isDispensaVoluntaria: false
      }
    ]
  },
  forja: {
    chave: 'forja',
    nome: 'Arcano da Forja',
    dominios: 'Calor, fogo, metal',
    fundir: 'Você ganha Resistência a dano de fogo e todo o dano de fogo causado por você ignora Resistências.',
    beneficiosFundir: { resistencias: ['fogo'], ignoraResistenciaElementos: ['fogo'] },
    opcoesDispensar: [
      {
        subcodigo: 'INFERNO', nomeEfeito: 'Inferno',
        efeitoTexto: 'Causa 30 pontos de dano de fogo a qualquer número de criaturas visíveis (ignora Resistências; +10 no nv. 20+, +20 no nv. 40+).',
        danoBase: 30, curaBase: 0, tipoDano: 'fogo', ignoraResistencia: true, isDispensaVoluntaria: true
      },
      {
        subcodigo: 'FORJA_EQUIPAMENTO', nomeEfeito: 'Forja (Criar Equipamento Ígneo)',
        efeitoTexto: 'Cria uma arma, armadura ou escudo básico à sua escolha (se for uma arma, ela causa dano de fogo em vez de dano físico).',
        danoBase: 0, curaBase: 0, tipoDano: 'fogo', ignoraResistencia: false, isDispensaVoluntaria: true
      }
    ]
  },
  geada: {
    chave: 'geada',
    nome: 'Arcano da Geada',
    dominios: 'Frio, gelo, silêncio',
    fundir: 'Você ganha Resistência a dano de gelo, torna-se imune à condição Enfurecido e todo o dano de gelo causado por você ignora Resistências.',
    beneficiosFundir: {
      resistencias: ['gelo'],
      imunidadesCondicao: ['enfurecido'],
      ignoraResistenciaElementos: ['gelo']
    },
    opcoesDispensar: [
      {
        subcodigo: 'ERA_DO_GELO',
        nomeEfeito: 'Era do Gelo',
        efeitoTexto: 'Causa 30 pontos de dano de gelo a qualquer número de criaturas visíveis (ignora Resistências; +10 no nv. 20+, +20 no nv. 40+).',
        danoBase: 30,
        curaBase: 0,
        tipoDano: 'gelo',
        ignoraResistencia: true,
        isDispensaVoluntaria: true
      }
    ]
  },
  roda: {
    chave: 'roda',
    nome: 'Arcano da Roda',
    dominios: 'Destino, tempo, velocidade',
    fundir: 'Você torna-se imune à condição Lento e sua Defesa aumenta em +1.',
    beneficiosFundir: {
      bonusDefesa: 1,
      imunidadesCondicao: ['lento']
    },
    opcoesDispensar: [
      {
        subcodigo: 'CONGELAR_O_TEMPO',
        nomeEfeito: 'Congelar o Tempo',
        efeitoTexto: 'Cada criatura visível escolhida fica Lenta. Se já estiver Lenta, ela realizará 1 ação a menos no próximo turno dela.',
        danoBase: 0,
        curaBase: 0,
        tipoDano: 'magico',
        condicaoAlvo: 'lento',
        reduzAcaoSeJaLento: true,
        isDispensaVoluntaria: true
      }
    ]
  },
  torre: {
    chave: 'torre',
    nome: 'Arcano da Torre',
    dominios: 'Julgamento, proteção, sacrifício',
    fundir: 'Escolha um tipo de dano (ar, fogo, gelo, raio, terra ou trevas): cada aliado seu em cena recebe Resistência ao tipo escolhido enquanto este Arcano estiver ativo.',
    beneficiosFundir: {
      resistenciaAliadosOpcoes: ['ar', 'fogo', 'gelo', 'raio', 'terra', 'trevas']
    },
    opcoesDispensar: [
      {
        subcodigo: 'JULGAMENTO',
        nomeEfeito: 'Julgamento',
        efeitoTexto: 'Causa 30 pontos de dano de luz a qualquer número de criaturas visíveis (ignora Resistências; +10 no nv. 20+, +20 no nv. 40+).',
        danoBase: 30,
        curaBase: 0,
        tipoDano: 'luz',
        ignoraResistencia: true,
        isDispensaVoluntaria: true
      }
    ]
  },
  carvalho: {
    chave: 'carvalho',
    nome: 'Arcano do Carvalho',
    dominios: 'Plantas, terra, veneno',
    fundir: 'Você ganha Resistência a dano de terra e de veneno, torna-se imune a Envenenado e sempre que recuperar PV você recupera +5 PV adicionais.',
    beneficiosFundir: {
      resistencias: ['terra', 'veneno'],
      imunidadesCondicao: ['envenenado'],
      bonusCuraRecebidaPv: 5
    },
    opcoesDispensar: [
      {
        subcodigo: 'FLORESCER',
        nomeEfeito: 'Florescer',
        efeitoTexto: 'Qualquer número de criaturas visíveis escolhidas (inclusive você) perde a condição Envenenado e recupera 40 PV (50 PV no nv. 20+, 60 PV no nv. 40+).',
        danoBase: 0,
        curaBase: 40,
        escalaCura: true,
        tipoDano: 'luz',
        removerCondicaoAlvo: 'envenenado',
        isDispensaVoluntaria: true
      }
    ]
  },
  ceu: {
    chave: 'ceu',
    nome: 'Arcano do Céu',
    dominios: 'Chuva, névoa, tempestades',
    fundir: 'Você ganha Resistência a dano de ar e de raio e pode usar uma ação para prever as condições climáticas do próximo dia (raio de 2 dias de viagem).',
    beneficiosFundir: {
      resistencias: ['ar', 'raio'],
      acaoPreverClima: true
    },
    opcoesDispensar: [
      {
        subcodigo: 'TEMPESTADE',
        nomeEfeito: 'Tempestade',
        efeitoTexto: 'Causa 30 pontos de dano de raio a qualquer número de criaturas visíveis (ignora Resistências; +10 no nv. 20+, +20 no nv. 40+).',
        danoBase: 30,
        curaBase: 0,
        tipoDano: 'raio',
        ignoraResistencia: true,
        isDispensaVoluntaria: true
      }
    ]
  },
  grimorio: {
    chave: 'grimorio',
    nome: 'Arcano do Grimório',
    dominios: 'Compreensão, conhecimento, revelações',
    fundir: 'Você compreende todos os idiomas e seu dado de Astúcia é considerado 1 passo maior (máximo d12).',
    beneficiosFundir: {
      bonusPassoAstucia: 1,
      compreendeTodosIdiomas: true
    },
    opcoesDispensar: [
      {
        subcodigo: 'ORACULO',
        nomeEfeito: 'Oráculo',
        efeitoTexto: 'Faça uma única pergunta ao Mestre; ele responde com sinceridade descrevendo a visão do Grimório (disponível 1x por dia).',
        danoBase: 0,
        curaBase: 0,
        tipoDano: 'magico',
        isDispensaVoluntaria: true
      }
    ]
  },
  portao: {
    chave: 'portao',
    nome: 'Arcano do Portão',
    dominios: 'Espaço, vazio, viagens',
    fundir: 'Você ganha Resistência a dano de trevas e sua Defesa Mágica aumenta em +1.',
    beneficiosFundir: {
      resistencias: ['trevas'],
      bonusDefesaMagica: 1
    },
    opcoesDispensar: [
      {
        subcodigo: 'OBLIVIO',
        nomeEfeito: 'Oblívio',
        efeitoTexto: 'Causa 30 pontos de dano de trevas a qualquer número de criaturas visíveis (ignora Resistências; +10 no nv. 20+, +20 no nv. 40+).',
        danoBase: 30,
        curaBase: 0,
        tipoDano: 'trevas',
        ignoraResistencia: true,
        isDispensaVoluntaria: true
      },
      {
        subcodigo: 'TRANSLOCAR',
        nomeEfeito: 'Translocar',
        efeitoTexto: 'Teletransporta você e até 5 criaturas voluntárias para um local já visitado a até 1 dia de viagem.',
        danoBase: 0,
        curaBase: 0,
        tipoDano: 'trevas',
        isDispensaVoluntaria: true
      }
    ]
  }
});

export function identificarArcanoOficial(arcanoOuTexto) {
  if (!arcanoOuTexto) return null;
  const texto = typeof arcanoOuTexto === 'string'
    ? normalizarTextoCore(arcanoOuTexto)
    : normalizarTextoCore(`${arcanoOuTexto.chave || ''} ${arcanoOuTexto.nome || ''} ${arcanoOuTexto.dispensar_nome || ''}`);

  if (!texto) return null;
  if (texto.includes('espada') || texto.includes('sword')) return CATALOGO_ARCANOS_OFICIAIS.espada;
  if (texto.includes('forja') || texto.includes('forge') || texto.includes('inferno')) return CATALOGO_ARCANOS_OFICIAIS.forja;
  if (texto.includes('geada') || texto.includes('frost') || texto.includes('era do gelo')) return CATALOGO_ARCANOS_OFICIAIS.geada;
  if (texto.includes('roda') || texto.includes('wheel') || texto.includes('congelar o tempo')) return CATALOGO_ARCANOS_OFICIAIS.roda;
  if (texto.includes('torre') || texto.includes('tower') || texto.includes('julgamento')) return CATALOGO_ARCANOS_OFICIAIS.torre;
  if (texto.includes('carvalho') || texto.includes('oak') || texto.includes('florescer')) return CATALOGO_ARCANOS_OFICIAIS.carvalho;
  if (texto.includes('ceu') || texto.includes('sky') || texto.includes('tempestade')) return CATALOGO_ARCANOS_OFICIAIS.ceu;
  if (texto.includes('grimorio') || texto.includes('grimoire') || texto.includes('oraculo')) return CATALOGO_ARCANOS_OFICIAIS.grimorio;
  if (texto.includes('portao') || texto.includes('gate') || texto.includes('oblivio') || texto.includes('translocar')) return CATALOGO_ARCANOS_OFICIAIS.portao;
  return null;
}
