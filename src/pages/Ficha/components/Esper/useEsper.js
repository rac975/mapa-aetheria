import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import { useAlert } from '../../../../contexts/useAlert';
import {
  BRAINWAVE_CLOCK_MAX_SECTIONS,
  calcularCustoPsychicGift,
  avancarBrainwaveClock,
  resetarBrainwaveClock,
  calcularBonusCognitiveFocus,
  calcularReducaoHypercognition,
  calcularLimiteDonsPsiquicosAprendidos,
  processarAtivacaoPsychicGift
} from '../../../../domain/fabula/technoFantasyRules';

export function useEsper({
  ficha,
  classe,
  classeObjeto,
  classes,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const { showAlert } = useAlert();
  const [catalogoDons, setCatalogoDons] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoDonsPsiquicos()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoDons(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Dons Psíquicos:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classeObjeto ||
    classes?.find((c) => (c.nome_classe || '').toLowerCase().includes('esper')) ||
    (ficha?.habilidades ? ficha : null);

  const habs = classeObj?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nivelEsper = parseInt(classeObj?.nivel, 10) || 1;
  const nvFocoCognitivo = getNivel('foco cognitivo');
  const nvHipercognicao = getNivel('hipercognicao');
  const habDons = habs.find((h) => {
    const norm = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return norm.includes('don') || norm.includes('dadiva');
  });
  const nvDons = parseInt(habDons?.nivel, 10) || 0;
  const maxDons = calcularLimiteDonsPsiquicosAprendidos(nvDons);

  const dadosEsperSalvos = classeObj?.dados_esper || habDons?.dados_esper || ficha?.dados_esper || {};
  const donsSalvosIniciais = habDons?.dons_aprendidos || dadosEsperSalvos.donsAprendidos || [];

  const [donsAprendidos, setDonsAprendidos] = useState(() => {
    if (Array.isArray(donsSalvosIniciais) && donsSalvosIniciais.length > 0) {
      return donsSalvosIniciais.slice(0, maxDons > 0 ? maxDons : undefined);
    }
    return [];
  });

  const [isModalDonsOpen, setIsModalDonsOpen] = useState(false);
  const [relogioSecoes, setRelogioSecoes] = useState(dadosEsperSalvos.relogioSecoes || 0);
  const [focoAtivo, setFocoAtivo] = useState(dadosEsperSalvos.focoAtivo || false);
  const [alvoFoco, setAlvoFoco] = useState(dadosEsperSalvos.alvoFoco || '');
  const [tipoAlvo, setTipoAlvo] = useState(dadosEsperSalvos.tipoAlvo || 'aliado');
  const [unicoAlvo, setUnicoAlvo] = useState(true);

  const [dadivaKey, setDadivaKey] = useState(() => {
    if (donsAprendidos.length > 0) return donsAprendidos[0];
    return dadosEsperSalvos.dadivaKey || 'atmocinese';
  });
  const [tipoDano, setTipoDano] = useState('ar');
  const [statusEscolhido, setStatusEscolhido] = useState('Abalado');
  const [feedback, setFeedback] = useState('');

  const custoAtualDadiva = calcularCustoPsychicGift(relogioSecoes);
  const bonusFoco = calcularBonusCognitiveFocus(nvFocoCognitivo);
  const reducaoHiper = calcularReducaoHypercognition(nvHipercognicao, unicoAlvo);

  const dadivaSelecionada = useMemo(() => {
    return catalogoDons.find((g) => g.key === dadivaKey) || catalogoDons[0] || null;
  }, [catalogoDons, dadivaKey]);

  const donsDisponiveis = useMemo(() => {
    if (donsAprendidos.length === 0) return catalogoDons;
    return catalogoDons.filter((g) => donsAprendidos.includes(g.key));
  }, [catalogoDons, donsAprendidos]);

  const salvarEsper = async (novosDados = {}) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      donsAprendidos,
      relogioSecoes,
      focoAtivo,
      alvoFoco,
      tipoAlvo,
      dadivaKey,
      ...novosDados
    };
    if (fichaIdReal) {
      await fichaService.salvarDadosEsper(fichaIdReal, payload, classes);
    }
    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => (c.nome_classe || '').toLowerCase().includes('esper'),
        (c) => ({ ...c, dados_esper: payload })
      );
    }
  };

  const handleToggleDomAprendido = (key) => {
    let novosDons;
    if (donsAprendidos.includes(key)) {
      novosDons = donsAprendidos.filter((k) => k !== key);
    } else {
      if (maxDons > 0 && donsAprendidos.length >= maxDons) {
        showAlert(`Limite atingido! Seu nível de Dons Psíquicos (${nvDons}) permite aprender no máximo ${maxDons} dons.`);
        return;
      }
      novosDons = [...donsAprendidos, key];
    }
    setDonsAprendidos(novosDons);
    salvarEsper({ donsAprendidos: novosDons });
    if (!novosDons.includes(dadivaKey) && novosDons.length > 0) {
      setDadivaKey(novosDons[0]);
    }
  };

  const handleSalvarDonsModal = async (novosDons) => {
    const validos = Array.isArray(novosDons) ? novosDons : [];
    setDonsAprendidos(validos);
    if (!validos.includes(dadivaKey) && validos.length > 0) {
      setDadivaKey(validos[0]);
    }
    await salvarEsper({ donsAprendidos: validos });
  };

  const handleToggleSecao = (secaoNum) => {
    const novo = relogioSecoes === secaoNum ? secaoNum - 1 : secaoNum;
    setRelogioSecoes(novo);
    salvarEsper({ relogioSecoes: novo });
  };

  const handleAvancarRelogio = () => {
    const novo = avancarBrainwaveClock(relogioSecoes);
    setRelogioSecoes(novo);
    salvarEsper({ relogioSecoes: novo });
  };

  const handleResetarRelogio = () => {
    const novo = resetarBrainwaveClock();
    setRelogioSecoes(novo);
    salvarEsper({ relogioSecoes: novo });
  };

  const handleAtivarDadiva = () => {
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 999);
    if (mpAtual < custoAtualDadiva) {
      showAlert(`PM insuficiente! Dom requer ${custoAtualDadiva} PM, você possui ${mpAtual} PM.`);
      return;
    }

    const resultado = processarAtivacaoPsychicGift({
      giftKey: dadivaKey,
      giftObjeto: dadivaSelecionada,
      catalogoDons,
      tipoEscolhido: tipoDano,
      secoesRelogio: relogioSecoes,
      danoBase: 0,
      statusEscolhido,
      dadoVon: ficha?.vontade || ficha?.von || 8
    });

    if (resultado.sucesso) {
      if (handleAjustarRecurso) {
        handleAjustarRecurso('mp_atual', -resultado.custoMp);
      }
      setRelogioSecoes(resultado.novoRelogio);
      setFeedback(resultado.mensagem);
      salvarEsper({ relogioSecoes: resultado.novoRelogio });
    }
  };

  return {
    catalogoDons,
    nivelEsper,
    nvFocoCognitivo,
    nvHipercognicao,
    nvDons,
    maxDons,
    donsAprendidos,
    donsDisponiveis,
    isModalDonsOpen,
    setIsModalDonsOpen,
    relogioSecoes,
    focoAtivo,
    setFocoAtivo,
    alvoFoco,
    setAlvoFoco,
    tipoAlvo,
    setTipoAlvo,
    unicoAlvo,
    setUnicoAlvo,
    dadivaKey,
    setDadivaKey,
    tipoDano,
    setTipoDano,
    statusEscolhido,
    setStatusEscolhido,
    feedback,
    custoAtualDadiva,
    bonusFoco,
    reducaoHiper,
    dadivaSelecionada,
    handleToggleDomAprendido,
    handleSalvarDonsModal,
    handleToggleSecao,
    handleAvancarRelogio,
    handleResetarRelogio,
    handleAtivarDadiva
  };
}
