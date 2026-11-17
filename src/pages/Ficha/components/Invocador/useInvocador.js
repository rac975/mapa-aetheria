import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  MANANCIAIS_ELEMENTAIS,
  ehClasseInvocador,
  possuiPoderHeroicoNF,
  extrairBeneficioInicialInvocador,
  gerarTextoBeneficioPvOuPm,
  verificarArmaExpandirManancial,
  filtrarInvocacoesDisponiveis,
  calcularValoresInvocacao,
  processarInvocacaoElemental,
  normalizarTextoNF
} from '../../../../domain/fabula/naturalFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoNF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useInvocador({
  ficha,
  classe,
  classes = [],
  itensEquipados = [],
  nivelTotal = 5,
  decretoDobrarPmAtivo = false,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoInvocacoes, setCatalogoInvocacoes] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoInvocadorElementais()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoInvocacoes(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Invocações:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseInvocador(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelInvocador = parseInt(classeObj?.nivel, 10) || 1;
  const nvInvocacao = getNivelHabilidade(habs, 'invocacao') || getNivelHabilidade(habs, 'invocação');
  const nvInvocacoesConectadas = getNivelHabilidade(habs, 'invocacoes conectadas');
  const nvExpandirManancial = getNivelHabilidade(habs, 'expandir manancial');
  const nvCascata = getNivelHabilidade(habs, 'cascata');
  const nvHarmoniaElemental = getNivelHabilidade(habs, 'harmonia elemental');

  const habInv = habs.find((h) => normalizarTextoNF(h?.nome).includes('invocac'));
  const dadosSalvos = classeObj?.dados_invocador || habInv?.dados_invocador || ficha?.dados_invocador || {};
  const infoBeneficio = extrairBeneficioInicialInvocador(classeObj, ficha);

  const [beneficioInicial, setBeneficioInicial] = useState(infoBeneficio.escolha);
  const [mananciaisCena, setMananciaisCena] = useState(() =>
    Array.isArray(dadosSalvos.mananciaisCena) && dadosSalvos.mananciaisCena.length > 0
      ? dadosSalvos.mananciaisCena
      : ['ar', 'terra']
  );
  const [manancialInteriorKey, setManancialInteriorKey] = useState(
    dadosSalvos.manancialInteriorKey || 'agua'
  );
  const [converterDanoManancialInterior, setConverterDanoManancialInterior] = useState(
    Boolean(dadosSalvos.converterDanoManancialInterior)
  );
  const [elementalPresente, setElementalPresente] = useState(Boolean(dadosSalvos.elementalPresente));
  const [pragaAtiva, setPragaAtiva] = useState(dadosSalvos.pragaAtiva || null);
  const [atributoCincoMananciais, setAtributoCincoMananciais] = useState(
    dadosSalvos.atributoCincoMananciais || null
  );
  const [atributoEscolhidoTerra, setAtributoEscolhidoTerra] = useState('vigor');
  const [invocacaoSelecionadaKey, setInvocacaoSelecionadaKey] = useState('');
  const [alvosExtras, setAlvosExtras] = useState(0);
  const [aplicarCuraEmSiMesmo, setAplicarCuraEmSiMesmo] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temManancialInterior =
    possuiPoderHeroicoNF(poderesHeroicos, 'manancial_interior') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'manancial interior');
  const temManipularMagia =
    possuiPoderHeroicoNF(poderesHeroicos, 'manipular_magia') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'manipular magia');
  const temPoderCincoMananciais =
    possuiPoderHeroicoNF(poderesHeroicos, 'poder_dos_cinco_mananciais') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'poder dos cinco mananciais');

  const temArmaExpandir = useMemo(
    () => verificarArmaExpandirManancial(itensEquipados),
    [itensEquipados]
  );

  const invocacoesDisponiveis = useMemo(() => {
    return filtrarInvocacoesDisponiveis(
      catalogoInvocacoes,
      mananciaisCena,
      nvInvocacao,
      temManancialInterior ? manancialInteriorKey : null
    );
  }, [catalogoInvocacoes, mananciaisCena, nvInvocacao, temManancialInterior, manancialInteriorKey]);

  const invocacaoSelecionada = useMemo(() => {
    return (
      invocacoesDisponiveis.find((i) => i.key === invocacaoSelecionadaKey) ||
      invocacoesDisponiveis[0] ||
      null
    );
  }, [invocacoesDisponiveis, invocacaoSelecionadaKey]);

  const valoresPrevia = useMemo(() => {
    return calcularValoresInvocacao({
      invocacao: invocacaoSelecionada,
      nivelPersonagem: nivelTotal,
      nvExpandirManancial,
      temArmaExpandir,
      nvHarmoniaElemental,
      elementalPresenteNaCena: elementalPresente,
      nvInvocacoesConectadas,
      alvosExtras
    });
  }, [
    invocacaoSelecionada,
    nivelTotal,
    nvExpandirManancial,
    temArmaExpandir,
    nvHarmoniaElemental,
    elementalPresente,
    nvInvocacoesConectadas,
    alvosExtras
  ]);

  const persistirInvocador = async (novosDados = {}, novoBeneficioTexto = null) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      beneficioInicial,
      mananciaisCena,
      manancialInteriorKey: temManancialInterior ? manancialInteriorKey : null,
      converterDanoManancialInterior,
      elementalPresente,
      pragaAtiva,
      atributoCincoMananciais,
      ...novosDados
    };

    if (fichaIdReal) {
      await fichaService.salvarDadosInvocador(fichaIdReal, payload, classes, novoBeneficioTexto);
    }

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseInvocador(c.nome_classe),
        (c) => ({
          ...c,
          beneficios: novoBeneficioTexto || c.beneficios,
          dados_invocador: payload,
          habilidades: (c.habilidades || []).map((h) =>
            normalizarTextoNF(h?.nome).includes('invocac')
              ? { ...h, dados_invocador: payload }
              : h
          )
        })
      );
    }
  };

  const handleEscolherBeneficio = async (escolha) => {
    setErroMsg('');
    setBeneficioInicial(escolha);
    const novoTexto = gerarTextoBeneficioPvOuPm(escolha);
    await persistirInvocador({ beneficioInicial: escolha }, novoTexto);
    setFeedback(`Benefício inicial do Invocador definido para +5 ${escolha.toUpperCase()} máximos.`);
  };

  const handleToggleManancialCena = async (key) => {
    setErroMsg('');
    let novaLista;
    if (mananciaisCena.includes(key)) {
      if (mananciaisCena.length <= 1) return;
      novaLista = mananciaisCena.filter((m) => m !== key);
    } else {
      novaLista = mananciaisCena.length >= 2 ? [mananciaisCena[1], key] : [...mananciaisCena, key];
    }
    setMananciaisCena(novaLista);
    await persistirInvocador({ mananciaisCena: novaLista });
  };

  const handleAlterarManancialInterior = async (key) => {
    setManancialInteriorKey(key);
    await persistirInvocador({ manancialInteriorKey: key });
    setFeedback(`Manancial Interior sintonizado com ${MANANCIAIS_ELEMENTAIS[key]?.nome || key}.`);
  };

  const handleToggleElementalPresente = async (presente) => {
    setElementalPresente(presente);
    await persistirInvocador({ elementalPresente: presente });
  };

  const handleRealizarInvocacao = async (usarManipularMagiaSemCusto = false) => {
    setErroMsg('');
    setFeedback('');

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    const resultado = processarInvocacaoElemental({
      invocacao: invocacaoSelecionada,
      mpAtual,
      alvosExtras,
      nvInvocacao,
      nvInvocacoesConectadas,
      nvExpandirManancial,
      temArmaExpandir,
      nvHarmoniaElemental,
      elementalPresenteNaCena: elementalPresente,
      nvCascata,
      usarManipularMagiaSemCusto,
      decretoDobrarPmAtivo,
      nivelPersonagem: nivelTotal,
      temPoderCincoMananciais,
      atributoEscolhidoTerra,
      aplicarCuraEmSiMesmo
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso) {
      if (resultado.custoPm > 0) handleAjustarRecurso('mp_atual', -resultado.custoPm);
      if (resultado.curaPvProprio > 0) handleAjustarRecurso('hp_atual', resultado.curaPvProprio);
    }

    const novaPraga = resultado.pragaAtiva || pragaAtiva;
    const novoAtributoCinco = resultado.atributoCincoMananciais || atributoCincoMananciais;

    setPragaAtiva(novaPraga);
    setAtributoCincoMananciais(novoAtributoCinco);
    setFeedback(resultado.mensagem);

    await persistirInvocador({
      pragaAtiva: novaPraga,
      atributoCincoMananciais: novoAtributoCinco
    });
  };

  const handleDissiparPragaCascata = async () => {
    setPragaAtiva(null);
    setFeedback(
      `Cascata executada! Ataque livre com +${nvCascata} em Precisão resolvido e Praga dissipada do alvo.`
    );
    await persistirInvocador({ pragaAtiva: null });
  };

  return {
    nivelInvocador, nvInvocacao, nvInvocacoesConectadas, nvExpandirManancial, nvCascata, nvHarmoniaElemental,
    beneficioInicial, mananciaisCena, manancialInteriorKey, converterDanoManancialInterior, setConverterDanoManancialInterior,
    elementalPresente, pragaAtiva, atributoCincoMananciais, atributoEscolhidoTerra, setAtributoEscolhidoTerra,
    temArmaExpandir, temManancialInterior, temManipularMagia, temPoderCincoMananciais,
    invocacoesDisponiveis, invocacaoSelecionada, invocacaoSelecionadaKey, setInvocacaoSelecionadaKey,
    alvosExtras, setAlvosExtras, aplicarCuraEmSiMesmo, setAplicarCuraEmSiMesmo,
    valoresPrevia, feedback, erroMsg,
    handleEscolherBeneficio, handleToggleManancialCena, handleAlterarManancialInterior,
    handleToggleElementalPresente, handleRealizarInvocacao, handleDissiparPragaCascata,
    persistirInvocador
  };
}
