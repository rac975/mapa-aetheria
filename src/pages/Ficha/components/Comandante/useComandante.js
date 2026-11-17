import { useState } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  ehClasseComandante,
  possuiPoderHeroicoHF,
  calcularCustoOrdemComandante,
  processarOrdemComandante,
  normalizarTextoHF
} from '../../../../domain/fabula/highFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoHF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useComandante({
  ficha,
  classe,
  classes = [],
  nivelTotal = 5,
  emCriseGlobal = false,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const classeObj =
    classe ||
    classes.find((c) => ehClasseComandante(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelComandante = parseInt(classeObj?.nivel, 10) || 1;
  const nvCarga = getNivelHabilidade(habs, 'carga de cavalaria');
  const nvCarruagem = getNivelHabilidade(habs, 'carruagem devastadora');
  const nvDecreto = getNivelHabilidade(habs, 'decreto do bispo');
  const nvGambito = getNivelHabilidade(habs, 'gambito da dama');
  const nvRoque = getNivelHabilidade(habs, 'roque do rei');

  const habRef = habs.find((h) => h?.dados_comandante);
  const dadosSalvos = classeObj?.dados_comandante || habRef?.dados_comandante || ficha?.dados_comandante || {};

  const [opcaoDecreto, setOpcaoDecreto] = useState(0);
  const [opcaoRoque, setOpcaoRoque] = useState(0);
  const [ordemAtiva, setOrdemAtiva] = useState(dadosSalvos.ordemAtiva || null);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temBatalhaIncessante =
    possuiPoderHeroicoHF(poderesHeroicos, 'batalha_incessante') ||
    possuiPoderHeroicoHF(poderesHeroicos, 'batalha incessante');
  const temTabulaRasa =
    possuiPoderHeroicoHF(poderesHeroicos, 'tabula_rasa') ||
    possuiPoderHeroicoHF(poderesHeroicos, 'tabula rasa');

  const custoOrdemPadrao = calcularCustoOrdemComandante({
    poderKey: 'carga_cavalaria',
    temBatalhaIncessante
  });

  const persistirComandante = async (novaOrdemAtiva) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = { ordemAtiva: novaOrdemAtiva };
    if (fichaIdReal) {
      await fichaService.salvarDadosComandante(fichaIdReal, payload, classes);
    }
    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseComandante(c.nome_classe),
        (c) => ({ ...c, dados_comandante: payload })
      );
    }
  };

  const handleExecutarOrdem = async (poderKey, nivelHabilidade, opcaoEscolhida = 0) => {
    setErroMsg('');
    setFeedback('');

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    const resultado = processarOrdemComandante({
      poderKey,
      nivelHabilidade,
      opcaoEscolhida,
      mpAtual,
      temBatalhaIncessante,
      temCarruagemDevastadora: nvCarruagem > 0,
      temTabulaRasa,
      emCrise: emCriseGlobal,
      nivelPersonagem: nivelTotal
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso && resultado.custoPm > 0) {
      handleAjustarRecurso('mp_atual', -resultado.custoPm);
    }

    const novaOrdem = {
      poderKey: resultado.poderKey,
      titulo: resultado.tituloOrdem,
      efeito: resultado.efeitoTexto,
      extras: resultado.extras
    };
    setOrdemAtiva(novaOrdem);
    setFeedback(resultado.mensagem);
    await persistirComandante(novaOrdem);
  };

  const handleLimparOrdemAtiva = async () => {
    setOrdemAtiva(null);
    setFeedback('Ordem tática encerrada.');
    await persistirComandante(null);
  };

  return {
    nivelComandante,
    nvCarga,
    nvCarruagem,
    nvDecreto,
    nvGambito,
    nvRoque,
    custoOrdemPadrao,
    temBatalhaIncessante,
    temTabulaRasa,
    emCriseGlobal,
    nivelTotal,
    opcaoDecreto,
    setOpcaoDecreto,
    opcaoRoque,
    setOpcaoRoque,
    ordemAtiva,
    feedback,
    erroMsg,
    handleExecutarOrdem,
    handleLimparOrdemAtiva
  };
}
