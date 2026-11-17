import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  VOLUMES_VERSO,
  ehClasseVirtuoso,
  possuiPoderHeroicoHF,
  calcularLimiteMagicanto,
  validarSelecaoMagicanto,
  calcularCustoVerso,
  calcularValoresVerso,
  processarCantoVerso,
  normalizarTextoHF
} from '../../../../domain/fabula/highFantasyRules';

const getNivelHabilidade = (habs, termo) => {
  const h = (habs || []).find((item) => normalizarTextoHF(item?.nome).includes(termo));
  return parseInt(h?.nivel, 10) || 0;
};

export function useVirtuoso({
  ficha,
  classe,
  classes = [],
  itensEquipados = [],
  nivelTotal = 5,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [catalogoEscalas, setCatalogoEscalas] = useState([]);
  const [catalogoTons, setCatalogoTons] = useState([]);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      fichaService.getCatalogoVirtuosoEscalas(),
      fichaService.getCatalogoVirtuosoTons()
    ])
      .then(([escalas, tons]) => {
        if (!cancelado) {
          if (Array.isArray(escalas)) setCatalogoEscalas(escalas);
          if (Array.isArray(tons)) setCatalogoTons(tons);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogos do Virtuoso:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classes.find((c) => ehClasseVirtuoso(c.nome_classe)) ||
    null;

  const habs = classeObj?.habilidades || [];
  const nivelVirtuoso = parseInt(classeObj?.nivel, 10) || 1;
  const nvMagicanto = getNivelHabilidade(habs, 'magicanto');
  const nvBarreiraSonora = getNivelHabilidade(habs, 'barreira sonora');
  const nvHarmonia = getNivelHabilidade(habs, 'harmonia');
  const nvVibrato = getNivelHabilidade(habs, 'vibrato');
  const nvCantoSereia = getNivelHabilidade(habs, 'canto da sereia');

  const habMagicanto = habs.find((h) => normalizarTextoHF(h?.nome).includes('magicanto'));
  const dadosSalvos = classeObj?.dados_virtuoso || habMagicanto?.dados_virtuoso || ficha?.dados_virtuoso || {};

  const limiteMagicanto = calcularLimiteMagicanto(nvMagicanto);

  const [escalasAprendidas, setEscalasAprendidas] = useState(() =>
    Array.isArray(dadosSalvos.escalasAprendidas) ? dadosSalvos.escalasAprendidas : []
  );
  const [tonsAprendidos, setTonsAprendidos] = useState(() =>
    Array.isArray(dadosSalvos.tonsAprendidos) ? dadosSalvos.tonsAprendidos : []
  );

  const [volumeKey, setVolumeKey] = useState(dadosSalvos.ultimoVolumeKey || 'fraco');
  const [escalaKey, setEscalaKey] = useState(
    dadosSalvos.ultimaEscalaKey || (Array.isArray(dadosSalvos.escalasAprendidas) ? dadosSalvos.escalasAprendidas[0] : '') || ''
  );
  const [tomKey, setTomKey] = useState(
    dadosSalvos.ultimoTomKey || (Array.isArray(dadosSalvos.tonsAprendidos) ? dadosSalvos.tonsAprendidos[0] : '') || ''
  );

  const [musicaTemaAtiva, setMusicaTemaAtiva] = useState(Boolean(dadosSalvos.musicaTemaAtiva));
  const [escalaMusicaTema, setEscalaMusicaTema] = useState(dadosSalvos.escalaMusicaTema || '');
  const [trilhaEpicaModo, setTrilhaEpicaModo] = useState('nenhum');
  const [alvoFracoEhInimigo, setAlvoFracoEhInimigo] = useState(false);
  const [temFocoCognitivoAlvo, setTemFocoCognitivoAlvo] = useState(false);
  const [unicoAlvoFoco, setUnicoAlvoFoco] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const [ultimoVersoResumo, setUltimoVersoResumo] = useState(dadosSalvos.ultimoVersoResumo || null);

  const poderesHeroicos = ficha?.poderes_heroicos || [];
  const temMusicaTema = possuiPoderHeroicoHF(poderesHeroicos, 'musica_tema') || possuiPoderHeroicoHF(poderesHeroicos, 'musica tema');
  const temTrilhaEpica = possuiPoderHeroicoHF(poderesHeroicos, 'trilha_epica') || possuiPoderHeroicoHF(poderesHeroicos, 'trilha epica');

  const esperClass = classes.find((c) => normalizarTextoHF(c.nome_classe).includes('esper'));
  const nvHipercognicao = getNivelHabilidade(esperClass?.habilidades || [], 'hipercognicao');

  const temArmaArcanaEquipada = useMemo(() => {
    return (itensEquipados || []).some((item) => {
      const cat = normalizarTextoHF(item?.stats_personalizados?.categoria || item?.tipo || '');
      return cat.includes('arcana') || cat.includes('cajado') || cat.includes('tomo');
    });
  }, [itensEquipados]);

  const escalasDisponiveis = useMemo(() => {
    if (escalasAprendidas.length === 0) return [];
    return catalogoEscalas.filter((e) => escalasAprendidas.includes(e.key));
  }, [catalogoEscalas, escalasAprendidas]);

  const tonsDisponiveis = useMemo(() => {
    if (tonsAprendidos.length === 0) return [];
    return catalogoTons.filter((t) => tonsAprendidos.includes(t.key));
  }, [catalogoTons, tonsAprendidos]);

  const escalaSelecionada = useMemo(() => {
    return escalasDisponiveis.find((e) => e.key === escalaKey) || escalasDisponiveis[0] || null;
  }, [escalasDisponiveis, escalaKey]);

  const tomSelecionado = useMemo(() => {
    return tonsDisponiveis.find((t) => t.key === tomKey) || tonsDisponiveis[0] || null;
  }, [tonsDisponiveis, tomKey]);

  const custoAtual = useMemo(() => {
    return calcularCustoVerso({
      volumeKey,
      escalaKey: escalaSelecionada?.key || '',
      musicaTemaAtiva: temMusicaTema && musicaTemaAtiva,
      escalaMusicaTema,
      trilhaEpicaModo: temTrilhaEpica ? trilhaEpicaModo : 'nenhum',
      temFocoCognitivoAlvo,
      nvHipercognicao,
      unicoAlvoFoco
    });
  }, [
    volumeKey,
    escalaSelecionada,
    temMusicaTema,
    musicaTemaAtiva,
    escalaMusicaTema,
    temTrilhaEpica,
    trilhaEpicaModo,
    temFocoCognitivoAlvo,
    nvHipercognicao,
    unicoAlvoFoco
  ]);

  const previewValores = useMemo(() => {
    return calcularValoresVerso({
      nivelPersonagem: nivelTotal,
      dadoVontade: ficha?.vontade || 8,
      escala: escalaSelecionada,
      tom: tomSelecionado,
      musicaTemaAtivaMesmaEscala:
        temMusicaTema &&
        musicaTemaAtiva &&
        normalizarTextoHF(escalaSelecionada?.key) === normalizarTextoHF(escalaMusicaTema)
    });
  }, [nivelTotal, ficha?.vontade, escalaSelecionada, tomSelecionado, temMusicaTema, musicaTemaAtiva, escalaMusicaTema]);

  const persistirVirtuoso = async (novosDados = {}) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const payload = {
      escalasAprendidas,
      tonsAprendidos,
      ultimoVolumeKey: volumeKey,
      ultimaEscalaKey: escalaSelecionada?.key || escalaKey,
      ultimoTomKey: tomSelecionado?.key || tomKey,
      musicaTemaAtiva,
      escalaMusicaTema,
      ultimoVersoResumo,
      ...novosDados
    };
    if (fichaIdReal) {
      await fichaService.salvarDadosVirtuoso(fichaIdReal, payload, classes);
    }
    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => ehClasseVirtuoso(c.nome_classe),
        (c) => ({ ...c, dados_virtuoso: payload })
      );
    }
  };

  const handleSalvarRepertorio = async (novasEscalas, novosTons) => {
    const validacao = validarSelecaoMagicanto(nvMagicanto, novasEscalas, novosTons);
    if (!validacao.valido) {
      setErroMsg(validacao.motivo || 'Seleção inválida para seu nível em Magicanto.');
      return false;
    }

    setErroMsg('');
    setEscalasAprendidas(novasEscalas);
    setTonsAprendidos(novosTons);

    const proxEscala = novasEscalas.includes(escalaKey) ? escalaKey : (novasEscalas[0] || '');
    const proxTom = novosTons.includes(tomKey) ? tomKey : (novosTons[0] || '');
    setEscalaKey(proxEscala);
    setTomKey(proxTom);

    await persistirVirtuoso({
      escalasAprendidas: novasEscalas,
      tonsAprendidos: novosTons,
      ultimaEscalaKey: proxEscala,
      ultimoTomKey: proxTom
    });
    setFeedback('Repertório de Escalas e Tons salvo com sucesso.');
    return true;
  };

  const handleCantarVerso = async () => {
    setErroMsg('');
    setFeedback('');

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    const fabulaAtual = Number(ficha?.fabula ?? 0);

    const resultado = processarCantoVerso({
      volumeKey,
      escala: escalaSelecionada,
      tom: tomSelecionado,
      mpAtual,
      fabulaAtual,
      nivelPersonagem: nivelTotal,
      dadoVontade: ficha?.vontade || 8,
      nvBarreiraSonora,
      nvHarmonia,
      nvVibrato,
      temArmaArcanaEquipada,
      alvoFracoEhInimigo,
      musicaTemaAtiva: temMusicaTema && musicaTemaAtiva,
      escalaMusicaTema,
      trilhaEpicaModo: temTrilhaEpica ? trilhaEpicaModo : 'nenhum',
      temFocoCognitivoAlvo,
      nvHipercognicao,
      unicoAlvoFoco
    });

    if (!resultado.sucesso) {
      setErroMsg(resultado.mensagem);
      return;
    }

    if (handleAjustarRecurso && resultado.custoPm > 0) {
      handleAjustarRecurso('mp_atual', -resultado.custoPm);
    }
    if (handleAjustarRecurso && resultado.custoFabula > 0) {
      handleAjustarRecurso('fabula', -resultado.custoFabula);
    }

    const resumo = {
      titulo: `${resultado.volume.nome} • ${resultado.escala.nome} • ${resultado.tom.nome}`,
      texto: resultado.valores.textoResolvido,
      efeitosExtras: resultado.efeitosExtras,
      custoPm: resultado.custoPm
    };
    setUltimoVersoResumo(resumo);
    setFeedback(resultado.mensagem);

    await persistirVirtuoso({
      ultimoVolumeKey: volumeKey,
      ultimaEscalaKey: resultado.escala.key,
      ultimoTomKey: resultado.tom.key,
      ultimoVersoResumo: resumo
    });
  };

  return {
    volumes: Object.values(VOLUMES_VERSO),
    catalogoEscalas,
    catalogoTons,
    nivelVirtuoso,
    nvMagicanto,
    nvBarreiraSonora,
    nvHarmonia,
    nvVibrato,
    nvCantoSereia,
    limiteMagicanto,
    escalasAprendidas,
    tonsAprendidos,
    escalasDisponiveis,
    tonsDisponiveis,
    volumeKey,
    setVolumeKey,
    escalaKey,
    setEscalaKey,
    tomKey,
    setTomKey,
    escalaSelecionada,
    tomSelecionado,
    custoAtual,
    previewValores,
    temMusicaTema,
    musicaTemaAtiva,
    setMusicaTemaAtiva,
    escalaMusicaTema,
    setEscalaMusicaTema,
    temTrilhaEpica,
    trilhaEpicaModo,
    setTrilhaEpicaModo,
    alvoFracoEhInimigo,
    setAlvoFracoEhInimigo,
    nvHipercognicao,
    temFocoCognitivoAlvo,
    setTemFocoCognitivoAlvo,
    unicoAlvoFoco,
    setUnicoAlvoFoco,
    temArmaArcanaEquipada,
    isModalOpen,
    setIsModalOpen,
    feedback,
    erroMsg,
    ultimoVersoResumo,
    handleSalvarRepertorio,
    handleCantarVerso
  };
}
