/**
 * Executa a lógica mecânica do Golpe das Sombras do Guerreiro Sombrio.
 * @param {Object} ficha Objeto atual da ficha do personagem (contém pv_atual, etc.)
 * @param {Array} classes Lista de classes do personagem para buscar o Nível do Poder (NP)
 * @param {Number} valorMaximoVigor O número de faces do dado de vigor atual (ex: 8 para d8)
 * @returns {Object} Resultado com o dano extra, custo em PV e se a ação foi bem-sucedida
 */
export function processarGolpeDasSombras(ficha, classes, valorMaximoVigor = 8) {
  // 1. Encontra o nível da habilidade (NP) do Golpe das Sombras
  let nivelPoder = 0;
  classes.forEach((c) => {
    (c.habilidades || []).forEach((h) => {
      const nomeHab = (h.nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      if (nomeHab.includes("golpe das sombras")) {
        nivelPoder = parseInt(h.nivel) || 0;
      }
    });
  });

  if (nivelPoder <= 0) {
    return { sucesso: false, mensagem: "Personagem não possui a habilidade Golpe das Sombras." };
  }

  // 2. Rola o dado atual de Vigor (ex: d8 sorteia de 1 a 8)
  const resultadoVigorRolado = Math.floor(Math.random() * valorMaximoVigor) + 1;

  const pvAtual = ficha?.pv_atual ?? 100; // Ajuste conforme a estrutura do seu estado

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
    tipoDano: "trevas", // Fixo por regra
    mensagem: `Golpe das Sombras preparado! Perda de ${resultadoVigorRolado} PV. Dano adicional de Trevas: +${danoAdicional} (NP ${nivelPoder} + ${resultadoVigorRolado} do dVigor).`,
  };
}