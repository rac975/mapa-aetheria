import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  ehClasseDancarino,
  possuiPoderHeroicoHF,
  extrairBeneficioInicialDancarino,
  gerarTextoBeneficioDancarino,
  calcularLimiteDancasAprendidas,
  calcularCustoDanca,
  resolverValoresDanca,
  processarApresentacaoDanca,
  normalizarTextoHF
} from '../../../../domain/fabula/highFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoHF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useDancarino({
  ficha,
  classe,
  classes = [],
  temArmaduraMarcial = false,
  nivelTotal = 5,
  emCriseGlobal = false,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoDancas, setCatalogoDancas] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoDancas()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoDancas(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Danças:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseDancarino(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelDancarino = parseInt(classeObj?.nivel, 10) || 1;
  const nvDanca = getNivelHabilidade(habs, 'danca') || getNivelHabilidade(habs, 'dança');
  const nvDancarinoGuerra = getNivelHabilidade(habs, 'dancarino de guerra');
  const nvMeAcompanhe = getNivelHabilidade(habs, 'me acompanhe');
  const nvSapateado = getNivelHabilidade(habs, 'sapateado frenetico');
  const nvTrocaFigurino = getNivelHabilidade(habs, 'troca de figurino');

  const habDanca = habs.find((h) => normalizarTextoHF(h?.nome).startsWith('danca'));
  const dadosSalvos = classeObj?.dados_dancarino || habDanca?.dados_dancarino || ficha?.dados_dancarino || {};
  const infoBeneficio = extrairBeneficioInicialDancarino(classeObj, ficha);

  const maxDancas = calcularLimiteDancasAprendidas(nvDanca);
  const [beneficioInicial, setBeneficioInicial] = useState(infoBeneficio.escolha);
  const [dancasAprendidas, setDancasAprendidas] = useState(() =>
    Array.isArray(dadosSalvos.dancasAprendidas) ? dadosSalvos.dancasAprendidas : []
  );
  const [dancaSelecionadaKey, setDancaSelecionadaKey] = useState(() =>
    dadosSalvos.ultimaDancaKey || (Array.isArray(dadosSalvos.dancasAprendidas) ? dadosSalvos.dancasAprendidas[0] : '') || ''
  );
  const [ultimaDancaKey, setUltimaDancaKey] = useState(dadosSalvos.ultimaDancaKey || null);
  const [dancaAtivaTurno, setDancaAtivaTurno] = useState(dadosSalvos.dancaAtivaTurno || null);
  const [usarMeAcompanhe, setUsarMeAcompanhe] = useState(false);
  const [modoElemento, setModoElemento] = useState('resistencia');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temPasoDoble =
    possuiPoderHeroicoHF(poderesHeroicos, 'paso_doble') ||
    possuiPoderHeroicoHF(poderesHeroicos, 'paso doble');
  const temEspetaculo =
    possuiPoderHeroicoHF(poderesHeroicos, 'espetaculo');

  const dancasDisponiveis = useMemo(() => {
    return catalogoDancas.filter((d) => dancasAprendidas.includes(d.key));
  }, [catalogoDancas, dancasAprendidas]);

  const dancaSelecionada = useMemo(() => {
    return dancasDisponiveis.find((d) => d.key === dancaSelecionadaKey) || dancasDisponiveis[0] || null;
  }, [dancasDisponiveis, dancaSelecionadaKey]);

  const custoAtual = useMemo(() => {
    return calcularCustoDanca({
      danca: dancaSelecionada,
      ultimaDancaKey,
      usarMeAcompanhe: usarMeAcompanhe && nvMeAcompanhe > 0,
      temPasoDoble,
      emCrise: emCriseGlobal,
      temArmaduraMarcial
    });
  }, [dancaSelecionada, ultimaDancaKey, usarMeAcompanhe, nvMeAcompanhe, temPasoDoble, emCriseGlobal, temArmaduraMarcial]);

  const valoresDanca = useMemo(() => {
    return resolverValoresDanca({
      danca: dancaSelecionada,
      dadoDestreza: ficha?.destreza || 8,
      nivelPersonagem: nivelTotal
    });
  }, [dancaSelecionada, ficha?.destreza, nivelTotal]);

  const persistirDancarino = async (novosDados = {}, novoBeneficioTexto = null) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      beneficioInicial,
      dancasAprendidas,
      ultimaDancaKey,
      dancaAtivaTurno,
      ...novosDados
    };

    if (fichaIdReal) {
      await fichaService.salvarDadosDancarino(fichaIdReal, payload, classes, novoBeneficioTexto);
    }

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseDancarino(c.nome_classe),
        (c) => ({
          ...c,
          beneficios: novoBeneficioTexto || c.beneficios,
          dados_dancarino: payload,
          habilidades: (c.habilidades || []).map((h) =>
            normalizarTextoHF(h?.nome).startsWith('danca')
              ? { ...h, dados_dancarino: payload }
              : h
          )
        })
      );
    }
  };

  const handleEscolherBeneficio = async (escolha) => {
    setErroMsg('');
    setBeneficioInicial(escolha);
    const novoTexto = gerarTextoBeneficioDancarino(escolha);
    await persistirDancarino({ beneficioInicial: escolha }, novoTexto);
    setFeedback(`Benefício inicial do Dançarino definido para +5 ${escolha.toUpperCase()} máximos.`);
  };

  const handleSalvarDancasModal = async (novasDancas) => {
    setErroMsg('');
    setDancasAprendidas(novasDancas);
    const proxKey = novasDancas.includes(dancaSelecionadaKey) ? dancaSelecionadaKey : (novasDancas[0] || '');
    setDancaSelecionadaKey(proxKey);
    await persistirDancarino({ dancasAprendidas: novasDancas });
    setFeedback('Repertório de Danças atualizado com sucesso.');
  };

  const handleApresentarDanca = async () => {
    setErroMsg('');
    setFeedback('');

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    const resultado = processarApresentacaoDanca({
      danca: dancaSelecionada,
      mpAtual,
      ultimaDancaKey,
      usarMeAcompanhe,
      temMeAcompanhe: nvMeAcompanhe > 0,
      temPasoDoble,
      emCrise: emCriseGlobal,
      temArmaduraMarcial,
      nvDancarinoGuerra,
      nvSapateadoFrenetico: nvSapateado,
      temTrocaFigurino: nvTrocaFigurino > 0,
      dadoDestreza: ficha?.destreza || 8,
      nivelPersonagem: nivelTotal,
      modoElemento
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso && resultado.custoTotal > 0) {
      handleAjustarRecurso('mp_atual', -resultado.custoTotal);
    }

    const novaAtiva = resultado.dancaAtivaTurno
      ? { key: resultado.dancaAtivaTurno.key, nome: resultado.dancaAtivaTurno.nome, descricao: resultado.dancaAtivaTurno.descricao }
      : null;

    setUltimaDancaKey(resultado.novaUltimaDancaKey);
    setDancaAtivaTurno(novaAtiva);
    setFeedback(resultado.mensagem);

    await persistirDancarino({
      ultimaDancaKey: resultado.novaUltimaDancaKey,
      dancaAtivaTurno: novaAtiva
    });
  };

  const handleEncerrarCena = async () => {
    setUltimaDancaKey(null);
    setDancaAtivaTurno(null);
    setFeedback('Dança encerrada / sequência de cena reiniciada.');
    await persistirDancarino({ ultimaDancaKey: null, dancaAtivaTurno: null });
  };

  return {
    catalogoDancas,
    nivelDancarino,
    nvDanca,
    maxDancas,
    nvDancarinoGuerra,
    nvMeAcompanhe,
    nvSapateado,
    nvTrocaFigurino,
    beneficioInicial,
    beneficioConfirmado: infoBeneficio.confirmado,
    dancasAprendidas,
    dancasDisponiveis,
    dancaSelecionada,
    dancaSelecionadaKey,
    setDancaSelecionadaKey,
    ultimaDancaKey,
    dancaAtivaTurno,
    usarMeAcompanhe,
    setUsarMeAcompanhe,
    modoElemento,
    setModoElemento,
    temArmaduraMarcial,
    temPasoDoble,
    temEspetaculo,
    custoAtual,
    valoresDanca,
    isModalOpen,
    setIsModalOpen,
    feedback,
    erroMsg,
    handleEscolherBeneficio,
    handleSalvarDancasModal,
    handleApresentarDanca,
    handleEncerrarCena
  };
}
