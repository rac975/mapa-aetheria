import {
  calcularEstatisticasVeiculo,
  aplicarPsicocinesePrecisao
} from '../domain/fabula/technoFantasyRules.js';
import { fichaService } from '../services/fichaService.js';
import {
  aumentarPassoDado,
  extrairStatsArmadura,
  extrairStatsItemDefensivo
} from '../domain/fabula/equipmentRules.js';
import {
  calcularBonusPassivosPoderesHeroicos,
  extrairHeroicAndQuirksDaFicha
} from '../domain/fabula/heroicAndQuirksRules.js';
import {
  ehClasseVirtuoso,
  ehClasseComandante,
  ehClasseDancarino,
  ehClasseSimbolista,
  extrairBeneficioInicialDancarino,
  calcularSinergiasCombateEMagia,
  normalizarTextoHF
} from '../domain/fabula/highFantasyRules.js';
import {
  ehClasseFloralista,
  ehClasseGourmet,
  ehClasseInvocador,
  ehClasseMercador,
  extrairBeneficioInicialFloralista,
  extrairBeneficioInicialInvocador,
  extrairEfeitosAtivosNaturalFantasy
} from '../domain/fabula/naturalFantasyRules.js';
import {
  calcularPassivosCoreClasses,
  calcularBonusGolpeBaixo
} from '../domain/fabula/coreClassRules.js';

/**
 * Realiza os cálculos automáticos de status e defesas para Fabula Ultima
 * @param {Object} atributos { destreza, astucia, vigor, vontade }
 * @param {Array} classes Lista de classes do personagem
 * @param {Array} itensEquipados Lista de itens da tabela itens_personagem que possuem 'slot'
 * @param {Object} [ficha=null] Objeto completo da ficha para acesso a dados_veiculo
 */

export const CONFIG_BONUS_CLASSES = {
  andarilho: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  arcanista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  atirador: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  cantor: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  comandante: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  dancarino: { bonusHp: 0, bonusMp: 0, bonusIp: 0 },
  elementalista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  entropista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  esper: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  floralista: { bonusHp: 0, bonusMp: 0, bonusIp: 0 },
  gourmet: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  "guerreiro sombrio": { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  erudito: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  espiritualista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  furioso: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  guardiao: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  inventor: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  invocador: { bonusHp: 0, bonusMp: 0, bonusIp: 0 },
  ladino: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  mercador: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  "mestre de armas": { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  mutante: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  orador: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  piloto: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  quimerista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  simbolista: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  virtuoso: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
};

export function calcularStatusPersonagem(
  atributos = {},
  classes = [],
  itensEquipados = [],
  ficha = null,
  poderesHeroicosParam = null,
) {
  const nivelTotal =
    classes.reduce((acc, c) => acc + (parseInt(c.nivel) || 0), 0) || 5;

  // Extrai e normaliza Poderes Heróicos e Peculiaridades da ficha
  const dadosHeroicosExtraidos = extrairHeroicAndQuirksDaFicha(
    ficha || (Array.isArray(poderesHeroicosParam) ? { poderes_heroicos: poderesHeroicosParam } : {})
  );
  const listaPoderesHeroicos = Array.isArray(poderesHeroicosParam)
    ? poderesHeroicosParam
    : Array.isArray(atributos?.poderes_heroicos)
      ? atributos.poderes_heroicos
      : dadosHeroicosExtraidos.poderes_heroicos;

  const bonusHeroicos = calcularBonusPassivosPoderesHeroicos(
    listaPoderesHeroicos,
    nivelTotal
  );

  const converterAtributoParaNumero = (valorAttr) => {
    if (!valorAttr) return 8;
    const str = String(valorAttr).trim().toLowerCase();

    if (str.startsWith("d")) {
      const faces = parseInt(str.substring(1), 10);
      return isNaN(faces) ? 8 : faces;
    }

    const num = parseInt(str, 10);
    return isNaN(num) ? 8 : num;
  };

  // Identifica classe Mutante e seus dados de Terioformas (Atlas Tecno-Fantasia)
  const mutanteClass = (classes || []).find((c) => {
    const nome = (c.nome_classe || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    return nome.includes('mutant');
  });

  const habTerio = (mutanteClass?.habilidades || []).find((h) => {
    const nome = (h.nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    return nome.includes('teriomorfose');
  });

  const nvTeriomorfose = parseInt(habTerio?.nivel, 10) || 0;
  const dadosMutante = mutanteClass?.dados_mutante || habTerio?.dados_mutante || ficha?.dados_mutante || {};
  const terioformasAtivas = Array.isArray(dadosMutante.terioformasAtivas) ? dadosMutante.terioformasAtivas : [];

  let des = converterAtributoParaNumero(atributos.destreza);
  let ast = converterAtributoParaNumero(atributos.astucia);
  let vig = converterAtributoParaNumero(atributos.vigor);
  let von = converterAtributoParaNumero(atributos.vontade);

  // Aplica Atributos Aprimorados dos Poderes Heróicos (aumento de passo até d12)
  if (!atributos._jaAplicouHeroicos) {
    const incDes = bonusHeroicos.aumentosAtributo?.destreza || 0;
    const incAst = bonusHeroicos.aumentosAtributo?.astucia || 0;
    const incVig = bonusHeroicos.aumentosAtributo?.vigor || 0;
    const incVon = bonusHeroicos.aumentosAtributo?.vontade || 0;

    for (let i = 0; i < incDes; i++) des = aumentarPassoDado(des, 12);
    for (let i = 0; i < incAst; i++) ast = aumentarPassoDado(ast, 12);
    for (let i = 0; i < incVig; i++) vig = aumentarPassoDado(vig, 12);
    for (let i = 0; i < incVon; i++) von = aumentarPassoDado(von, 12);
  }

  // Aplica Terioformas ativas que aumentam passos de atributo (máximo d12)
  const temTachytheria = terioformasAtivas.includes('tachytheria');
  const temArpaktida = terioformasAtivas.includes('arpaktida');
  const temDynamotheria = terioformasAtivas.includes('dynamotheria');

  if (!atributos._jaAplicouTerioformas) {
    if (temTachytheria) {
      des = aumentarPassoDado(des);
    }
    if (temArpaktida) {
      ast = aumentarPassoDado(ast);
    }
    if (temDynamotheria) {
      vig = aumentarPassoDado(vig);
    }
  }

  // Efeitos ativos das 4 classes do Atlas Fantasia Natural (Magisseeds, Pratos Gourmet, Invocações e Comércio)
  const efeitosNF = extrairEfeitosAtivosNaturalFantasy({
    classes,
    ficha,
    itensEquipados,
    nivelTotal,
    catalogoMagiseeds: fichaService._catalogoFloralistaMagiseedsCache || []
  });

  if (!atributos._jaAplicouNaturalFantasy) {
    const incDesNF = efeitosNF.aumentosAtributoNF?.destreza || 0;
    const incAstNF = efeitosNF.aumentosAtributoNF?.astucia || 0;
    const incVigNF = efeitosNF.aumentosAtributoNF?.vigor || 0;
    const incVonNF = efeitosNF.aumentosAtributoNF?.vontade || 0;

    for (let i = 0; i < incDesNF; i++) des = aumentarPassoDado(des, 12);
    for (let i = 0; i < incAstNF; i++) ast = aumentarPassoDado(ast, 12);
    for (let i = 0; i < incVigNF; i++) vig = aumentarPassoDado(vig, 12);
    for (let i = 0; i < incVonNF; i++) von = aumentarPassoDado(von, 12);
  }

  // Símbolo das Amarras (Simbolista): dado atual não pode exceder o dado básico da ficha
  const sinonimosSinergiasInit = calcularSinergiasCombateEMagia({
    classes,
    ficha,
    itensEquipados,
    nivelTotal
  });
  if (sinonimosSinergiasInit.simbolista.travaAtributosBase && ficha) {
    des = Math.min(des, converterAtributoParaNumero(ficha.destreza));
    ast = Math.min(ast, converterAtributoParaNumero(ficha.astucia));
    vig = Math.min(vig, converterAtributoParaNumero(ficha.vigor));
    von = Math.min(von, converterAtributoParaNumero(ficha.vontade));
  }

  // 1. Acumula os bônus passivos de classe e habilidades de PV
  let bonusHpPorClasse = 0;
  let bonusMpPorClasse = 0;
  let bonusIpPorClasse = 0;

  classes.forEach((c) => {
    const nomeOriginal = c.nome_classe || "";
    const nomeNormalizado = nomeOriginal
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

    const configClasse = CONFIG_BONUS_CLASSES[nomeNormalizado];
    if (configClasse) {
      bonusHpPorClasse += configClasse.bonusHp || 0;
      bonusMpPorClasse += configClasse.bonusMp || 0;
      bonusIpPorClasse += configClasse.bonusIp || 0;
    } else if (ehClasseVirtuoso(nomeOriginal)) {
      bonusMpPorClasse += 5;
    } else if (ehClasseComandante(nomeOriginal)) {
      bonusHpPorClasse += 5;
    }

    // Benefício inicial à escolha do Dançarino (+5 PV ou +5 PM)
    if (ehClasseDancarino(nomeOriginal)) {
      const benDancarino = extrairBeneficioInicialDancarino(c, ficha);
      bonusHpPorClasse += benDancarino.bonusPv;
      bonusMpPorClasse += benDancarino.bonusPm;
    } else if (!configClasse && ehClasseSimbolista(nomeOriginal)) {
      bonusIpPorClasse += 2;
    }

    // Benefícios iniciais do Atlas Fantasia Natural (Floralista, Invocador, Gourmet e Mercador)
    if (ehClasseFloralista(nomeOriginal)) {
      const benFloralista = extrairBeneficioInicialFloralista(c, ficha);
      bonusHpPorClasse += benFloralista.bonusPv;
      bonusMpPorClasse += benFloralista.bonusPm;
    } else if (ehClasseInvocador(nomeOriginal)) {
      const benInvocador = extrairBeneficioInicialInvocador(c, ficha);
      bonusHpPorClasse += benInvocador.bonusPv;
      bonusMpPorClasse += benInvocador.bonusPm;
    } else if (!configClasse && (ehClasseGourmet(nomeOriginal) || ehClasseMercador(nomeOriginal))) {
      bonusIpPorClasse += 2;
    }

    // Soma passiva da habilidade "Fortaleza" do Guardião (NP * 3)
    if (nomeNormalizado.includes("guardiao")) {
      (c.habilidades || []).forEach((h) => {
        const nomeHab = (h.nome || "").toLowerCase();
        const nivelHab = parseInt(h.nivel) || 0;
        if (nomeHab.includes("fortaleza") && nivelHab > 0) {
          bonusHpPorClasse += nivelHab * 3;
        }
      });
    }

    // Soma passiva da habilidade "Concentrado" do Erudito (NP * 3 em PM)
    if (nomeNormalizado.includes("erudito")) {
      (c.habilidades || []).forEach((h) => {
        const nomeHab = (h.nome || "").toLowerCase();
        const nivelHab = parseInt(h.nivel) || 0;
        if (nomeHab.includes("concentrado") && nivelHab > 0) {
          bonusMpPorClasse += nivelHab * 3;
        }
      });
    }
  });

  // (Cole logo após o fechamento do classes.forEach na função calcularStatusPersonagem)
  // console.log("[DEBUG CÁLCULO HP]", {
  //   nivelTotal,
  //   vigor: vig,
  //   multiplicadorVigor: vig * 5,
  //   classesLidas: classes.map((c) => ({ nome: c.nome_classe, nivel: c.nivel })),
  //   bonusHpPorClasse,
  //   pvMaxCalculadoFinal: vig * 5 + nivelTotal + bonusHpPorClasse,
  // });

  const pvMax = vig * 5 + nivelTotal + bonusHpPorClasse + (bonusHeroicos.bonusPvMax || 0);
  const mpMax = von * 5 + nivelTotal + bonusMpPorClasse + (bonusHeroicos.bonusPmMax || 0);
  const piMax = 6 + bonusIpPorClasse + (bonusHeroicos.bonusPiMax || 0);

  // 2. Identificar itens nos slots equipados
  const itemMaoDom = itensEquipados.find(
    (i) => i.stats_personalizados?.slot === "mao_dominante",
  );
  const itemMaoSec = itensEquipados.find(
    (i) => i.stats_personalizados?.slot === "mao_secundaria",
  );
  const itemArmadura = itensEquipados.find(
    (i) => i.stats_personalizados?.slot === "armadura",
  );
  const itemAcessorio = itensEquipados.find(
    (i) => i.stats_personalizados?.slot === "acessorio",
  );

  // Verificações de equipamentos (Escudos e Armaduras Marciais)
  const ehEscudoItem = (item) => {
    if (!item) return false;
    const tipo = (item.tipo || "").toLowerCase();
    const stats = item.stats_personalizados || {};
    return tipo.includes("escudo") || stats.escudo === true;
  };

  const temEscudoEquipado =
    ehEscudoItem(itemMaoDom) || ehEscudoItem(itemMaoSec);
  const temDoisEscudos = ehEscudoItem(itemMaoDom) && ehEscudoItem(itemMaoSec);

  const statsArmadura = extrairStatsArmadura(itemArmadura, des);
  const temArmaduraMarcial = statsArmadura.ehMarcial;

  // 3. Cálculo de Defesa Física
  // Regra Oficial Fabula Ultima:
  // Armadura Marcial define a Defesa Base como valor fixo (ex: 10, 11, etc.), substituindo DES.
  // Armadura Leve mantém a Defesa Base igual a DES e soma o bônus fixo da armadura (+1, +2, etc.).
  let defesaBase = statsArmadura.defesaBase;
  let bonusDefesaItens = statsArmadura.bonusDefesaArmadura;

  [itemMaoDom, itemMaoSec, itemAcessorio].forEach((item) => {
    if (item) {
      const statsDef = extrairStatsItemDefensivo(item);
      bonusDefesaItens += statsDef.bonusDef;
    }
  });

  // 🛡️ VERIFICAÇÃO DA HABILIDADE "ESQUIVA" DO LADINO
  let bonusEsquivaLadino = 0;
  if (!temEscudoEquipado && !temArmaduraMarcial) {
    classes.forEach((c) => {
      const nomeNormalizado = (c.nome_classe || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

      if (nomeNormalizado.includes("ladino")) {
        (c.habilidades || []).forEach((h) => {
          const nomeHab = (h.nome || "").toLowerCase();
          const nivelHab = parseInt(h.nivel) || 0;
          if (nomeHab.includes("esquiva") && nivelHab > 0) {
            bonusEsquivaLadino += nivelHab;
          }
        });
      }
    });
  }

  let defesaTotal = defesaBase + bonusDefesaItens + bonusEsquivaLadino;

  // 🛡️ VERIFICAÇÃO DE "MAESTRIA DEFENSIVA" DO GUARDIÃO E PODER HERÓICO "BASTIÃO INABALÁVEL" (Redução de Dano)
  let reducaoDano = 0;
  if (temEscudoEquipado || temArmaduraMarcial) {
    classes.forEach((c) => {
      (c.habilidades || []).forEach((h) => {
        const nomeHab = (h.nome || "").toLowerCase();
        const nivelHab = parseInt(h.nivel) || 0;
        if (nomeHab.includes("maestria defensiva") && nivelHab > 0) {
          reducaoDano += nivelHab;
        }
      });
    });
    reducaoDano += bonusHeroicos.reducaoDanoExtraEscudoOuMarcial || 0;
  }

  // 4. Cálculo de Defesa Mágica (MDef)
  // Base é o dado de Astúcia + bônus de armaduras, escudos e acessórios
  let mdefBase = ast;
  let bonusMDefItens = statsArmadura.bonusMDefArmadura;

  [itemMaoDom, itemMaoSec, itemAcessorio].forEach((item) => {
    if (item) {
      const statsDef = extrairStatsItemDefensivo(item);
      bonusMDefItens += statsDef.bonusMDef;
    }
  });

  let mdefTotal = mdefBase + bonusMDefItens;

  // 5. Cálculo de Iniciativa Base (+ bônus de Poderes Heróicos como Alta Velocidade + penalidades de equipamentos)
  let iniciativaTotal = (bonusHeroicos.bonusIniciativa || 0) + statsArmadura.penalidadeIniciativa;
  [itemMaoDom, itemMaoSec, itemAcessorio].forEach((item) => {
    if (item) {
      const statsDef = extrairStatsItemDefensivo(item);
      iniciativaTotal += statsDef.modIni;
    }
  });

  // 6. Integração com Veículo Pessoal do Piloto (Atlas Tecno-Fantasia)
  // Quando o Piloto estiver embarcado/ativo no veículo, soma ou aplica os valores dos módulos ativos
  const pilotoClass = (classes || []).find((c) => {
    const nome = (c.nome_classe || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    return nome.includes('pilot');
  });

  const habVeiculo = (pilotoClass?.habilidades || []).find((h) => {
    const nome = (h.nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    return nome.includes('veiculo');
  });

  const dadosVeiculo = ficha?.dados_veiculo || pilotoClass?.veiculo || habVeiculo?.veiculo || null;
  const veiculoAtivo = !!(dadosVeiculo && typeof dadosVeiculo === 'object' && dadosVeiculo.veiculoInvocado !== false);

  let precisaoBonus = 0;
  let dadosVeiculoInfo = null;

  if (veiculoAtivo) {
    const slVeiculo = Math.max(1, parseInt(habVeiculo?.nivel, 10) || 1);
    const statsVeiculo = calcularEstatisticasVeiculo(
      dadosVeiculo.frameKey || 'exoesqueleto',
      Array.isArray(dadosVeiculo.modulosAtivos) ? dadosVeiculo.modulosAtivos : [],
      { des, int: ast, vig, von },
      slVeiculo,
      dadosVeiculo.customizacoes || {},
      fichaService._catalogoVeiculosEstruturasCache || [],
      fichaService._catalogoVeiculosModulosCache || []
    );

    // Se o veículo tiver módulo de blindagem ativa, substitui as defesas base pelas do veículo
    if (statsVeiculo.armaduraAtiva) {
      defesaBase = Number(statsVeiculo.defesaBase) || (Number(des) || 8);
      mdefBase = Number(statsVeiculo.mdefBase) || (Number(ast) || 8);
    } else if (statsVeiculo.frameAtual) {
      defesaBase = Math.max(Number(defesaBase) || 0, Number(statsVeiculo.frameAtual.defesa_base) || (Number(des) || 8));
      mdefBase = Math.max(Number(mdefBase) || 0, Number(statsVeiculo.frameAtual.mdef_base) || (Number(ast) || 8));
    }

    // Soma bônus estruturais e de módulos (ex: Módulo de Escudo +2 DEF, +2 MDEF, Mecha +1 DEF)
    const defVeiculoTotal = Number(statsVeiculo.defesaTotal) || 0;
    const defVeiculoBase = Number(statsVeiculo.defesaBase) || 0;
    const bonusDefVeiculo = Math.max(0, defVeiculoTotal - defVeiculoBase);

    const mdefVeiculoTotal = Number(statsVeiculo.mdefTotal) || 0;
    const mdefVeiculoBase = Number(statsVeiculo.mdefBase) || 0;
    const bonusMdefVeiculo = Math.max(0, mdefVeiculoTotal - mdefVeiculoBase);

    bonusDefesaItens = (Number(bonusDefesaItens) || 0) + bonusDefVeiculo;
    bonusMDefItens = (Number(bonusMDefItens) || 0) + bonusMdefVeiculo;

    // Modificador de Iniciativa do veículo (Mecha -2, Corcel +4, Módulo de Velocidade +2)
    iniciativaTotal = (Number(iniciativaTotal) || 0) + (Number(statsVeiculo.iniciativaBonus) || 0);

    // Bônus de Precisão concedido por módulos (ex: Módulo de Mira Avançada +2)
    precisaoBonus = Number(statsVeiculo.precisaoBonus) || 0;

    dadosVeiculoInfo = {
      nome: dadosVeiculo.nome || 'Veículo Pessoal',
      frameKey: dadosVeiculo.frameKey || 'exoesqueleto',
      armaduraAtiva: statsVeiculo.armaduraAtiva?.nome || null,
      defesaVeiculo: Number(statsVeiculo.defesaTotal) || 0,
      mdefVeiculo: Number(statsVeiculo.mdefTotal) || 0,
      iniciativaBonus: Number(statsVeiculo.iniciativaBonus) || 0,
      precisaoBonus,
      armasInstaladas: statsVeiculo.armasInstaladas || []
    };
  }

  defesaTotal = (Number(defesaBase) || 0) + (Number(bonusDefesaItens) || 0) + (Number(bonusEsquivaLadino) || 0);

  // Bônus condicionais de Poderes Heróicos em Defesa / Defesa Mágica
  const ehArmaItem = (item) => {
    if (!item) return false;
    const t = (item.tipo || '').toLowerCase();
    return t.includes('arma') && !ehEscudoItem(item);
  };
  const ehAdagaCorpoACorpo = (item) => {
    if (!item) return false;
    const cat = ((item.stats_personalizados?.categoria || item.tipo || '')).toLowerCase();
    const alc = (item.stats_personalizados?.alcance || '').toLowerCase();
    return cat.includes('adaga') && !alc.includes('distancia') && !alc.includes('distância');
  };
  const temHoplita = listaPoderesHeroicos.some((p) => normalizarTextoHF(typeof p === 'string' ? p : p?.key || p?.nome) === 'hoplita');
  const temAdeptoLaminas = listaPoderesHeroicos.some((p) => normalizarTextoHF(typeof p === 'string' ? p : p?.key || p?.nome) === 'adepto_das_laminas' || normalizarTextoHF(typeof p === 'string' ? p : p?.nome) === 'adepto das laminas');
  const temAmbidestria = listaPoderesHeroicos.some((p) => normalizarTextoHF(typeof p === 'string' ? p : p?.key || p?.nome) === 'ambidestria');

  if (temHoplita && ehArmaItem(itemMaoDom) && ehEscudoItem(itemMaoSec)) {
    defesaTotal += 1;
  }
  if (temAmbidestria && ehArmaItem(itemMaoDom) && ehArmaItem(itemMaoSec)) {
    defesaTotal += 2;
  }
  if (temAdeptoLaminas && (ehAdagaCorpoACorpo(itemMaoDom) || ehAdagaCorpoACorpo(itemMaoSec))) {
    defesaTotal += 1;
    bonusMDefItens += 1;
  }

  // 8. Integração com Terioformas e Habilidades do Mutante (Atlas Tecno-Fantasia)
  // Placófora: trata Defesa como 13 + [metade do nível de Teriomorfose] se for superior à normal
  const temPlacophora = terioformasAtivas.includes('placophora');
  let defPlacophora = null;
  if (temPlacophora) {
    defPlacophora = 13 + Math.floor(nvTeriomorfose / 2);
    if (defPlacophora > defesaTotal) {
      defesaTotal = defPlacophora;
    }
  }

  // Resistências ativas (Écdise do Mutante, Danças Elementais, Símbolo da Proteção, Sangue das Trevas)
  const resistenciasAtivas = [];
  if (dadosMutante.resistenciaEcdise) {
    resistenciasAtivas.push({
      tipo: dadosMutante.resistenciaEcdise,
      fonte: 'Écdise'
    });
  }

  const pvAtualNum = Number(ficha?.hp_atual ?? pvMax);
  const emCriseCalculado = pvAtualNum > 0 && pvAtualNum <= Math.floor(pvMax / 2);
  const sinergias = calcularSinergiasCombateEMagia({
    classes,
    ficha,
    itensEquipados,
    nivelTotal,
    emCrise: emCriseCalculado
  });

  // Dança Elemental ativa (Dançarino)
  const MAPA_DANCA_RESISTENCIA = {
    danca_anjo: 'luz',
    danca_fenix: 'fogo',
    danca_golem: 'raio',
    danca_grifo: 'ar',
    danca_ieti: 'gelo',
    danca_mirmidao: 'terra',
    danca_morcego: 'trevas'
  };
  const dancaAtivaKey = normalizarTextoHF(sinergias.dancaAtivaTurno?.key || '');
  if (MAPA_DANCA_RESISTENCIA[dancaAtivaKey]) {
    resistenciasAtivas.push({
      tipo: MAPA_DANCA_RESISTENCIA[dancaAtivaKey],
      fonte: sinergias.dancaAtivaTurno?.nome || 'Dança'
    });
  }

  // Símbolos da Proteção aplicados em si mesmo (Simbolista)
  if (sinergias.simbolista.resistencias.length > 0) {
    sinergias.simbolista.resistencias.forEach((r) => resistenciasAtivas.push(r));
  }

  // Resistências concedidas pelo Atlas Fantasia Natural (Magissementes, Iguarias e Manancial Interior)
  if (Array.isArray(efeitosNF.resistenciasNF) && efeitosNF.resistenciasNF.length > 0) {
    efeitosNF.resistenciasNF.forEach((r) => resistenciasAtivas.push(r));
  }

  // Sangue das Trevas em Crise (Guerreiro Sombrio)
  const temSangueTrevas = emCriseCalculado && classes.some((c) =>
    (c.habilidades || []).some((h) => normalizarTextoHF(h?.nome).includes('sangue das trevas') && (parseInt(h.nivel, 10) || 0) > 0)
  );
  if (temSangueTrevas) {
    resistenciasAtivas.push({ tipo: 'trevas', fonte: 'Sangue das Trevas' });
    resistenciasAtivas.push({ tipo: 'veneno', fonte: 'Sangue das Trevas' });
  }

  // Barreira Sonora do Virtuoso (redução de dano físico)
  const virtClass = (classes || []).find((c) => ehClasseVirtuoso(c?.nome_classe));
  const habMagicanto = (virtClass?.habilidades || []).find((h) => normalizarTextoHF(h?.nome).includes('magicanto'));
  const ultimoVersoResumo = virtClass?.dados_virtuoso?.ultimoVersoResumo || habMagicanto?.dados_virtuoso?.ultimoVersoResumo || ficha?.dados_virtuoso?.ultimoVersoResumo;
  const barreiraAtiva = Boolean(
    sinergias.nvBarreiraSonora > 0 &&
    ultimoVersoResumo?.titulo &&
    (normalizarTextoHF(ultimoVersoResumo.titulo).includes('medio') || normalizarTextoHF(ultimoVersoResumo.titulo).includes('forte'))
  );
  if (barreiraAtiva) {
    reducaoDano += sinergias.nvBarreiraSonora;
  }

  // Resumo discriminado das Terioformas ativas para exibição de Badges
  const catalogoTerioformasCache = fichaService._catalogoTerioformasCache || [];
  const terioformasAtivasDetalhes = terioformasAtivas.map(chave => {
    const itemCatalogo = catalogoTerioformasCache.find(t => t.key === chave);
    let resumoEfeito = '';
    if (chave === 'placophora') resumoEfeito = `DEF ${13 + Math.floor(nvTeriomorfose / 2)}`;
    else if (chave === 'dynamotheria') resumoEfeito = '+1 Passo VIG';
    else if (chave === 'tachytheria') resumoEfeito = '+1 Passo DES';
    else if (chave === 'arpaktida') resumoEfeito = '+1 Passo AST (+5 Dano Crise)';
    else if (chave === 'polypoda') resumoEfeito = 'Multi (3) Desarmado';
    else if (chave === 'electrophora') resumoEfeito = 'Dano Raio (Lento)';
    else if (chave === 'pyrophora') resumoEfeito = 'Dano Fogo (Confuso)';
    else if (chave === 'pneumophora') resumoEfeito = 'Dano Ar (Fraco)';
    else if (chave === 'toxicophora') resumoEfeito = 'Dano Veneno (Envenenado)';
    else if (chave === 'pterotheria') resumoEfeito = 'Voando';
    else if (chave === 'amphibia') resumoEfeito = 'Aquático (+5 Cura)';
    else if (chave === 'neurophagoida') resumoEfeito = 'Biofagia PM';

    return {
      key: chave,
      nome: itemCatalogo?.nome?.split('(')[0]?.trim() || chave,
      nomeCompleto: itemCatalogo?.nome || chave,
      resumoEfeito
    };
  });

  mdefTotal = (Number(mdefBase) || 0) + (Number(bonusMDefItens) || 0);
  iniciativaTotal = Number(iniciativaTotal) || 0;
  precisaoBonus = Number(precisaoBonus) || 0;

  // 7. Verificação de Proficiências Concedidas por Classes (ex: Piloto, Comandante, Mestre de Armas)
  const temProficienciaArmasMarciais = classes.some((c) => {
    const nomeNorm = (c.nome_classe || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
    const ben = (c.beneficios || "").toLowerCase();
    return (
      ehClasseComandante(c.nome_classe) ||
      nomeNorm.includes("piloto") ||
      nomeNorm.includes("mestre de armas") ||
      nomeNorm.includes("atirador") ||
      ben.includes("marciais") ||
      ben.includes("marcial")
    );
  });

  return {
    nivelTotal: Number(nivelTotal) || 1,
    pvMax: Number(pvMax) || 10,
    mpMax: Number(mpMax) || 10,
    piMax: Number(piMax) || 6,
    defesaTotal: Number(defesaTotal) || 0,
    mdefTotal: Number(mdefTotal) || 0,
    iniciativaTotal: Number(iniciativaTotal) || 0,
    precisaoBonus: Number(precisaoBonus) || 0,
    reducaoDano: Number(reducaoDano) || 0,
    reducaoCustoPi: Number(bonusHeroicos.reducaoCustoPi) || 0,
    atributosCalculados: {
      destreza: des,
      astucia: ast,
      vigor: vig,
      vontade: von
    },
    bonusHeroicos,
    poderesHeroicosAtivos: dadosHeroicosExtraidos.poderes_heroicos,
    peculiaridadeAtiva: dadosHeroicosExtraidos.peculiaridade,
    temDoisEscudos,
    temArmaduraMarcial,
    temProficienciaArmasMarciais,
    veiculoAtivo,
    dadosVeiculo: dadosVeiculoInfo,
    mutanteAtivo: !!mutanteClass,
    nvTeriomorfose,
    terioformasAtivas,
    terioformasAtivasDetalhes,
    resistenciasAtivas,
    imunidadesCondicaoAtivas: efeitosNF.imunidadesCondicaoNF || [],
    naturalFantasy: efeitosNF,
    corePassivos: calcularPassivosCoreClasses({
      classes,
      ficha,
      itensEquipados,
      emCrise: emCriseCalculado
    }),
    defesaPlacophoraAtiva: temPlacophora ? defPlacophora : null,
    dadosMutante,
    sinergias: {
      ...sinergias,
      naturalFantasy: efeitosNF
    }
  };
}

export function rolarAtaqueEDanoArma(
  itemArma,
  atributosAtuais,
  isMulti = false,
  classes = [],
  itensEquipados = [],
  opcoesDanoExtra = {},
  emCriseGlobal = false,
) {
  const stats = itemArma.stats_personalizados || {};
  const tipoItem = (itemArma.tipo || "").toLowerCase();
  const categoriaArma = (
    stats.categoria ||
    stats.alcance ||
    tipoItem
  ).toLowerCase();

  const nomeArmaLower = (itemArma.nome || "").toLowerCase();

  const ehDistancia =
    categoriaArma.includes("distancia") ||
    categoriaArma.includes("distância") ||
    categoriaArma.includes("arco") ||
    categoriaArma.includes("fogo") ||
    categoriaArma.includes("arremesso");

  const ehCorpoACorpo = !ehDistancia;

  const ehEscudo = tipoItem.includes("escudo") || stats.escudo === true;
  const temDuploEscudeiro = classes.some((c) =>
    (c.habilidades || []).some(
      (h) =>
        (h.nome || "").toLowerCase().includes("duplo escudeiro") &&
        (parseInt(h.nivel) || 0) > 0,
    ),
  );

  const qtdEscudos = itensEquipados.filter(
    (i) =>
      (i.tipo || "").toLowerCase().includes("escudo") ||
      i.stats_personalizados?.escudo === true,
  ).length;
  const ehEscudosGemeos =
    ehEscudo &&
    temDuploEscudeiro &&
    (itensEquipados.length === 0 || qtdEscudos >= 2);

  let bonusMaestriaCorpo = 0;
  let bonusMaestriaDistancia = 0;
  let bonusGolpeDasSombrasExtra = 0;
  let nivelAdrenalinaFurioso = 0;
  let temFrenesiFurioso = false;

  classes.forEach((c) => {
    const nomeClasseNorm = (c.nome_classe || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    (c.habilidades || []).forEach((h) => {
      const nomeHab = (h.nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const nivelHab = parseInt(h.nivel) || 0;

      if (nivelHab > 0) {
        if (
          nomeHab.includes("maestria com armas corpo a corpo") &&
          ehCorpoACorpo
        )
          bonusMaestriaCorpo += nivelHab;
        if (
          nomeHab.includes("maestria com armas a distancia") &&
          ehDistancia
        )
          bonusMaestriaDistancia += nivelHab;

        if (
          nomeHab.includes("golpe das sombras") &&
          nomeClasseNorm.includes("guerreiro sombrio")
        ) {
          bonusGolpeDasSombrasExtra += nivelHab;
        }

        if (
          nomeHab.includes("adrenalina") &&
          nomeClasseNorm.includes("furioso")
        ) {
          nivelAdrenalinaFurioso += nivelHab;
        }
        if (nomeHab.includes("frenesi") && nomeClasseNorm.includes("furioso")) {
          temFrenesiFurioso = true;
        }
      }
    });
  });

  const bonusPrecisaoClasse =
    ehEscudosGemeos || ehCorpoACorpo
      ? bonusMaestriaCorpo
      : bonusMaestriaDistancia;

  let bonusPrecisaoArma = parseInt(stats.precisao || stats.acerto || 0) || 0;
  const formulaPrecisao = String(stats.precisao || "").toUpperCase();

  let attr1Nome = ehEscudosGemeos ? "vigor" : stats.attr1 || "destreza";
  let attr2Nome = ehEscudosGemeos ? "vigor" : stats.attr2 || "astucia";

  if (formulaPrecisao) {
    const mapaAtributos = {
      DEX: "destreza",
      DES: "destreza",
      INS: "astucia",
      AST: "astucia",
      INT: "astucia",
      MIG: "vigor",
      VIG: "vigor",
      WLP: "vontade",
      VON: "vontade",
    };
    const matchAtributos = formulaPrecisao.match(
      /[([【]([A-Z]{3})\s*\+\s*([A-Z]{3})[)\]】]/,
    );
    if (matchAtributos) {
      if (mapaAtributos[matchAtributos[1]])
        attr1Nome = mapaAtributos[matchAtributos[1]];
      if (mapaAtributos[matchAtributos[2]])
        attr2Nome = mapaAtributos[matchAtributos[2]];
    }
    const partes = formulaPrecisao.split(/[)\]】]/);
    if (partes.length > 1) {
      const matchBonus = partes[1].match(/\+\s*(\d+)/);
      if (matchBonus) bonusPrecisaoArma = Math.max(bonusPrecisaoArma, parseInt(matchBonus[1], 10) || 0);
    }
  }

  const bonusPrecisaoSinergia = parseInt(opcoesDanoExtra?.bonusPrecisaoExtra, 10) || 0;
  const bonusPrecisaoTotal = bonusPrecisaoClasse + bonusPrecisaoArma + bonusPrecisaoSinergia;

  const extrairFaces = (valorAttr) => {
    if (!valorAttr) return 8;
    const str = String(valorAttr).trim().toLowerCase();
    if (str.startsWith("d")) {
      const faces = parseInt(str.substring(1), 10);
      return isNaN(faces) ? 8 : faces;
    }
    const num = parseInt(str, 10);
    return isNaN(num) ? 8 : num;
  };

  let faces1 = extrairFaces(atributosAtuais[attr1Nome]);
  let faces2 = extrairFaces(atributosAtuais[attr2Nome]);

  if (opcoesDanoExtra?.usarPsicocinese) {
    const facesVon = extrairFaces(
      atributosAtuais.vontade || atributosAtuais.von || atributosAtuais.wlp
    );
    const modPsico = aplicarPsicocinesePrecisao({
      attr1Nome,
      attr2Nome,
      faces1,
      faces2,
      facesVon
    });
    attr1Nome = modPsico.attr1Nome;
    attr2Nome = modPsico.attr2Nome;
    faces1 = modPsico.faces1;
    faces2 = modPsico.faces2;
  }

  if (opcoesDanoExtra?.usarConhecimentoEPoder) {
    const facesAst = extrairFaces(atributosAtuais.astucia || atributosAtuais.ast || 8);
    if (attr1Nome !== "astucia" && (attr2Nome === "astucia" || faces1 <= faces2)) {
      attr1Nome = "astucia";
      faces1 = facesAst;
    } else {
      attr2Nome = "astucia";
      faces2 = facesAst;
    }
  }

  const res1 = Math.floor(Math.random() * faces1) + 1;
  const res2 = Math.floor(Math.random() * faces2) + 1;
  const testeAtaque = res1 + res2 + bonusPrecisaoTotal;

  const dadoMaisAlto = Math.max(res1, res2);

  let statusCritico = null;
  if (res1 === 1 && res2 === 1) {
    statusCritico = "Erro Crítico (Fumble)";
  } else if (res1 === res2) {
    if (res1 >= 6) {
      statusCritico = "Sucesso Crítico!";
    } else if (opcoesDanoExtra?.criticoExpandido) {
      statusCritico = "Sucesso Crítico (Trilha Épica)!";
    } else if (
      temFrenesiFurioso &&
      (categoriaArma.includes("adaga") ||
        categoriaArma.includes("luta") ||
        categoriaArma.includes("malho") ||
        categoriaArma.includes("arremesso") ||
        nomeArmaLower.includes("adaga") ||
        nomeArmaLower.includes("malho") ||
        nomeArmaLower.includes("soqueira") ||
        nomeArmaLower.includes("luta"))
    ) {
      statusCritico = "Sucesso Crítico (Frenesi)!";
    }
  }

  const extrairBonusDano = (valorBruto) => {
    if (valorBruto === undefined || valorBruto === null) return 0;
    if (typeof valorBruto === "number") return valorBruto;
    const str = String(valorBruto).trim();
    if (str.includes("+")) {
      const partes = str.split("+");
      const num = parseInt(partes[partes.length - 1].trim(), 10);
      return isNaN(num) ? 0 : num;
    }
    const numDireto = parseInt(str, 10);
    return isNaN(numDireto) ? 0 : numDireto;
  };

  let bonusOriginal = 0;
  if (ehEscudosGemeos) {
    let bonusMaestriaDefensiva = 0;
    classes.forEach((c) => {
      (c.habilidades || []).forEach((h) => {
        const nomeHab = (h.nome || "").toLowerCase();
        const nivelHab = parseInt(h.nivel) || 0;
        if (nomeHab.includes("maestria defensiva") && nivelHab > 0) {
          bonusMaestriaDefensiva += nivelHab;
        }
      });
    });
    bonusOriginal = 5 + bonusMaestriaDefensiva;
  } else {
    const valorDanoBruto =
      stats.dano_fixo !== undefined
        ? stats.dano_fixo
        : stats.dano !== undefined
        ? stats.dano
        : stats.bonus_dano !== undefined
        ? stats.bonus_dano
        : 0;
    bonusOriginal = extrairBonusDano(valorDanoBruto);
  }

  let danoExtraHabilidade = 0;
  if (opcoesDanoExtra.usandoGolpeDasSombras) {
    const valorDadoVigorRolado = opcoesDanoExtra.resultadoVigorRolado || 0;
    danoExtraHabilidade += valorDadoVigorRolado + bonusGolpeDasSombrasExtra;
  }

  let danoAdrenalinaFurioso = 0;
  if (emCriseGlobal && nivelAdrenalinaFurioso > 0) {
    danoAdrenalinaFurioso = nivelAdrenalinaFurioso * 2;
  }

  const ehCategoriaDancarinoGuerra =
    categoriaArma.includes("adaga") ||
    categoriaArma.includes("luta") ||
    categoriaArma.includes("malho") ||
    categoriaArma.includes("arremesso") ||
    nomeArmaLower.includes("adaga") ||
    nomeArmaLower.includes("malho") ||
    nomeArmaLower.includes("soqueira") ||
    nomeArmaLower.includes("luta");

  const sinergiasArma = calcularSinergiasCombateEMagia({
    classes,
    itensEquipados,
    emCrise: emCriseGlobal
  });

  const efeitosNFArma = extrairEfeitosAtivosNaturalFantasy({
    classes,
    itensEquipados,
    catalogoMagiseeds: fichaService._catalogoFloralistaMagiseedsCache || []
  });

  const danoDancarinoGuerra = ehCategoriaDancarinoGuerra ? sinergiasArma.bonusDanoDancarinoGuerra : 0;
  const danoDecretoBispo = sinergiasArma.bonusDanoDecreto;
  const danoBeladona = efeitosNFArma.floralista?.bonusDanoVenenoBeladona || 0;
  const corePassivosArma = calcularPassivosCoreClasses({
    classes,
    itensEquipados,
    emCrise: emCriseGlobal
  });
  const danoGolpeBaixo = calcularBonusGolpeBaixo(
    corePassivosArma.nvGolpeBaixo,
    opcoesDanoExtra?.condicoesAlvo || opcoesDanoExtra?.qtdCondicoesAlvo || 0,
    !isMulti
  );
  const danoSinergiaExtra = (parseInt(opcoesDanoExtra?.bonusDanoExtra, 10) || 0) + danoBeladona + danoGolpeBaixo;

  const bonusDanoFixo = (isMulti ? 0 : bonusOriginal) +
    danoExtraHabilidade +
    danoAdrenalinaFurioso +
    danoDancarinoGuerra +
    danoDecretoBispo +
    danoSinergiaExtra;
  const danoTotal = dadoMaisAlto + bonusDanoFixo;

  return {
    nomeArma: ehEscudosGemeos ? "Escudos Gêmeos" : itemArma.nome,
    attr1: `${attr1Nome.toUpperCase()} (d${faces1})`,
    res1,
    attr2: `${attr2Nome.toUpperCase()} (d${faces2})`,
    res2,
    bonusPrecisaoTotal,
    testeAtaque,
    statusCritico,
    dadoMaisAlto,
    bonusDanoFixo,
    danoTotal,
    isMulti,
    danoExtraHabilidade,
    danoAdrenalinaFurioso,
    danoDancarinoGuerra,
    danoDecretoBispo,
    danoSinergiaExtra,
    tipoDano: opcoesDanoExtra?.tipoDanoOverride || efeitosNFArma.conversaoDanoAtiva || stats.tipo_dano || 'fisico',
    multiplo: stats.multiplo || null,
    usandoPsicocinese: !!opcoesDanoExtra?.usarPsicocinese,
    usandoConhecimentoEPoder: !!opcoesDanoExtra?.usarConhecimentoEPoder
  };
}