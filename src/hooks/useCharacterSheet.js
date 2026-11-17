import { useState, useEffect, useCallback, useMemo } from 'react';
import { fichaService } from '../services/fichaService';
import { playerSessionService } from '../services/playerSessionService';
import { calcularStatusPersonagem } from '../utils/calculosFicha';
import { calcularNivelTotal } from '../domain/fabula/characterProgression';
import {
  calcularBonusPassivosPoderesHeroicos,
  prepararHeroicAndQuirksParaBanco
} from '../domain/fabula/heroicAndQuirksRules';

const PROGRESSAO_DADOS = [6, 8, 10, 12, 20];

/**
 * Calcula modificadores temporários de atributos a partir das condições ativas de Fabula Ultima
 * @param {Array<string>} condicoes
 * @returns {Object}
 */
export function calcularModificadoresCondicoes(condicoes = []) {
  const mods = {};
  if (condicoes.includes('abalado')) mods.vontade = (mods.vontade || 0) - 1;
  if (condicoes.includes('atordoado')) mods.astucia = (mods.astucia || 0) - 1;
  if (condicoes.includes('enfurecido')) {
    mods.destreza = (mods.destreza || 0) - 1;
    mods.astucia = (mods.astucia || 0) - 1;
  }
  if (condicoes.includes('envenenado')) {
    mods.vigor = (mods.vigor || 0) - 1;
    mods.vontade = (mods.vontade || 0) - 1;
  }
  if (condicoes.includes('fraco')) {
    mods.destreza = (mods.destreza || 0) - 1;
    mods.astucia = (mods.astucia || 0) - 1;
    mods.vigor = (mods.vigor || 0) - 1;
    mods.vontade = (mods.vontade || 0) - 1;
  }
  if (condicoes.includes('lento')) mods.destreza = (mods.destreza || 0) - 1;
  return mods;
}

/**
 * Hook customizado para gerenciar o estado completo e em tempo real da ficha de personagem.
 * Isola o ciclo de vida, persistência e subscriptions do Supabase conforme as diretrizes do GEMINI.md.
 *
 * @param {string|number} id - ID da ficha recebido via rota
 * @param {Function} navigate - Função de navegação do react-router
 */
export function useCharacterSheet(id, navigate) {
  const [ficha, setFicha] = useState(null);
  const [classes, setClasses] = useState([]);
  const [magias, setMagias] = useState([]);
  const [itensInventario, setItensInventario] = useState([]);
  const [condicoesAtivas, setCondicoesAtivas] = useState([]);
  const [modificadoresTemporarios, setModificadoresTemporarios] = useState({});

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // 1. Carregamento inicial de todos os dados da ficha
  const carregarDadosCompletos = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      // Verificação de expiração de sessão do jogador (permanência / inatividade)
      const statusSessao = playerSessionService.verificarExpiracao();
      if (statusSessao.expirada) {
        playerSessionService.encerrarSessao(statusSessao.mensagem);
        if (navigate) navigate('/ficha/login', { replace: true });
        return;
      }

      const tokenAtual = localStorage.getItem('aetheria_jogador_token');
      if (!id && !tokenAtual) {
        if (navigate) navigate('/ficha/login', { replace: true });
        return;
      }

      const fichaData = await fichaService.getFichaByIdOrToken({ id, token: tokenAtual });
      if (!fichaData) {
        setErro('Ficha não encontrada ou ID inválido.');
        return;
      }

      if (fichaData.jogador_token) {
        playerSessionService.iniciarSessao(fichaData.jogador_token, fichaData.id, fichaData.nome_personagem);
      }
      localStorage.setItem('aetheria_ultima_ficha_id', fichaData.id);

      const [classesData, magiasData, itensData, condicoesData] = await Promise.all([
        fichaService.getClassesByFichaId(fichaData.id),
        fichaService.getMagiasByFichaId(fichaData.id),
        fichaService.getItensByFichaId(fichaData.id),
        fichaService.getCondicoesCombate(fichaData.id),
        fichaService.getCatalogoTerioformas().catch(() => []),
        fichaService.getCatalogoVeiculosEstruturas().catch(() => []),
        fichaService.getCatalogoVeiculosModulos().catch(() => [])
      ]);

      setFicha(fichaData);
      setClasses(classesData);
      setMagias(magiasData);
      setItensInventario(itensData);
      setCondicoesAtivas(condicoesData);
      setModificadoresTemporarios(calcularModificadoresCondicoes(condicoesData));
    } catch (err) {
      console.error('Erro ao carregar dados da ficha:', err);
      setErro('Erro ao carregar dados do banco.');
    } finally {
      setCarregando(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    carregarDadosCompletos();
  }, [carregarDadosCompletos]);

  // 2. Subscriptions em tempo real via fichaService com cleanup garantido
  useEffect(() => {
    const fichaId = ficha?.id;
    if (!fichaId) return;

    let canalEquip = null;
    let canalCondicoes = null;
    let canalClasses = null;

    try {
      canalEquip = fichaService.subscribeItens(fichaId, async () => {
        try {
          const novosItens = await fichaService.getItensByFichaId(fichaId);
          setItensInventario(novosItens);
        } catch (err) {
          console.error('Erro ao atualizar itens em tempo real:', err);
        }
      });

      canalCondicoes = fichaService.subscribeCondicoesCombate(fichaId, (payload) => {
        const novasCondicoes = payload?.new?.condicoes || [];
        setCondicoesAtivas(novasCondicoes);
        setModificadoresTemporarios(calcularModificadoresCondicoes(novasCondicoes));
      });

      canalClasses = fichaService.subscribeClasses(fichaId, async () => {
        try {
          const novasClasses = await fichaService.getClassesByFichaId(fichaId);
          setClasses(novasClasses);
        } catch (err) {
          console.error('Erro ao atualizar classes em tempo real:', err);
        }
      });
    } catch (subErr) {
      console.error('Erro ao registrar subscriptions da ficha:', subErr);
    }

    return () => {
      if (canalEquip) fichaService.removeChannel(canalEquip);
      if (canalCondicoes) fichaService.removeChannel(canalCondicoes);
      if (canalClasses) fichaService.removeChannel(canalClasses);
    };
  }, [ficha?.id]);

  // Identifica terioformas ativas do Mutante que aumentam passos de atributos
  const dadosMutanteAtual = useMemo(() => {
    const mutanteClass = (classes || []).find((c) =>
      (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('mutant')
    );
    const habTerio = (mutanteClass?.habilidades || []).find((h) =>
      (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('teriomorfose')
    );
    return mutanteClass?.dados_mutante || habTerio?.dados_mutante || ficha?.dados_mutante || {};
  }, [classes, ficha?.dados_mutante]);

  const terioformasAtivasLista = dadosMutanteAtual?.terioformasAtivas || [];
  const temTachytheria = terioformasAtivasLista.includes('tachytheria');
  const temArpaktida = terioformasAtivasLista.includes('arpaktida');
  const temDynamotheria = terioformasAtivasLista.includes('dynamotheria');

  const nivelTotalPersonagem = useMemo(() => calcularNivelTotal(classes) || 5, [classes]);
  const bonusHeroicosPassivos = useMemo(
    () => calcularBonusPassivosPoderesHeroicos(ficha?.poderes_heroicos || [], nivelTotalPersonagem),
    [ficha?.poderes_heroicos, nivelTotalPersonagem]
  );

  // 3. Cálculo de atributos dinâmicos com Poderes Heróicos, Terioformas e modificadores temporários
  const getAtributoAtualValor = useCallback((nomeAtributo, valorBase) => {
    const idxBaseBruto = Math.max(0, PROGRESSAO_DADOS.indexOf(Number(valorBase) || 8));
    let bonusPermanenteOuForma = bonusHeroicosPassivos.aumentosAtributo?.[nomeAtributo] || 0;
    if (nomeAtributo === 'destreza' && temTachytheria) bonusPermanenteOuForma += 1;
    if (nomeAtributo === 'astucia' && temArpaktida) bonusPermanenteOuForma += 1;
    if (nomeAtributo === 'vigor' && temDynamotheria) bonusPermanenteOuForma += 1;

    // Aumentos permanentes de Poderes Heróicos e Terioformas têm teto em d12 (índice 3)
    const idxComAprimoramento = Math.min(3, idxBaseBruto + bonusPermanenteOuForma);

    const modTemp = modificadoresTemporarios[nomeAtributo] || 0;
    const idxFinal = Math.max(0, Math.min(PROGRESSAO_DADOS.length - 1, idxComAprimoramento + modTemp));
    return PROGRESSAO_DADOS[idxFinal];
  }, [modificadoresTemporarios, bonusHeroicosPassivos, temTachytheria, temArpaktida, temDynamotheria]);

  const atributosAtuaisParaCalculo = useMemo(() => ({
    destreza: getAtributoAtualValor('destreza', ficha?.destreza),
    astucia: getAtributoAtualValor('astucia', ficha?.astucia),
    vigor: getAtributoAtualValor('vigor', ficha?.vigor),
    vontade: getAtributoAtualValor('vontade', ficha?.vontade),
    _jaAplicouHeroicos: true,
    _jaAplicouTerioformas: true
  }), [ficha?.destreza, ficha?.astucia, ficha?.vigor, ficha?.vontade, getAtributoAtualValor]);

  const itensEquipados = useMemo(() => {
    return itensInventario.filter(i => i.stats_personalizados?.slot);
  }, [itensInventario]);

  // Atualização direta e reativa dos dados de Mutante no estado de classes
  const atualizarDadosMutante = useCallback((novosDadosMutante) => {
    setClasses(prevClasses => {
      return prevClasses.map(c => {
        const norm = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (norm.includes('mutant')) {
          const habsAtualizadas = (c.habilidades || []).map(h => {
            const nomeHab = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (nomeHab.includes('teriomorfose')) {
              return {
                ...h,
                terioformas_aprendidas: novosDadosMutante.terioformasAprendidas || h.terioformas_aprendidas || [],
                dados_mutante: novosDadosMutante
              };
            }
            if (nomeHab.includes('terioforma') || nomeHab.includes('acromorfose') || nomeHab.includes('biofag')) {
              return { ...h, dados_mutante: novosDadosMutante };
            }
            return h;
          });
          return {
            ...c,
            dados_mutante: novosDadosMutante,
            habilidades: habsAtualizadas
          };
        }
        return c;
      });
    });
  }, []);

  // 4. Status globais calculados (HP Máx, MP Máx, PI Máx, Defesas, Iniciativa)
  const statusFicha = useMemo(() => {
    return calcularStatusPersonagem(
      atributosAtuaisParaCalculo,
      classes,
      itensEquipados,
      ficha
    );
  }, [atributosAtuaisParaCalculo, classes, itensEquipados, ficha]);

  // Estado de Crise Global (HP atual <= metade do HP máximo)
  const hpAtualNum = Number(ficha?.hp_atual ?? statusFicha.pvMax);
  const emCriseGlobal = statusFicha?.pvMax ? hpAtualNum <= Math.floor(statusFicha.pvMax / 2) : false;

  // 5. Sincronização automática dos tetos de HP/MP/PI com o Supabase quando mudarem
  useEffect(() => {
    if (!ficha?.id || !statusFicha?.pvMax || !statusFicha?.mpMax) return;

    const pvCalculado = statusFicha.pvMax;
    const mpCalculado = statusFicha.mpMax;
    const piCalculado = statusFicha.piMax;

    if (
      Number(ficha.hp_max) !== Number(pvCalculado) ||
      Number(ficha.mp_max) !== Number(mpCalculado) ||
      (ficha.pi_max !== undefined && Number(ficha.pi_max) !== Number(piCalculado))
    ) {
      fichaService.atualizarFicha(ficha.id, {
        hp_max: pvCalculado,
        mp_max: mpCalculado,
        pi_max: piCalculado
      }).then(() => {
        setFicha(prev => ({
          ...prev,
          hp_max: pvCalculado,
          mp_max: mpCalculado,
          pi_max: piCalculado
        }));
      }).catch(err => {
        console.error('Erro ao sincronizar tetos máximos:', err);
      });
    }
  }, [ficha?.id, ficha?.hp_max, ficha?.mp_max, ficha?.pi_max, statusFicha?.pvMax, statusFicha?.mpMax, statusFicha?.piMax]);

  // 6. Manipulação de Recursos (HP, MP, IP, Fábula, EXP)
  const ajustarRecurso = useCallback(async (campo, valor) => {
    if (!ficha?.id) return;

    let maximo = 999;
    let fallback = 0;

    if (campo === 'hp_atual') {
      maximo = statusFicha?.pvMax || 999;
      fallback = maximo;
    } else if (campo === 'mp_atual') {
      maximo = statusFicha?.mpMax || 999;
      fallback = maximo;
    } else if (campo === 'ip_atual' || campo === 'pi_atual') {
      maximo = statusFicha?.piMax || ficha.ip_max || ficha.pi_max || 6;
      fallback = maximo;
    } else if (campo === 'fabula') {
      maximo = 99;
      fallback = 3;
    } else if (campo === 'exp') {
      maximo = 10;
      fallback = 0;
    }

    const valorBrutoAtual = Number(ficha[campo] !== undefined && ficha[campo] !== null ? ficha[campo] : fallback);
    const valorAtual = Math.min(valorBrutoAtual, maximo);
    const novoValor = Math.min(maximo, Math.max(0, valorAtual + valor));

    const dadosAtualizar = { [campo]: novoValor };
    if (campo === 'ip_atual') {
      dadosAtualizar.pi_atual = novoValor;
    } else if (campo === 'pi_atual') {
      dadosAtualizar.ip_atual = novoValor;
    }

    setFicha(prev => ({ ...prev, ...dadosAtualizar }));
    playerSessionService.registrarAtividade();

    try {
      await fichaService.atualizarFicha(ficha.id, dadosAtualizar);
    } catch (err) {
      console.error('Erro ao salvar recurso:', err);
    }
  }, [ficha, statusFicha]);

  // 7. Salvar edição completa da ficha
  const salvarEdicaoCompleta = useCallback(async ({ formData, formClasses, formMagias }) => {
    if (!ficha?.id) return;
    setSalvando(true);

    try {
      const nivelCalculado = calcularNivelTotal(formClasses);
      const camposHeroicQuirks = prepararHeroicAndQuirksParaBanco(formData);
      const atributosForm = {
        destreza: formData.destreza ?? ficha.destreza ?? 8,
        astucia: formData.astucia ?? ficha.astucia ?? 8,
        vigor: formData.vigor ?? ficha.vigor ?? 8,
        vontade: formData.vontade ?? ficha.vontade ?? 8
      };
      const statusCalculados = calcularStatusPersonagem(
        atributosForm,
        formClasses,
        itensEquipados,
        { ...formData, ...camposHeroicQuirks }
      );

      const dadosParaSalvar = {
        ...formData,
        ...camposHeroicQuirks,
        nivel: nivelCalculado,
        hp_max: statusCalculados.pvMax,
        mp_max: statusCalculados.mpMax,
        pi_max: statusCalculados.piMax
      };

      await fichaService.atualizarFicha(ficha.id, dadosParaSalvar);
      await fichaService.salvarClassesEMagias(ficha.id, formClasses, formMagias);

      setFicha(dadosParaSalvar);
      setClasses(formClasses);
      setMagias(formMagias);
    } finally {
      setSalvando(false);
    }
  }, [ficha, itensEquipados]);

  return {
    ficha,
    setFicha,
    classes,
    setClasses,
    magias,
    setMagias,
    itensInventario,
    setItensInventario,
    itensEquipados,
    condicoesAtivas,
    modificadoresTemporarios,
    setModificadoresTemporarios,
    atributosAtuaisParaCalculo,
    statusFicha,
    emCriseGlobal,
    carregando,
    salvando,
    erro,
    recarregar: carregarDadosCompletos,
    ajustarRecurso,
    atualizarDadosMutante,
    salvarEdicaoCompleta
  };
}
