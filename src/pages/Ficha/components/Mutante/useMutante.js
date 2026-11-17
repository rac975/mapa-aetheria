import { useState, useMemo, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import { useAlert } from '../../../../contexts/useAlert';
import {
  THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT,
  calcularCustoAtivacaoTeriomorfose,
  validarManifestacaoTerioformas,
  calcularBonusAkromorphosis,
  processarBiofagiaCura,
  calcularLimiteTerioformasAprendidas,
  calcularDefesaPlacophora,
  processarEcdise
} from '../../../../domain/fabula/technoFantasyRules';

export function useMutante({
  ficha,
  classe,
  classeObjeto,
  classes,
  handleAjustarRecurso,
  emCriseGlobal,
  pvMaxCalculado,
  onAtualizarMutante
}) {
  const { showAlert } = useAlert();
  const [catalogoTerioformas, setCatalogoTerioformas] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoTerioformas()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoTerioformas(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo de Terioformas:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classeObjeto ||
    classes?.find((c) => (c.nome_classe || '').toLowerCase().includes('mutant')) ||
    (ficha?.habilidades ? ficha : null);

  const habs = classeObj?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nivelMutante = parseInt(classeObj?.nivel, 10) || 1;
  const habTerio = habs.find((h) => {
    const norm = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return norm.includes('teriomorfose');
  });
  const nvTeriomorfose = parseInt(habTerio?.nivel, 10) || 0;
  const maxTerioformas = calcularLimiteTerioformasAprendidas(nvTeriomorfose);
  const nvAcromorfose = getNivel('acromorfose');
  const nvBiofagia = getNivel('biofag');
  const nvEcdise = getNivel('ecdise');
  const nvGenoclepse = getNivel('genocleps');

  const pvMax = pvMaxCalculado || Number(ficha?.hp_max ?? 30);
  const pvAtual = Number(ficha?.hp_atual ?? ficha?.pv_atual ?? pvMax);
  const limiteCrise = Math.floor(pvMax / 2);
  const isCrise = emCriseGlobal !== undefined ? emCriseGlobal : pvAtual <= limiteCrise;

  const dadosMutanteSalvos = classeObj?.dados_mutante || habTerio?.dados_mutante || ficha?.dados_mutante || {};
  const terioSalvasIniciais = habTerio?.terioformas_aprendidas || dadosMutanteSalvos.terioformasAprendidas || [];

  function maxDonsLimit(limit) {
    return limit > 0 ? limit : undefined;
  }

  const [terioformasAprendidas, setTerioformasAprendidas] = useState(() => {
    if (Array.isArray(terioSalvasIniciais) && terioSalvasIniciais.length > 0) {
      return terioSalvasIniciais.slice(0, maxDonsLimit(maxTerioformas));
    }
    return [];
  });

  const [terioformasAtivas, setTerioformasAtivas] = useState(dadosMutanteSalvos.terioformasAtivas || []);
  const [teriomorfoseManifestada, setTeriomorfoseManifestada] = useState(dadosMutanteSalvos.teriomorfoseManifestada || false);
  const [categoriaArma, setCategoriaArma] = useState(dadosMutanteSalvos.categoriaArma || 'Armas de Luta');
  const [resistenciaEcdise, setResistenciaEcdise] = useState(dadosMutanteSalvos.resistenciaEcdise || null);
  const [tipoDanoEcdise, setTipoDanoEcdise] = useState('fogo');
  const [isModalTerioOpen, setIsModalTerioOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const terioformasAprendidasObjetos = useMemo(() => {
    return catalogoTerioformas.filter((tf) => terioformasAprendidas.includes(tf.key));
  }, [catalogoTerioformas, terioformasAprendidas]);

  const custoTeriomorfose = calcularCustoAtivacaoTeriomorfose(pvAtual);
  const bonusAcro = calcularBonusAkromorphosis(nvAcromorfose);
  const temNeurophagoida = terioformasAtivas.includes('neurophagoida');
  const temPlacophora = terioformasAtivas.includes('placophora');
  const defesaPlacophora = temPlacophora ? calcularDefesaPlacophora(nvTeriomorfose) : null;
  const biofagiaInfo = processarBiofagiaCura(nvBiofagia, isCrise, temNeurophagoida);

  const salvarMutante = async (novosDados = {}) => {
    const fichaIdReal = ficha?.id || classeObj?.ficha_id;
    const dadosAtualizados = {
      terioformasAprendidas,
      terioformasAtivas,
      teriomorfoseManifestada,
      categoriaArma,
      resistenciaEcdise,
      ...novosDados
    };
    if (fichaIdReal) {
      await fichaService.salvarDadosMutante(
        fichaIdReal,
        dadosAtualizados,
        classes
      );
    }
    if (onAtualizarMutante) {
      onAtualizarMutante(dadosAtualizados);
    }
  };

  const handleSetCategoriaArma = (novaCategoria) => {
    setCategoriaArma(novaCategoria);
    salvarMutante({ categoriaArma: novaCategoria });
  };

  const handleToggleTerioformaAprendida = (key) => {
    let novasAprendidas;
    if (terioformasAprendidas.includes(key)) {
      novasAprendidas = terioformasAprendidas.filter((k) => k !== key);
      if (terioformasAtivas.includes(key)) {
        const novasAtivas = terioformasAtivas.filter((k) => k !== key);
        setTerioformasAtivas(novasAtivas);
      }
    } else {
      if (maxTerioformas > 0 && terioformasAprendidas.length >= maxTerioformas) {
        showAlert(`Limite atingido! Seu nível em Teriomorfose (${nvTeriomorfose}) permite aprender no máximo ${maxTerioformas} terioformas.`);
        return;
      }
      novasAprendidas = [...terioformasAprendidas, key];
    }
    setTerioformasAprendidas(novasAprendidas);
    salvarMutante({ terioformasAprendidas: novasAprendidas });
  };

  const handleToggleTerioformaAtiva = (key) => {
    let novasAtivas;
    if (terioformasAtivas.includes(key)) {
      novasAtivas = terioformasAtivas.filter((k) => k !== key);
    } else {
      if (terioformasAtivas.length >= THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT) {
        showAlert(`Limite atingido! A Teriomorfose permite no máximo ${THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT} terioformas ativas simultâneas.`);
        return;
      }
      novasAtivas = [...terioformasAtivas, key];
    }

    const validacao = validarManifestacaoTerioformas(novasAtivas, THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT);
    if (!validacao.valido) {
      showAlert(validacao.mensagem);
      return;
    }
    setTerioformasAtivas(novasAtivas);
    salvarMutante({ terioformasAtivas: novasAtivas });
  };

  const handleAtivarTeriomorfose = () => {
    if (terioformasAtivas.length === 0) {
      showAlert('Selecione pelo menos 1 Terioforma aprendida antes de manifestar a Teriomorfose!');
      return;
    }
    if (pvAtual <= custoTeriomorfose) {
      showAlert(`PV insuficiente! O custo de 1/3 do PV atual é ${custoTeriomorfose} PV.`);
      return;
    }
    if (handleAjustarRecurso && custoTeriomorfose > 0) {
      handleAjustarRecurso('hp_atual', -custoTeriomorfose);
    }
    setTeriomorfoseManifestada(true);
    setFeedback(`Teriomorfose manifestada com sucesso! Gasto de ${custoTeriomorfose} PV (1/3 do PV atual).`);
    salvarMutante({ teriomorfoseManifestada: true });
  };

  const handleEncerrarCena = () => {
    setTeriomorfoseManifestada(false);
    setTerioformasAtivas([]);
    setFeedback('Terioformas dissipadas no encerramento da cena.');
    salvarMutante({ teriomorfoseManifestada: false, terioformasAtivas: [] });
  };

  const handleCuraBiofagia = () => {
    if (!handleAjustarRecurso || !biofagiaInfo.emCrise || biofagiaInfo.curaPv <= 0) return;
    handleAjustarRecurso('hp_atual', biofagiaInfo.curaPv);
    if (biofagiaInfo.curaMp > 0) {
      handleAjustarRecurso('mp_atual', biofagiaInfo.curaMp);
    }
    setFeedback(biofagiaInfo.mensagem);
  };

  const handleAtivarEcdise = () => {
    const res = processarEcdise({ pvAtual, tipoDanoSofrido: tipoDanoEcdise });
    if (!res.sucesso) {
      showAlert(res.mensagem);
      return;
    }
    if (handleAjustarRecurso) {
      handleAjustarRecurso('hp_atual', -res.custoPv);
    }
    setResistenciaEcdise(res.tipoResistencia);
    setFeedback(res.mensagem);
    salvarMutante({ resistenciaEcdise: res.tipoResistencia });
  };

  return {
    catalogoTerioformas,
    terioformasAprendidasObjetos,
    nivelMutante,
    nvTeriomorfose,
    maxTerioformas,
    nvAcromorfose,
    nvBiofagia,
    nvEcdise,
    nvGenoclepse,
    limiteCrise,
    isCrise,
    pvAtual,
    terioformasAprendidas,
    terioformasAtivas,
    teriomorfoseManifestada,
    categoriaArma,
    setCategoriaArma,
    handleSetCategoriaArma,
    resistenciaEcdise,
    tipoDanoEcdise,
    setTipoDanoEcdise,
    isModalTerioOpen,
    setIsModalTerioOpen,
    feedback,
    custoTeriomorfose,
    bonusAcro,
    temNeurophagoida,
    temPlacophora,
    defesaPlacophora,
    biofagiaInfo,
    handleToggleTerioformaAprendida,
    handleToggleTerioformaAtiva,
    handleAtivarTeriomorfose,
    handleEncerrarCena,
    handleCuraBiofagia,
    handleAtivarEcdise
  };
}
