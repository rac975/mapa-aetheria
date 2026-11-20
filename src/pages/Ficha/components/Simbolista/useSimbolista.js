import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  ehClasseSimbolista,
  possuiPoderHeroicoHF,
  calcularLimiteSimbolosAprendidos,
  calcularLimiteSimbolosAtivos,
  calcularLimitePmSimbolosMagicos,
  calcularCustoCriacaoSimbolo,
  calcularValorSimboloProibicao,
  processarCriacaoSimbolo,
  normalizarTextoHF
} from '../../../../domain/fabula/highFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoHF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useSimbolista({
  ficha,
  classe,
  classes = [],
  reducaoCustoPi = 0,
  nivelTotal = 5,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoSimbolos, setCatalogoSimbolos] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoSimbolos()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoSimbolos(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Símbolos:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseSimbolista(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelSimbolista = parseInt(classeObj?.nivel, 10) || 1;
  const nvSimbolismo = getNivelHabilidade(habs, 'simbolismo');
  const nvSimbolosMagicos = getNivelHabilidade(habs, 'simbolos magicos');
  const nvToquePessoal = getNivelHabilidade(habs, 'toque pessoal');
  const nvConexaoSimbolica = getNivelHabilidade(habs, 'conexao simbolica');
  const nvMiragem = getNivelHabilidade(habs, 'miragem');

  const habSimbolismo = habs.find((h) => normalizarTextoHF(h?.nome).includes('simbolismo'));
  const dadosSalvos = classeObj?.dados_simbolista || habSimbolismo?.dados_simbolista || ficha?.dados_simbolista || {};

  const maxAprendidos = calcularLimiteSimbolosAprendidos(nvSimbolismo);
  const maxAtivos = calcularLimiteSimbolosAtivos(nvSimbolismo);
  const limitePmMagicos = calcularLimitePmSimbolosMagicos(nvSimbolosMagicos);
  const danoProibicao = calcularValorSimboloProibicao(nivelTotal);

  const [simbolosAprendidos, setSimbolosAprendidos] = useState(() =>
    Array.isArray(dadosSalvos.simbolosAprendidos) ? dadosSalvos.simbolosAprendidos : []
  );
  const [simbolosAtivos, setSimbolosAtivos] = useState(() =>
    Array.isArray(dadosSalvos.simbolosAtivos) ? dadosSalvos.simbolosAtivos : []
  );
  const [simboloSelecionadoKey, setSimboloSelecionadoKey] = useState(() =>
    (Array.isArray(dadosSalvos.simbolosAprendidos) ? dadosSalvos.simbolosAprendidos[0] : '') || ''
  );
  const [escolhaOpcao, setEscolhaOpcao] = useState('');
  const [modoAplicacao, setModoAplicacao] = useState('proprio');
  const [nomeAlvo, setNomeAlvo] = useState('');
  const [seloRitualTexto, setSeloRitualTexto] = useState(dadosSalvos.seloRitualTexto || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temSelosRituais = possuiPoderHeroicoHF(poderesHeroicos, 'selos_rituais') || possuiPoderHeroicoHF(poderesHeroicos, 'selos rituais');
  const temTelaEmBranco = possuiPoderHeroicoHF(poderesHeroicos, 'tela_em_branco') || possuiPoderHeroicoHF(poderesHeroicos, 'tela em branco');
  const temMiraArcana = possuiPoderHeroicoHF(poderesHeroicos, 'mira_arcana') || possuiPoderHeroicoHF(poderesHeroicos, 'mira arcana');

  const simbolosDisponiveis = useMemo(() => {
    return catalogoSimbolos.filter((s) => simbolosAprendidos.includes(s.key));
  }, [catalogoSimbolos, simbolosAprendidos]);

  const simboloSelecionado = useMemo(() => {
    return simbolosDisponiveis.find((s) => s.key === simboloSelecionadoKey) || simbolosDisponiveis[0] || null;
  }, [simbolosDisponiveis, simboloSelecionadoKey]);

  const custoPiAtual = calcularCustoCriacaoSimbolo({ reducaoCustoPi });

  const persistirSimbolista = async (novosDados = {}) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      simbolosAprendidos,
      simbolosAtivos,
      seloRitualTexto,
      ...novosDados
    };

    if (fichaIdReal) {
      await fichaService.salvarDadosSimbolista(fichaIdReal, payload, classes);
    }

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseSimbolista(c.nome_classe),
        (c) => ({
          ...c,
          dados_simbolista: payload,
          habilidades: (c.habilidades || []).map((h) =>
            normalizarTextoHF(h?.nome).includes('simbolismo')
              ? { ...h, dados_simbolista: payload }
              : h
          )
        })
      );
    }
  };

  const handleSelecionarSimboloKey = (key) => {
    setSimboloSelecionadoKey(key);
    const encontrado = catalogoSimbolos.find((s) => s.key === key);
    if (encontrado?.requer_escolha && Array.isArray(encontrado.opcoes_escolha)) {
      setEscolhaOpcao(encontrado.opcoes_escolha[0] || '');
    } else {
      setEscolhaOpcao('');
    }
  };

  const handleSalvarAprendidosModal = async (novasChaves) => {
    setErroMsg('');
    setSimbolosAprendidos(novasChaves);
    const proxKey = novasChaves.includes(simboloSelecionadoKey) ? simboloSelecionadoKey : (novasChaves[0] || '');
    handleSelecionarSimboloKey(proxKey);
    await persistirSimbolista({ simbolosAprendidos: novasChaves });
    setFeedback('Catálogo de Símbolos aprendidos atualizado com sucesso.');
  };

  const handleCriarSimbolo = async (substituirSimboloId = null) => {
    setErroMsg('');
    setFeedback('');

    const opcoes = simboloSelecionado?.opcoes_escolha || [];
    const opcaoFinal = simboloSelecionado?.requer_escolha
      ? (opcoes.includes(escolhaOpcao) ? escolhaOpcao : (opcoes[0] || ''))
      : '';

    const piAtual = Number(ficha?.pi_atual ?? ficha?.ip_atual ?? 0);
    const resultado = processarCriacaoSimbolo({
      simbolo: simboloSelecionado,
      escolhaOpcao: opcaoFinal,
      modoAplicacao,
      nomeAlvo,
      simbolosAtivos,
      nvSimbolismo,
      piAtual,
      reducaoCustoPi,
      substituirSimboloId
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso && resultado.custoPi > 0) {
      handleAjustarRecurso('pi_atual', -resultado.custoPi);
    }

    setSimbolosAtivos(resultado.simbolosAtivos);
    setNomeAlvo('');
    setFeedback(resultado.mensagem);
    await persistirSimbolista({ simbolosAtivos: resultado.simbolosAtivos });
  };

  const handleDestruirSimbolo = async (simboloId) => {
    setErroMsg('');
    const novaLista = simbolosAtivos.filter((s) => s.id !== simboloId);
    setSimbolosAtivos(novaLista);
    setFeedback('Símbolo destruído instantaneamente (0 ações).');
    await persistirSimbolista({ simbolosAtivos: novaLista });
  };

  const handleSalvarSeloRitual = async (texto) => {
    setSeloRitualTexto(texto);
    await persistirSimbolista({ seloRitualTexto: texto });
    setFeedback(texto ? 'Selo Ritual armazenado na ficha.' : 'Selo Ritual ativado / removido.');
  };

  return {
    catalogoSimbolos,
    nivelSimbolista,
    nvSimbolismo,
    nvSimbolosMagicos,
    nvToquePessoal,
    nvConexaoSimbolica,
    nvMiragem,
    maxAprendidos,
    maxAtivos,
    limitePmMagicos,
    danoProibicao,
    custoPiAtual,
    simbolosAprendidos,
    simbolosDisponiveis,
    simbolosAtivos,
    simboloSelecionado,
    simboloSelecionadoKey,
    handleSelecionarSimboloKey,
    escolhaOpcao,
    setEscolhaOpcao,
    modoAplicacao,
    setModoAplicacao,
    nomeAlvo,
    setNomeAlvo,
    seloRitualTexto,
    temSelosRituais,
    temTelaEmBranco,
    temMiraArcana,
    isModalOpen,
    setIsModalOpen,
    feedback,
    erroMsg,
    handleSalvarAprendidosModal,
    handleCriarSimbolo,
    handleDestruirSimbolo,
    handleSalvarSeloRitual
  };
}
