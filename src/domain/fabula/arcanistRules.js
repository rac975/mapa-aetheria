/**
 * Regras puras de Fabula Ultima para a classe Arcanista (Arcanist).
 * Concentra o mapeamento de habilidades e resolução de Fundir e Dispensar dos 9 Arcanos
 * oficiais (Espada, Forja, Geada, Roda, Torre, Carvalho, Céu, Grimório e Portão).
 */

import { obterNivelHabilidade, normalizarTextoCore, extrairArcanosVinculados } from './coreClassRules.js';
import { CATALOGO_ARCANOS_OFICIAIS, identificarArcanoOficial } from './arcanaCatalog.js';

export { CATALOGO_ARCANOS_OFICIAIS, identificarArcanoOficial };

function normalizarPoderesHeroicos(poderesHeroicos = []) {
  const set = new Set();
  (Array.isArray(poderesHeroicos) ? poderesHeroicos : []).forEach((p) => {
    const txt = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''} ${p?.nome_original || ''}`;
    set.add(normalizarTextoCore(txt));
  });
  return set;
}

export function extrairTipoDanoDispensa(texto = '') {
  const norm = normalizarTextoCore(texto);
  if (norm.includes('sem tipo') || norm.includes('perde seu tipo')) return 'sem_tipo';
  if (norm.includes('fogo')) return 'fogo';
  if (norm.includes('gelo')) return 'gelo';
  if (norm.includes('luz')) return 'luz';
  if (norm.includes('raio')) return 'raio';
  if (norm.includes('terra')) return 'terra';
  if (norm.includes('trevas') || norm.includes('sombrio')) return 'trevas';
  if (norm.includes('veneno')) return 'veneno';
  if (norm.includes('ar') || norm.includes('vento')) return 'ar';
  return 'magico';
}

export function calcularBonusEscalaDispensa(nivelTotal = 5) {
  const nv = parseInt(nivelTotal, 10) || 0;
  if (nv >= 40) return 20;
  if (nv >= 20) return 10;
  return 0;
}

export function calcularEfeitoDispensaArcano({ arcano = {}, nivelTotal = 5, danoBase = null, opcaoSubcodigo = null } = {}) {
  const bonusEscala = calcularBonusEscalaDispensa(nivelTotal);
  const oficial = identificarArcanoOficial(arcano);

  if (oficial) {
    const dispNomeNorm = normalizarTextoCore(arcano.dispensar_nome || '');
    const op = oficial.opcoesDispensar.find(
      (o) => opcaoSubcodigo ? o.subcodigo === opcaoSubcodigo : (dispNomeNorm && normalizarTextoCore(o.nomeEfeito).includes(dispNomeNorm))
    ) || oficial.opcoesDispensar[0];

    const danoTotal = op.danoBase > 0 ? op.danoBase + bonusEscala : 0;
    const curaTotal = op.curaBase > 0 ? (op.escalaCura ? op.curaBase + bonusEscala : op.curaBase) : 0;

    return {
      chaveArcano: oficial.chave, danoTotal, curaTotal, tipoDano: op.tipoDano || 'magico',
      bonusEscala, nomeEfeito: op.nomeEfeito, efeitoTexto: arcano.dispensar_efeito || op.efeitoTexto,
      ignoraResistencia: Boolean(op.ignoraResistencia), ignoraAfinidades: Boolean(op.ignoraAfinidades),
      isGolpeFundirEspada: Boolean(op.isGolpeFundirEspada), isDispensaVoluntaria: op.isDispensaVoluntaria !== false,
      condicaoAlvo: op.condicaoAlvo || null, reduzAcaoSeJaLento: Boolean(op.reduzAcaoSeJaLento),
      removerCondicaoAlvo: op.removerCondicaoAlvo || null
    };
  }

  const efeitoTexto = arcano.dispensar_efeito || arcano.efeito_descarte || arcano.descricao || '';
  const nomeEfeito = arcano.dispensar_nome || 'Dispensa de Arcano';
  const tipoDano = extrairTipoDanoDispensa(efeitoTexto);
  const matchDano = efeitoTexto.match(/\b(\d+)\s*(?:pontos?\s+de\s+dano|dano)\b/i);
  const matchCura = efeitoTexto.match(/(?:recupera|cura)\s+(\d+)\s*pv/i);
  const baseDano = danoBase !== null ? danoBase : (matchDano ? parseInt(matchDano[1], 10) : (matchCura ? 0 : 30));
  const danoTotal = baseDano > 0 ? baseDano + bonusEscala : 0;
  const curaTotal = matchCura ? (parseInt(matchCura[1], 10) + bonusEscala) : 0;

  return {
    chaveArcano: null, danoTotal, curaTotal, tipoDano, bonusEscala, nomeEfeito, efeitoTexto,
    ignoraResistencia: normalizarTextoCore(efeitoTexto).includes('ignora resistencia'),
    ignoraAfinidades: false, isGolpeFundirEspada: false, isDispensaVoluntaria: true,
    condicaoAlvo: null, reduzAcaoSeJaLento: false, removerCondicaoAlvo: null
  };
}

export function extrairHabilidadesArcanista({ classes = [], poderesHeroicos = [], ficha = null, emCrise = false } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const classeArcanista = listaClasses.find((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('arcanista') || nome.includes('arcanist');
  });

  const temClasseArcanista = Boolean(classeArcanista);
  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvVincularInvocar = obterNivelHabilidade(listaClasses, 'arcanista', 'vincular e invocar') || (temClasseArcanista ? 1 : 0);
  const nvArcanoEmergencial = obterNivelHabilidade(listaClasses, 'arcanista', 'arcano emergencial');
  const nvCirculoArcano = obterNivelHabilidade(listaClasses, 'arcanista', 'circulo arcano');
  const nvRegeneracaoArcana = obterNivelHabilidade(listaClasses, 'arcanista', 'regeneracao arcana');
  const nvArcanismoRitualista = obterNivelHabilidade(listaClasses, 'arcanista', 'arcanismo ritualista');

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;
  const descontoEmergencial = emCrise ? nvArcanoEmergencial * 5 : 0;
  const custoInvocacaoPadrao = Math.max(0, 40 - descontoEmergencial);
  const curaRegeneracao = nvRegeneracaoArcana * 5;
  const bonusEscalaDispensa = calcularBonusEscalaDispensa(nivelTotal);
  const circuloArcanoCustoMax = nvCirculoArcano * 5;
  const arcanosVinculados = temClasseArcanista ? extrairArcanosVinculados(classeArcanista, ficha) : [];

  return {
    temClasseArcanista, nivelTotal,
    habilidades: {
      vincularInvocar: { nivel: nvVincularInvocar, ativo: nvVincularInvocar > 0 },
      arcanoEmergencial: { nivel: nvArcanoEmergencial, ativo: nvArcanoEmergencial > 0, desconto: descontoEmergencial },
      circuloArcano: { nivel: nvCirculoArcano, ativo: nvCirculoArcano > 0, custoMaximoFeitico: circuloArcanoCustoMax },
      regeneracaoArcana: { nivel: nvRegeneracaoArcana, ativo: nvRegeneracaoArcana > 0, curaPv: curaRegeneracao },
      arcanismoRitualista: { nivel: nvArcanismoRitualista, ativo: nvArcanismoRitualista > 0 }
    },
    custoInvocacaoPadrao, curaRegeneracao, bonusEscalaDispensa, arcanosVinculados,
    poderesHeroicos: {
      adversidade: Array.from(poderesSet).some((p) => p.includes('adversidade')),
      ecosArcanos: Array.from(poderesSet).some((p) => p.includes('ecos arcanos')),
      revelacao: Array.from(poderesSet).some((p) => p.includes('revelacao')),
      grandeInvocacao: Array.from(poderesSet).some((p) => p.includes('grande invocacao')),
      soldadoArcano: Array.from(poderesSet).some((p) => p.includes('soldado arcano'))
    }
  };
}

export function gerarAcoesConflitoArcanista({ classes = [], poderesHeroicos = [], ficha = null, emCrise = false, modificadoresCena = {} } = {}) {
  const dados = extrairHabilidadesArcanista({ classes, poderesHeroicos, ficha, emCrise });
  if (!dados.temClasseArcanista || dados.arcanosVinculados.length === 0) return [];

  const acoes = [];
  const custoBase = dados.custoInvocacaoPadrao;
  const custoPmFinal = modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase;

  dados.arcanosVinculados.forEach((arc, idx) => {
    const oficial = identificarArcanoOficial(arc);
    const nomeArcano = (typeof arc === 'string' ? arc : arc?.nome) || oficial?.nome || `Arcano ${idx + 1}`;
    const objArcano = typeof arc === 'object' ? arc : { nome: nomeArcano };
    const efeitoInvocacao = objArcano.fundir || objArcano.efeito_invocacao || oficial?.fundir || objArcano.descricao || '';
    const dominios = objArcano.dominios || oficial?.dominios || '';
    const infoDispPrincipal = calcularEfeitoDispensaArcano({ arcano: objArcano, nivelTotal: dados.nivelTotal });
    const bonusCuraCarvalho = oficial?.beneficiosFundir?.bonusCuraRecebidaPv && dados.curaRegeneracao > 0 ? 5 : 0;
    const curaInvocacaoTotal = dados.curaRegeneracao + bonusCuraCarvalho;

    acoes.push({
      id: `arcano_invocar_${idx}`, codigo: 'INVOCAR_ARCANO', chaveArcano: oficial?.chave || null,
      nome: `Invocar: ${nomeArcano}`, nomeArcano, dominios, tipo: 'invocacao_arcano', classe: 'Arcanista',
      custoPm: custoPmFinal, curaRegeneracao: curaInvocacaoTotal, beneficiosFundir: oficial?.beneficiosFundir || null,
      isArcano: true, ofensiva: false, efeitoInvocacao, dispensarNome: infoDispPrincipal.nomeEfeito,
      dispensarEfeito: infoDispPrincipal.efeitoTexto,
      descricao: efeitoInvocacao || 'Invoca e funde o Arcano à sua alma sem teste de atributo.',
      resumoEfeito: `Fundir (${custoPmFinal} PM)${curaInvocacaoTotal > 0 ? ` • Regenera +${curaInvocacaoTotal} PV` : ''}`
    });

    const opcoes = oficial?.opcoesDispensar || [{ subcodigo: 'PADRAO' }];
    opcoes.forEach((op, opIdx) => {
      const infoDisp = calcularEfeitoDispensaArcano({ arcano: objArcano, nivelTotal: dados.nivelTotal, opcaoSubcodigo: op.subcodigo });
      const sufixoOp = opIdx > 0 ? `_${op.subcodigo.toLowerCase()}` : '';
      const rotuloAcao = infoDisp.isGolpeFundirEspada
        ? `Fundir & Dispensar: ${nomeArcano} (${infoDisp.nomeEfeito})`
        : `Dispensar: ${nomeArcano} (${infoDisp.nomeEfeito})`;

      acoes.push({
        id: `arcano_dispensar_${idx}${sufixoOp}`, codigo: 'DISPENSAR_ARCANO',
        chaveArcano: infoDisp.chaveArcano, subcodigoDispensa: op.subcodigo, nome: rotuloAcao, nomeArcano,
        nomeCurto: `${infoDisp.nomeEfeito} (${nomeArcano})`, tipo: 'dispensa_arcano', classe: 'Arcanista',
        custoPm: 0, isArcano: true, isDispensaArcano: true,
        isGolpeFundirEspada: infoDisp.isGolpeFundirEspada, isDispensaVoluntaria: infoDisp.isDispensaVoluntaria,
        ofensiva: infoDisp.danoTotal > 0 || infoDisp.isGolpeFundirEspada,
        danoTotal: infoDisp.danoTotal, curaTotal: infoDisp.curaTotal, tipoDano: infoDisp.tipoDano,
        ignoraResistencia: infoDisp.ignoraResistencia, ignoraAfinidades: infoDisp.ignoraAfinidades,
        condicaoAlvo: infoDisp.condicaoAlvo, reduzAcaoSeJaLento: infoDisp.reduzAcaoSeJaLento,
        removerCondicaoAlvo: infoDisp.removerCondicaoAlvo, bonusEscala: infoDisp.bonusEscala,
        circuloArcanoTexto: (dados.habilidades.circuloArcano.ativo && infoDisp.isDispensaVoluntaria)
          ? `Círculo Arcano: pode lançar feitiço de até ${dados.habilidades.circuloArcano.custoMaximoFeitico} PM sem gastar ação!`
          : '',
        descricao: infoDisp.efeitoTexto,
        resumoEfeito: `${infoDisp.nomeEfeito}: ${infoDisp.danoTotal > 0 ? `${infoDisp.danoTotal} dano (${infoDisp.tipoDano})` : (infoDisp.curaTotal > 0 ? `+${infoDisp.curaTotal} PV` : 'Efeito especial')}`
      });
    });
  });

  if (dados.habilidades.circuloArcano.ativo) {
    const custoMax = dados.habilidades.circuloArcano.custoMaximoFeitico;
    acoes.push({
      id: 'arcanista_circulo_arcano', codigo: 'CIRCULO_ARCANO', nome: 'Círculo Arcano (Feitiço Livre)',
      nomeCurto: 'Círculo Arcano', tipo: 'acao_suporte', classe: 'Arcanista',
      nivel: dados.habilidades.circuloArcano.nivel, custoPm: 0, requerAlvo: false,
      descricao: `Em seu turno, após dispensar voluntariamente um Arcano: você pode fazer a ação Feitiço de até ${custoMax} PM sem gastar uma ação (arma arcana equipada).`
    });
  }

  return acoes;
}
