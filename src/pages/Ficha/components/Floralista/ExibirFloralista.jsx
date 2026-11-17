import {
  FaSeedling,
  FaBookOpen,
  FaCheck,
  FaExclamationTriangle,
  FaHeart,
  FaClock,
  FaExchangeAlt,
  FaTrash,
  FaLeaf
} from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import { useFloralista } from './useFloralista';
import FloralistaCatalogoModal from './FloralistaCatalogoModal';
import styles from './ExibirFloralista.module.css';

export default function ExibirFloralista(props) {
  const {
    catalogoMagiseeds, nivelFloralista, nvCloromancia, maxMagiseeds,
    nvArvoreDaVida, curaArvore, nvEnxerto, nvInfluenciaVerdejante, nvJardinagemMarcial, limitePmJardinagem,
    beneficioInicial, magiseedsAprendidas, magiseedsDisponiveis,
    magiseedSelecionada, magiseedSelecionadaKey, setMagiseedSelecionadaKey,
    magiseedAtiva, secaoRelogio, escolhaElementoMagiseed,
    efeitoAtivoNoJardim, dedoVerdeUsadoCiclo,
    temCloromanciaMaior, temDedoVerde, temMuralhaEspinhos,
    isModalOpen, setIsModalOpen, feedback, erroMsg,
    handleEscolherBeneficio, handleSalvarMagiseedsModal,
    handlePlantarOuEnxertar, handleAvancarRelogio, handleAlterarElementoMagiseed, handleRemoverMagiseed
  } = useFloralista(props);

  const opcoesConversao = efeitoAtivoNoJardim?.opcoesConversao || [];

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaSeedling /> Jardim de Cloromancia — Floralista
        </div>
        <div className={styles.headerActions}>
          {nvCloromancia > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Magissementes ({magiseedsAprendidas.length}/{maxMagiseeds})
            </Button>
          )}
          <Badge variant="core" size="md">Nível {nivelFloralista}</Badge>
        </div>
      </div>

      {/* Benefício Inicial (+5 PV ou +5 PM) */}
      <div className={styles.beneficioBar}>
        <span className={styles.beneficioLabel}>
          <FaHeart /> Benefício Inicial (+5 PV ou +5 PM):
        </span>
        <div className={styles.beneficioBtns}>
          <Button
            variant={beneficioInicial === 'pv' ? 'core' : 'ghost'}
            size="sm"
            onClick={() => handleEscolherBeneficio('pv')}
          >
            +5 PV Máximos
          </Button>
          <Button
            variant={beneficioInicial === 'pm' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleEscolherBeneficio('pm')}
          >
            +5 PM Máximos
          </Button>
        </div>
      </div>

      {/* Passivas e Poderes */}
      <div className={styles.badgesRow}>
        {nvArvoreDaVida > 0 && (
          <Badge variant="pv" size="sm">Árvore da Vida: +{curaArvore} PV (Alvo em Crise)</Badge>
        )}
        {nvJardinagemMarcial > 0 && (
          <Badge variant="gold" size="sm">Jardinagem Marcial: Ataque Livre / Feitiço ≤ {limitePmJardinagem} PM</Badge>
        )}
        {nvEnxerto > 0 && <Badge variant="core" size="sm">Enxerto (Trocar Semente)</Badge>}
        {nvInfluenciaVerdejante > 0 && <Badge variant="ether" size="sm"><FaLeaf /> Influência Verdejante (Ritualismo)</Badge>}
        {temCloromanciaMaior && <Badge variant="pm" size="sm">Cloromancia Maior (20 PM)</Badge>}
        {temDedoVerde && <Badge variant="core" size="sm">Dedo Verde (±1 Seção / Ignora Resist.)</Badge>}
        {temMuralhaEspinhos && <Badge variant="gold" size="sm">Muralha de Espinhos (Resist. Luz/Veneno)</Badge>}
      </div>

      {/* O Jardim & Relógio de Germinação (4 Seções) */}
      {magiseedAtiva && (
        <div className={styles.jardimAtivoBox}>
          <div className={styles.jardimTopRow}>
            <div>
              <span className={styles.jardimSeedTitle}><FaSeedling /> No Jardim: {magiseedAtiva.nome}</span>
              <div className={styles.jardimSeedDesc}>{magiseedAtiva.descricao}</div>
            </div>
            <div className={styles.relogioSegments}>
              {[0, 1, 2, 3].map((sec) => (
                <div
                  key={sec}
                  className={`${styles.relogioBadge} ${secaoRelogio === sec ? styles.relogioBadgeAtivo : ''} ${sec < secaoRelogio ? styles.relogioBadgePreenchido : ''}`}
                >
                  T={sec}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.previewBox}>
            <div className={styles.badgesRow}>
              <Badge variant="core" size="sm"><FaClock /> Seção Atual: {secaoRelogio} / 4</Badge>
              {efeitoAtivoNoJardim.conversaoDano && (
                <Badge variant="gold" size="sm">Dano Convertido: {efeitoAtivoNoJardim.conversaoDano.toUpperCase()}</Badge>
              )}
              {efeitoAtivoNoJardim.resistencias?.length > 0 && (
                <Badge variant="ether" size="sm">Resistência: {efeitoAtivoNoJardim.resistencias.join(', ').toUpperCase()}</Badge>
              )}
            </div>
            <div className={styles.previewTexto}>{efeitoAtivoNoJardim.textoSecao}</div>

            {opcoesConversao.length > 0 && (
              <div className={styles.selectsRow}>
                <span className={styles.beneficioLabel}>Elemento Ativo:</span>
                {opcoesConversao.map((elem) => (
                  <Button
                    key={elem}
                    variant={escolhaElementoMagiseed === elem ? 'core' : 'ghost'}
                    size="sm"
                    onClick={() => handleAlterarElementoMagiseed(elem)}
                  >
                    {elem.toUpperCase()}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.jardimControls}>
            <Button variant="primary" size="sm" onClick={() => handleAvancarRelogio(0)}>
              <FaClock /> Fim do Turno (+1 Seção)
            </Button>
            {temDedoVerde && !dedoVerdeUsadoCiclo && (
              <>
                <Button variant="core" size="sm" onClick={() => handleAvancarRelogio(1)}>
                  Dedo Verde (+2 Seções)
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleAvancarRelogio(-1)}>
                  Dedo Verde (+0 Seção)
                </Button>
              </>
            )}
            <Button variant="danger" size="sm" onClick={() => handleRemoverMagiseed(true)}>
              <FaTrash /> Colher / Remover do Jardim
            </Button>
          </div>
        </div>
      )}

      {/* Plantar ou Enxertar Magissemente */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaSeedling /> {magiseedAtiva ? 'Enxertar Outra Magissemente' : 'Plantar Magissemente no Jardim'}
          </span>
          <Badge variant="pm" size="sm">Cloromancia: 20 PM {nvEnxerto > 0 ? '| Enxerto: 0 PM' : ''}</Badge>
        </div>

        {nvCloromancia === 0 ? (
          <div className={styles.emptyBox}>
            Adquira níveis em <strong>Cloromancia</strong> para cultivar magissementes.
          </div>
        ) : magiseedsDisponiveis.length === 0 ? (
          <div className={styles.emptyBox}>
            <span>Nenhuma magissemente selecionada ({magiseedsAprendidas.length}/{maxMagiseeds}).</span>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Escolher Magissementes no Catálogo
            </Button>
          </div>
        ) : (
          <div className={styles.composerBody}>
            <div className={styles.selectsRow}>
              <select
                value={magiseedSelecionada?.key || magiseedSelecionadaKey}
                onChange={(e) => setMagiseedSelecionadaKey(e.target.value)}
                className={styles.select}
              >
                {magiseedsDisponiveis.map((m) => (
                  <option key={m.key} value={m.key}>{m.nome}</option>
                ))}
              </select>

              {!magiseedAtiva ? (
                <Button variant="primary" size="sm" onClick={() => handlePlantarOuEnxertar(false)}>
                  <FaSeedling /> Plantar (-20 PM)
                </Button>
              ) : (
                nvEnxerto > 0 && secaoRelogio >= 1 && (
                  <Button variant="core" size="sm" onClick={() => handlePlantarOuEnxertar(true)}>
                    <FaExchangeAlt /> Enxertar (Manter T={secaoRelogio})
                  </Button>
                )
              )}
            </div>

            {magiseedSelecionada && (
              <div className={styles.seedPreviewMini}>
                <div><strong>{magiseedSelecionada.nome}:</strong> {magiseedSelecionada.descricao}</div>
                {magiseedSelecionada.efeito_secao_0 && <div><strong>[0-1]:</strong> {magiseedSelecionada.efeito_secao_0}</div>}
                {!magiseedSelecionada.efeito_secao_0 && magiseedSelecionada.efeito_secao_1 && <div><strong>[1]:</strong> {magiseedSelecionada.efeito_secao_1}</div>}
                {magiseedSelecionada.efeito_secao_2 && <div><strong>[2]:</strong> {magiseedSelecionada.efeito_secao_2}</div>}
                {magiseedSelecionada.efeito_secao_3 && magiseedSelecionada.efeito_secao_3 !== magiseedSelecionada.efeito_secao_2 && (
                  <div><strong>[3]:</strong> {magiseedSelecionada.efeito_secao_3}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <div><strong>Benefício Inicial:</strong> +5 {beneficioInicial.toUpperCase()} Máximos</div>
        <div><strong>Magissementes Conhecidas:</strong> {magiseedsDisponiveis.map((m) => m.nome).join(', ') || 'Nenhuma'}</div>
        {magiseedAtiva && <div><strong>No Jardim (T={secaoRelogio}/4):</strong> {magiseedAtiva.nome} — {efeitoAtivoNoJardim.textoSecao}</div>}
      </div>

      {isModalOpen && (
        <FloralistaCatalogoModal
          onClose={() => setIsModalOpen(false)}
          catalogoMagiseeds={catalogoMagiseeds}
          magiseedsIniciais={magiseedsAprendidas}
          maxMagiseeds={maxMagiseeds}
          nvCloromancia={nvCloromancia}
          onSalvar={handleSalvarMagiseedsModal}
        />
      )}
    </Card>
  );
}
