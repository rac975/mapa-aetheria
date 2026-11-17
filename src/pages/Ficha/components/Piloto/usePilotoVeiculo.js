import { useState, useEffect } from 'react';
import { fichaService } from '../../../../services/fichaService';
import {
  COMPRESSION_TECH_IP_COST,
  calcularEstatisticasVeiculo,
  validarConfiguracaoVeiculo,
  processarConfiguracaoFlexivel,
  processarTecnologiaCompressao,
  processarCoracaoNoMotor,
  calcularTotalModulosHangar
} from '../../../../domain/fabula/technoFantasyRules';

export function usePilotoVeiculo({
  fichaId,
  ficha,
  classe,
  classeObjeto,
  classes,
  handleAjustarRecurso
}) {
  const fichaIdReal = fichaId || ficha?.id;

  const [catalogoEstruturas, setCatalogoEstruturas] = useState([]);
  const [catalogoModulos, setCatalogoModulos] = useState([]);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      fichaService.getCatalogoVeiculosEstruturas(),
      fichaService.getCatalogoVeiculosModulos()
    ])
      .then(([estruturas, modulos]) => {
        if (!cancelado) {
          if (Array.isArray(estruturas)) setCatalogoEstruturas(estruturas);
          if (Array.isArray(modulos)) setCatalogoModulos(modulos);
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogos de veículo do Piloto:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const classeObj =
    classe ||
    classeObjeto ||
    classes?.find((c) => (c.nome_classe || '').toLowerCase().includes('pilot')) ||
    (ficha?.habilidades ? ficha : null);

  const habs = classeObj?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nivelPiloto = parseInt(classeObj?.nivel, 10) || 1;
  const slVeiculoPessoal = Math.max(1, getNivel('veiculo pessoal') || 1);
  const nvConfigFlexivel = getNivel('configuracao flexivel');
  const nvPulsoFirme = getNivel('pulso firme');
  const nvCoracao = getNivel('coracao no motor');
  const totalModulosPermitidos = calcularTotalModulosHangar(slVeiculoPessoal);

  const habVeiculo = habs.find((h) =>
    (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('veiculo')
  );
  const veiculoSalvo = classeObj?.veiculo || habVeiculo?.veiculo || ficha?.dados_veiculo || null;

  const [nomeVeiculo, setNomeVeiculo] = useState(() => veiculoSalvo?.nome || 'Veículo Pessoal');
  const [frameKey, setFrameKey] = useState(() => veiculoSalvo?.frameKey || 'exoesqueleto');
  const [modulosAtivos, setModulosAtivos] = useState(() =>
    veiculoSalvo?.modulosAtivos || ['blindagem_padrao', 'arma_espada', 'suporte_mira_avancada']
  );
  const [modulosReserva, setModulosReserva] = useState(() =>
    veiculoSalvo?.modulosReserva || ['blindagem_pesada', 'arma_machado', 'suporte_turbo']
  );
  const [customizacoes, setCustomizacoes] = useState(() =>
    veiculoSalvo?.customizacoes || { elementoAntiElemento: 'fogo', usarPulsoFirme: false }
  );
  const [veiculoInvocado, setVeiculoInvocado] = useState(() =>
    veiculoSalvo?.veiculoInvocado !== false
  );

  const [modalCatalogoAberto, setModalCatalogoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);
  const [feedback, setFeedback] = useState('');

  const extrairNumDado = (val, padrao = 8) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (!val) return padrao;
    const str = String(val).trim().toLowerCase().replace('d', '');
    const num = parseInt(str, 10);
    return isNaN(num) ? padrao : num;
  };

  const atributos = {
    des: extrairNumDado(ficha?.destreza ?? ficha?.atributos?.des ?? ficha?.atributos?.destreza, 8),
    int: extrairNumDado(ficha?.astucia ?? ficha?.atributos?.int ?? ficha?.atributos?.astucia, 8),
    vig: extrairNumDado(ficha?.vigor ?? ficha?.atributos?.vig ?? ficha?.atributos?.vigor, 8),
    von: extrairNumDado(ficha?.vontade ?? ficha?.atributos?.von ?? ficha?.atributos?.vontade, 8),
  };
  const piAtual = Number(ficha?.pi_atual ?? ficha?.ip_atual ?? 6);
  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 10);

  const stats = calcularEstatisticasVeiculo(
    frameKey,
    Array.isArray(modulosAtivos) ? modulosAtivos : [],
    atributos,
    slVeiculoPessoal,
    customizacoes,
    catalogoEstruturas,
    catalogoModulos
  );

  const handleAtivarModulo = (modId) => {
    const novosAtivos = [...modulosAtivos, modId];

    if (nvConfigFlexivel > 0) {
      const res = processarConfiguracaoFlexivel({
        modulosAtivosAtuais: modulosAtivos,
        modulosParaDesativar: [],
        modulosParaAtivar: [modId],
        nivelHabilidade: nvConfigFlexivel,
        frameKey,
        nivelPilotoOuSl: slVeiculoPessoal,
        catalogoEstruturas,
        catalogoModulos
      });
      if (!res.sucesso) {
        window.alert(res.mensagem);
        return;
      }
    } else {
      const validacao = validarConfiguracaoVeiculo({
        frameKey,
        modulosAtivosIds: novosAtivos,
        nivelPilotoOuSl: slVeiculoPessoal,
        catalogoEstruturas,
        catalogoModulos
      });
      if (!validacao.valido) {
        window.alert(validacao.erros.join('\n'));
        return;
      }
    }

    setModulosAtivos(novosAtivos);
    setModulosReserva((prev) => prev.filter((id) => id !== modId));
    setFeedback('Módulo ativado no veículo com sucesso!');
  };

  const handleDesativarModulo = (modId) => {
    setModulosAtivos((prev) => prev.filter((id) => id !== modId));
    if (!modulosReserva.includes(modId)) {
      setModulosReserva((prev) => [...prev, modId]);
    }
    setFeedback('Módulo transferido para a reserva.');
  };

  const handleAdicionarAoHangar = (modId) => {
    if (!modulosReserva.includes(modId) && !modulosAtivos.includes(modId)) {
      setModulosReserva((prev) => [...prev, modId]);
      setFeedback('Módulo adicionado à reserva.');
    }
  };

  const handleRemoverDaReserva = (modId) => {
    setModulosReserva((prev) => prev.filter((id) => id !== modId));
    setFeedback('Módulo removido da reserva.');
  };

  const handleChangeCustomizacao = (chave, valor) => {
    setCustomizacoes((prev) => ({ ...prev, [chave]: valor }));
  };

  const custoCompressao = frameKey === 'exoesqueleto' ? 0 : COMPRESSION_TECH_IP_COST;

  const handleAlternarCompressao = () => {
    const resultado = processarTecnologiaCompressao(piAtual, frameKey);
    if (!resultado.sucesso) {
      window.alert(resultado.mensagem);
      return;
    }

    if (resultado.custoIp > 0 && handleAjustarRecurso) {
      handleAjustarRecurso('ip_atual', -resultado.custoIp);
    }

    setVeiculoInvocado(!veiculoInvocado);
    setFeedback(
      !veiculoInvocado
        ? (resultado.custoIp > 0
            ? `Veículo invocado em campo! (-${resultado.custoIp} PI)`
            : 'Exoesqueleto invocado em campo! (0 PI)')
        : (resultado.custoIp > 0
            ? `Veículo comprimido em dispositivo portátil! (-${resultado.custoIp} PI)`
            : 'Exoesqueleto comprimido instantaneamente! (0 PI)')
    );
  };

  const handleAtivarCoracao = (modo) => {
    if (mpAtual < 10) {
      window.alert('Pontos de Magia (PM) insuficientes! São necessários 10 PM para Coração no Motor.');
      return;
    }
    const res = processarCoracaoNoMotor(nvCoracao, modo);
    if (handleAjustarRecurso) {
      handleAjustarRecurso('mp_atual', -res.custoMp);
    }
    setFeedback(res.mensagem);
  };

  const handleSalvarVeiculo = async () => {
    if (!fichaIdReal) {
      window.alert('ID da ficha não encontrado para persistência.');
      return;
    }

    setSalvando(true);
    setSalvoSucesso(false);

    const configuracao = {
      nome: nomeVeiculo || 'Veículo Pessoal',
      frameKey,
      modulosAtivos,
      modulosReserva,
      customizacoes,
      veiculoInvocado
    };

    try {
      const { sucesso, error } = await fichaService.salvarConfiguracaoVeiculo(
        fichaIdReal,
        configuracao,
        classes
      );

      if (sucesso) {
        if (habVeiculo) habVeiculo.veiculo = configuracao;
        if (classeObj) classeObj.veiculo = configuracao;
        setSalvoSucesso(true);
        setFeedback('Configuração do veículo salva na ficha com sucesso!');
        setTimeout(() => setSalvoSucesso(false), 3000);
      } else {
        window.alert(`Erro ao salvar veículo: ${error?.message || 'Falha de rede.'}`);
      }
    } finally {
      setSalvando(false);
    }
  };

  return {
    catalogoEstruturas,
    catalogoModulos,
    nomeVeiculo,
    setNomeVeiculo,
    frameKey,
    setFrameKey,
    modulosAtivos,
    modulosReserva,
    customizacoes,
    veiculoInvocado,
    custoCompressao,
    modalCatalogoAberto,
    setModalCatalogoAberto,
    salvando,
    salvoSucesso,
    feedback,
    stats,
    atributos,
    nivelPiloto,
    slVeiculoPessoal,
    nvConfigFlexivel,
    nvPulsoFirme,
    nvCoracao,
    totalModulosPermitidos,
    handleAtivarModulo,
    handleDesativarModulo,
    handleAdicionarAoHangar,
    handleRemoverDaReserva,
    handleChangeCustomizacao,
    handleAlternarCompressao,
    handleAtivarCoracao,
    handleSalvarVeiculo
  };
}
