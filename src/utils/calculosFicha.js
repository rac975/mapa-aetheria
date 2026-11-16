/**
 * Realiza os cálculos automáticos de status e defesas para Fabula Ultima
 * @param {Object} atributos { destreza, astucia, vigor, vontade }
 * @param {Array} classes Lista de classes do personagem
 * @param {Array} itensEquipados Lista de itens da tabela itens_personagem que possuem 'slot'
 */

const CONFIG_BONUS_CLASSES = {
  andarilho: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  arcanista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  atirador: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  elementalista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  entropista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  "guerreiro sombrio": { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  erudito: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  espiritualista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  furioso: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  guardiao: { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  inventor: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  ladino: { bonusHp: 0, bonusMp: 0, bonusIp: 2 },
  "mestre de armas": { bonusHp: 5, bonusMp: 0, bonusIp: 0 },
  orador: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
  quimerista: { bonusHp: 0, bonusMp: 5, bonusIp: 0 },
};

export function calcularStatusPersonagem(
  atributos = {},
  classes = [],
  itensEquipados = [],
) {
  const nivelTotal =
    classes.reduce((acc, c) => acc + (parseInt(c.nivel) || 0), 0) || 5;

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

  const des = converterAtributoParaNumero(atributos.destreza);
  const ast = converterAtributoParaNumero(atributos.astucia);
  const vig = converterAtributoParaNumero(atributos.vigor);
  const von = converterAtributoParaNumero(atributos.vontade);

  const mapaAtributos = {
    des,
    destreza: des,
    ast,
    astucia: ast,
    vig,
    vigor: vig,
    von,
    vontade: von,
  };

  const resolverExpressao = (valorBruto) => {
    if (typeof valorBruto === "number") return valorBruto;
    if (!valorBruto) return 0;

    let str = String(valorBruto).trim().toLowerCase();
    str = str.replace(/dado de /g, "").replace(/dado /g, "");

    Object.keys(mapaAtributos).forEach((sigla) => {
      const regex = new RegExp(`\\b${sigla}\\b`, "g");
      str = str.replace(regex, mapaAtributos[sigla]);
    });

    try {
      const resultado = eval(str);
      return isNaN(resultado) ? 0 : parseInt(resultado, 10);
    } catch {
      return 0;
    }
  };

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

  const pvMax = vig * 5 + nivelTotal + bonusHpPorClasse;
  const mpMax = von * 5 + nivelTotal + bonusMpPorClasse;
  const piMax = 6 + bonusIpPorClasse;

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

  const temArmaduraMarcial = (() => {
    if (!itemArmadura) return false;
    const stats = itemArmadura.stats_personalizados || {};
    const tipo = (itemArmadura.tipo || "").toLowerCase();
    return stats.marcial === true || tipo.includes("marcial");
  })();

  // 3. Cálculo de Defesa Física
  let defesaBase = des;
  let bonusDefesaItens = 0;

  if (itemArmadura) {
    const statsArm = itemArmadura.stats_personalizados || {};
    const defArmaduraBruta = statsArm.defesa || statsArm.def || 0;
    const defCalculada = resolverExpressao(defArmaduraBruta);
    if (defCalculada > 0) {
      defesaBase = defCalculada;
    }
  }

  [itemMaoDom, itemMaoSec, itemAcessorio].forEach((item) => {
    if (item) {
      const stats = item.stats_personalizados || {};
      const defBruta = stats.defesa || stats.def || 0;
      bonusDefesaItens += resolverExpressao(defBruta);
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

  const defesaTotal = defesaBase + bonusDefesaItens + bonusEsquivaLadino;

  // 🛡️ VERIFICAÇÃO DE "MAESTRIA DEFENSIVA" DO GUARDIÃO (Redução de Dano)
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
  }

  // 4. Cálculo de Defesa Mágica (MDef)
  let mdefBase = ast;
  let bonusMDefItens = 0;

  [itemArmadura, itemMaoSec, itemMaoDom, itemAcessorio].forEach((item) => {
    if (item) {
      const stats = item.stats_personalizados || {};
      const mdefBruta =
        stats["defesa magica"] ||
        stats["defesa mágica"] ||
        stats.mdefesa ||
        stats.mdef ||
        stats.defesa_magica ||
        0;

      const mdefCalculada = resolverExpressao(mdefBruta);

      if (
        typeof mdefBruta === "string" &&
        mdefBruta.toLowerCase().includes("base")
      ) {
        mdefBase = Math.max(mdefBase, mdefCalculada);
      } else {
        bonusMDefItens += mdefCalculada;
      }
    }
  });

  const mdefTotal = mdefBase + bonusMDefItens;

  // 5. Cálculo de Iniciativa
  let iniciativaTotal = 0;
  [itemArmadura, itemMaoSec, itemMaoDom, itemAcessorio].forEach((item) => {
    if (item) {
      const stats = item.stats_personalizados || {};
      const iniBruta = stats.iniciativa || stats.ini || stats.Iniciativa || 0;
      iniciativaTotal += parseInt(iniBruta) || 0;
    }
  });

  return {
    nivelTotal,
    pvMax,
    mpMax,
    piMax,
    defesaTotal,
    mdefTotal,
    iniciativaTotal,
    reducaoDano,
    temDoisEscudos,
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
      INS: "intuicao",
      MIG: "vigor",
      WLP: "vontade",
      AST: "astucia",
    };
    const matchAtributos = formulaPrecisao.match(
      /\(([A-Z]{3})\s*\+\s*([A-Z]{3})\)/,
    );
    if (matchAtributos) {
      if (mapaAtributos[matchAtributos[1]])
        attr1Nome = mapaAtributos[matchAtributos[1]];
      if (mapaAtributos[matchAtributos[2]])
        attr2Nome = mapaAtributos[matchAtributos[2]];
    }
    const partes = formulaPrecisao.split(")");
    if (partes.length > 1) {
      const matchBonus = partes[1].match(/\+\s*(\d+)/);
      if (matchBonus) bonusPrecisaoArma = parseInt(matchBonus[1], 10) || 0;
    }
  }

  const bonusPrecisaoTotal = bonusPrecisaoClasse + bonusPrecisaoArma;

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

  const faces1 = extrairFaces(atributosAtuais[attr1Nome]);
  const faces2 = extrairFaces(atributosAtuais[attr2Nome]);

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

  const bonusDanoFixo = isMulti
    ? 0
    : bonusOriginal + danoExtraHabilidade + danoAdrenalinaFurioso;
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
  };
}