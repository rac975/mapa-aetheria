import { useState, useEffect, useCallback } from 'react';
import { fichaService } from '../services/fichaService';
import { combatService } from '../services/combatService';
import { playerSessionService } from '../services/playerSessionService';
import { useCharacterStats, calcularModificadoresCondicoes } from './useCharacterStats';
import { useCharacterRealtime } from './useCharacterRealtime';
import { useCharacterSheetActions } from './useCharacterSheetActions';

export { calcularModificadoresCondicoes };

/**
 * Hook customizado para gerenciar o estado completo e em tempo real da ficha de personagem.
 * Isola o ciclo de vida, persistência e subscriptions do Supabase conforme GEMINI.md.
 */
export function useCharacterSheet(id, navigate, isMestre = false) {
  const [ficha, setFicha] = useState(null);
  const [classes, setClasses] = useState([]);
  const [magias, setMagias] = useState([]);
  const [itensInventario, setItensInventario] = useState([]);
  const [condicoesAtivas, setCondicoesAtivas] = useState([]);
  const [modificadoresTemporarios, setModificadoresTemporarios] = useState({});

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // 1. Carregamento e identificação robusta por Token de Crachá ou ID
  const carregarDadosCompletos = useCallback(async () => {
    setCarregando(true);
    setErro('');

    const modoMestreAtivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());
    const idLimpo = id ? String(id).trim() : '';

    try {
      let fichaData = null;
      const credencial = playerSessionService.extrairCredencial(idLimpo);
      const isFormatoToken = credencial.tipo === 'token' || Boolean(
        idLimpo &&
        (/^[A-Za-z]{3}-\d{3}$/i.test(idLimpo) || playerSessionService.validarFormatoToken(idLimpo))
      );
      const tokenAlvo = credencial.token || (isFormatoToken ? playerSessionService.normalizarToken(idLimpo) : null);

      if (isFormatoToken && tokenAlvo) {
        // Fluxo de identificação via Token de Crachá Puro (ex: CYR-525 ou aetheria:ficha:CYR-525)
        const resultadoToken = await playerSessionService.buscarFichaPorToken(tokenAlvo);

        if (!resultadoToken.valido || !resultadoToken.ficha) {
          playerSessionService.encerrarSessao({
            titulo: 'Crachá Não Encontrado',
            mensagem: 'O crachá informado não foi localizado no banco de Aetheria. Por favor, reconecte seu crachá.',
            motivo: 'ficha_removida'
          });
          if (navigate) navigate('/ficha/login', { replace: true });
          return;
        }

        fichaData = resultadoToken.ficha;

        if (modoMestreAtivo) {
          playerSessionService.ativarGodMode();
          playerSessionService.sincronizarSessaoAtiva(fichaData, { isMestre: true });
        }
      } else if (modoMestreAtivo) {
        // God Mode do Mestre por ID
        playerSessionService.ativarGodMode();
        let idAlvoMestre = idLimpo || playerSessionService.obterUltimaFichaMestre();
        if (!idAlvoMestre) {
          idAlvoMestre = await fichaService.getPrimeiraFichaId();
        }
        if (!idAlvoMestre) {
          if (navigate) navigate('/mestre/fichas', { replace: true });
          return;
        }

        fichaData = await fichaService.getFichaByIdOrToken({ id: idAlvoMestre });
        if (!fichaData && !idLimpo) {
          const fallbackId = await fichaService.getPrimeiraFichaId();
          if (fallbackId) {
            fichaData = await fichaService.getFichaByIdOrToken({ id: fallbackId });
          }
        }

        if (!fichaData) {
          setErro('Ficha não encontrada no painel do Mestre.');
          return;
        }

        playerSessionService.sincronizarSessaoAtiva(fichaData, { isMestre: true });
      } else {
        // Jogador comum por ID numérico ou UUID
        const validacaoRota = playerSessionService.validarAcessoRotaFicha({
          idRota: idLimpo,
          isMestre: false
        });

        if (!validacaoRota.permitido) {
          if (validacaoRota.motivo && validacaoRota.motivo !== 'sem_sessao') {
            playerSessionService.encerrarSessao({
              titulo: validacaoRota.titulo,
              mensagem: validacaoRota.mensagem,
              motivo: validacaoRota.motivo
            });
          } else {
            playerSessionService.encerrarSessao();
          }
          if (navigate) navigate('/ficha/login', { replace: true });
          return;
        }

        fichaData = await fichaService.getFichaByIdOrToken({
          id: validacaoRota.fichaIdAlvo,
          token: validacaoRota.token
        });

        if (!fichaData) {
          playerSessionService.encerrarSessao({
            titulo: 'Crachá Não Encontrado',
            mensagem: 'A ficha associada à sua sessão não foi encontrada ou o código foi atualizado pelo Mestre. Reconecte seu crachá.',
            motivo: 'ficha_removida'
          });
          if (navigate) navigate('/ficha/login', { replace: true });
          return;
        }

        const sincronia = playerSessionService.sincronizarSessaoAtiva(fichaData, { isMestre: false });
        if (!sincronia.valida) {
          playerSessionService.encerrarSessao({
            titulo: sincronia.titulo,
            mensagem: sincronia.mensagem,
            motivo: sincronia.motivo
          });
          if (navigate) navigate('/ficha/login', { replace: true });
          return;
        }
      }

      // Inicializa os dados e estado do personagem (nome, PV, PM, IP, Fábula)
      const [classesData, magiasData, itensData, condicoesData] = await Promise.all([
        fichaService.getClassesByFichaId(fichaData.id),
        fichaService.getMagiasByFichaId(fichaData.id),
        fichaService.getItensByFichaId(fichaData.id),
        fichaService.getCondicoesCombate(fichaData.id),
        fichaService.getCatalogoFloralistaMagiseeds().catch(() => [])
      ]);

      const condicoesIniciais = Array.isArray(fichaData.condicoes) && fichaData.condicoes.length > 0
        ? fichaData.condicoes
        : (condicoesData || []);

      setFicha(fichaData);
      setClasses(classesData || []);
      setMagias(magiasData || []);
      setItensInventario(itensData || []);
      setCondicoesAtivas(condicoesIniciais);
      setModificadoresTemporarios(calcularModificadoresCondicoes(condicoesIniciais));
    } catch (err) {
      console.error('Erro ao carregar dados da ficha:', err);
      setErro('Erro ao carregar dados do banco.');
    } finally {
      setCarregando(false);
    }
  }, [id, navigate, isMestre]);

  useEffect(() => {
    carregarDadosCompletos();
  }, [carregarDadosCompletos]);

  // 2. Subscriptions em tempo real desacopladas
  useCharacterRealtime(ficha?.id, {
    setFicha, setItensInventario, setCondicoesAtivas, setModificadoresTemporarios, setClasses
  });

  // 3. Cálculos de atributos, status derivados e condições de regras desacoplados
  const { itensEquipados, statusFicha, atributosAtuaisParaCalculo, emCriseGlobal } = useCharacterStats({
    ficha, classes, itensInventario, condicoesAtivas, modificadoresTemporarios, setModificadoresTemporarios
  });

  // 4. Mutações, ajustes de recursos e persistência desacoplados
  const {
    salvando, ajustarRecurso, salvarEdicaoCompleta, atualizarDadosMutante, atualizarDadosClasseLocal
  } = useCharacterSheetActions({ ficha, setFicha, setClasses, setMagias, statusFicha, isMestre });

  const toggleCondicaoFicha = useCallback(
    async (condId) => {
      if (!ficha?.id) return;
      const cNorm = (condId || '').toLowerCase().trim();
      const novas = condicoesAtivas.includes(cNorm)
        ? condicoesAtivas.filter((c) => c !== cNorm)
        : [...condicoesAtivas, cNorm];
      setCondicoesAtivas(novas);
      setModificadoresTemporarios(calcularModificadoresCondicoes(novas));
      setFicha((prev) => (prev ? { ...prev, condicoes: novas } : prev));
      try {
        await combatService.updateIniciativaFromFicha(ficha.id, { condicoes: novas });
      } catch (err) {
        console.error('Erro ao alternar condição:', err);
      }
    },
    [ficha?.id, condicoesAtivas, setFicha]
  );

  return {
    ficha, setFicha, classes, setClasses, magias, setMagias,
    itensInventario, setItensInventario, itensEquipados, condicoesAtivas,
    modificadoresTemporarios, setModificadoresTemporarios,
    atributosAtuaisParaCalculo, statusFicha, emCriseGlobal,
    carregando, salvando, erro, recarregar: carregarDadosCompletos,
    ajustarRecurso, atualizarDadosMutante, atualizarDadosClasseLocal,
    salvarEdicaoCompleta, toggleCondicaoFicha
  };
}
