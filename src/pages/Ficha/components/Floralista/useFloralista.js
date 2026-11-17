import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  ehClasseFloralista,
  possuiPoderHeroicoNF,
  extrairBeneficioInicialFloralista,
  gerarTextoBeneficioPvOuPm,
  calcularLimiteMagiseedsAprendidas,
  calcularCuraArvoreDaVida,
  calcularLimitePmJardinagemMarcial,
  resolverEfeitoMagiseedNaSecao,
  processarPlantioMagiseed,
  processarAvancoRelogioGerminacao,
  normalizarTextoNF
} from '../../../../domain/fabula/naturalFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoNF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useFloralista({
  ficha,
  classe,
  classes = [],
  nivelTotal = 5,
  emCriseGlobal = false,
  decretoDobrarPmAtivo = false,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoMagiseeds, setCatalogoMagiseeds] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoFloralistaMagiseeds()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoMagiseeds(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Magissementes:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseFloralista(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelFloralista = parseInt(classeObj?.nivel, 10) || 1;
  const nvCloromancia = getNivelHabilidade(habs, 'cloromancia');
  const nvArvoreDaVida = getNivelHabilidade(habs, 'arvore da vida');
  const nvEnxerto = getNivelHabilidade(habs, 'enxerto');
  const nvInfluenciaVerdejante = getNivelHabilidade(habs, 'influencia verdejante');
  const nvJardinagemMarcial = getNivelHabilidade(habs, 'jardinagem marcial');

  const habCloro = habs.find((h) => normalizarTextoNF(h?.nome).includes('cloromancia'));
  const dadosSalvos = classeObj?.dados_floralista || habCloro?.dados_floralista || ficha?.dados_floralista || {};
  const infoBeneficio = extrairBeneficioInicialFloralista(classeObj, ficha);

  const maxMagiseeds = calcularLimiteMagiseedsAprendidas(nvCloromancia);
  const curaArvore = calcularCuraArvoreDaVida(nvArvoreDaVida);
  const limitePmJardinagem = calcularLimitePmJardinagemMarcial(nvJardinagemMarcial);

  const [beneficioInicial, setBeneficioInicial] = useState(infoBeneficio.escolha);
  const [magiseedsAprendidas, setMagiseedsAprendidas] = useState(() =>
    Array.isArray(dadosSalvos.magiseedsAprendidas) ? dadosSalvos.magiseedsAprendidas : []
  );
  const [magiseedSelecionadaKey, setMagiseedSelecionadaKey] = useState(() =>
    (Array.isArray(dadosSalvos.magiseedsAprendidas) ? dadosSalvos.magiseedsAprendidas[0] : '') || ''
  );
  const [magiseedAtiva, setMagiseedAtiva] = useState(dadosSalvos.magiseedAtiva || null);
  const [secaoRelogio, setSecaoRelogio] = useState(parseInt(dadosSalvos.secaoRelogio, 10) || 0);
  const [escolhaElementoMagiseed, setEscolhaElementoMagiseed] = useState(
    dadosSalvos.escolhaElementoMagiseed || 'terra'
  );
  const [dedoVerdeUsadoCiclo, setDedoVerdeUsadoCiclo] = useState(Boolean(dadosSalvos.dedoVerdeUsadoCiclo));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temCloromanciaMaior =
    possuiPoderHeroicoNF(poderesHeroicos, 'cloromancia_maior') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'cloromancia maior');
  const temDedoVerde =
    possuiPoderHeroicoNF(poderesHeroicos, 'dedo_verde') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'dedo verde');
  const temMuralhaEspinhos =
    possuiPoderHeroicoNF(poderesHeroicos, 'muralha_de_espinhos') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'muralha de espinhos');

  const magiseedsDisponiveis = useMemo(() => {
    return catalogoMagiseeds.filter((m) => magiseedsAprendidas.includes(m.key));
  }, [catalogoMagiseeds, magiseedsAprendidas]);

  const magiseedSelecionada = useMemo(() => {
    return magiseedsDisponiveis.find((m) => m.key === magiseedSelecionadaKey) || magiseedsDisponiveis[0] || null;
  }, [magiseedsDisponiveis, magiseedSelecionadaKey]);

  const magiseedAtivaCompleta = useMemo(() => {
    if (!magiseedAtiva) return null;
    return catalogoMagiseeds.find((m) => m.key === magiseedAtiva.key) || magiseedAtiva;
  }, [catalogoMagiseeds, magiseedAtiva]);

  const efeitoAtivoNoJardim = useMemo(() => {
    return resolverEfeitoMagiseedNaSecao({
      magiseed: magiseedAtivaCompleta,
      secaoAtual: secaoRelogio,
      nvCloromancia: Math.max(1, nvCloromancia),
      nivelPersonagem: nivelTotal,
      escolhaElemento: escolhaElementoMagiseed,
      temDedoVerde
    });
  }, [magiseedAtivaCompleta, secaoRelogio, nvCloromancia, nivelTotal, escolhaElementoMagiseed, temDedoVerde]);

  const persistirFloralista = async (novosDados = {}, novoBeneficioTexto = null) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      beneficioInicial,
      magiseedsAprendidas,
      magiseedAtiva,
      secaoRelogio,
      escolhaElementoMagiseed,
      dedoVerdeUsadoCiclo,
      ...novosDados
    };

    if (fichaIdReal) {
      await fichaService.salvarDadosFloralista(fichaIdReal, payload, classes, novoBeneficioTexto);
    }

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseFloralista(c.nome_classe),
        (c) => ({
          ...c,
          beneficios: novoBeneficioTexto || c.beneficios,
          dados_floralista: payload,
          habilidades: (c.habilidades || []).map((h) =>
            normalizarTextoNF(h?.nome).includes('cloromancia')
              ? { ...h, dados_floralista: payload }
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
    await persistirFloralista({ beneficioInicial: escolha }, novoTexto);
    setFeedback(`Benefício inicial do Floralista definido para +5 ${escolha.toUpperCase()} máximos.`);
  };

  const handleSalvarMagiseedsModal = async (novasChaves) => {
    setErroMsg('');
    setMagiseedsAprendidas(novasChaves);
    const proxKey = novasChaves.includes(magiseedSelecionadaKey) ? magiseedSelecionadaKey : (novasChaves[0] || '');
    setMagiseedSelecionadaKey(proxKey);
    await persistirFloralista({ magiseedsAprendidas: novasChaves });
    setFeedback('Catálogo de Magissementes conhecidas atualizado com sucesso.');
  };

  const handlePlantarOuEnxertar = async (usarEnxerto = false) => {
    setErroMsg('');
    setFeedback('');

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    const resultado = processarPlantioMagiseed({
      magiseed: magiseedSelecionada,
      mpAtual,
      magiseedAtualNoJardim: magiseedAtivaCompleta,
      secaoRelogioAtual: secaoRelogio,
      nvCloromancia,
      nvEnxerto,
      nvJardinagemMarcial,
      nvArvoreDaVida,
      usarEnxerto,
      decretoDobrarPmAtivo,
      escolhaElemento: escolhaElementoMagiseed,
      nivelPersonagem: nivelTotal
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso && resultado.custoPm > 0) {
      handleAjustarRecurso('mp_atual', -resultado.custoPm);
    }
    if (usarEnxerto && emCriseGlobal && resultado.curaArvoreDaVidaDisponivel > 0 && handleAjustarRecurso) {
      handleAjustarRecurso('hp_atual', resultado.curaArvoreDaVidaDisponivel);
    }

    const sementeResumida = {
      key: resultado.novaMagiseed.key,
      nome: resultado.novaMagiseed.nome,
      descricao: resultado.novaMagiseed.descricao
    };

    setMagiseedAtiva(sementeResumida);
    setSecaoRelogio(resultado.novaSecaoRelogio);
    if (!usarEnxerto) setDedoVerdeUsadoCiclo(false);
    setFeedback([resultado.mensagem, ...(resultado.extras || [])].join(' '));

    await persistirFloralista({
      magiseedAtiva: sementeResumida,
      secaoRelogio: resultado.novaSecaoRelogio,
      dedoVerdeUsadoCiclo: usarEnxerto ? dedoVerdeUsadoCiclo : false
    });
  };

  const handleAvancarRelogio = async (modDedoVerde = 0) => {
    setErroMsg('');
    setFeedback('');

    const resultado = processarAvancoRelogioGerminacao({
      magiseedAtiva: magiseedAtivaCompleta,
      secaoAtual: secaoRelogio,
      deltaSecoes: 1,
      modificadorDedoVerde: modDedoVerde,
      dedoVerdeUsadoCiclo,
      nvCloromancia,
      nvArvoreDaVida,
      nivelPersonagem: nivelTotal,
      escolhaElemento: escolhaElementoMagiseed,
      temDedoVerde
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (resultado.cicloConcluido) {
      if (emCriseGlobal && resultado.curaArvoreDaVidaDisponivel > 0 && handleAjustarRecurso) {
        handleAjustarRecurso('hp_atual', resultado.curaArvoreDaVidaDisponivel);
      }
      setMagiseedAtiva(null);
      setSecaoRelogio(0);
      setDedoVerdeUsadoCiclo(false);
      setFeedback(resultado.mensagem);
      await persistirFloralista({ magiseedAtiva: null, secaoRelogio: 0, dedoVerdeUsadoCiclo: false });
      return;
    }

    const ef = resultado.efeitoResolvido;
    if (handleAjustarRecurso && ef) {
      if (ef.curaPvFimTurno > 0) handleAjustarRecurso('hp_atual', ef.curaPvFimTurno);
      if (ef.curaPmFimTurno > 0) handleAjustarRecurso('mp_atual', ef.curaPmFimTurno);
      if (ef.curaPiFimTurno > 0) handleAjustarRecurso('ip_atual', ef.curaPiFimTurno);
    }

    setSecaoRelogio(resultado.novaSecaoRelogio);
    setDedoVerdeUsadoCiclo(resultado.novoDedoVerdeUsado);
    setFeedback(resultado.mensagem);

    await persistirFloralista({
      secaoRelogio: resultado.novaSecaoRelogio,
      dedoVerdeUsadoCiclo: resultado.novoDedoVerdeUsado
    });
  };

  const handleAlterarElementoMagiseed = async (novoElemento) => {
    setEscolhaElementoMagiseed(novoElemento);
    await persistirFloralista({ escolhaElementoMagiseed: novoElemento });
    setFeedback(`Elemento da magissemente definido para ${novoElemento.toUpperCase()}.`);
  };

  const handleRemoverMagiseed = async (curarArvoreSeCrise = true) => {
    if (!magiseedAtiva) return;
    if (curarArvoreSeCrise && emCriseGlobal && curaArvore > 0 && handleAjustarRecurso) {
      handleAjustarRecurso('hp_atual', curaArvore);
    }
    setMagiseedAtiva(null);
    setSecaoRelogio(0);
    setDedoVerdeUsadoCiclo(false);
    setFeedback(
      `Magissemente removida do jardim e relógio zerado.${curarArvoreSeCrise && curaArvore > 0 ? ` (Árvore da Vida: +${curaArvore} PV em Crise)` : ''}`
    );
    await persistirFloralista({ magiseedAtiva: null, secaoRelogio: 0, dedoVerdeUsadoCiclo: false });
  };

  return {
    catalogoMagiseeds, nivelFloralista, nvCloromancia, maxMagiseeds,
    nvArvoreDaVida, curaArvore, nvEnxerto, nvInfluenciaVerdejante, nvJardinagemMarcial, limitePmJardinagem,
    beneficioInicial, magiseedsAprendidas, magiseedsDisponiveis,
    magiseedSelecionada, magiseedSelecionadaKey, setMagiseedSelecionadaKey,
    magiseedAtiva: magiseedAtivaCompleta, secaoRelogio, escolhaElementoMagiseed,
    efeitoAtivoNoJardim, dedoVerdeUsadoCiclo,
    temCloromanciaMaior, temDedoVerde, temMuralhaEspinhos,
    isModalOpen, setIsModalOpen, feedback, erroMsg,
    handleEscolherBeneficio, handleSalvarMagiseedsModal,
    handlePlantarOuEnxertar, handleAvancarRelogio, handleAlterarElementoMagiseed, handleRemoverMagiseed
  };
}
