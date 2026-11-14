/**
 * Realiza os cálculos automáticos de status e defesas para Fabula Ultima
 * @param {Object} atributos { destreza, astucia, vigor, vontade }
 * @param {Array} classes Lista de classes do personagem
 * @param {Array} itensEquipados Lista de itens da tabela itens_personagem que possuem 'slot'
 */
export function calcularStatusPersonagem(
  atributos = {},
  classes = [],
  itensEquipados = [],
) {
  const nivelTotal =
    classes.reduce((acc, c) => acc + (parseInt(c.nivel) || 0), 0) || 5;

  // Converte o dado da ficha (ex: "d8", "d10") no seu valor numérico correspondente (8, 10, etc.)
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
    des: des,
    destreza: des,
    ast: ast,
    astucia: ast,
    vig: vig,
    vigor: vig,
    von: von,
    vontade: von,
  };

  // Resolve expressões como "AST + 1" ou "Dado de AST + 1" substituindo AST pelo valor numérico (ex: 8)
  const resolverExpressao = (valorBruto) => {
    if (typeof valorBruto === "number") return valorBruto;
    if (!valorBruto) return 0;

    let str = String(valorBruto).trim().toLowerCase();

    str = str.replace(/dado de /g, "");
    str = str.replace(/dado /g, "");

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

  let bonusHpPorClasse = 0;
  let bonusMpPorClasse = 0;
  let bonusIpPorClasse = 0;

  // 2. Fórmulas Oficiais de PV, MP e PI
  const pvMax = atributos.vigor * 5 + nivelTotal + bonusHpPorClasse;
  const mpMax = atributos.vontade * 5 + nivelTotal + bonusMpPorClasse;
  const piMax = 6 + bonusIpPorClasse;

  // 3. Identificar itens nos slots equipados
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

  // 4. Cálculo de DEF (Defesa Física)
  // Regra: Se tem armadura, a defesa é FIXADA pelo valor da armadura. Senão, usa DES.
  let defesaBase = des;
  let bonusDefesaItens = 0;

  if (itemArmadura) {
    const statsArm = itemArmadura.stats_personalizados || {};
    const defArmaduraBruta = statsArm.defesa || statsArm.def || 0;
    const defCalculada = resolverExpressao(defArmaduraBruta);
    if (defCalculada > 0) {
      defesaBase = defCalculada; // Substitui pelo valor fixo da armadura (ex: 11)
    }
  }

  if (itemMaoSec) {
    const statsSec = itemMaoSec.stats_personalizados || {};
    bonusDefesaItens += resolverExpressao(statsSec.defesa || statsSec.def || 0);
  }
  if (itemAcessorio) {
    const statsAc = itemAcessorio.stats_personalizados || {};
    bonusDefesaItens += resolverExpressao(statsAc.defesa || statsAc.def || 0);
  }

  const defesaTotal = defesaBase + bonusDefesaItens;

  // 5. Cálculo de MDEF (Defesa Mágica)
  // Regra: A base é o AST. Se a armadura/acessório trouxer uma fórmula (ex: "AST + 1"), ela calcula o valor da fórmula.
  // Se a fórmula retornar um valor válido (> 0), ela substitui a base. Senão, mantém o AST puro.
  let mdefBase = ast;

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
      if (mdefCalculada > 0) {
        mdefBase = mdefCalculada; // Substitui pelo valor da fórmula (ex: 8 + 1 = 9)
      }
    }
  });

  const mdefTotal = mdefBase;

  // 6. Cálculo de Iniciativa Total
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
  };
}

export function rolarAtaqueEDanoArma(itemArma, atributosAtuais, isMulti = false) {
    const stats = itemArma.stats_personalizados || {};
    
    // Atributos da arma (ex: destreza, astucia)
    const attr1Nome = stats.attr1 || 'destreza';
    const attr2Nome = stats.attr2 || 'astucia';

    const extrairFaces = (valorAttr) => {
        if (!valorAttr) return 8;
        const str = String(valorAttr).trim().toLowerCase();
        if (str.startsWith('d')) {
            const faces = parseInt(str.substring(1), 10);
            return isNaN(faces) ? 8 : faces;
        }
        const num = parseInt(str, 10);
        return isNaN(num) ? 8 : num;
    };

    const faces1 = extrairFaces(atributosAtuais[attr1Nome]);
    const faces2 = extrairFaces(atributosAtuais[attr2Nome]);

    // Rola os dois dados
    const res1 = Math.floor(Math.random() * faces1) + 1;
    const res2 = Math.floor(Math.random() * faces2) + 1;
    const testeAtaque = res1 + res2;

    // 🎯 Captura correta do dado mais alto para o dano
    const dadoMaisAlto = Math.max(res1, res2);

    // Bônus fixo da arma (verifica se está em dano_fixo, dano ou bonus_dano)
    const valorBonusBruto = stats.dano_fixo !== undefined ? stats.dano_fixo : (stats.dano !== undefined ? stats.dano : 0);
    const bonusDanoFixo = isMulti ? 0 : (parseInt(valorBonusBruto) || 0);
    
    const danoTotal = dadoMaisAlto + bonusDanoFixo;

    return {
        nomeArma: itemArma.nome,
        attr1: `${attr1Nome.toUpperCase()} (d${faces1})`,
        res1,
        attr2: `${attr2Nome.toUpperCase()} (d${faces2})`,
        res2,
        testeAtaque,
        dadoMaisAlto,
        bonusDanoFixo,
        danoTotal,
        isMulti
    };
}