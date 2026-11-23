import { useState, useMemo } from 'react';
import { FaBolt, FaCheck, FaForward } from 'react-icons/fa';
import { Badge } from '../ui';
import { AFINIDADES_DANO } from '../../domain/fabula/combatRules';
import { extrairHabilidadesEleitasCombatente } from '../../domain/fabula/abilityPresetRules';
import CombatantTargetSelector from './CombatantTargetSelector';
import CombatantArsenalActions from './CombatantArsenalActions';
import CombatantSecondaryActions from './CombatantSecondaryActions';
import CombatantEffectAccordion from './CombatantEffectAccordion';
import styles from './CombatantTurnActionArea.module.css';

export default function CombatantTurnActionArea({
  combatente,
  perfil,
  participantes = [],
  companheiros = [],
  relogios = [],
  alvoId,
  alvosIds = [],
  multiAlvoAtivo = false,
  onSelecionarAlvo,
  onToggleMultiAlvo,
  onLimparAlvo,
  onToggleAlvoMulti,
  onExecutarAcao,
  onRolarDados
}) {
  const [danoAplicado, setDanoAplicado] = useState(0);
  const [curaAplicada, setCuraAplicada] = useState(0);
  const [recursoCura, setRecursoCura] = useState('pv');
  const [tipoDano, setTipoDano] = useState('fisico');
  const [afinidadeAlvo, setAfinidadeAlvo] = useState(AFINIDADES_DANO.NORMAL);
  const [condicaoAlvo, setCondicaoAlvo] = useState('');
  const [custoPv, setCustoPv] = useState(0);
  const [custoPm, setCustoPm] = useState(0);
  const [custoPi, setCustoPi] = useState(0);
  const [perdaPmAlvo, setPerdaPmAlvo] = useState(0);
  const [avancoRelogio, setAvancoRelogio] = useState(0);
  const [notaLivre, setNotaLivre] = useState('');
  const [marcarTurnoConcluido, setMarcarTurnoConcluido] = useState(true);
  const [habilidadePreparada, setHabilidadePreparada] = useState(null);
  const [presetAtivoId, setPresetAtivoId] = useState('');

  const resetarAjustes = () => {
    setDanoAplicado(0); setCuraAplicada(0); setRecursoCura('pv'); setTipoDano('fisico');
    setAfinidadeAlvo(AFINIDADES_DANO.NORMAL); setCondicaoAlvo(''); setCustoPv(0); setCustoPm(0);
    setCustoPi(0); setPerdaPmAlvo(0); setAvancoRelogio(0); setNotaLivre('');
    setPresetAtivoId(''); setHabilidadePreparada(null);
  };

  const habilidadesEleitas = useMemo(() => extrairHabilidadesEleitasCombatente(perfil), [perfil]);
  const alvoAtual = useMemo(() => participantes.find((p) => String(p.id) === String(alvoId)) || null, [participantes, alvoId]);

  if (!combatente) return null;

  const handleAplicarPreset = (preset) => {
    setPresetAtivoId(preset.id);
    const v = preset.valores || {};
    if (v.danoAplicado !== undefined) setDanoAplicado(v.danoAplicado);
    if (v.curaAplicada !== undefined) setCuraAplicada(v.curaAplicada);
    if (v.recursoCura !== undefined) setRecursoCura(v.recursoCura);
    if (v.tipoDano !== undefined) setTipoDano(v.tipoDano);
    if (v.condicaoAlvo !== undefined) setCondicaoAlvo(v.condicaoAlvo);
    if (v.custoPv !== undefined) setCustoPv(v.custoPv);
    if (v.custoPm !== undefined) setCustoPm(v.custoPm);
    if (v.custoPi !== undefined) setCustoPi(v.custoPi);
    if (v.perdaPmAlvo !== undefined) setPerdaPmAlvo(v.perdaPmAlvo);
    if (v.avancoRelogio !== undefined) setAvancoRelogio(v.avancoRelogio);
    if (v.notaLivre !== undefined) setNotaLivre(v.notaLivre);
  };

  const handleDispararAcaoGeral = async (e) => {
    e?.preventDefault?.();
    if (!onExecutarAcao) return;

    let acaoCodigoFinal = 'ACAO_LIVRE';
    if (habilidadePreparada?.codigo) acaoCodigoFinal = habilidadePreparada.codigo;
    else if (Number(danoAplicado) > 0) acaoCodigoFinal = 'ATAQUE';
    else if (Number(curaAplicada) > 0) acaoCodigoFinal = 'INVENTARIO';

    const exigeAlvoExterno = Number(danoAplicado) > 0 || condicaoAlvo || Number(perdaPmAlvo) > 0;
    const temAlvo = multiAlvoAtivo ? alvosIds.length > 0 : Boolean(alvoId);
    if (exigeAlvoExterno && !temAlvo) {
      setNotaLivre('⚠️ Selecione um alvo para aplicar o dano, condição ou perda de PM.');
      return;
    }

    const alvosFinais = multiAlvoAtivo ? (alvosIds.length > 0 ? alvosIds : [null]) : [alvoId || null];
    let sucessoTotal = false;

    for (let i = 0; i < alvosFinais.length; i += 1) {
      const curAlvoId = alvosFinais[i];
      const ehPrimeiro = i === 0;

      let afinidadeEfetiva = afinidadeAlvo;
      if (afinidadeEfetiva === AFINIDADES_DANO.NORMAL && curAlvoId && tipoDano) {
        const curAlvo = participantes.find((p) => String(p.id) === String(curAlvoId));
        const afs = curAlvo?.afinidades || curAlvo?.afinidades_elementais || {};
        const valAf = afs[tipoDano?.toLowerCase()];
        if (valAf) {
          const vNorm = String(valAf).toLowerCase();
          if (vNorm === 'vul' || vNorm === 'vulneravel') afinidadeEfetiva = AFINIDADES_DANO.VULNERAVEL;
          else if (vNorm === 'res' || vNorm === 'resistente') afinidadeEfetiva = AFINIDADES_DANO.RESISTENTE;
          else if (vNorm === 'imu' || vNorm === 'imune') afinidadeEfetiva = AFINIDADES_DANO.IMUNE;
          else if (vNorm === 'abs' || vNorm === 'absorve') afinidadeEfetiva = AFINIDADES_DANO.ABSORVE;
        }
      }

      const ok = await onExecutarAcao({
        acaoCodigo: acaoCodigoFinal, atorId: combatente.id, alvoId: curAlvoId,
        relogioId: relogios[0]?.id || null, custoPv: ehPrimeiro ? custoPv : 0, custoPm: ehPrimeiro ? custoPm : 0, custoPi: ehPrimeiro ? custoPi : 0,
        danoAplicado, curaAplicada, recursoCura, tipoDano, afinidadeAlvo: afinidadeEfetiva, condicaoAlvo: condicaoAlvo || null,
        perdaPmAlvo, avancoRelogio, notaLivre, marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
      });
      if (ok) sucessoTotal = true;
    }

    if (sucessoTotal) resetarAjustes();
  };

  const handlePassarTurno = async () => {
    if (!onExecutarAcao) return;
    const ok = await onExecutarAcao({
      acaoCodigo: 'PASSAR_TURNO', atorId: combatente.id, alvoId: null,
      notaLivre: `${combatente.nome} passou o turno.`, marcarTurnoConcluido: true
    });
    if (ok) resetarAjustes();
  };

  return (
    <div className={styles.turnActionArea} onClick={(e) => e.stopPropagation()}>
      <div className={styles.actionAreaHeader}>
        <div className={styles.actionAreaTitle}><FaBolt /> Central de Turno: {combatente.nome}</div>
        <Badge variant={combatente.tipo === 'heroi' ? 'core' : 'villain'} size="sm">
          {combatente.tipo === 'heroi' ? 'Ações do Herói' : 'Ações do Inimigo'}
        </Badge>
      </div>

      <CombatantTargetSelector
        participantes={participantes} companheiros={companheiros} atorId={combatente.id}
        alvoId={alvoId} alvosIds={alvosIds} multiAlvoAtivo={multiAlvoAtivo}
        onSelecionarAlvo={onSelecionarAlvo} onToggleMultiAlvo={onToggleMultiAlvo}
        onLimparAlvo={onLimparAlvo} onToggleAlvoMulti={onToggleAlvoMulti}
      />

      <CombatantArsenalActions
        combatente={combatente} perfil={perfil} alvoId={alvoId} alvo={alvoAtual}
        multiAlvoAtivo={multiAlvoAtivo} marcarTurnoConcluido={marcarTurnoConcluido}
        onExecutarAcao={onExecutarAcao} onRolarDados={onRolarDados}
        setDanoAplicado={setDanoAplicado} setCuraAplicada={setCuraAplicada}
        setTipoDano={setTipoDano} setCustoPm={setCustoPm} setNotaLivre={setNotaLivre}
        onHabilidadeSelecionada={(hab) => { setHabilidadePreparada(hab); setPresetAtivoId(''); }}
      />

      <CombatantSecondaryActions
        ator={combatente} perfil={perfil} alvoId={alvoId} relogios={relogios}
        marcarTurnoConcluido={marcarTurnoConcluido} onExecutarAcao={onExecutarAcao}
        onRolarDados={onRolarDados} setNotaLivre={setNotaLivre} setAvancoRelogio={setAvancoRelogio}
      />

      <CombatantEffectAccordion
        danoAplicado={danoAplicado} setDanoAplicado={setDanoAplicado}
        curaAplicada={curaAplicada} setCuraAplicada={setCuraAplicada}
        recursoCura={recursoCura} setRecursoCura={setRecursoCura}
        tipoDano={tipoDano} setTipoDano={setTipoDano}
        afinidadeAlvo={afinidadeAlvo} setAfinidadeAlvo={setAfinidadeAlvo}
        condicaoAlvo={condicaoAlvo} setCondicaoAlvo={setCondicaoAlvo}
        custoPm={custoPm} setCustoPm={setCustoPm}
        custoPi={custoPi} setCustoPi={setCustoPi}
        perdaPmAlvo={perdaPmAlvo} setPerdaPmAlvo={setPerdaPmAlvo}
        notaLivre={notaLivre} setNotaLivre={setNotaLivre}
        habilidadeAtiva={habilidadePreparada} habilidadesEleitas={habilidadesEleitas}
        onSelecionarHabilidade={(hab) => { setHabilidadePreparada(hab); setPresetAtivoId(''); }}
        alvo={alvoAtual} combatente={combatente} presetAtivoId={presetAtivoId} onAplicarPreset={handleAplicarPreset}
      />

      <div className={styles.triggerBar}>
        <label className={styles.concluirTurnoLabel} title="Marca o turno como concluído ao disparar a ação principal">
          <input
            type="checkbox"
            className={styles.concluirTurnoCheckbox}
            checked={marcarTurnoConcluido}
            onChange={(e) => setMarcarTurnoConcluido(e.target.checked)}
          />
          <span>Concluir Turno nesta Ação</span>
        </label>

        <div className={styles.triggerBtnGroup}>
          <button
            type="button"
            className={styles.btnPassarTurno}
            onClick={handlePassarTurno}
            title="Passar a vez neste turno (registra no histórico e avança a iniciativa)"
          >
            <FaForward /> Passar Turno
          </button>
          <button
            type="button"
            className={styles.btnDisparar}
            onClick={handleDispararAcaoGeral}
            title="Aplicar dados e efeitos configurados no alvo e concluir turno se marcado"
          >
            <FaCheck /> Confirmar / Disparar Ação
          </button>
        </div>
      </div>
    </div>
  );
}
