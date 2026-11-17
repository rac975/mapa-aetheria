import { useState, useMemo, useEffect } from 'react';
import { FaCrown, FaPlus, FaTrash, FaCheck, FaStar, FaBookOpen } from 'react-icons/fa';
import { Card, Button, Badge, Input, Modal } from '../../../components/ui';
import { fichaService } from '../../../services/fichaService';
import { useAlert } from '../../../contexts/useAlert';
import {
  FONTES_MANUAIS,
  REGRAS_OFICIAIS_RESUMO,
  calcularLimitePoderesHeroicos,
  obterClassesDominadas,
  listarPoderesHeroicosDisponiveis,
  validarSelecaoPoderesHeroicos,
  calcularBonusPassivosPoderesHeroicos,
  extrairHeroicAndQuirksDaFicha,
  buscarPoderHeroicoNoCatalogo,
  normalizarTexto
} from '../../../domain/fabula/heroicAndQuirksRules';
import styles from './FichaPoderesHeroicosSecao.module.css';

const FILTROS_FONTE = [
  { key: null, label: 'Todos os Manuais' },
  { key: FONTES_MANUAIS.LIVRO_BASICO, label: FONTES_MANUAIS.LIVRO_BASICO },
  { key: FONTES_MANUAIS.ALTA_FANTASIA, label: FONTES_MANUAIS.ALTA_FANTASIA },
  { key: FONTES_MANUAIS.TECNO_FANTASIA, label: FONTES_MANUAIS.TECNO_FANTASIA },
  { key: FONTES_MANUAIS.FANTASIA_NATURAL, label: FONTES_MANUAIS.FANTASIA_NATURAL }
];

export default function FichaPoderesHeroicosSecao({ fichaId, ficha, setFicha, classes = [] }) {
  const { showAlert } = useAlert();
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroFonte, setFiltroFonte] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [catalogoPoderes, setCatalogoPoderes] = useState([]);

  useEffect(() => {
    let cancelado = false;
    const carregarCatalogo = async () => {
      try {
        const dados = await fichaService.getCatalogoPoderesHeroicos();
        if (!cancelado && dados) {
          setCatalogoPoderes(dados);
        }
      } catch (err) {
        console.error('Erro ao carregar catálogo de poderes heróicos:', err);
      }
    };
    carregarCatalogo();
    return () => {
      cancelado = true;
    };
  }, []);

  const fichaIdReal = fichaId || ficha?.id;
  const nivelTotal = useMemo(
    () => (classes || []).reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || 5,
    [classes]
  );

  const classesDominadasObjs = useMemo(() => obterClassesDominadas(classes), [classes]);
  const limitePoderes = useMemo(() => calcularLimitePoderesHeroicos(classes), [classes]);
  const { poderes_heroicos: poderesAdquiridos } = useMemo(
    () => extrairHeroicAndQuirksDaFicha(ficha || {}),
    [ficha]
  );

  const bonusPassivos = useMemo(
    () => calcularBonusPassivosPoderesHeroicos(poderesAdquiridos, nivelTotal),
    [poderesAdquiridos, nivelTotal]
  );

  const analiseCatalogo = useMemo(
    () => listarPoderesHeroicosDisponiveis(classes, poderesAdquiridos, filtroFonte, catalogoPoderes),
    [classes, poderesAdquiridos, filtroFonte, catalogoPoderes]
  );

  // Filtra apenas os poderes cujos pré-requisitos de classe Nv. 10 e habilidades o personagem atende
  const poderesFiltradosModal = useMemo(() => {
    const listaElegiveis = [...analiseCatalogo.elegiveis, ...analiseCatalogo.adquiridos];
    const buscaNorm = normalizarTexto(termoBusca);
    if (!buscaNorm) return listaElegiveis;
    return listaElegiveis.filter(
      (p) =>
        normalizarTexto(p.nome).includes(buscaNorm) ||
        normalizarTexto(p.nome_original).includes(buscaNorm) ||
        normalizarTexto(p.descricao).includes(buscaNorm) ||
        (p.classes_requeridas || []).some((cr) => normalizarTexto(cr).includes(buscaNorm))
    );
  }, [analiseCatalogo, termoBusca]);

  const persistirPoderes = async (novaLista, msgFeedback) => {
    if (!fichaIdReal) return;
    setSalvando(true);
    setFeedback('');
    try {
      await fichaService.salvarPoderesHeroicos(fichaIdReal, novaLista);
      if (setFicha) setFicha((prev) => ({ ...prev, poderes_heroicos: novaLista }));
      setFeedback(msgFeedback);
    } catch (err) {
      showAlert(`Erro ao salvar Poderes Heróicos: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleAdquirirPoder = async (poderCatalogo) => {
    const novoPoder = {
      key: poderCatalogo.key,
      nome: poderCatalogo.nome,
      fonte: poderCatalogo.fonte,
      descricao: poderCatalogo.descricao,
      classe_origem: poderCatalogo.classesDominadasQueHabilitam?.[0] || null
    };
    const novaLista = [...poderesAdquiridos, novoPoder];
    const validacao = validarSelecaoPoderesHeroicos(classes, novaLista, catalogoPoderes);
    if (!validacao.valido) {
      showAlert(validacao.erros.join('\n'));
      return;
    }
    await persistirPoderes(novaLista, `Poder Heróico "${poderCatalogo.nome}" adquirido com sucesso!`);
  };

  const handleRemoverPoder = async (chaveOuNome) => {
    const alvoNorm = normalizarTexto(chaveOuNome);
    const novaLista = poderesAdquiridos.filter(
      (p) => normalizarTexto(p.key || p.nome) !== alvoNorm && normalizarTexto(p.nome) !== alvoNorm
    );
    await persistirPoderes(novaLista, 'Poder Heróico removido da ficha.');
  };

  const tagsBonusAtivos = [
    bonusPassivos.bonusPvMax > 0 && `+${bonusPassivos.bonusPvMax} PV Máx`,
    bonusPassivos.bonusPmMax > 0 && `+${bonusPassivos.bonusPmMax} PM Máx`,
    bonusPassivos.bonusPiMax > 0 && `+${bonusPassivos.bonusPiMax} PI Máx`,
    bonusPassivos.bonusIniciativa > 0 && `+${bonusPassivos.bonusIniciativa} Iniciativa`,
    bonusPassivos.reducaoDanoExtraEscudoOuMarcial > 0 && `-${bonusPassivos.reducaoDanoExtraEscudoOuMarcial} Dano (Escudo/Marcial)`,
    bonusPassivos.reducaoCustoPi > 0 && `-${bonusPassivos.reducaoCustoPi} Custo PI`,
    bonusPassivos.aumentosAtributo.destreza > 0 && `+${bonusPassivos.aumentosAtributo.destreza} Passo DES`,
    bonusPassivos.aumentosAtributo.astucia > 0 && `+${bonusPassivos.aumentosAtributo.astucia} Passo AST`,
    bonusPassivos.aumentosAtributo.vigor > 0 && `+${bonusPassivos.aumentosAtributo.vigor} Passo VIG`,
    bonusPassivos.aumentosAtributo.vontade > 0 && `+${bonusPassivos.aumentosAtributo.vontade} Passo VON`,
    bonusPassivos.permiteArma2hEmUmaMao && 'Arma 2H em 1 Mão',
    bonusPassivos.permiteDuasArmasCategoriasDistintas && 'Ambidestria'
  ].filter(Boolean);

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.sectionHeader}>
          <FaCrown /> Poderes Heróicos ({poderesAdquiridos.length}/{limitePoderes})
        </h3>
        <div className={`${styles.headerActions} ${styles.noPrint}`}>
          <Badge variant={analiseCatalogo.possuiSlotsLivres ? 'core' : 'gold'} size="md">
            {analiseCatalogo.slotsLivres} Slot(s) Livre(s)
          </Badge>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalAberto(true)}
            disabled={limitePoderes === 0 && poderesAdquiridos.length === 0}
          >
            <FaBookOpen /> Catálogo de Poderes Heróicos
          </Button>
        </div>
      </div>

      <div className={styles.summaryBar}>
        <div className={styles.masteredClassesGroup}>
          <span className={styles.summaryLabel}>Classes Dominadas (Nv. 10):</span>
          {classesDominadasObjs.length === 0 ? (
            <Badge variant="default" size="sm">Nenhuma classe no Nível 10 ainda</Badge>
          ) : (
            classesDominadasObjs.map((cd, idx) => (
              <Badge key={idx} variant="gold" size="sm">
                <FaStar /> {cd.nome_classe} (Nv. {cd.nivel})
              </Badge>
            ))
          )}
        </div>
        <Badge variant="ether" size="sm">Elegíveis no Catálogo: {analiseCatalogo.elegiveis.length}</Badge>
      </div>

      {tagsBonusAtivos.length > 0 && (
        <div className={styles.passiveBonusesStrip}>
          <span className={styles.summaryLabel}>Bônus Passivos Ativos na Ficha:</span>
          {tagsBonusAtivos.map((tag, idx) => (
            <Badge key={idx} variant="core" size="sm">{tag}</Badge>
          ))}
        </div>
      )}

      {feedback && <div className={`${styles.feedbackBanner} ${styles.noPrint}`}>{feedback}</div>}

      {poderesAdquiridos.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>
            {limitePoderes > 0
              ? `Você possui ${limitePoderes} slot(s) de Poder Heróico disponível(is) por dominar classe(s) no Nível 10!`
              : 'Nenhum Poder Heróico desbloqueado ainda.'}
          </p>
          <p className={styles.emptyText}>{REGRAS_OFICIAIS_RESUMO.poderesHeroicos.regraDesbloqueio}</p>
        </div>
      ) : (
        <div className={styles.skillsGrid}>
          {poderesAdquiridos.map((item, idx) => {
            const detCatalogo = buscarPoderHeroicoNoCatalogo(item.key || item.nome, catalogoPoderes);
            const classesReq = detCatalogo?.classes_requeridas || [];
            const habsReq = detCatalogo?.habilidades_requeridas || [];
            return (
              <div key={item.key || idx} className={styles.skillCard}>
                <div className={styles.skillCardTop}>
                  <div className={styles.skillTitleGroup}>
                    <span className={styles.skillName}><FaCrown /> {item.nome}</span>
                    {detCatalogo?.nome_original && (
                      <span className={styles.skillOriginalName}>{detCatalogo.nome_original}</span>
                    )}
                    <div className={styles.badgesRow}>
                      <Badge variant="gold" size="sm">{item.fonte || detCatalogo?.fonte || 'Livro Básico'}</Badge>
                      {item.classe_origem && <Badge variant="ether" size="sm">Origem: {item.classe_origem}</Badge>}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    className={styles.noPrint}
                    disabled={salvando}
                    onClick={() => handleRemoverPoder(item.key || item.nome)}
                    title="Remover Poder Heróico"
                  >
                    <FaTrash />
                  </Button>
                </div>
                <p className={styles.skillDescription}>{item.descricao || detCatalogo?.descricao}</p>
                <div className={styles.skillReqs}>
                  <strong>Requisito:</strong>{' '}
                  {classesReq.length > 0 ? `Classe Nv. 10 (${classesReq.join(', ')})` : 'Qualquer Classe Nv. 10'}
                  {habsReq.length > 0 ? ` • Habilidade: ${habsReq.join(', ')}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Catálogo Oficial de Poderes Heróicos (Elegíveis)"
        size="lg"
        footer={
          <div className={styles.modalFooterActions}>
            <Button variant="secondary" size="sm" onClick={() => setModalAberto(false)}>Fechar</Button>
          </div>
        }
      >
        <div className={styles.modalBody}>
          <div className={styles.modalTopInfo}>
            <span>
              Exibindo apenas os Poderes Heróicos cujos pré-requisitos de <strong>Classe Dominada (Nv. 10)</strong> e <strong>Habilidades</strong> seu personagem cumpre.
            </span>
            <Badge variant={analiseCatalogo.possuiSlotsLivres ? 'core' : 'gold'} size="md">
              {analiseCatalogo.slotsUsados} / {analiseCatalogo.slotsTotais} Adquiridos
            </Badge>
          </div>

          <div className={styles.modalFiltersRow}>
            <div className={styles.sourceTabs}>
              {FILTROS_FONTE.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFiltroFonte(f.key)}
                  className={`${styles.tabBtn} ${filtroFonte === f.key ? styles.tabBtnActive : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Filtrar por nome, classe ou efeito mecânico..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>

          <div className={styles.catalogList}>
            {poderesFiltradosModal.map((poder) => (
              <div
                key={poder.key}
                className={`${styles.catalogCard} ${poder.jaAdquirido ? styles.catalogCardAcquired : ''}`}
              >
                <div className={styles.skillTitleGroup}>
                  <span className={styles.skillName}>{poder.nome}</span>
                  <span className={styles.skillOriginalName}>{poder.nome_original}</span>
                  <div className={styles.badgesRow}>
                    <Badge variant="gold" size="sm">{poder.fonte}</Badge>
                    <Badge variant="ether" size="sm">
                      {poder.classes_requeridas?.length > 0 ? poder.classes_requeridas.join(' / ') : 'Geral (Qualquer Nv. 10)'}
                    </Badge>
                  </div>
                </div>
                <p className={styles.skillDescription}>{poder.descricao}</p>
                <div className={styles.catalogCardFooter}>
                  <span className={styles.skillOriginalName}>
                    {poder.habilidades_requeridas?.length > 0
                      ? `Requer: ${poder.habilidades_requeridas.join(', ')}`
                      : `Habilitado por: ${poder.classesDominadasQueHabilitam?.join(', ') || 'Classe Nv. 10'}`}
                  </span>
                  {poder.jaAdquirido ? (
                    <Button variant="danger" size="sm" disabled={salvando} onClick={() => handleRemoverPoder(poder.key)}>
                      <FaCheck /> Adquirido (Remover)
                    </Button>
                  ) : (
                    <Button
                      variant="core"
                      size="sm"
                      disabled={!analiseCatalogo.possuiSlotsLivres || salvando}
                      onClick={() => handleAdquirirPoder(poder)}
                    >
                      <FaPlus /> Adquirir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </Card>
  );
}
