import { useState } from 'react';
import { FaBolt, FaCheck } from 'react-icons/fa';
import { Badge } from '../ui';
import { AFINIDADES_DANO } from '../../domain/fabula/combatRules';
import CombatantTargetSelector from './CombatantTargetSelector';
import CombatantArsenalActions from './CombatantArsenalActions';
import CombatantSecondaryActions from './CombatantSecondaryActions';
import CombatantEffectAccordion from './CombatantEffectAccordion';
import styles from './CombatantTurnActionArea.module.css';

export default function CombatantTurnActionArea({
  combatente,
  perfil,
  participantes = [],
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
  const [custoPm, setCustoPm] = useState(0);
  const [custoPi, setCustoPi] = useState(0);
  const [avancoRelogio, setAvancoRelogio] = useState(0);
  const [notaLivre, setNotaLivre] = useState('');
  const [marcarTurnoConcluido, setMarcarTurnoConcluido] = useState(true);

  if (!combatente) return null;

  const handleDispararAcaoGeral = async (e) => {
    e?.preventDefault?.();
    if (!onExecutarAcao) return;

    const alvosFinais = multiAlvoAtivo
      ? (alvosIds.length > 0 ? alvosIds : [null])
      : [alvoId || null];

    let sucessoTotal = false;

    for (let i = 0; i < alvosFinais.length; i += 1) {
      const curAlvoId = alvosFinais[i];
      const ehPrimeiro = i === 0;

      const ok = await onExecutarAcao({
        acaoCodigo: danoAplicado > 0 ? 'ATAQUE' : (curaAplicada > 0 ? 'ITEM' : 'ACAO_LIVRE'),
        atorId: combatente.id,
        alvoId: curAlvoId,
        relogioId: relogios[0]?.id || null,
        custoPm: ehPrimeiro ? custoPm : 0,
        custoPi: ehPrimeiro ? custoPi : 0,
        danoAplicado,
        curaAplicada,
        recursoCura,
        tipoDano,
        afinidadeAlvo,
        condicaoAlvo: condicaoAlvo || null,
        avancoRelogio,
        notaLivre,
        marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
      });
      if (ok) sucessoTotal = true;
    }

    if (sucessoTotal) {
      setDanoAplicado(0);
      setCuraAplicada(0);
      setCustoPm(0);
      setCustoPi(0);
      setCondicaoAlvo('');
      setNotaLivre('');
      setAvancoRelogio(0);
    }
  };

  return (
    <div className={styles.turnActionArea} onClick={(e) => e.stopPropagation()}>
      <div className={styles.actionAreaHeader}>
        <div className={styles.actionAreaTitle}>
          <FaBolt /> Central de Turno: {combatente.nome}
        </div>
        <Badge variant={combatente.tipo === 'heroi' ? 'core' : 'villain'} size="sm">
          {combatente.tipo === 'heroi' ? 'Ações do Herói' : 'Ações do Inimigo'}
        </Badge>
      </div>

      <CombatantTargetSelector
        participantes={participantes}
        atorId={combatente.id}
        alvoId={alvoId}
        alvosIds={alvosIds}
        multiAlvoAtivo={multiAlvoAtivo}
        onSelecionarAlvo={onSelecionarAlvo}
        onToggleMultiAlvo={onToggleMultiAlvo}
        onLimparAlvo={onLimparAlvo}
        onToggleAlvoMulti={onToggleAlvoMulti}
      />

      <CombatantArsenalActions
        combatente={combatente}
        perfil={perfil}
        onRolarDados={onRolarDados}
        setDanoAplicado={setDanoAplicado}
        setTipoDano={setTipoDano}
        setCustoPm={setCustoPm}
        setNotaLivre={setNotaLivre}
      />

      <CombatantSecondaryActions
        ator={combatente}
        perfil={perfil}
        alvoId={alvoId}
        relogios={relogios}
        marcarTurnoConcluido={marcarTurnoConcluido}
        onExecutarAcao={onExecutarAcao}
        onRolarDados={onRolarDados}
        setNotaLivre={setNotaLivre}
        setAvancoRelogio={setAvancoRelogio}
      />

      <CombatantEffectAccordion
        danoAplicado={danoAplicado}
        setDanoAplicado={setDanoAplicado}
        curaAplicada={curaAplicada}
        setCuraAplicada={setCuraAplicada}
        recursoCura={recursoCura}
        setRecursoCura={setRecursoCura}
        tipoDano={tipoDano}
        setTipoDano={setTipoDano}
        afinidadeAlvo={afinidadeAlvo}
        setAfinidadeAlvo={setAfinidadeAlvo}
        condicaoAlvo={condicaoAlvo}
        setCondicaoAlvo={setCondicaoAlvo}
        custoPm={custoPm}
        setCustoPm={setCustoPm}
        custoPi={custoPi}
        setCustoPi={setCustoPi}
        notaLivre={notaLivre}
        setNotaLivre={setNotaLivre}
      />

      <div className={styles.triggerBar}>
        <label
          className={styles.concluirTurnoLabel}
          title="Marca o turno como concluído ao disparar a ação principal"
        >
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
