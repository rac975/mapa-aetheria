/**
 * Regras puras de Fabula Ultima para a classe Inventor.
 * Concentra as regras de Engenhocas (Alquimia, Infusões, Tecnomagia),
 * Magiesferas, Item Emergencial, Chuva de Poções e Fórmula Secreta.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const CUSTO_PI_ATIVACAO_MAGIESFERA = 2;
export const DISCIPLINAS_MAGIESFERAS_PERMITIDAS = new Set(['elementalista', 'entropista', 'espiritualista']);

function normalizarPoderesHeroicos(poderesHeroicos = []) {
  const set = new Set();
  (Array.isArray(poderesHeroicos) ? poderesHeroicos : []).forEach((p) => {
    const txt = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''} ${p?.nome_original || ''}`;
    set.add(normalizarTextoCore(txt));
  });
  return set;
}

export function calcularLimiteMagiesferas(nivelPersonagem = 5) {
  const nivel = Math.max(1, parseInt(nivelPersonagem, 10) || 1);
  let limite = 3;
  if (nivel >= 20) limite += 1;
  if (nivel >= 40) limite += 1;
  return limite;
}

export function validarDisciplinaMagiesfera(classeOuDisciplina) {
  if (!classeOuDisciplina || typeof classeOuDisciplina !== 'string') return false;
  return DISCIPLINAS_MAGIESFERAS_PERMITIDAS.has(normalizarTextoCore(classeOuDisciplina));
}

export function calcularCustoPiComBolsosFundos({ custoPi = 1, temBolsosFundos = false } = {}) {
  const base = Math.max(1, parseInt(custoPi, 10) || 1);
  return temBolsosFundos ? Math.max(1, base - 1) : base;
}

export function calcularCuraComFormulaSecreta({ curaBase = 0, npFormulaSecreta = 0 } = {}) {
  const base = Math.max(0, parseInt(curaBase, 10) || 0);
  const np = Math.max(0, parseInt(npFormulaSecreta, 10) || 0);
  return base + (np * 5);
}

export function calcularDanoComFormulaSecreta({ danoBase = 0, npFormulaSecreta = 0 } = {}) {
  const base = Math.max(0, parseInt(danoBase, 10) || 0);
  const np = Math.max(0, parseInt(npFormulaSecreta, 10) || 0);
  return base + np;
}

export function extrairHabilidadesInventor({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasseInventor = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('inventor') || nome.includes('tinkerer');
  });

  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvChuvaPocoes = obterNivelHabilidade(listaClasses, 'inventor', 'chuva de pocoes');
  const nvEngenhocas = obterNivelHabilidade(listaClasses, 'inventor', 'engenhocas');
  const nvFormulaSecreta = obterNivelHabilidade(listaClasses, 'inventor', 'formula secreta');
  const nvItemEmergencial = obterNivelHabilidade(listaClasses, 'inventor', 'item emergencial');
  const nvVisionario = obterNivelHabilidade(listaClasses, 'inventor', 'visionario');

  const classeInv = listaClasses.find((c) => normalizarTextoCore(c?.nome_classe || c?.classe || '').includes('inventor'));
  const habEng = (classeInv?.habilidades || []).find((h) => normalizarTextoCore(h?.nome || '').includes('engenhocas'));
  const ramos = habEng?.ramos || {};

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClasseInventor,
    nivelTotal,
    habilidades: {
      chuvaPocoes: { nivel: nvChuvaPocoes, ativo: nvChuvaPocoes > 0, criaturasAdicionais: nvChuvaPocoes },
      engenhocas: { nivel: nvEngenhocas, ativo: nvEngenhocas > 0, ramos },
      formulaSecreta: { nivel: nvFormulaSecreta, ativo: nvFormulaSecreta > 0, bonusCura: nvFormulaSecreta * 5, bonusDano: nvFormulaSecreta },
      itemEmergencial: { nivel: nvItemEmergencial, ativo: nvItemEmergencial > 0 },
      visionario: { nivel: nvVisionario, ativo: nvVisionario > 0, descontoZenites: nvVisionario * 100, progressoExtra: nvVisionario }
    },
    poderesHeroicos: {
      bolsosFundos: Array.from(poderesSet).some((p) => p.includes('bolsos fundos')),
      magicanhaoQuantico: Array.from(poderesSet).some((p) => p.includes('magicanhao quantico')),
      nebulizacao: Array.from(poderesSet).some((p) => p.includes('nebulizacao')),
      dosagemPrecisa: Array.from(poderesSet).some((p) => p.includes('dosagem precisa'))
    }
  };
}

export function extrairMagiesferasInventor({ classes = [], ficha = null, temBolsosFundos = false } = {}) {
  const dados = extrairHabilidadesInventor({ classes, ficha });
  if (!dados.temClasseInventor) return { temSuperiorTecnomagia: false, limite: 0, magiesferas: [] };

  const ramoTecnomagia = dados.habilidades.engenhocas.ramos?.tecnomagia;
  const temSuperiorTecnomagia = ramoTecnomagia === 'superior';
  if (!temSuperiorTecnomagia) return { temSuperiorTecnomagia: false, limite: 0, magiesferas: [] };

  const limite = calcularLimiteMagiesferas(dados.nivelTotal);
  const listaClasses = Array.isArray(classes) && classes.length > 0 ? classes : (ficha?.classes || []);
  const classeInv = listaClasses.find((c) => normalizarTextoCore(c?.nome_classe || '').includes('inventor'));
  const habEng = (classeInv?.habilidades || []).find((h) => normalizarTextoCore(h?.nome || '').includes('engenhocas'));
  const raw = Array.isArray(habEng?.magiesferas) ? habEng.magiesferas : (Array.isArray(classeInv?.magiesferas) ? classeInv.magiesferas : []);

  const custoPiFinal = calcularCustoPiComBolsosFundos({ custoPi: CUSTO_PI_ATIVACAO_MAGIESFERA, temBolsosFundos });

  const magiesferasValidas = raw.filter((m) => m && (m.nome || m.id)).slice(0, limite).map((m, idx) => ({
    id: m.id || `magiesfera_${idx + 1}`,
    nome: m.nome || `Magiesfera ${idx + 1}`,
    classe: m.classe || 'Elementalista',
    custoPm: Number(m.pm_custo || m.custo_mp || m.custoPm) || 10,
    pm_custo: Number(m.pm_custo || m.custo_mp || m.custoPm) || 10,
    custoPi: custoPiFinal,
    descricao: m.descricao || '',
    alvo: m.alvo || '1 criatura',
    duracao: m.duracao || 'Instantânea',
    ofensivo: Boolean(m.ofensivo),
    isMagiesfera: true,
    tipo_acao: 'inventario'
  }));

  return { temSuperiorTecnomagia: true, limite, magiesferas: magiesferasValidas };
}

export function gerarAcoesConflitoInventor({ classes = [], poderesHeroicos = [], ficha = null, emCrise = false } = {}) {
  const dados = extrairHabilidadesInventor({ classes, poderesHeroicos, ficha });
  if (!dados.temClasseInventor) return [];

  const acoes = [];
  const temBolsosFundos = dados.poderesHeroicos.bolsosFundos;
  const npFormula = dados.habilidades.formulaSecreta.nivel;

  if (dados.habilidades.itemEmergencial.ativo && emCrise) {
    acoes.push({
      id: 'inventor_item_emergencial',
      codigo: 'ITEM_EMERGENCIAL',
      nome: '🚨 Item Emergencial (Ação Extra de Inventário em Crise)',
      nomeCurto: 'Item Emergencial',
      tipo: 'acao_emergencial',
      classe: 'Inventor',
      custoPi: 0,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: 'Uma vez por conflito em Crise: realiza uma ação adicional no turno que deve ser obrigatoriamente Inventário.'
    });
  }

  if (dados.habilidades.chuvaPocoes.ativo) {
    const npChuva = dados.habilidades.chuvaPocoes.nivel;
    const custoPi = calcularCustoPiComBolsosFundos({ custoPi: 2, temBolsosFundos });
    acoes.push({
      id: 'inventor_chuva_pocoes',
      codigo: 'CHUVA_POCOES',
      nome: `🌧️ Chuva de Poções (+${npChuva} Aliados • 50% Cura)`,
      nomeCurto: 'Chuva de Poções',
      tipo: 'acao_suporte',
      classe: 'Inventor',
      nivel: npChuva,
      custoPi,
      custoPm: 0,
      descricao: `Gasta ação de Inventário e ${custoPi} PI para repartir cura de poção com até ${npChuva} aliados adicionais (50% de eficácia em cada).`
    });
  }

  const ramos = dados.habilidades.engenhocas.ramos || {};
  if (ramos.alquimia) {
    const curaPot = calcularCuraComFormulaSecreta({ curaBase: 30, npFormulaSecreta: npFormula });
    const custoPiTonico = calcularCustoPiComBolsosFundos({ custoPi: 2, temBolsosFundos });
    acoes.push({
      id: 'inventor_tonico_alquimico',
      codigo: 'TONICO_ALQUIMICO',
      nome: `🧪 Tônico Alquímico (+${curaPot} PV • ${custoPiTonico} PI)`,
      nomeCurto: 'Tônico Alquímico',
      tipo: 'acao_suporte',
      classe: 'Inventor',
      custoPi: custoPiTonico,
      curaAplicada: curaPot,
      recursoCura: 'pv',
      descricao: `Criação rápida de poção alquímica: restaura ${curaPot} PV em aliado visível${npFormula > 0 ? ` (+${npFormula * 5} por Fórmula Secreta)` : ''}.`
    });

    const danoBomba = calcularDanoComFormulaSecreta({ danoBase: 20, npFormulaSecreta: npFormula });
    const custoPiBomba = calcularCustoPiComBolsosFundos({ custoPi: 2, temBolsosFundos });
    acoes.push({
      id: 'inventor_bomba_alquimica',
      codigo: 'BOMBA_ALQUIMICA',
      nome: `💣 Bomba Alquímica (${danoBomba} Dano Elemental • ${custoPiBomba} PI)`,
      nomeCurto: 'Bomba Alquímica',
      tipo: 'acao_combate',
      classe: 'Inventor',
      custoPi: custoPiBomba,
      danoAplicado: danoBomba,
      tipoDano: 'fogo',
      descricao: `Engenhoca ofensiva: arremessa bomba alquímica causando ${danoBomba} de dano elemental${npFormula > 0 ? ` (+${npFormula} por Fórmula Secreta)` : ''}.`
    });
  }

  if (ramos.infusoes) {
    const custoPiInfusao = calcularCustoPiComBolsosFundos({ custoPi: 1, temBolsosFundos });
    acoes.push({
      id: 'inventor_infusao_elemental',
      codigo: 'INFUSAO_ELEMENTAL',
      nome: `⚙️ Infusão Elemental (Arma/Armadura • ${custoPiInfusao} PI)`,
      nomeCurto: 'Infusão Elemental',
      tipo: 'acao_suporte',
      classe: 'Inventor',
      custoPi: custoPiInfusao,
      descricao: `Imbui equipamento de aliado com elemento temporário (Fogo, Gelo, Raio, etc.) ou resistência elementar até o fim da cena.`
    });
  }

  return acoes;
}
