/**
 * Fabula Ultima - Regras de Habilidades e Classes
 *
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 * Conforme o Livro Básico de Regras de Fabula Ultima.
 */

/**
 * Converte representação de dado ('d8', 8) para valor numérico inteiro.
 * @param {string|number} dadoStr
 * @returns {number}
 */
export const extrairValorDado = (dadoStr) => {
  if (!dadoStr) return 8;
  const num = parseInt(String(dadoStr).replace(/\D/g, ''), 10);
  return isNaN(num) ? 8 : num;
};

/**
 * Fórmula oficial de Fabula Ultima para PV do Companheiro Fiel (Andarilho).
 * PV Máximo = (NP * Vigor) + floor(Nível do Personagem / 2)
 * @param {number} nivelNP Nível de poder da habilidade Companheiro Fiel
 * @param {string|number} dadoVigor Valor ou string do dado de Vigor (ex: 'd8' ou 8)
 * @param {number} nivelPersonagem Nível total somado do personagem
 * @returns {number}
 */
export function calcularPvMaximoCompanheiro(nivelNP, dadoVigor, nivelPersonagem, bonusPoderes = 0) {
  const np = parseInt(nivelNP, 10) || 0;
  const nvPersonagem = parseInt(nivelPersonagem, 10) || 0;
  const valorVigor = extrairValorDado(dadoVigor);
  return (np * valorVigor) + Math.floor(nvPersonagem / 2) + (Number(bonusPoderes) || 0);
}

/**
 * Encontra o nível da habilidade Companheiro Fiel a partir da lista de classes.
 * @param {Array<{habilidades?: Array<{nome?: string, nivel?: number|string}>}>} classes
 * @returns {number}
 */
export function extrairNivelCompanheiroFiel(classes = []) {
  if (!Array.isArray(classes)) return 0;
  return classes.reduce((max, c) => {
    const hab = (c.habilidades || []).find(h =>
      (h.nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes('companheiro fiel')
    );
    return hab ? Math.max(max, parseInt(hab.nivel, 10) || 0) : max;
  }, 0);
}

/**
 * Calcula o bônus de escala de nível para efeitos de dispensa do Arcanista.
 * Conforme regras de Fabula Ultima: Nv. 40+ concede +20, Nv. 20+ concede +10, caso contrário 0.
 * @param {number} nivelTotal
 * @returns {number}
 */
export function calcularBonusEscalaArcanista(nivelTotal) {
  const nv = parseInt(nivelTotal, 10) || 0;
  if (nv >= 40) return 20;
  if (nv >= 20) return 10;
  return 0;
}

/**
 * Executa a lógica mecânica do Golpe das Sombras do Guerreiro Sombrio.
 * @param {Object} ficha Objeto atual da ficha do personagem (contém pv_atual, etc.)
 * @param {Array} classes Lista de classes do personagem para buscar o Nível do Poder (NP)
 * @param {number} valorMaximoVigor O número de faces do dado de vigor atual (ex: 8 para d8)
 * @returns {Object} Resultado com o dano extra, custo em PV e se a ação foi bem-sucedida
 */
export function processarGolpeDasSombras(ficha, classes, valorMaximoVigor = 8) {
  // 1. Encontra o nível da habilidade (NP) do Golpe das Sombras
  let nivelPoder = 0;
  (classes || []).forEach((c) => {
    (c.habilidades || []).forEach((h) => {
      const nomeHab = (h.nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (nomeHab.includes('golpe das sombras')) {
        nivelPoder = parseInt(h.nivel, 10) || 0;
      }
    });
  });

  if (nivelPoder <= 0) {
    return { sucesso: false, mensagem: 'Personagem não possui a habilidade Golpe das Sombras.' };
  }

  // 2. Rola o dado atual de Vigor (ex: d8 sorteia de 1 a 8)
  const resultadoVigorRolado = Math.floor(Math.random() * valorMaximoVigor) + 1;

  const pvBruto = ficha?.hp_atual ?? ficha?.pv_atual;
  const pvAtual = pvBruto !== undefined && pvBruto !== null ? Number(pvBruto) : 0;

  // 3. Regra: Se isto reduzir os PV a 0 ou menos, o golpe não pode ser feito (ou impede a morte instantânea)
  if (pvAtual - resultadoVigorRolado <= 0) {
    return {
      sucesso: false,
      mensagem: `Aviso: Sacrificar ${resultadoVigorRolado} de PV reduzirá seus PV a 0 ou menos! Ação cancelada por segurança.`,
      custoPv: resultadoVigorRolado,
    };
  }

  // 4. Calcula o dano adicional: (NP + número rolado no dado de Vigor)
  const danoAdicional = nivelPoder + resultadoVigorRolado;

  return {
    sucesso: true,
    custoPv: resultadoVigorRolado,
    danoAdicional,
    nivelPoder,
    tipoDano: 'trevas',
    mensagem: `Golpe das Sombras preparado! Perda de ${resultadoVigorRolado} PV. Dano adicional de Trevas: +${danoAdicional} (NP ${nivelPoder} + ${resultadoVigorRolado} do dVigor).`,
  };
}
