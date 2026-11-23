/**
 * Fabula Ultima - Regras das Classes Básicas (Livro Base / Core Rulebook) e Condições
 *
 * Funções puras em JavaScript sem dependências de UI (React) ou Banco de Dados (Supabase).
 * Consolidado para garantir rigor mecânico e coesão equivalentes aos módulos de expansão
 * (Alta Fantasia, Tecno-Fantasia e Fantasia Natural).
 */

export const CORE_CLASS_NAMES = [
  'Andarilho',
  'Arcanista',
  'Atirador',
  'Elementalista',
  'Entropista',
  'Erudito',
  'Espiritualista',
  'Furioso',
  'Guardião',
  'Guerreiro Sombrio',
  'Inventor',
  'Ladino',
  'Mestre de Armas',
  'Orador',
  'Quimerista'
];

export const PROGRESSAO_DADOS_ATRIBUTO = [6, 8, 10, 12, 20];

/**
 * Regras oficiais das 6 Condições (Status Effects) de Fabula Ultima (Livro Básico).
 * Cada condição reduz em 1 passo (mínimo d6) o dado atual de um ou mais atributos.
 */
export const CONDICOES_OFICIAIS = {
  abalado: {
    id: 'abalado',
    nome: 'Abalado',
    atributosAfetados: ['vontade'],
    descricao: 'Reduz o dado atual de Vontade (VON) em 1 passo (mínimo d6).'
  },
  atordoado: {
    id: 'atordoado',
    nome: 'Atordoado',
    atributosAfetados: ['astucia'],
    descricao: 'Reduz o dado atual de Astúcia (AST) em 1 passo (mínimo d6).'
  },
  enfurecido: {
    id: 'enfurecido',
    nome: 'Enfurecido',
    atributosAfetados: ['destreza', 'astucia'],
    descricao: 'Reduz os dados atuais de Destreza (DES) e Astúcia (AST) em 1 passo (mínimo d6).'
  },
  envenenado: {
    id: 'envenenado',
    nome: 'Envenenado',
    atributosAfetados: ['vigor', 'vontade'],
    descricao: 'Reduz os dados atuais de Vigor (VIG) e Vontade (VON) em 1 passo (mínimo d6).'
  },
  fraco: {
    id: 'fraco',
    nome: 'Fraco',
    atributosAfetados: ['vigor'],
    descricao: 'Reduz o dado atual de Vigor (VIG) em 1 passo (mínimo d6).'
  },
  lento: {
    id: 'lento',
    nome: 'Lento',
    atributosAfetados: ['destreza'],
    descricao: 'Reduz o dado atual de Destreza (DES) em 1 passo (mínimo d6).'
  }
};

/**
 * Normaliza textos para comparação robusta sem acentos e em minúsculas.
 * @param {string} texto
 * @returns {string}
 */
export function normalizarTextoCore(texto = '') {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Busca o Nível de Poder (NP / SL) de uma habilidade na lista de classes do personagem.
 * @param {Array<Object>} classes
 * @param {string} termoClasse - Substring normalizada do nome da classe (opcional, null para buscar em todas)
 * @param {string} termoHabilidade - Substring normalizada do nome da habilidade
 * @returns {number}
 */
export function obterNivelHabilidade(classes = [], termoClasse = null, termoHabilidade = '') {
  const termoHabNorm = normalizarTextoCore(termoHabilidade);
  const termoClasseNorm = termoClasse ? normalizarTextoCore(termoClasse) : null;
  if (!termoHabNorm || !Array.isArray(classes)) return 0;

  let maxNivel = 0;
  classes.forEach((c) => {
    const nomeClasse = normalizarTextoCore(c?.nome_classe || '');
    if (termoClasseNorm && !nomeClasse.includes(termoClasseNorm)) return;
    const habs = Array.isArray(c?.habilidades)
      ? c.habilidades
      : (c?.habilidades && typeof c.habilidades === 'object'
          ? Object.entries(c.habilidades).map(([nome, nivel]) => ({ nome, nivel }))
          : []);
    habs.forEach((h) => {
      const nomeHab = normalizarTextoCore(h?.nome || '');
      if (nomeHab.includes(termoHabNorm)) {
        const nv = parseInt(h?.nivel, 10) || 0;
        if (nv > maxNivel) maxNivel = nv;
      }
    });
  });
  return maxNivel;
}

export const ALIAS_CONDICOES_OFICIAIS = {
  enfraquecido: 'fraco',
  weak: 'fraco',
  shaken: 'abalado',
  dazed: 'atordoado',
  enraged: 'enfurecido',
  poisoned: 'envenenado',
  slow: 'lento'
};

/**
 * Calcula modificadores de passos de atributos causados pelas condições ativas oficiais
 * respeitando eventuais imunidades a condições.
 * @param {Array<string>} condicoes
 * @param {Array<string>} [imunidades=[]]
 * @returns {{ destreza: number, astucia: number, vigor: number, vontade: number }}
 */
export function calcularModificadoresCondicoesOficiais(condicoes = [], imunidades = []) {
  const mods = { destreza: 0, astucia: 0, vigor: 0, vontade: 0 };
  if (!Array.isArray(condicoes) || condicoes.length === 0) return mods;

  const imunes = new Set(
    (Array.isArray(imunidades) ? imunidades : []).map((c) => {
      const norm = normalizarTextoCore(c);
      return ALIAS_CONDICOES_OFICIAIS[norm] || norm;
    })
  );
  const unicas = new Set(
    condicoes.map((c) => {
      const norm = normalizarTextoCore(c);
      return ALIAS_CONDICOES_OFICIAIS[norm] || norm;
    })
  );

  unicas.forEach((condId) => {
    if (imunes.has(condId)) return;
    const chaveResolvida = ALIAS_CONDICOES_OFICIAIS[condId] || condId;
    const regra = CONDICOES_OFICIAIS[chaveResolvida];
    if (!regra) return;
    regra.atributosAfetados.forEach((attr) => {
      mods[attr] = (mods[attr] || 0) - 1;
    });
  });

  return mods;
}

/**
 * Consolida todos os bônus passivos, ativações em Crise e interações de combate/magia
 * das 15 classes básicas do Livro Base de Fabula Ultima.
 * @param {Object} params
 * @param {Array<Object>} [params.classes=[]]
 * @param {Object|null} [params.ficha=null]
 * @param {Array<Object>} [params.itensEquipados=[]]
 * @param {boolean} [params.emCrise=false]
 * @returns {Object}
 */
export function calcularPassivosCoreClasses({
  classes = [],
  ficha = null,
  itensEquipados = [],
  emCrise = false
} = {}) {
  const temEscudo = (itensEquipados || []).some((i) => {
    const tipo = normalizarTextoCore(i?.tipo || '');
    return tipo.includes('escudo') || i?.stats_personalizados?.escudo === true;
  });

  const temArmaduraMarcial = (itensEquipados || []).some((i) => {
    const slot = i?.stats_personalizados?.slot;
    const tipo = normalizarTextoCore(i?.tipo || '');
    return slot === 'armadura' && (i?.stats_personalizados?.marcial === true || tipo.includes('marcial'));
  });

  const temArmaArcana = (itensEquipados || []).some((i) => {
    const cat = normalizarTextoCore(i?.stats_personalizados?.categoria || i?.tipo || '');
    return cat.includes('arcana') || cat.includes('cajado') || cat.includes('tomo');
  });

  const temArmaFocoConsumir = (itensEquipados || []).some((i) => {
    const cat = normalizarTextoCore(i?.stats_personalizados?.categoria || i?.tipo || '');
    return cat.includes('adaga') || cat.includes('arcana') || cat.includes('malho') || cat.includes('cajado') || cat.includes('tomo');
  });

  // Andarilho
  const nvCompanheiroFiel = obterNivelHabilidade(classes, 'andarilho', 'companheiro fiel');
  const nvCacadorTesouros = obterNivelHabilidade(classes, 'andarilho', 'cacador de tesouros');
  const nvPratico = obterNivelHabilidade(classes, 'andarilho', 'pratico');
  const nvViajanteExperiente = obterNivelHabilidade(classes, 'andarilho', 'viajante experiente');

  // Arcanista
  const nvArcanoEmergencial = obterNivelHabilidade(classes, 'arcanista', 'arcano emergencial');
  const nvRegeneracaoArcana = obterNivelHabilidade(classes, 'arcanista', 'regeneracao arcana');
  const nvCirculoArcano = obterNivelHabilidade(classes, 'arcanista', 'circulo arcano');

  // Atirador
  const nvMaestriaDistancia = obterNivelHabilidade(classes, 'atirador', 'maestria com armas a distancia');
  const nvBarragem = obterNivelHabilidade(classes, 'atirador', 'barragem');
  const nvFogoCruzado = obterNivelHabilidade(classes, 'atirador', 'fogo cruzado');
  const nvOlhosAguia = obterNivelHabilidade(classes, 'atirador', 'olhos de aguia');
  const nvTiroAviso = obterNivelHabilidade(classes, 'atirador', 'tiro de aviso');

  // Elementalista
  const nvArtilhariaMagica = obterNivelHabilidade(classes, 'elementalista', 'artilharia magica');
  const nvCataclismo = obterNivelHabilidade(classes, 'elementalista', 'cataclismo');
  const nvLaminaMagica = obterNivelHabilidade(classes, 'elementalista', 'lamina magica');

  // Entropista
  const nvAbsorverPm = obterNivelHabilidade(classes, 'entropista', 'absorver pm');
  const nvSeteDaSorte = obterNivelHabilidade(classes, 'entropista', 'sete da sorte');
  const nvTempoRoubado = obterNivelHabilidade(classes, 'entropista', 'tempo roubado');

  // Erudito
  const nvConcentrado = obterNivelHabilidade(classes, 'erudito', 'concentrado');
  const nvConhecimentoEPoder = obterNivelHabilidade(classes, 'erudito', 'conhecimento e poder');
  const nvAnaliseRapida = obterNivelHabilidade(classes, 'erudito', 'analise rapida');
  const nvLampejoSaber = obterNivelHabilidade(classes, 'erudito', 'lampejo de saber');

  // Espiritualista
  const nvPoderCurativo = obterNivelHabilidade(classes, 'espiritualista', 'poder curativo');
  const nvMagiaSuporte = obterNivelHabilidade(classes, 'espiritualista', 'magia de suporte');
  const nvVismagus = obterNivelHabilidade(classes, 'espiritualista', 'vismagus');

  // Furioso
  const nvAdrenalina = obterNivelHabilidade(classes, 'furioso', 'adrenalina');
  const nvEspiritoIndomavel = obterNivelHabilidade(classes, 'furioso', 'espirito indomavel');
  const nvFrenesi = obterNivelHabilidade(classes, 'furioso', 'frenesi');
  const nvProvocar = obterNivelHabilidade(classes, 'furioso', 'provocar');
  const nvResistir = obterNivelHabilidade(classes, 'furioso', 'resistir');

  // Guardião
  const nvFortaleza = obterNivelHabilidade(classes, 'guardiao', 'fortaleza');
  const nvMaestriaDefensiva = obterNivelHabilidade(classes, 'guardiao', 'maestria defensiva');
  const nvDuploEscudeiro = obterNivelHabilidade(classes, 'guardiao', 'duplo escudeiro');
  const nvGuardaCostas = obterNivelHabilidade(classes, 'guardiao', 'guarda-costas');
  const nvProteger = obterNivelHabilidade(classes, 'guardiao', 'proteger');

  // Guerreiro Sombrio
  const nvAgonia = obterNivelHabilidade(classes, 'guerreiro sombrio', 'agonia');
  const nvCoracaoEscuridao = obterNivelHabilidade(classes, 'guerreiro sombrio', 'coracao da escuridao');
  const nvGolpeSombras = obterNivelHabilidade(classes, 'guerreiro sombrio', 'golpe das sombras');
  const nvLicaoDolorosa = obterNivelHabilidade(classes, 'guerreiro sombrio', 'licao dolorosa');
  const nvSangueTrevas = obterNivelHabilidade(classes, 'guerreiro sombrio', 'sangue das trevas');

  // Inventor
  const nvFormulaSecreta = obterNivelHabilidade(classes, 'inventor', 'formula secreta');
  const nvChuvaPocoes = obterNivelHabilidade(classes, 'inventor', 'chuva de pocoes');
  const nvItemEmergencial = obterNivelHabilidade(classes, 'inventor', 'item emergencial');
  const nvVisionario = obterNivelHabilidade(classes, 'inventor', 'visionario');

  // Ladino
  const nvEsquiva = obterNivelHabilidade(classes, 'ladino', 'esquiva');
  const nvGolpeBaixo = obterNivelHabilidade(classes, 'ladino', 'golpe baixo');
  const nvAltaVelocidade = obterNivelHabilidade(classes, 'ladino', 'alta velocidade');
  const nvRouboAlma = obterNivelHabilidade(classes, 'ladino', 'roubo de alma');

  // Mestre de Armas
  const nvMaestriaCorpo = obterNivelHabilidade(classes, 'mestre de armas', 'maestria com armas corpo a corpo');
  const nvChuvaLaminas = obterNivelHabilidade(classes, 'mestre de armas', 'chuva de laminas');
  const nvContraAtaque = obterNivelHabilidade(classes, 'mestre de armas', 'contra-ataque');
  const nvQuebraOssos = obterNivelHabilidade(classes, 'mestre de armas', 'quebra-ossos');
  const nvTrespassar = obterNivelHabilidade(classes, 'mestre de armas', 'trespassar');

  // Orador
  const nvCondenar = obterNivelHabilidade(classes, 'orador', 'condenar');
  const nvEncorajar = obterNivelHabilidade(classes, 'orador', 'encorajar');
  const nvConfioEmVoce = obterNivelHabilidade(classes, 'orador', 'confio em voce');
  const nvPersuasivo = obterNivelHabilidade(classes, 'orador', 'persuasivo');
  const nvAliadoInesperado = obterNivelHabilidade(classes, 'orador', 'aliado inesperado');

  // Quimerista
  const nvImitacaoMagica = obterNivelHabilidade(classes, 'quimerista', 'imitacao magica');
  const nvConsumir = obterNivelHabilidade(classes, 'quimerista', 'consumir');
  const nvPatogenese = obterNivelHabilidade(classes, 'quimerista', 'patogenese');

  const lacos = Array.isArray(ficha?.lacos) ? ficha.lacos : [];
  const maiorLaco = lacos.length > 0
    ? Math.max(...lacos.map((l) => parseInt(l?.forca || l?.nivel || 1, 10) || 1), 1)
    : 1;

  const resistenciasCrise = [];
  if (emCrise && nvSangueTrevas > 0) {
    resistenciasCrise.push({ tipo: 'trevas', fonte: 'Sangue das Trevas' });
    resistenciasCrise.push({ tipo: 'veneno', fonte: 'Sangue das Trevas' });
  }

  return {
    // Bônus Passivos Numéricos
    bonusPvFortaleza: nvFortaleza * 3,
    bonusPmConcentrado: nvConcentrado * 3,
    bonusDefesaEsquiva: !temEscudo && !temArmaduraMarcial ? nvEsquiva : 0,
    reducaoDanoMaestriaDefensiva: temEscudo || temArmaduraMarcial ? nvMaestriaDefensiva : 0,
    bonusPrecisaoCorpoACorpo: nvMaestriaCorpo,
    bonusPrecisaoDistancia: nvMaestriaDistancia,
    bonusTesteAbertoAstAst: nvConcentrado,
    bonusTesteArtilhariaMagica: temArmaArcana ? nvArtilhariaMagica * 2 : 0,
    bonusCuraPoderCurativo: temArmaArcana && nvPoderCurativo > 0 ? 3 + (nvPoderCurativo * lacos.length) : 0,
    recuperacaoPmConsumir: temArmaFocoConsumir ? nvConsumir * 2 : 0,
    limiteFeiticosQuimerista: nvImitacaoMagica > 0 ? nvImitacaoMagica + 2 : 0,
    bonusCuraFormulaSecreta: nvFormulaSecreta * 5,
    bonusDanoFormulaSecreta: nvFormulaSecreta,
    descontoProjetoVisionarioZenites: nvVisionario * 100,
    progressoExtraProjetoVisionario: nvVisionario,
    descobertaViagemCacador: nvCacadorTesouros > 0 ? nvCacadorTesouros + 1 : 1,
    recuperacaoPiViagemPratico: nvPratico,
    reduzDadoViagem: nvViajanteExperiente > 0,

    // Efeitos de Crise (PV <= metade do máx)
    emCrise,
    bonusDanoAdrenalinaCrise: emCrise ? nvAdrenalina * 2 : 0,
    descontoInvocacaoArcanoEmergencial: emCrise ? nvArcanoEmergencial * 5 : 0,
    temItemEmergencialDisponivel: emCrise && nvItemEmergencial > 0,
    temCoracaoEscuridaoDisponivel: emCrise && nvCoracaoEscuridao > 0,
    resistenciasCrise,

    // Sinergias Ativas de Combate e Suporte
    nvCompanheiroFiel,
    nvRegeneracaoArcana,
    nvCirculoArcano,
    nvBarragem,
    nvFogoCruzado,
    nvOlhosAguia,
    nvTiroAviso,
    nvCataclismo,
    nvLaminaMagica,
    nvAbsorverPm,
    nvSeteDaSorte,
    nvTempoRoubado,
    nvConhecimentoEPoder,
    nvAnaliseRapida,
    nvLampejoSaber,
    nvMagiaSuporte,
    nvVismagus,
    nvEspiritoIndomavel,
    nvFrenesi,
    nvProvocar,
    nvResistir,
    nvDuploEscudeiro,
    nvGuardaCostas,
    nvProteger,
    nvAgonia,
    nvGolpeSombras,
    nvLicaoDolorosa,
    nvChuvaPocoes,
    nvGolpeBaixo,
    nvAltaVelocidade,
    nvRouboAlma,
    nvChuvaLaminas,
    nvContraAtaque,
    nvQuebraOssos,
    nvTrespassar,
    nvCondenar,
    nvEncorajar,
    nvConfioEmVoce,
    nvPersuasivo,
    nvAliadoInesperado,
    nvPatogenese,
    maiorLaco
  };
}

/**
 * Calcula o dano extra da habilidade Golpe Baixo (Ladino).
 * Regra oficial: Ao atingir uma única criatura sofrendo uma ou mais condições,
 * causa dano adicional igual a (NP + número de condições afetando a criatura).
 * @param {number} nvGolpeBaixo
 * @param {Array<string>} condicoesAlvo
 * @param {boolean} isAlvoUnico
 * @returns {number}
 */
export function calcularBonusGolpeBaixo(nvGolpeBaixo = 0, condicoesAlvo = [], isAlvoUnico = true) {
  const np = parseInt(nvGolpeBaixo, 10) || 0;
  const qtdCondicoes = Array.isArray(condicoesAlvo) ? condicoesAlvo.length : Number(condicoesAlvo) || 0;
  if (np <= 0 || !isAlvoUnico || qtdCondicoes <= 0) return 0;
  return np + qtdCondicoes;
}

/**
 * Calcula o custo de Invocação de Arcano (Arcanista) aplicando Arcano Emergencial em Crise.
 * @param {number} nvArcanoEmergencial
 * @param {boolean} emCrise
 * @returns {{ custoPm: number, curaRegeneracao: number }}
 */
export function calcularInvocacaoArcano({ nvArcanoEmergencial = 0, nvRegeneracaoArcana = 0, emCrise = false } = {}) {
  const desconto = emCrise ? (parseInt(nvArcanoEmergencial, 10) || 0) * 5 : 0;
  const custoPm = Math.max(0, 40 - desconto);
  const curaRegeneracao = (parseInt(nvRegeneracaoArcana, 10) || 0) * 5;
  return { custoPm, curaRegeneracao };
}

/**
 * Calcula a resolução de Roubo de Alma (Ladino) usando os dados reais de DES + VON + NP.
 * @param {Object} params
 * @returns {Object}
 */
export function calcularResultadoRouboDeAlma({
  nvRouboAlma = 1,
  dadoDes = 8,
  dadoVon = 8,
  rolagem1 = null,
  rolagem2 = null,
  tipoAlvo = 'soldado',
  nivelAlvo = 5
} = {}) {
  const np = Math.max(1, parseInt(nvRouboAlma, 10) || 1);
  const f1 = parseInt(String(dadoDes).replace(/\D/g, ''), 10) || 8;
  const f2 = parseInt(String(dadoVon).replace(/\D/g, ''), 10) || 8;
  const r1 = rolagem1 ?? (Math.floor(Math.random() * f1) + 1);
  const r2 = rolagem2 ?? (Math.floor(Math.random() * f2) + 1);
  const total = r1 + r2 + np;
  const nivelNum = Math.max(1, parseInt(nivelAlvo, 10) || 1);

  if (tipoAlvo === 'soldado') {
    return {
      rolagem: [r1, r2],
      faces: [f1, f2],
      bonus: np,
      total,
      piRecuperados: np,
      valorZenites: 0,
      nomeTesouro: null,
      detalhe: `Em sucesso contra a Defesa Mágica do Soldado, você recupera ${np} PI.`
    };
  }

  const multiplicador = tipoAlvo === 'vilao' ? 50 : 30;
  const valorZenites = nivelNum * multiplicador;
  return {
    rolagem: [r1, r2],
    faces: [f1, f2],
    bonus: np,
    total,
    piRecuperados: 0,
    valorZenites,
    nomeTesouro: `Tesouro da Alma (${tipoAlvo.toUpperCase()} Nv. ${nivelNum})`,
    detalhe: `Em sucesso contra a Defesa Mágica, gera Tesouro da Alma de até ${valorZenites}z.`
  };
}

/**
 * Calcula valores oficiais das habilidades de Orador com base no NP individual de cada poder.
 * @param {Array<Object>} classes
 * @returns {Object}
 */
export function calcularDadosOrador(classes = []) {
  const nvCondenar = obterNivelHabilidade(classes, 'orador', 'condenar');
  const nvEncorajar = obterNivelHabilidade(classes, 'orador', 'encorajar');
  const nvConfio = obterNivelHabilidade(classes, 'orador', 'confio em voce');
  const nvPersuasivo = obterNivelHabilidade(classes, 'orador', 'persuasivo');
  const nvAliado = obterNivelHabilidade(classes, 'orador', 'aliado inesperado');

  return {
    nvCondenar,
    custoCondenarPm: 5,
    perdaPmCondenar: nvCondenar * 10,
    bonusDanoCondenar: nvCondenar,
    bonusTesteCondenar: nvCondenar,

    nvEncorajar,
    custoEncorajarPm: 5,
    curaPvEncorajar: nvEncorajar * 5,

    nvConfio,
    custoConfioPf: 1,
    curaPmConfioComLaco: nvConfio * 10,

    nvPersuasivo,
    maxPmPersuasivo: nvPersuasivo * 20,

    nvAliado,
    custoAliadoPf: 1
  };
}

/**
 * Calcula custo alternativo em PV para a habilidade Vismagus (Espiritualista).
 * Regra: 10 + custo total em PM do feitiço em PV (não pode reduzir PV a 0 se auto-dano letal).
 * @param {number} custoPmTotal
 * @param {number} pvAtual
 * @returns {{ permitido: boolean, custoPv: number, motivo?: string }}
 */
export function calcularCustoVismagus(custoPmTotal = 0, pvAtual = 0) {
  const custoPv = 10 + Math.max(0, parseInt(custoPmTotal, 10) || 0);
  const hp = parseInt(pvAtual, 10) || 0;
  if (hp <= custoPv) {
    return {
      permitido: false,
      custoPv,
      motivo: `PV insuficientes (${hp} PV) para sacrificar ${custoPv} PV via Vismagus sem cair a 0 PV.`
    };
  }
  return { permitido: true, custoPv };
}

/**
 * Verifica se o gatilho de Contra-Ataque (Mestre de Armas) foi disparado por um ataque inimigo.
 * Regra: Quando um inimigo atinge ou erra um ataque corpo a corpo contra você e o resultado
 * do Teste de Precisão do inimigo é um número PAR, você pode fazer um ataque livre (RA = 0).
 * @param {number} nvContraAtaque
 * @param {number} resultadoPrecisaoInimigo
 * @param {boolean} isAtaqueCorpoACorpo
 * @returns {boolean}
 */
export function verificarGatilhoContraAtaque(nvContraAtaque = 0, resultadoPrecisaoInimigo = 0, isAtaqueCorpoACorpo = true) {
  if ((parseInt(nvContraAtaque, 10) || 0) <= 0 || !isAtaqueCorpoACorpo) return false;
  const total = parseInt(resultadoPrecisaoInimigo, 10);
  if (isNaN(total)) return false;
  return total % 2 === 0;
}

/**
 * Calcula o custo em PM de Fogo Cruzado (Atirador) para anular um ataque à distância.
 * Regra: 5 + resultado do teste de Precisão da criatura (não funciona em Sucesso Crítico).
 * @param {number} nvFogoCruzado
 * @param {number} testePrecisaoAlvo
 * @param {boolean} isSucessoCritico
 * @returns {{ permitido: boolean, custoPm: number, motivo?: string }}
 */
export function calcularCustoFogoCruzado(nvFogoCruzado = 0, testePrecisaoAlvo = 0, isSucessoCritico = false) {
  if ((parseInt(nvFogoCruzado, 10) || 0) <= 0) {
    return { permitido: false, custoPm: 0, motivo: 'Personagem não possui Fogo Cruzado.' };
  }
  if (isSucessoCritico) {
    return { permitido: false, custoPm: 0, motivo: 'Fogo Cruzado não anula Sucesso Crítico.' };
  }
  return {
    permitido: true,
    custoPm: 5 + Math.max(0, parseInt(testePrecisaoAlvo, 10) || 0)
  };
}

/**
 * Extrai a lista normalizada de Arcanos vinculados da classe ou ficha.
 * Suporta leitura a partir de classe.arcanos_vinculados, habilidade "Vincular e Invocar",
 * classe.arcano_vinculado ou ficha.arcanos_vinculados.
 * @param {Object} [classe]
 * @param {Object} [ficha]
 * @returns {Array<Object>} Lista de arcanos normalizados
 */
export function extrairArcanosVinculados(classe = {}, ficha = {}) {
  if (Array.isArray(classe?.arcanos_vinculados) && classe.arcanos_vinculados.length > 0) {
    return classe.arcanos_vinculados.filter(Boolean);
  }

  const habs = Array.isArray(classe?.habilidades)
    ? classe.habilidades
    : (Array.isArray(ficha?.habilidades) ? ficha.habilidades : []);

  const habVincular = habs.find((h) => {
    const n = (h?.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return n.includes('vincular') && n.includes('invocar');
  });

  if (habVincular) {
    if (Array.isArray(habVincular.arcanos_vinculados) && habVincular.arcanos_vinculados.length > 0) {
      return habVincular.arcanos_vinculados.filter(Boolean);
    }
    if (habVincular.arcano_vinculado) {
      return [habVincular.arcano_vinculado];
    }
  }

  if (classe?.arcano_vinculado) {
    return [classe.arcano_vinculado];
  }

  if (Array.isArray(ficha?.arcanos_vinculados) && ficha.arcanos_vinculados.length > 0) {
    return ficha.arcanos_vinculados.filter(Boolean);
  }

  return [];
}

/**
 * Retorna o Arcano vinculado principal ou null.
 * @param {Object} [classe]
 * @param {Object} [ficha]
 * @returns {Object|null}
 */
export function extrairArcanoVinculadoPrincipal(classe = {}, ficha = {}) {
  const lista = extrairArcanosVinculados(classe, ficha);
  return lista.length > 0 ? lista[0] : null;
}

/**
 * Atualiza ou insere os arcanos vinculados na habilidade "Vincular e Invocar" dentro do array de habilidades.
 * Retorna um novo array de habilidades sem mutar o original (função pura).
 * @param {Array<Object>} habilidades
 * @param {Array<Object>|Object} arcanos
 * @returns {Array<Object>}
 */
export function sincronizarArcanosNaHabilidade(habilidades = [], arcanos = []) {
  const lista = Array.isArray(arcanos) ? arcanos : (arcanos ? [arcanos] : []);
  const arcanoPrincipal = lista[0] || null;
  const base = Array.isArray(habilidades) ? [...habilidades] : [];
  let encontrou = false;

  const atualizadas = base.map((h) => {
    const n = (h?.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (n.includes('vincular') && n.includes('invocar')) {
      encontrou = true;
      return {
        ...h,
        arcanos_vinculados: lista,
        arcano_vinculado: arcanoPrincipal
      };
    }
    return h;
  });

  if (!encontrou && lista.length > 0) {
    atualizadas.push({
      nome: 'Vincular e Invocar',
      nivel: 1,
      descricao: 'Você pode vincular Arcanos à sua alma para invocá-los usando uma ação e 40 PM. Na criação de personagem, começa vinculado a um Arcano à sua escolha; novos Arcanos são obtidos na história.',
      arcanos_vinculados: lista,
      arcano_vinculado: arcanoPrincipal
    });
  }

  return atualizadas;
}

/**
 * Extrai a lista normalizada de magias imitadas (feitiços aprendidos) do Quimerista.
 * Suporta leitura a partir de classe.magias_imitadas, classe.dados_quimerista.magias_imitadas,
 * habilidade "Imitação Mágica", classe.magias, ou ficha.magias_imitadas.
 * @param {Object} [classe]
 * @param {Object} [ficha]
 * @returns {Array<Object>} Lista de feitiços imitados normalizados
 */
export function extrairMagiasQuimerista(classe = {}, ficha = {}) {
  if (Array.isArray(classe?.magias_imitadas) && classe.magias_imitadas.length > 0) {
    return classe.magias_imitadas.filter(Boolean);
  }

  if (Array.isArray(classe?.dados_quimerista?.magias_imitadas) && classe.dados_quimerista.magias_imitadas.length > 0) {
    return classe.dados_quimerista.magias_imitadas.filter(Boolean);
  }

  const habs = Array.isArray(classe?.habilidades)
    ? classe.habilidades
    : (Array.isArray(ficha?.habilidades) ? ficha.habilidades : []);

  const habImitacao = habs.find((h) => {
    const n = (h?.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return n.includes('imitacao') && n.includes('magica');
  });

  if (habImitacao) {
    if (Array.isArray(habImitacao.magias_imitadas) && habImitacao.magias_imitadas.length > 0) {
      return habImitacao.magias_imitadas.filter(Boolean);
    }
    if (Array.isArray(habImitacao.dados_quimerista?.magias_imitadas) && habImitacao.dados_quimerista.magias_imitadas.length > 0) {
      return habImitacao.dados_quimerista.magias_imitadas.filter(Boolean);
    }
  }

  if (Array.isArray(ficha?.magias_imitadas) && ficha.magias_imitadas.length > 0) {
    return ficha.magias_imitadas.filter(Boolean);
  }

  if (Array.isArray(ficha?.dados_quimerista?.magias_imitadas) && ficha.dados_quimerista.magias_imitadas.length > 0) {
    return ficha.dados_quimerista.magias_imitadas.filter(Boolean);
  }

  return [];
}

/**
 * Extrai a configuração de atributos do Quimerista (ex.: "AST + VON" ou "VIG + VON").
 * @param {Object} [classe]
 * @param {Object} [ficha]
 * @returns {string}
 */
export function extrairAtributoQuimerista(classe = {}, ficha = {}) {
  if (classe?.atributo_quimerista) return classe.atributo_quimerista;
  if (classe?.dados_quimerista?.atributo_quimerista) return classe.dados_quimerista.atributo_quimerista;

  const habs = Array.isArray(classe?.habilidades)
    ? classe.habilidades
    : (Array.isArray(ficha?.habilidades) ? ficha.habilidades : []);

  const habImitacao = habs.find((h) => {
    const n = (h?.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return n.includes('imitacao') && n.includes('magica');
  });

  if (habImitacao?.atributo_quimerista) return habImitacao.atributo_quimerista;
  if (habImitacao?.dados_quimerista?.atributo_quimerista) return habImitacao.dados_quimerista.atributo_quimerista;

  if (ficha?.atributo_quimerista) return ficha.atributo_quimerista;
  if (ficha?.dados_quimerista?.atributo_quimerista) return ficha.dados_quimerista.atributo_quimerista;

  return 'AST + VON';
}

/**
 * Atualiza ou insere as magias imitadas e atributo na habilidade "Imitação Mágica" dentro do array de habilidades.
 * Retorna um novo array de habilidades sem mutar o original (função pura).
 * @param {Array<Object>} habilidades
 * @param {Object} dadosQuimerista
 * @returns {Array<Object>}
 */
export function sincronizarQuimeristaNaHabilidade(habilidades = [], dadosQuimerista = {}) {
  const magias = Array.isArray(dadosQuimerista?.magias_imitadas)
    ? dadosQuimerista.magias_imitadas
    : (Array.isArray(dadosQuimerista?.magiasImitadas) ? dadosQuimerista.magiasImitadas : []);
  const atributo = dadosQuimerista?.atributo_quimerista || dadosQuimerista?.atributoEscolhido || 'AST + VON';
  const dados = { magias_imitadas: magias, atributo_quimerista: atributo };

  const base = Array.isArray(habilidades) ? [...habilidades] : [];
  let encontrou = false;

  const atualizadas = base.map((h) => {
    const n = (h?.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (n.includes('imitacao') && n.includes('magica')) {
      encontrou = true;
      return {
        ...h,
        magias_imitadas: magias,
        atributo_quimerista: atributo,
        dados_quimerista: dados
      };
    }
    return h;
  });

  if (!encontrou && magias.length > 0) {
    atualizadas.push({
      nome: 'Imitação Mágica',
      nivel: 1,
      descricao: 'Você pode aprender feitiços de certas espécies de criaturas (feras, monstros, plantas).',
      magias_imitadas: magias,
      atributo_quimerista: atributo,
      dados_quimerista: dados
    });
  }

  return atualizadas;
}
