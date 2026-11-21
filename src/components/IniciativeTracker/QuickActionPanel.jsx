import { useState, useMemo } from 'react';
import { FaBolt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Badge } from '../ui';
import { AFINIDADES_DANO, calcularProgressoRelogioPorTeste } from '../../domain/fabula/combatRules';
import QuickDiceStrip from './QuickDiceStrip';
import ActionFeedPanel from './ActionFeedPanel';
import QuickActionForm from './QuickActionForm';
import QuickActionTabs from './QuickActionTabs';
import { CATEGORIAS_ACOES, TODAS_OPCOES } from './quickActionConstants';
import styles from './QuickActionPanel.module.css';

export default function QuickActionPanel({
  participantes = [],
  relogios = [],
  acoesFeed = [],
  isMestre,
  jogadorFichaId,
  jogadorNome,
  atorFocoId,
  setAtorFocoId,
  alvoFocoId,
  setAlvoFocoId,
  obterPerfilRolagem,
  onRolarDados,
  onExecutarAcao,
  onLimparHistorico
}) {
  const [abaAtiva, setAbaAtiva] = useState('principais');
  const [acaoCodigo, setAcaoCodigo] = useState('ATAQUE');
  const [mostrarAvancado, setMostrarAvancado] = useState(false);
  const [painelRecolhido, setPainelRecolhido] = useState(false);

  const [atorIdInput, setAtorIdInput] = useState('');
  const [alvoId, setAlvoId] = useState('');
  const [relogioId, setRelogioId] = useState('');
  const [custoPm, setCustoPm] = useState(0);
  const [custoPi, setCustoPi] = useState(0);
  const [danoAplicado, setDanoAplicado] = useState(0);
  const [curaAplicada, setCuraAplicada] = useState(0);
  const [afinidadeAlvo, setAfinidadeAlvo] = useState(AFINIDADES_DANO.NORMAL);
  const [condicaoAlvo, setCondicaoAlvo] = useState('');
  const [avancoRelogio, setAvancoRelogio] = useState(1);
  const [notaLivre, setNotaLivre] = useState('');
  const [marcarTurnoConcluido, setMarcarTurnoConcluido] = useState(true);

  const meuHeroi = useMemo(() => {
    if (isMestre) return null;
    return (
      participantes.find(
        (p) =>
          p.tipo === 'heroi' &&
          ((jogadorFichaId && String(p.ficha_id) === String(jogadorFichaId)) ||
            (jogadorNome && p.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase()))
      ) || null
    );
  }, [isMestre, participantes, jogadorFichaId, jogadorNome]);

  const atorAtivoPadrao = useMemo(() => {
    if (!isMestre && meuHeroi) return meuHeroi.id;
    const noTurno = participantes.find((p) => p.turno_atual && Number(p.hp_atual) > 0);
    return noTurno?.id || participantes.find((p) => Number(p.hp_atual) > 0)?.id || '';
  }, [isMestre, meuHeroi, participantes]);

  const atorSelecionadoId = !isMestre
    ? (meuHeroi?.id || '')
    : (atorFocoId || atorIdInput || atorAtivoPadrao);

  const alvoSelecionadoId = alvoFocoId !== undefined ? alvoFocoId : alvoId;
  const setAlvoIdFinal = (novoAlvoId) => {
    setAlvoId(novoAlvoId);
    setAlvoFocoId?.(novoAlvoId);
  };
  const setAtorIdFinal = (novoAtorId) => {
    setAtorIdInput(novoAtorId);
    setAtorFocoId?.(novoAtorId);
  };

  const atorSelecionado = useMemo(
    () => participantes.find((p) => String(p.id) === String(atorSelecionadoId)) || null,
    [participantes, atorSelecionadoId]
  );
  const perfilAtor = useMemo(
    () => (atorSelecionado && obterPerfilRolagem ? obterPerfilRolagem(atorSelecionado) : null),
    [atorSelecionado, obterPerfilRolagem]
  );

  const relogioSelecionadoId = relogioId || (relogios[0]?.id || '');
  const categoriaAtual = CATEGORIAS_ACOES.find((c) => c.id === abaAtiva) || CATEGORIAS_ACOES[0];
  const acaoAtual = TODAS_OPCOES.find((a) => a.codigo === acaoCodigo) || TODAS_OPCOES[0];

  const handleTrocarAba = (novaAbaId) => {
    setAbaAtiva(novaAbaId);
    const cat = CATEGORIAS_ACOES.find((c) => c.id === novaAbaId);
    if (cat && cat.opcoes.length > 0) setAcaoCodigo(cat.opcoes[0].codigo);
  };

  const handleRolarArma = async (arma) => {
    if (!onRolarDados || !atorSelecionado) return;
    const semDano = acaoCodigo === 'TIRO_AVISO_QUEBRA_OSSOS';
    const res = await onRolarDados({
      combatente: atorSelecionado, perfil: perfilAtor, categoria: 'arma',
      titulo: `${acaoAtual.titulo}: ${arma.nome}`, attr1: arma.attr1, attr2: arma.attr2,
      bonusTeste: Number(arma.bonusPrecisao) || 0, bonusDano: Number(arma.bonusDano) || 0,
      calcularDano: !semDano, isMulti: acaoCodigo === 'MULTI_ATAQUE',
      zerarHr: acaoCodigo === 'CONTRA_ATAQUE' || acaoCodigo === 'DUAS_ARMAS', tipoDano: arma.tipoDano || 'fisico'
    });
    if (res) {
      if (!semDano && res.danoTotal !== null) setDanoAplicado(res.danoTotal);
      const tagVoador = arma.atingeVoadores ? ' • 🦅 Atinge Voadores' : '';
      setNotaLivre(`${arma.nome}: Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${res.statusCritico ? ` • ${res.statusCritico}` : ''}${tagVoador}`);
    }
  };

  const handleRolarMagia = async (magia) => {
    if (!onRolarDados || !atorSelecionado) return;
    const res = await onRolarDados({
      combatente: atorSelecionado, perfil: perfilAtor, categoria: 'magia',
      titulo: `Conjurar: ${magia.nome}`, attr1: magia.attr1 || 'ast', attr2: magia.attr2 || 'von',
      bonusTeste: Number(magia.bonusPrecisao) || 0, bonusDano: Number(magia.bonusDano) || 0,
      calcularDano: Boolean(magia.ofensiva), tipoDano: 'magico', custoPm: Number(magia.custoPm) || 0
    });
    if (res) {
      setCustoPm(Number(magia.custoPm) || 0);
      if (res.danoTotal !== null) setDanoAplicado(res.danoTotal);
      setNotaLivre(`${magia.nome}: Magia ${res.total} ${res.formulaDados} • RA ${res.hr}`);
    }
  };

  const handleRolarTeste = async (attr1, attr2) => {
    if (!onRolarDados || !atorSelecionado) return;
    const res = await onRolarDados({
      combatente: atorSelecionado, perfil: perfilAtor, categoria: 'atributo',
      titulo: `Teste (${acaoAtual.titulo})`, attr1, attr2, isOposto: acaoCodigo === 'IMPEDIMENTO',
      ndAlvo: acaoCodigo === 'ESTUDO' || acaoCodigo === 'OBJETIVO' ? 10 : null, calcularDano: false
    });
    if (res) {
      if (acaoCodigo === 'OBJETIVO') {
        const prog = calcularProgressoRelogioPorTeste({
          resultadoTeste: res.total, nivelDificuldade: 10, isCritico: res.isCritico, isFalhaCritica: res.isFumble
        });
        setAvancoRelogio(prog.secoesAvancadas);
      }
      setNotaLivre(`Teste ${res.total} ${res.formulaDados}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);
    }
  };

  const handleDisparar = async (e) => {
    e.preventDefault();
    if (!atorSelecionadoId) return;
    if (!isMestre && !meuHeroi) return;

    const ok = await onExecutarAcao({
      acaoCodigo, atorId: atorSelecionadoId, alvoId: alvoSelecionadoId || null,
      relogioId: acaoCodigo === 'OBJETIVO' ? relogioSelecionadoId : null,
      custoPm, custoPi, danoAplicado, curaAplicada, afinidadeAlvo,
      condicaoAlvo: condicaoAlvo || null, avancoRelogio: acaoCodigo === 'OBJETIVO' ? avancoRelogio : 0,
      notaLivre, marcarTurnoConcluido: !acaoAtual.isReacao && marcarTurnoConcluido
    });

    if (ok) {
      setDanoAplicado(0); setCuraAplicada(0); setCustoPm(0); setCustoPi(0);
      setCondicaoAlvo(''); setNotaLivre('');
    }
  };

  if (participantes.length === 0) return null;

  const temModAvancado = custoPm > 0 || custoPi > 0 || afinidadeAlvo !== 'normal' || Boolean(condicaoAlvo);
  const podeExibirDadosAtor = isMestre || (atorSelecionado && atorSelecionado.id === meuHeroi?.id);
  const formState = { danoAplicado, curaAplicada, custoPm, custoPi, afinidadeAlvo, condicaoAlvo, avancoRelogio, notaLivre, marcarTurnoConcluido, mostrarAvancado, temModAvancado };
  const formSetters = { setDanoAplicado, setCuraAplicada, setCustoPm, setCustoPi, setAfinidadeAlvo, setCondicaoAlvo, setAvancoRelogio, setNotaLivre, setMarcarTurnoConcluido, setMostrarAvancado };

  return (
    <div className={`${styles.tacticalGrid} ${styles.noPrint}`}>
      <section className={styles.actionCard}>
        <header className={styles.panelHeader} onClick={() => setPainelRecolhido((v) => !v)}>
          <div className={styles.headerTitleWrap}>
            <h3 className={styles.panelTitle}>
              <FaBolt />
              <span className={styles.panelTitleDesktop}>Central de Ações & Rolagens</span>
              <span className={styles.panelTitleMobile}>Ações & Rolagens</span>
            </h3>
            <Badge variant="gold" size="sm">{acaoAtual.titulo}</Badge>
          </div>
          <button
            type="button"
            className={styles.collapseToggleBtn}
            title={painelRecolhido ? 'Expandir painel de ações' : 'Recolher painel de ações'}
          >
            {painelRecolhido ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </header>

        {!painelRecolhido && (
          <div className={styles.panelBody}>
            <QuickActionTabs
              abaAtiva={abaAtiva}
              handleTrocarAba={handleTrocarAba}
              categoriaAtual={categoriaAtual}
              acaoCodigo={acaoCodigo}
              setAcaoCodigo={setAcaoCodigo}
            />

            {podeExibirDadosAtor && (
              <QuickDiceStrip
                atorSelecionado={atorSelecionado}
                perfilAtor={perfilAtor}
                acaoCodigo={acaoCodigo}
                onRolarArma={handleRolarArma}
                onRolarMagia={handleRolarMagia}
                onRolarTeste={handleRolarTeste}
              />
            )}

            <QuickActionForm
              acaoAtual={acaoAtual}
              acaoCodigo={acaoCodigo}
              atorSelecionadoId={atorSelecionadoId}
              setAtorIdInput={setAtorIdFinal}
              participantes={participantes}
              alvoId={alvoSelecionadoId}
              setAlvoId={setAlvoIdFinal}
              relogios={relogios}
              relogioSelecionadoId={relogioSelecionadoId}
              setRelogioId={setRelogioId}
              formState={formState}
              formSetters={formSetters}
              handleDisparar={handleDisparar}
              isMestre={isMestre}
              meuHeroi={meuHeroi}
            />
          </div>
        )}
      </section>

      <ActionFeedPanel
        acoesFeed={acoesFeed}
        isMestre={isMestre}
        onLimparHistorico={onLimparHistorico}
      />
    </div>
  );
}
