import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  ehClasseMercador,
  possuiPoderHeroicoNF,
  calcularParametrosMercador,
  normalizarTextoNF
} from '../../../../domain/fabula/naturalFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoNF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useMercador({
  ficha,
  classe,
  classes = [],
  itensEquipados = [],
  nivelTotal = 5,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoMercador, setCatalogoMercador] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoMercadorItens()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoMercador(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Mercador:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseMercador(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelMercador = parseInt(classeObj?.nivel, 10) || 1;
  const nvDataDeValidade = getNivelHabilidade(habs, 'data de validade');
  const nvEstoquePessoal = getNivelHabilidade(habs, 'estoque pessoal');
  const nvJaOuviFalar = getNivelHabilidade(habs, 'ja ouvi falar');
  const nvVentosDoComercio = getNivelHabilidade(habs, 'ventos do comercio');
  const nvVerdadeiroTesouro = getNivelHabilidade(habs, 'verdadeiro tesouro');

  const habVentos = habs.find((h) => normalizarTextoNF(h?.nome).includes('ventos do comercio'));
  const dadosSalvos = classeObj?.dados_mercador || habVentos?.dados_mercador || ficha?.dados_mercador || {};

  const nomesItens = (itensEquipados || []).map((i) => normalizarTextoNF(i?.nome || '')).join(' ');
  const temCachecolArtesanal = nomesItens.includes('cachecol artesanal');
  const temPimentaEmPo = nomesItens.includes('pimenta em po');

  const [prosperidadeAssentamento, setProsperidadeAssentamento] = useState(
    parseInt(dadosSalvos.prosperidadeAssentamento, 10) || 0
  );

  const parametros = useMemo(() => {
    return calcularParametrosMercador({
      nivelPersonagem: nivelTotal,
      nvDataDeValidade,
      nvEstoquePessoal,
      nvJaOuviFalar,
      nvVentosDoComercio,
      nvVerdadeiroTesouro,
      prosperidadeAssentamento,
      temPimentaEmPo
    });
  }, [
    nivelTotal,
    nvDataDeValidade,
    nvEstoquePessoal,
    nvJaOuviFalar,
    nvVentosDoComercio,
    nvVerdadeiroTesouro,
    prosperidadeAssentamento,
    temPimentaEmPo
  ]);

  const [pontosComercio, setPontosComercio] = useState(() => {
    if (dadosSalvos.pontosComercio !== undefined && dadosSalvos.pontosComercio !== null) {
      return parseInt(dadosSalvos.pontosComercio, 10) || 0;
    }
    return nvVentosDoComercio > 0 ? 2 : 0;
  });
  const [registrosComerciais, setRegistrosComerciais] = useState(() =>
    Array.isArray(dadosSalvos.registrosComerciais) ? dadosSalvos.registrosComerciais : []
  );
  const [tipoVentos, setTipoVentos] = useState('item_raro');
  const [textoVentos, setTextoVentos] = useState('');
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temPorUmFuturoMelhor =
    possuiPoderHeroicoNF(poderesHeroicos, 'por_um_futuro_melhor') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'por um futuro melhor');
  const temCochiloPoderoso =
    possuiPoderHeroicoNF(poderesHeroicos, 'cochilo_poderoso') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'cochilo poderoso');
  const temDosagemPrecisa =
    possuiPoderHeroicoNF(poderesHeroicos, 'dosagem_precisa') ||
    possuiPoderHeroicoNF(poderesHeroicos, 'dosagem precisa');

  const persistirMercador = async (novosDados = {}) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      pontosComercio,
      prosperidadeAssentamento,
      registrosComerciais,
      temPimentaEmPo,
      ...novosDados
    };

    if (fichaIdReal) {
      await fichaService.salvarDadosMercador(fichaIdReal, payload, classes);
    }

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseMercador(c.nome_classe),
        (c) => ({
          ...c,
          dados_mercador: payload,
          habilidades: (c.habilidades || []).map((h) =>
            normalizarTextoNF(h?.nome).includes('ventos do comercio')
              ? { ...h, dados_mercador: payload }
              : h
          )
        })
      );
    }
  };

  const handleAjustarPontosComercio = async (delta) => {
    setErroMsg('');
    const teto = parametros.maxPontosComercio || 99;
    const novo = Math.max(0, Math.min(teto, pontosComercio + delta));
    setPontosComercio(novo);
    await persistirMercador({ pontosComercio: novo });
  };

  const handleDescansoComercial = async (investirProsperidade = false) => {
    setErroMsg('');
    if (nvVentosDoComercio <= 0) {
      setErroMsg('Adquira Ventos do Comércio para receber Pontos de Comércio ao descansar.');
      return;
    }

    const teto = parametros.maxPontosComercio;
    if (investirProsperidade && temPorUmFuturoMelhor && parametros.ganhoDescansoComercio >= 2) {
      const novoPc = Math.min(teto, pontosComercio + 1);
      const novaProsp = prosperidadeAssentamento + parametros.aumentoProsperidadePorDescanso;
      setPontosComercio(novoPc);
      setProsperidadeAssentamento(novaProsp);
      setFeedback(
        `Por um Futuro Melhor: +1 Ponto de Comércio e Prosperidade do Assentamento aumentada em +${parametros.aumentoProsperidadePorDescanso} (Total: ${novaProsp})!`
      );
      await persistirMercador({ pontosComercio: novoPc, prosperidadeAssentamento: novaProsp });
      return;
    }

    const novoPc = Math.min(teto, pontosComercio + parametros.ganhoDescansoComercio);
    setPontosComercio(novoPc);
    setFeedback(`Descanso em área comercial: +${parametros.ganhoDescansoComercio} Pontos de Comércio (${novoPc}/${teto}).`);
    await persistirMercador({ pontosComercio: novoPc });
  };

  const handleVerdadeiroTesouro = async () => {
    setErroMsg('');
    if (nvVentosDoComercio <= 0 || nvVerdadeiroTesouro <= 0) {
      setErroMsg('Verdadeiro Tesouro exige possuir também Ventos do Comércio.');
      return;
    }
    const teto = parametros.maxPontosComercio;
    const ganho = parametros.ganhoVerdadeiroTesouro;
    const novoPc = Math.min(teto, pontosComercio + ganho);
    setPontosComercio(novoPc);

    if (temCachecolArtesanal && handleAjustarRecurso) {
      handleAjustarRecurso('fabula', 1);
    }

    setFeedback(
      `Verdadeiro Tesouro ativado! +${ganho} Pontos de Comércio (${novoPc}/${teto})${temCachecolArtesanal ? ' + 1 Ponto de Fábula (Cachecol Artesanal)!' : '.'}`
    );
    await persistirMercador({ pontosComercio: novoPc });
  };

  const handleUsarEstoquePessoal = async () => {
    setErroMsg('');
    if (nvEstoquePessoal <= 0) return;
    if (pontosComercio < 1) {
      setErroMsg('Pontos de Comércio insuficientes (requer 1 PC).');
      return;
    }
    const novoPc = pontosComercio - 1;
    setPontosComercio(novoPc);
    setFeedback(
      `Estoque Pessoal (-1 PC): Você ou um aliado ignora um gasto de até ${parametros.limitePiEstoquePessoal} PI!`
    );
    await persistirMercador({ pontosComercio: novoPc });
  };

  const handleUsarJaOuviFalar = async () => {
    setErroMsg('');
    if (nvJaOuviFalar <= 0) return;
    if (pontosComercio < 1) {
      setErroMsg('Pontos de Comércio insuficientes (requer 1 PC).');
      return;
    }
    const novoPc = pontosComercio - 1;
    setPontosComercio(novoPc);
    setFeedback(
      `Já Ouvi Falar (-1 PC): +${parametros.bonusExaminarJaOuviFalar} concedido ao teste para examinar criatura, item ou local!`
    );
    await persistirMercador({ pontosComercio: novoPc });
  };

  const handleConverterEmFabula = async () => {
    setErroMsg('');
    if (!temPorUmFuturoMelhor || pontosComercio < 1) {
      setErroMsg('Requer Por um Futuro Melhor e pelo menos 1 Ponto de Comércio.');
      return;
    }
    const novoPc = pontosComercio - 1;
    setPontosComercio(novoPc);
    if (handleAjustarRecurso) handleAjustarRecurso('fabula', 1);
    setFeedback('Por um Futuro Melhor: 1 Ponto de Comércio convertido em 1 Ponto de Fábula!');
    await persistirMercador({ pontosComercio: novoPc });
  };

  const handleExecutarVentosDoComercio = async () => {
    setErroMsg('');
    if (nvVentosDoComercio <= 0) return;
    if (pontosComercio < 2) {
      setErroMsg('Ventos do Comércio exige gastar 2 Pontos de Comércio.');
      return;
    }
    const desc = textoVentos.trim() || (tipoVentos === 'item_raro' ? 'Material / Item Raro Comercial' : 'Contato NPC Local');
    const novoPc = pontosComercio - 2;
    const novoReg = {
      id: `comercio_${Date.now()}`,
      tipo: tipoVentos,
      descricao: desc,
      valorMaxZenit: tipoVentos === 'item_raro' ? parametros.orcamentoMaxItemRaroZenit : null
    };

    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    if (tipoVentos === 'item_raro' && fichaIdReal) {
      try {
        await fichaService.addItemPersonagem({
          ficha_id: fichaIdReal,
          nome: desc,
          tipo: 'Material / Item Raro',
          quantidade: 1,
          equipado: false,
          stats_personalizados: {
            custo: parametros.orcamentoMaxItemRaroZenit,
            valor_zenites: parametros.orcamentoMaxItemRaroZenit,
            efeito: `Criado via Ventos do Comércio (valor máx. ${parametros.orcamentoMaxItemRaroZenit}z).`
          }
        });
      } catch (err) {
        console.error('Erro ao adicionar item de Ventos do Comércio:', err);
      }
    }

    const novaLista = [novoReg, ...registrosComerciais];
    setPontosComercio(novoPc);
    setRegistrosComerciais(novaLista);
    setTextoVentos('');
    setFeedback(
      tipoVentos === 'item_raro'
        ? `Ventos do Comércio (-2 PC): "${desc}" (até ${parametros.orcamentoMaxItemRaroZenit}z) criado e adicionado à mochila!`
        : `Ventos do Comércio (-2 PC): Contato NPC "${desc}" estabelecido na região!`
    );
    await persistirMercador({ pontosComercio: novoPc, registrosComerciais: novaLista });
  };

  return {
    catalogoMercador, nivelMercador,
    nvDataDeValidade, nvEstoquePessoal, nvJaOuviFalar, nvVentosDoComercio, nvVerdadeiroTesouro,
    parametros, pontosComercio, prosperidadeAssentamento, setProsperidadeAssentamento,
    registrosComerciais, tipoVentos, setTipoVentos, textoVentos, setTextoVentos,
    temPorUmFuturoMelhor, temCochiloPoderoso, temDosagemPrecisa,
    feedback, erroMsg,
    handleAjustarPontosComercio, handleDescansoComercial, handleVerdadeiroTesouro,
    handleUsarEstoquePessoal, handleUsarJaOuviFalar, handleConverterEmFabula,
    handleExecutarVentosDoComercio, persistirMercador
  };
}
