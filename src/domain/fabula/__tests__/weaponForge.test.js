import {
  CUSTO_BASE_ARMA_PERSONALIZADA,
  calcularVagasOcupadas,
  podeAdicionarPersonalizacao,
  calcularCustoTotal,
  calcularDanoFinal,
  verificarEhMarcial,
  construirStatsArmaPersonalizada,
  obterItemFormaAtivaArmaMutavel,
  PERSONALIZACOES_DISPONIVEIS
} from '../weaponForge.js';
import {
  resolverCaracteristicaParametrizada
} from '../equipmentRules.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
}

console.log('--- 1. Testando Criação de Arma Personalizada Padrão (Atlas) ---');
const persPadrao = [
  PERSONALIZACOES_DISPONIVEIS.find(p => p.id === 'certeira'),
  PERSONALIZACOES_DISPONIVEIS.find(p => p.id === 'poderosa')
];

assert(calcularVagasOcupadas(persPadrao) === 2, 'Ocupa 2 vagas');
assert(podeAdicionarPersonalizacao(persPadrao, PERSONALIZACOES_DISPONIVEIS[0]), 'Pode adicionar até 3 vagas');
assert(calcularCustoTotal(persPadrao) === 300, 'Custo padrão é 300z');
assert(calcularDanoFinal('espada', persPadrao) === 10, 'Dano final espada poderosa é 10');
assert(verificarEhMarcial(persPadrao, 10) === true, 'Espada poderosa com dano 10 é marcial');

const statsPadrao = construirStatsArmaPersonalizada({
  categoria: 'espada',
  alcance: 'Corpo a corpo',
  precisaoTipo: '(DES + AST)',
  personalizacoes: persPadrao,
  raridade: 'padrao'
});

assert(statsPadrao.custo === 300, 'Stats custo é 300');
assert(statsPadrao.dano === 'RA + 10', 'Dano padrão com poderosa é RA + 10');
assert(statsPadrao.precisao === '(DES + AST) + 2', 'Precisão com certeira é + 2');
assert(statsPadrao.marcial === true, 'Espada com dano 10 é marcial');
assert(statsPadrao.raridade === 'personalizada', 'Raridade é personalizada');
console.log('PASSED: Criação de Arma Personalizada Padrão validada!');

console.log('--- 2. Testando Criação de Arma Personalizada Rara com Aprimoramentos do Livro Básico ---');
const caracCacadoraRaw = { id: 'cacadora', nome: 'Caçadora', efeito: 'Causa +5 de dano contra uma espécie.', custo: 200 };
const caracCacadoraResolvida = resolverCaracteristicaParametrizada(caracCacadoraRaw, { especie1: 'Fera' });

const statsRara = construirStatsArmaPersonalizada({
  categoria: 'espada',
  alcance: 'Corpo a corpo',
  precisaoTipo: '(DES + AST)',
  personalizacoes: persPadrao, // Certeira (+2) e Poderosa (+5)
  raridade: 'rara',
  ehRara: true,
  bonusPrecisaoArma: true, // +1 precisão (+100z)
  bonusDanoExtraArma: true, // +4 dano (+200z)
  atributoUnico: true, // +50z
  atributoEscolhido: 'Vigor', // (VIG + VIG)
  tipoDano: 'Fogo', // (+100z)
  caracteristicaSelecionada: caracCacadoraRaw,
  caracResolvida: caracCacadoraResolvida
});

// Custo esperado: 300 (base) + 200 (rara) + 100 (precisão) + 200 (dano) + 50 (atrib único) + 100 (fogo) + 200 (caçadora) = 1150z
assert(statsRara.custo === 1150, `Custo raro total deve ser 1150z, recebido: ${statsRara.custo}`);
// Dano: 5 base + 5 poderosa + 4 extra rara = 14
assert(statsRara.dano === 'RA + 14', `Dano com aprimoramento raro deve ser RA + 14, recebido: ${statsRara.dano}`);
// Precisão: Certeira (+2) + Bônus raro (+1) = +3, com atributo único (VIG + VIG)
assert(statsRara.precisao === '(VIG + VIG) + 3', `Precisão deve ser (VIG + VIG) + 3, recebido: ${statsRara.precisao}`);
assert(statsRara.tipo_dano === 'fogo', `Tipo de dano deve ser fogo, recebido: ${statsRara.tipo_dano}`);
assert(statsRara.raridade === 'personalizada_rara', `Raridade deve ser personalizada_rara, recebido: ${statsRara.raridade}`);
assert(Array.isArray(statsRara.especies_cacadora) && statsRara.especies_cacadora[0] === 'Fera', 'Espécie caçadora Fera preservada');
assert(statsRara.caracteristica_especial?.tipo_parametro === 'especie_1', 'Característica especial meta registrada');
console.log('PASSED: Criação de Arma Personalizada Rara validada com sucesso!');

console.log('--- 3. Testando Arma Personalizada Rara Mutável (Reflexo na 1ª e 2ª Forma) ---');
const persMutavel = [
  PERSONALIZACOES_DISPONIVEIS.find(p => p.id === 'certeira'),
  PERSONALIZACOES_DISPONIVEIS.find(p => p.id === 'mutavel'), // custoExtra 100
  PERSONALIZACOES_DISPONIVEIS.find(p => p.id === 'poderosa')
];

const caracResRaw = { id: 'resistencia', nome: 'Resistência', efeito: 'Resistência a um dano.', custo: 100 };
const caracResResolvida = resolverCaracteristicaParametrizada(caracResRaw, { tipoDano1: 'Raio' });

const statsMutavelRara = construirStatsArmaPersonalizada({
  categoria: 'espada', // dano base 5 + poderosa 5 + raro 4 = 14
  alcance: 'Corpo a corpo',
  precisaoTipo: '(DES + AST)',
  personalizacoes: persMutavel,
  temMutavel: true,
  segundaForma: {
    nome: 'Modo Machado Pesado',
    categoria: 'pesada', // dano base 5 + poderosa pesada 7 + raro 4 = 16
    alcance: 'Corpo a corpo',
    precisaoTipo: '(DES + VIG)'
  },
  raridade: 'rara',
  ehRara: true,
  bonusPrecisaoArma: true,
  bonusDanoExtraArma: true,
  atributoUnico: true,
  atributoEscolhido: 'Astúcia',
  tipoDano: 'Gelo',
  caracteristicaSelecionada: caracResRaw,
  caracResolvida: caracResResolvida
});

// 1ª Forma
assert(statsMutavelRara.mutavel === true, 'Arma marcada como mutável');
assert(statsMutavelRara.dano === 'RA + 14', '1ª forma tem dano RA + 14');
assert(statsMutavelRara.precisao === '(AST + AST) + 3', '1ª forma tem precisão (AST + AST) + 3');
assert(statsMutavelRara.tipo_dano === 'gelo', '1ª forma tem dano gelo');
assert(statsMutavelRara.resistencias.includes('raio'), '1ª forma tem resistência raio');

// 2ª Forma
const seg = statsMutavelRara.segunda_forma;
assert(seg !== null && typeof seg === 'object', 'Objeto da 2ª forma presente');
assert(seg.nome === 'Modo Machado Pesado', 'Nome da 2ª forma correto');
assert(seg.categoria === 'pesada', 'Categoria pesada da 2ª forma');
assert(seg.dano === 'RA + 16', `2ª forma reflete aprimoramento raro de dano (+4), resultando em RA + 16. Recebido: ${seg.dano}`);
assert(seg.precisao === '(AST + AST) + 3', `2ª forma reflete atributo único e bônus raro de precisão (+1). Recebido: ${seg.precisao}`);
assert(seg.tipo_dano === 'gelo', `2ª forma reflete tipo de dano raro gelo. Recebido: ${seg.tipo_dano}`);
assert(seg.marcial === true, '2ª forma pesada é marcial');
assert(seg.resistencias.includes('raio'), '2ª forma herda resistência a raio da característica');
assert(seg.caracteristica_especial?.tipo_parametro === 'dano_1', '2ª forma herda meta da característica especial');

// Testando alternância virtual da forma ativa
const itemArma = {
  id: 'arma_teste_1',
  nome: 'Ceifadora Espectral',
  stats: statsMutavelRara
};

const armaNaForma2 = obterItemFormaAtivaArmaMutavel(itemArma, true);
assert(armaNaForma2.nome === 'Ceifadora Espectral (Modo Machado Pesado)', 'Nome da forma ativa atualizado');
assert(armaNaForma2.stats.dano === 'RA + 16', 'Stats ativo reflete RA + 16 da 2ª forma');
assert(armaNaForma2.stats.precisao === '(AST + AST) + 3', 'Stats ativo reflete precisão da 2ª forma');
assert(armaNaForma2.stats.resistencias.includes('raio'), 'Stats ativo preserva resistência');

console.log('PASSED: Reflexo em ambas as formas da Arma Mutável validado com sucesso!');
console.log('TODOS OS TESTES DE WEAPON FORGE PASSARAM!');
