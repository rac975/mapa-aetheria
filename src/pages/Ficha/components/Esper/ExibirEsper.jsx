import { useState } from 'react';
import { FaBrain, FaClock, FaEye, FaBolt, FaRedo, FaCheck } from 'react-icons/fa';
import { Button, Badge, Input } from '../../../../components/ui';
import { fichaService } from '../../../../services/fichaService';
import {
  BRAINWAVE_CLOCK_MAX_SECTIONS,
  PSYCHIC_GIFTS_CATALOG,
  calcularCustoPsychicGift,
  avancarBrainwaveClock,
  resetarBrainwaveClock,
  calcularBonusCognitiveFocus,
  calcularReducaoHypercognition,
  processarAtivacaoPsychicGift
} from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirEsper.module.css';

export default function ExibirEsper({
  ficha,
  classe,
  classeObjeto,
  classes,
  handleAjustarRecurso
}) {
  const classeObj =
    classe || classeObjeto ||
    classes?.find(c => (c.nome_classe || '').toLowerCase().includes('esper')) ||
    (ficha?.habilidades ? ficha : null);

  const habs = classeObj?.habilidades || [];
  const getNivel = termo => {
    const h = habs.find(item =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nivelEsper = parseInt(classeObj?.nivel, 10) || 1;
  const nvFocoCognitivo = getNivel('foco cognitivo');
  const nvHipercognicao = getNivel('hipercognicao');

  const dadosEsperSalvos = ficha?.dados_esper || {};
  const [relogioSecoes, setRelogioSecoes] = useState(dadosEsperSalvos.relogioSecoes || 0);
  const [focoAtivo, setFocoAtivo] = useState(dadosEsperSalvos.focoAtivo || false);
  const [alvoFoco, setAlvoFoco] = useState(dadosEsperSalvos.alvoFoco || '');
  const [tipoAlvo, setTipoAlvo] = useState(dadosEsperSalvos.tipoAlvo || 'aliado');
  const [unicoAlvo, setUnicoAlvo] = useState(true);
  const [dadivaKey, setDadivaKey] = useState(dadosEsperSalvos.dadivaKey || 'atmocinese');
  const [tipoDano, setTipoDano] = useState('ar');
  const [feedback, setFeedback] = useState('');

  const custoAtualDadiva = calcularCustoPsychicGift(relogioSecoes);
  const bonusFoco = calcularBonusCognitiveFocus(nvFocoCognitivo);
  const reducaoHiper = calcularReducaoHypercognition(nvHipercognicao, unicoAlvo);
  const dadivaSelecionada = PSYCHIC_GIFTS_CATALOG.find(g => g.key === dadivaKey) || PSYCHIC_GIFTS_CATALOG[0];

  const salvarEsper = (novosDados = {}) => {
    if (ficha?.id) {
      fichaService.salvarDadosEsper(ficha.id, {
        relogioSecoes, focoAtivo, alvoFoco, tipoAlvo, dadivaKey,
        ...novosDados
      });
    }
  };

  const handleToggleSecao = secaoNum => {
    const novo = relogioSecoes === secaoNum ? secaoNum - 1 : secaoNum;
    setRelogioSecoes(novo);
    salvarEsper({ relogioSecoes: novo });
  };

  const handleAvancarRelogio = () => {
    const novo = avancarBrainwaveClock(relogioSecoes);
    setRelogioSecoes(novo);
    salvarEsper({ relogioSecoes: novo });
  };

  const handleResetarRelogio = () => {
    const novo = resetarBrainwaveClock();
    setRelogioSecoes(novo);
    salvarEsper({ relogioSecoes: novo });
  };

  const handleAtivarDadiva = () => {
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 999);
    if (mpAtual < custoAtualDadiva) {
      window.alert(`PM insuficiente! Dádiva requer ${custoAtualDadiva} PM, você possui ${mpAtual} PM.`);
      return;
    }

    const resultado = processarAtivacaoPsychicGift({
      giftKey: dadivaKey,
      tipoEscolhido: tipoDano,
      secoesRelogio: relogioSecoes,
      danoBase: 0
    });

    if (resultado.sucesso) {
      if (handleAjustarRecurso) handleAjustarRecurso('mp_atual', -resultado.custoMp);
      setRelogioSecoes(resultado.novoRelogio);
      setFeedback(resultado.mensagem);
      salvarEsper({ relogioSecoes: resultado.novoRelogio });
    }
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.title}>
          <FaBrain /> Sensitivo Psíquico — Esper
        </div>
        <Badge variant="ether" size="md">Nível {nivelEsper}</Badge>
      </div>

      {/* 1. RELÓGIO DE ONDAS CEREBRAIS */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaClock /> Relógio de Ondas Cerebrais ({relogioSecoes}/{BRAINWAVE_CLOCK_MAX_SECTIONS} Seções)
          </span>
          <Badge variant="pm" size="sm">
            Custo Próxima Dádiva: {custoAtualDadiva} PM
          </Badge>
        </div>

        <div className={styles.clockTrack}>
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              onClick={() => handleToggleSecao(num)}
              className={`${styles.clockSegment} ${num <= relogioSecoes ? styles.clockSegmentFilled : ''}`}
            >
              Seção {num} {num <= relogioSecoes ? '✦' : '✧'}
            </div>
          ))}
        </div>

        <div className={styles.clockControls}>
          <div className={styles.clockButtons}>
            <Button variant="ghost" size="sm" onClick={handleAvancarRelogio} disabled={relogioSecoes >= BRAINWAVE_CLOCK_MAX_SECTIONS}>
              Avançar (+1)
            </Button>
            <Button variant="secondary" size="sm" onClick={handleResetarRelogio}>
              <FaRedo /> Resetar (0)
            </Button>
          </div>
          <div className={styles.printOnly}>
            Relógio de Ondas Cerebrais: {relogioSecoes} de {BRAINWAVE_CLOCK_MAX_SECTIONS} seções ativas. Custo base: {custoAtualDadiva} PM.
          </div>
        </div>
      </div>

      {/* 2. FOCO COGNITIVO */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaEye /> Foco Cognitivo {nvFocoCognitivo > 0 ? `(Nv. ${nvFocoCognitivo})` : ''}
          </span>
          <Badge variant={focoAtivo ? 'core' : 'default'} size="sm">
            {focoAtivo ? 'Foco Fixado' : 'Sem Foco'}
          </Badge>
        </div>

        <div className={styles.focoForm}>
          <div className={styles.focoInputsRow}>
            <select
              value={tipoAlvo}
              onChange={e => setTipoAlvo(e.target.value)}
              className={styles.select}
            >
              <option value="aliado">Aliado (Audição)</option>
              <option value="inimigo">Inimigo (Confuso/Enfurecido/Abalado)</option>
            </select>
            <Input
              placeholder="Nome ou descrição do alvo..."
              value={alvoFoco}
              onChange={e => setAlvoFoco(e.target.value)}
            />
            <Button
              variant={focoAtivo ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setFocoAtivo(!focoAtivo)}
            >
              {focoAtivo ? 'Desfocar' : 'Focar Alvo'}
            </Button>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={unicoAlvo}
              onChange={e => setUnicoAlvo(e.target.checked)}
            />
            Alvo único da magia (otimiza Hipercognição)
          </label>

          <div className={styles.bonusesRow}>
            <Badge variant="gold" size="sm">+{bonusFoco.bonusExame} Exame</Badge>
            <Badge variant="gold" size="sm">+{bonusFoco.bonusPrecisaoMagia} Precisão/Magia</Badge>
            <Badge variant="pv" size="sm">+{bonusFoco.curaExtra} Cura PV/PM</Badge>
            {nvHipercognicao > 0 && (
              <Badge variant="ether" size="sm">Hipercognição: -{reducaoHiper} PM</Badge>
            )}
          </div>

          <div className={styles.printOnly}>
            {focoAtivo ? `Foco Atual (${tipoAlvo}): ${alvoFoco || 'Designado'}` : 'Nenhum foco ativo no momento.'}
          </div>
        </div>
      </div>

      {/* 3. DÁDIVAS PSÍQUICAS */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaBolt /> Dádivas Psíquicas
          </span>
          <Badge variant="pm" size="sm">Custo: {custoAtualDadiva} PM</Badge>
        </div>

        <div className={styles.dadivaForm}>
          <div className={styles.dadivaSelectRow}>
            <select
              value={dadivaKey}
              onChange={e => {
                const k = e.target.value;
                setDadivaKey(k);
                const g = PSYCHIC_GIFTS_CATALOG.find(item => item.key === k);
                if (g?.tipos_dano?.length > 0) setTipoDano(g.tipos_dano[0]);
              }}
              className={styles.select}
            >
              {PSYCHIC_GIFTS_CATALOG.map(g => (
                <option key={g.key} value={g.key}>{g.nome}</option>
              ))}
            </select>

            {dadivaSelecionada.tipos_dano.length > 0 && (
              <select
                value={tipoDano}
                onChange={e => setTipoDano(e.target.value)}
                className={styles.select}
              >
                {dadivaSelecionada.tipos_dano.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            )}

            <Button variant="primary" size="sm" onClick={handleAtivarDadiva}>
              <FaBolt /> Ativar Dádiva ({custoAtualDadiva} PM)
            </Button>
          </div>

          <div className={styles.dadivaDescricao}>
            <strong>{dadivaSelecionada.gatilho}:</strong> {dadivaSelecionada.descricao}
          </div>

          {feedback && (
            <div className={styles.feedbackBox}>
              <FaCheck /> {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
