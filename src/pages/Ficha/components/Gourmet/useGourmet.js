import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  SABORES_GOURMET,
  TABELA_EFEITOS_IGUARIA_PADRAO,
  ehClasseGourmet,
  ehClasseMercador,
  possuiPoderHeroicoNF,
  calcularCapacidadeIngredientes,
  calcularGanhosIngredientes,
  extrairParesDeSabores,
  rolarSaborIngrediente,
  descobrirEfeitoParSabor,
  processarPreparoIguaria,
  normalizarTextoNF
} from '../../../../domain/fabula/naturalFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoNF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useGourmet({
  ficha,
  classe,
  classes = [],
  itensEquipados = [],
  nivelTotal = 5,
  decretoDobrarPmAtivo = false,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoGourmet, setCatalogoGourmet] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoGourmetIngredientesReceitas()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoGourmet(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Gourmet:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseGourmet(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelGourmet = parseInt(classeObj?.nivel, 10) || 1;
  const nvCulinaria = getNivelHabilidade(habs, 'culinaria');
  const nvCozinheiroViajante = getNivelHabilidade(habs, 'cozinheiro viajante');
  const nvFeitoComAmor = getNivelHabilidade(habs, 'feito com amor');
  const nvGarfoEFaca = getNivelHabilidade(habs, 'garfo e faca');
  const nvSalEPimenta = getNivelHabilidade(habs, 'sal e pimenta');

  // Verifica sinergia com Data de Validade (Mercador)
  const mercadorObj = classes.find((c) => ehClasseMercador(c.nome_classe));
  const nvDataDeValidade = getNivelHabilidade(mercadorObj?.habilidades || [], 'data de validade');

  const habCulinaria = habs.find((h) => normalizarTextoNF(h?.nome).includes('culinaria'));
  const dadosSalvos = classeObj?.dados_gourmet || habCulinaria?.dados_gourmet || ficha?.dados_gourmet || {};

  const capacidadeMax = calcularCapacidadeIngredientes(nvCulinaria);
  const ganhos = calcularGanhosIngredientes(nvCulinaria, nvCozinheiroViajante);

  const [estoqueSabores, setEstoqueSabores] = useState(() => ({
    amargo: 0,
    salgado: 0,
    azedo: 0,
    doce: 0,
    umami: 0,
    ...(dadosSalvos.estoqueSabores || {})
  }));
  const [livroReceitas, setLivroReceitas] = useState(() => dadosSalvos.livroReceitas || {});
  const [pratoAtivoCena, setPratoAtivoCena] = useState(() => dadosSalvos.pratoAtivoCena || null);
  const [saboresEscolhidos, setSaboresEscolhidos] = useState(['amargo', 'doce']);
  const [modoAplicacao, setModoAplicacao] = useState('aliados');
  const [alvosExtrasAmor, setAlvosExtrasAmor] = useState(0);
  const [usarGarfoEFaca, setUsarGarfoEFaca] = useState(true);
  const [usarSalEPimenta, setUsarSalEPimenta] = useState(false);
  const [saborNovoSalEPimenta, setSaborNovoSalEPimenta] = useState('umami');
  const [usarDataDeValidade, setUsarDataDeValidade] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temRodizio = possuiPoderHeroicoNF(poderesHeroicos, 'rodizio');
  const temEspecialidadeDaCasa =
    possuiPoderHeroicoNF(poderesHeroicos, 'especialidade_da_casa') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'especialidade da casa');
  const temDosagemPrecisa =
    possuiPoderHeroicoNF(poderesHeroicos, 'dosagem_precisa') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'dosagem precisa');

  const nomesItensEquipados = (itensEquipados || []).map((i) => normalizarTextoNF(i?.nome || '')).join(' ');
  const temConcha = nomesItensEquipados.includes('concha');
  const temEscudoTampa = nomesItensEquipados.includes('escudo-tampa') || nomesItensEquipados.includes('escudo tampa');
  const temPimentaEmPo = nomesItensEquipados.includes('pimenta em po');

  const totalIngredientesAtual = useMemo(() => {
    return SABORES_GOURMET.reduce((acc, s) => acc + (parseInt(estoqueSabores[s.key], 10) || 0), 0);
  }, [estoqueSabores]);

  const catalogoEfeitosIguaria = useMemo(() => {
    const filtrados = catalogoGourmet.filter((i) => i.categoria === 'efeito_iguaria');
    return filtrados.length >= 12 ? filtrados : TABELA_EFEITOS_IGUARIA_PADRAO;
  }, [catalogoGourmet]);

  const paresPrevia = useMemo(() => {
    const lista = [...saboresEscolhidos];
    if (usarSalEPimenta && nvSalEPimenta > 0 && lista.length > 0) {
      lista[0] = saborNovoSalEPimenta;
    }
    return extrairParesDeSabores(lista);
  }, [saboresEscolhidos, usarSalEPimenta, nvSalEPimenta, saborNovoSalEPimenta]);

  const persistirGourmet = async (novosDados = {}) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      estoqueSabores,
      livroReceitas,
      pratoAtivoCena,
      ...novosDados
    };

    if (fichaIdReal) {
      await fichaService.salvarDadosGourmet(fichaIdReal, payload, classes);
    }

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseGourmet(c.nome_classe),
        (c) => ({
          ...c,
          dados_gourmet: payload,
          habilidades: (c.habilidades || []).map((h) =>
            normalizarTextoNF(h?.nome).includes('culinaria')
              ? { ...h, dados_gourmet: payload }
              : h
          )
        })
      );
    }
  };

  const handleAjustarIngrediente = async (saborKey, delta) => {
    setErroMsg('');
    const atual = parseInt(estoqueSabores[saborKey], 10) || 0;
    if (delta > 0 && capacidadeMax > 0 && totalIngredientesAtual >= capacidadeMax) {
      setErroMsg(`Bolsa cheia! Limite máximo de ${capacidadeMax} ingredientes (10 + NP×5).`);
      return;
    }
    const novoValor = Math.max(0, atual + delta);
    const novoEstoque = { ...estoqueSabores, [saborKey]: novoValor };
    setEstoqueSabores(novoEstoque);
    await persistirGourmet({ estoqueSabores: novoEstoque });
  };

  const handleGerarIngredientesAleatorios = async (quantidade = 1, rotuloOrigem = 'Coleta') => {
    setErroMsg('');
    if (capacidadeMax <= 0) {
      setErroMsg('Adquira Culinária para armazenar ingredientes.');
      return;
    }
    const espacoLivre = Math.max(0, capacidadeMax - totalIngredientesAtual);
    const qtdReal = Math.min(quantidade, espacoLivre);
    if (qtdReal <= 0) {
      setErroMsg(`Sua bolsa já atingiu a capacidade máxima de ${capacidadeMax} ingredientes.`);
      return;
    }

    const novoEstoque = { ...estoqueSabores };
    const obtidos = [];
    for (let i = 0; i < qtdReal; i++) {
      const rolado = rolarSaborIngrediente();
      novoEstoque[rolado.sabor] = (parseInt(novoEstoque[rolado.sabor], 10) || 0) + 1;
      obtidos.push(`${rolado.nomeSabor} (d6=${rolado.dado})`);
    }

    setEstoqueSabores(novoEstoque);
    setFeedback(`${rotuloOrigem}: +${qtdReal} ingrediente(s) obtido(s) [${obtidos.join(', ')}]!`);
    await persistirGourmet({ estoqueSabores: novoEstoque });
  };

  const handlePrepararIguaria = async () => {
    setErroMsg('');
    setFeedback('');

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    const piAtual = Number(ficha?.pi_atual ?? ficha?.ip_atual ?? 0);

    const resultado = processarPreparoIguaria({
      saboresEscolhidos,
      estoqueSabores,
      livroReceitas,
      catalogoEfeitos: catalogoEfeitosIguaria,
      nvCulinaria,
      nvFeitoComAmor,
      alvosExtrasFeitoComAmor: alvosExtrasAmor,
      temGarfoEFaca: nvGarfoEFaca > 0,
      usarGarfoEFaca,
      temSalEPimenta: nvSalEPimenta > 0,
      usarSalEPimenta,
      saborOriginalSalEPimenta: saboresEscolhidos[0] || '',
      saborNovoSalEPimenta,
      modoAplicacao,
      aplicarEmSiMesmo: modoAplicacao === 'aliados',
      usarDataDeValidade,
      nvDataDeValidade,
      temRodizio,
      temConcha,
      temEscudoTampa,
      temPimentaEmPo,
      mpAtual,
      piAtual,
      decretoDobrarPmAtivo,
      nivelPersonagem: nivelTotal
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso) {
      if (resultado.custoPm > 0) handleAjustarRecurso('mp_atual', -resultado.custoPm);
      if (resultado.custoPi > 0) handleAjustarRecurso('pi_atual', -resultado.custoPi);
      if (resultado.curaPvProprio > 0) {
        handleAjustarRecurso('hp_atual', resultado.curaPvProprio, { permitirDosagemPrecisa: temDosagemPrecisa });
      }
      if (resultado.curaPmProprio > 0) {
        handleAjustarRecurso('mp_atual', resultado.curaPmProprio, { permitirDosagemPrecisa: temDosagemPrecisa });
      }
    }

    setEstoqueSabores(resultado.novoEstoque);
    setLivroReceitas(resultado.novoLivroReceitas);
    setPratoAtivoCena(resultado.pratoAtivoCena);
    setFeedback(resultado.mensagem);

    await persistirGourmet({
      estoqueSabores: resultado.novoEstoque,
      livroReceitas: resultado.novoLivroReceitas,
      pratoAtivoCena: resultado.pratoAtivoCena
    });
  };

  const handleRerrolarParReceita = async (parKey, d12Forcado = null, escolhaForcada = null) => {
    const novaDescoberta = descobrirEfeitoParSabor({
      parKey,
      livroReceitas,
      catalogoEfeitos: catalogoEfeitosIguaria,
      d12Predefinido: d12Forcado,
      escolhaPredefinida: escolhaForcada
    });
    const novoLivro = { ...livroReceitas, [parKey]: novaDescoberta };
    setLivroReceitas(novoLivro);
    await persistirGourmet({ livroReceitas: novoLivro });
    setFeedback(`Combinação ${parKey.toUpperCase()} registrada: ${novaDescoberta.nome}!`);
  };

  const handleLimparPratoAtivo = async () => {
    setPratoAtivoCena(null);
    setFeedback('Efeitos temporários da iguaria encerrados.');
    await persistirGourmet({ pratoAtivoCena: null });
  };

  return {
    catalogoGourmet, catalogoEfeitosIguaria, nivelGourmet,
    nvCulinaria, nvCozinheiroViajante, nvFeitoComAmor, nvGarfoEFaca, nvSalEPimenta, nvDataDeValidade,
    capacidadeMax, ganhos, estoqueSabores, totalIngredientesAtual,
    livroReceitas, pratoAtivoCena, saboresEscolhidos, setSaboresEscolhidos,
    paresPrevia, modoAplicacao, setModoAplicacao, alvosExtrasAmor, setAlvosExtrasAmor,
    usarGarfoEFaca, setUsarGarfoEFaca, usarSalEPimenta, setUsarSalEPimenta,
    saborNovoSalEPimenta, setSaborNovoSalEPimenta, usarDataDeValidade, setUsarDataDeValidade,
    temRodizio, temEspecialidadeDaCasa, temDosagemPrecisa,
    isModalOpen, setIsModalOpen, feedback, erroMsg,
    handleAjustarIngrediente, handleGerarIngredientesAleatorios,
    handlePrepararIguaria, handleRerrolarParReceita, handleLimparPratoAtivo
  };
}
