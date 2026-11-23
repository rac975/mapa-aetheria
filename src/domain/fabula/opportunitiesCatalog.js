/**
 * Fabula Ultima - Catálogo Oficial de Oportunidades (Livro Básico p. 41)
 *
 * Exatamente as 11 opções canônicas de Oportunidades disponíveis para
 * Sucessos Críticos e Falhas Críticas em Conflitos.
 */

export const CATALOGO_OPORTUNIDADES_FABULA = Object.freeze([
  {
    codigo: 'AFLICAO',
    titulo: 'Aflição',
    icone: '⚡',
    categoria: 'mecanica',
    descricao: 'Uma criatura fica abalada, atordoada, fraca ou lenta.',
    condicoesPermitidas: ['abalado', 'atordoado', 'fraco', 'lento']
  },
  {
    codigo: 'AVALIAR',
    titulo: 'Avaliar',
    icone: '👁️',
    categoria: 'tatica',
    descricao: 'Você descobre uma Vulnerabilidade ou um Traço de uma criatura que possa ver.'
  },
  {
    codigo: 'CONEXAO',
    titulo: 'Conexão',
    icone: '❤️',
    categoria: 'narrativa',
    descricao: 'Você cria um Laço com algo ou alguém ou adiciona uma emoção a um dos Laços que já tem.'
  },
  {
    codigo: 'DESMASCARAR',
    titulo: 'Desmascarar',
    icone: '🎭',
    categoria: 'narrativa',
    descricao: 'Você descobre objetivos e motivações de uma criatura à sua escolha.'
  },
  {
    codigo: 'FAVOR',
    titulo: 'Favor',
    icone: '🤝',
    categoria: 'narrativa',
    descricao: 'Suas ações garantem apoio ou admiração de uma pessoa ou grupo.'
  },
  {
    codigo: 'INFORMACOES',
    titulo: 'Informações',
    icone: '📜',
    categoria: 'narrativa',
    descricao: 'Você detecta uma pista ou detalhe útil. O mestre pode lhe dizer o que é ou pedir que você a descreva e/ou invente.'
  },
  {
    codigo: 'ITEM_PERDIDO',
    titulo: 'Item Perdido',
    icone: '🎒',
    categoria: 'tatica',
    descricao: 'Um item é destruído, perdido, roubado ou abandonado.'
  },
  {
    codigo: 'MANCADA',
    titulo: 'Mancada',
    icone: '🗣️',
    categoria: 'narrativa',
    descricao: 'Escolha uma criatura presente na cena: a pessoa que a controla deve interpretar um comentário comprometedor feito por ela.'
  },
  {
    codigo: 'PROGRESSO',
    titulo: 'Progresso',
    icone: '🕒',
    categoria: 'mecanica',
    descricao: 'Você preenche ou apaga até duas seções de um relógio.'
  },
  {
    codigo: 'REVIRAVOLTA',
    titulo: 'Reviravolta!',
    icone: '🌪️',
    categoria: 'narrativa',
    descricao: 'Alguém ou algo à sua escolha aparece de repente na cena.'
  },
  {
    codigo: 'VANTAGEM',
    titulo: 'Vantagem',
    icone: '✨',
    categoria: 'mecanica',
    descricao: 'O próximo teste feito por você ou por um aliado à sua escolha recebe um bônus de +4.'
  }
]);

export const ALIAS_OPORTUNIDADES_LEGADAS = Object.freeze({
  AFETAR: 'AFLICAO',
  FAVORECER: 'VANTAGEM',
  REVELAR: 'AVALIAR',
  LACO: 'CONEXAO',
  RELOGIO: 'PROGRESSO'
});
