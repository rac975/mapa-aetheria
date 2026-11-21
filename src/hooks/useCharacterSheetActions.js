import { useState, useCallback, useEffect } from 'react';
import { fichaService } from '../services/fichaService';
import { playerSessionService } from '../services/playerSessionService';
import { calcularNivelTotal } from '../domain/fabula/characterProgression';
import { prepararHeroicAndQuirksParaBanco } from '../domain/fabula/heroicAndQuirksRules';
import {
  extrairArcanosVinculados,
  sincronizarArcanosNaHabilidade,
  extrairMagiasQuimerista,
  extrairAtributoQuimerista,
  sincronizarQuimeristaNaHabilidade
} from '../domain/fabula/coreClassRules';
import { calcularStatusPersonagem } from '../utils/calculosFicha';

/**
 * Hook auxiliar para isolar as mutações, ajustes de recursos e persistência da ficha de personagem.
 */
export function useCharacterSheetActions({
  ficha,
  setFicha,
  setClasses,
  setMagias,
  statusFicha,
  isMestre = false
}) {
  const [salvando, setSalvando] = useState(false);

  // Sincronização automática dos tetos máximos (PV, PM, PI) com o banco
  useEffect(() => {
    if (!ficha?.id || !statusFicha?.pvMax || !statusFicha?.mpMax) return;
    const { pvMax, mpMax, piMax } = statusFicha;

    if (
      Number(ficha.hp_max) !== Number(pvMax) ||
      Number(ficha.mp_max) !== Number(mpMax) ||
      (ficha.pi_max !== undefined && Number(ficha.pi_max) !== Number(piMax))
    ) {
      fichaService
        .atualizarFicha(ficha.id, { hp_max: pvMax, mp_max: mpMax, pi_max: piMax })
        .then(() => setFicha((prev) => ({ ...prev, hp_max: pvMax, mp_max: mpMax, pi_max: piMax })))
        .catch((err) => console.error('Erro ao sincronizar tetos máximos:', err));
    }
  }, [ficha?.id, ficha?.hp_max, ficha?.mp_max, ficha?.pi_max, statusFicha, setFicha]);

  const atualizarDadosMutante = useCallback(
    (novosDadosMutante) => {
      setClasses((prev) =>
        prev.map((c) => {
          const norm = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (!norm.includes('mutant')) return c;
          const habsAtualizadas = (c.habilidades || []).map((h) => {
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
          return { ...c, dados_mutante: novosDadosMutante, habilidades: habsAtualizadas };
        })
      );
    },
    [setClasses]
  );

  const atualizarDadosClasseLocal = useCallback(
    (matchFn, updaterFn) => {
      setClasses((prev) => prev.map((c) => (matchFn(c) ? updaterFn(c) : c)));
    },
    [setClasses]
  );

  const ajustarRecurso = useCallback(
    async (campo, valor, opcoesRecurso = {}) => {
      if (!ficha?.id) return;
      let maximo = 999;
      let fallback = 0;
      const permiteAcimaMax = Boolean(
        opcoesRecurso?.permitirDosagemPrecisa || statusFicha?.naturalFantasy?.temDosagemPrecisa
      );

      if (campo === 'hp_atual') {
        const baseMax = statusFicha?.pvMax || 999;
        fallback = baseMax;
        maximo = permiteAcimaMax && valor > 0 ? Math.floor(baseMax * 1.5) : Math.max(baseMax, Number(ficha.hp_atual || 0));
      } else if (campo === 'mp_atual') {
        const baseMax = statusFicha?.mpMax || 999;
        fallback = baseMax;
        maximo = permiteAcimaMax && valor > 0 ? Math.floor(baseMax * 1.5) : Math.max(baseMax, Number(ficha.mp_atual || 0));
      } else if (campo === 'ip_atual' || campo === 'pi_atual') {
        maximo = statusFicha?.piMax || ficha.pi_max || ficha.ip_max || 6;
        fallback = maximo;
      } else if (campo === 'fabula') {
        maximo = 99;
        fallback = 3;
      } else if (campo === 'exp') {
        maximo = 10;
        fallback = 0;
      } else if (campo === 'zenit') {
        maximo = 9999999;
        fallback = 0;
      }

      const campoNormalizado = (campo === 'ip_atual' || campo === 'pi_atual') ? 'pi_atual' : campo;
      const valorBrutoAtual = (campo === 'ip_atual' || campo === 'pi_atual')
        ? Number(ficha.pi_atual !== undefined && ficha.pi_atual !== null ? ficha.pi_atual : (ficha.ip_atual ?? fallback))
        : Number(ficha[campo] !== undefined && ficha[campo] !== null ? ficha[campo] : fallback);
      const valorAtual = Math.min(valorBrutoAtual, maximo);
      const novoValor = Math.min(maximo, Math.max(0, valorAtual + valor));

      const dadosAtualizar = { [campoNormalizado]: novoValor };

      setFicha((prev) => ({ ...prev, ...dadosAtualizar }));
      playerSessionService.registrarAtividade({ isMestre });

      try {
        await fichaService.atualizarFicha(ficha.id, dadosAtualizar);
      } catch (err) {
        console.error('Erro ao salvar recurso:', err);
      }
    },
    [ficha, statusFicha, isMestre, setFicha]
  );

  const salvarEdicaoCompleta = useCallback(
    async ({ formData, formClasses, formMagias }) => {
      if (!ficha?.id) return;
      setSalvando(true);
      try {
        const nivelCalculado = calcularNivelTotal(formClasses);
        const camposHeroicQuirks = prepararHeroicAndQuirksParaBanco(formData);
        const statusNovos = calcularStatusPersonagem(
          formData,
          formClasses,
          [],
          { ...ficha, ...formData, nivel: nivelCalculado }
        );

        const pvMax = statusNovos.pvMax || statusFicha?.pvMax || ficha.hp_max || 30;
        const mpMax = statusNovos.mpMax || statusFicha?.mpMax || ficha.mp_max || 20;
        const piMax = statusNovos.piMax || statusFicha?.piMax || ficha.pi_max || 6;

        const dadosParaSalvar = {
          ...formData,
          ...camposHeroicQuirks,
          nivel: nivelCalculado,
          hp_max: pvMax,
          mp_max: mpMax,
          pi_max: piMax
        };

        const classesNormalizadas = (formClasses || []).map((c) => {
          const norm = (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (norm.includes('arcanista')) {
            const arcanos = extrairArcanosVinculados(c);
            const habs = sincronizarArcanosNaHabilidade(c.habilidades, arcanos);
            return {
              ...c,
              habilidades: habs,
              arcanos_vinculados: arcanos,
              arcano_vinculado: arcanos[0] || null
            };
          }
          if (norm.includes('quimerista')) {
            const magias = extrairMagiasQuimerista(c);
            const attr = extrairAtributoQuimerista(c);
            const habs = sincronizarQuimeristaNaHabilidade(c.habilidades, {
              magias_imitadas: magias,
              atributo_quimerista: attr
            });
            return {
              ...c,
              habilidades: habs,
              magias_imitadas: magias,
              atributo_quimerista: attr,
              dados_quimerista: { magias_imitadas: magias, atributo_quimerista: attr }
            };
          }
          return c;
        });

        await fichaService.atualizarFicha(ficha.id, dadosParaSalvar);
        await fichaService.salvarClassesEMagias(ficha.id, classesNormalizadas, formMagias);

        setFicha(dadosParaSalvar);
        setClasses(classesNormalizadas);
        setMagias(formMagias);
      } finally {
        setSalvando(false);
      }
    },
    [ficha, statusFicha, setFicha, setClasses, setMagias]
  );

  return {
    salvando,
    ajustarRecurso,
    salvarEdicaoCompleta,
    atualizarDadosMutante,
    atualizarDadosClasseLocal
  };
}
