import {
  FaBolt, FaCheck, FaExclamationTriangle, FaHeart,
  FaWater, FaFire, FaWind, FaMountain, FaRedo
} from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import { MANANCIAIS_ELEMENTAIS } from '../../../../domain/fabula/naturalFantasyRules';
import { useInvocador } from './useInvocador';
import styles from './ExibirInvocador.module.css';

const ICONES_MANANCIAL = { ar: FaWind, terra: FaMountain, fogo: FaFire, raio: FaBolt, agua: FaWater };

export default function ExibirInvocador(props) {
  const {
    nivelInvocador, nvInvocacao, nvInvocacoesConectadas, nvExpandirManancial, nvCascata, nvHarmoniaElemental,
    beneficioInicial, mananciaisCena, manancialInteriorKey,
    elementalPresente, pragaAtiva, atributoCincoMananciais, atributoEscolhidoTerra, setAtributoEscolhidoTerra,
    temArmaExpandir, temManancialInterior, temManipularMagia, temPoderCincoMananciais,
    invocacoesDisponiveis, invocacaoSelecionada, invocacaoSelecionadaKey, setInvocacaoSelecionadaKey,
    alvosExtras, setAlvosExtras, aplicarCuraEmSiMesmo, setAplicarCuraEmSiMesmo,
    valoresPrevia, feedback, erroMsg,
    handleEscolherBeneficio, handleToggleManancialCena, handleAlterarManancialInterior,
    handleToggleElementalPresente, handleRealizarInvocacao, handleDissiparPragaCascata,
    persistirInvocador
  } = useInvocador(props);

  const custoTotalPm = 5 + (alvosExtras * 10);

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaWind /> Mananciais da Alma — Invocador</div>
        <div className={styles.headerActions}>
          <Badge variant="pm" size="md">Nível {nivelInvocador}</Badge>
        </div>
      </div>

      {/* Benefício Inicial (+5 PV ou +5 PM) */}
      <div className={styles.beneficioBar}>
        <span className={styles.beneficioLabel}><FaHeart /> Benefício Inicial (+5 PV ou +5 PM):</span>
        <div className={styles.beneficioBtns}>
          <Button variant={beneficioInicial === 'pv' ? 'core' : 'ghost'} size="sm" onClick={() => handleEscolherBeneficio('pv')}>
            +5 PV Máximos
          </Button>
          <Button variant={beneficioInicial === 'pm' ? 'primary' : 'ghost'} size="sm" onClick={() => handleEscolherBeneficio('pm')}>
            +5 PM Máximos
          </Button>
        </div>
      </div>

      <div className={styles.badgesRow}>
        {nvCascata > 0 && <Badge variant="gold" size="sm">Cascata: +{nvCascata} Precisão (Ataque Livre)</Badge>}
        {nvExpandirManancial > 0 && (
          <Badge variant={temArmaExpandir ? 'core' : 'default'} size="sm">
            Expandir Manancial: +{nvExpandirManancial} Dano ({temArmaExpandir ? 'Arma Ativa' : 'Sem Arma Elegível'})
          </Badge>
        )}
        {nvHarmoniaElemental > 0 && <Badge variant="pv" size="sm">Harmonia Elemental: +{nvHarmoniaElemental * 5} PV Cura</Badge>}
        {nvInvocacoesConectadas > 0 && <Badge variant="pm" size="sm">Invocações Conectadas: até +{nvInvocacoesConectadas} Alvos</Badge>}
        {atributoCincoMananciais && <Badge variant="core" size="sm">Cinco Mananciais: +1 Passo em {atributoCincoMananciais.toUpperCase()}</Badge>}
      </div>

      {/* Seleção dos 2 Mananciais da Cena */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Mananciais Presentes na Cena (Escolha 2):</span>
          {nvHarmoniaElemental > 0 && (
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={elementalPresente} onChange={(e) => handleToggleElementalPresente(e.target.checked)} />
              Elemental Presente (+{nvHarmoniaElemental * 5} PV em curas)
            </label>
          )}
        </div>

        <div className={styles.mananciaisGrid}>
          {Object.values(MANANCIAIS_ELEMENTAIS).map((man) => {
            const ativoCena = mananciaisCena.includes(man.key);
            const ativoInterior = temManancialInterior && manancialInteriorKey === man.key;
            const Icone = ICONES_MANANCIAL[man.key] || FaBolt;
            return (
              <button
                type="button"
                key={man.key}
                onClick={() => handleToggleManancialCena(man.key)}
                className={`${styles.manancialPill} ${ativoCena || ativoInterior ? styles.manancialPillAtivo : ''}`}
              >
                <Icone />
                <span>{man.nomeCurto} ({man.tipoDano})</span>
                {ativoInterior && <Badge variant="core" size="sm">Interior</Badge>}
              </button>
            );
          })}
        </div>

        {temManancialInterior && (
          <div className={styles.selectsRow}>
            <span className={styles.beneficioLabel}>Manancial Interior (Sempre ativo + Resistência):</span>
            <select value={manancialInteriorKey} onChange={(e) => handleAlterarManancialInterior(e.target.value)} className={styles.selectCompact}>
              {Object.values(MANANCIAIS_ELEMENTAIS).map((m) => (
                <option key={m.key} value={m.key}>{m.nome} (Resist. {m.tipoDano})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {pragaAtiva && (
        <div className={styles.pragaAtivaBox}>
          <div>
            <strong>{pragaAtiva.nome} Ativa no Alvo:</strong> Dano de <strong>{pragaAtiva.elementosVulneraveis?.join(' e ')}</strong> causa <strong>+{pragaAtiva.bonusDano} extra</strong>!
          </div>
          <Button variant="core" size="sm" onClick={handleDissiparPragaCascata}>
            <FaBolt /> {nvCascata > 0 ? `Disparar Cascata (+${nvCascata} Precisão) e Dissipar` : 'Dissipar Praga'}
          </Button>
        </div>
      )}

      {/* Canalizar Invocação */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}><FaBolt /> Canalizar Invocação {nvInvocacao > 0 ? `(NP ${nvInvocacao})` : ''}</span>
          <Badge variant="pm" size="sm">Custo: {custoTotalPm} PM</Badge>
        </div>

        {nvInvocacao === 0 ? (
          <div className={styles.emptyBox}>
            Adquira níveis em <strong>Invocação</strong> para acessar os mananciais elementais (NP 1: Explosão, NP 2: Praga, NP 3: Todas).
          </div>
        ) : (
          <div className={styles.composerBody}>
            <div className={styles.selectsRow}>
              <select
                value={invocacaoSelecionada?.key || invocacaoSelecionadaKey}
                onChange={(e) => setInvocacaoSelecionadaKey(e.target.value)}
                className={styles.select}
              >
                {invocacoesDisponiveis.map((inv) => (
                  <option key={inv.key} value={inv.key}>
                    [{inv.manancial_nome.replace('Manancial de ', '')}] {inv.nome} (NP {inv.np_minimo})
                  </option>
                ))}
              </select>

              {nvInvocacoesConectadas > 0 && (
                <select value={alvosExtras} onChange={(e) => setAlvosExtras(parseInt(e.target.value, 10) || 0)} className={styles.selectCompact}>
                  <option value={0}>1 Alvo (5 PM)</option>
                  {[1, 2, 3].slice(0, nvInvocacoesConectadas).map((n) => (
                    <option key={n} value={n}>{1 + n} Alvos ({5 + n * 10} PM)</option>
                  ))}
                </select>
              )}

              {temPoderCincoMananciais && invocacaoSelecionada?.manancial_key === 'terra' && (
                <select value={atributoEscolhidoTerra} onChange={(e) => setAtributoEscolhidoTerra(e.target.value)} className={styles.selectCompact}>
                  <option value="destreza">Terra: +1 Passo DES</option>
                  <option value="astucia">Terra: +1 Passo AST</option>
                  <option value="vigor">Terra: +1 Passo VIG</option>
                  <option value="vontade">Terra: +1 Passo VON</option>
                </select>
              )}

              <Button variant="primary" size="sm" onClick={() => handleRealizarInvocacao(false)}>
                <FaBolt /> Invocar (-{custoTotalPm} PM)
              </Button>
              {temManipularMagia && invocacaoSelecionada?.categoria_invocacao !== 'praga' && (
                <Button variant="secondary" size="sm" onClick={() => handleRealizarInvocacao(true)}>
                  Manipular Magia (0 PM)
                </Button>
              )}
            </div>

            {invocacaoSelecionada && valoresPrevia && (
              <div className={styles.previewBox}>
                <div className={styles.badgesRow}>
                  <Badge variant="ether" size="sm">{invocacaoSelecionada.manancial_nome}</Badge>
                  {valoresPrevia.danoFinal !== null && <Badge variant="crise" size="sm">Dano Total: {valoresPrevia.danoFinal} ({valoresPrevia.tipoDano})</Badge>}
                  {valoresPrevia.pragaBonusDano !== null && <Badge variant="gold" size="sm">Praga: +{valoresPrevia.pragaBonusDano} Dano ({valoresPrevia.elementosVulneraveis.join('/')})</Badge>}
                  {valoresPrevia.curaPvFinal !== null && <Badge variant="pv" size="sm">Recuperação: {valoresPrevia.curaPvFinal} PV</Badge>}
                  {valoresPrevia.perdaPmFinal !== null && <Badge variant="pm" size="sm">Dreno: -{valoresPrevia.perdaPmFinal} PM</Badge>}
                </div>
                <div className={styles.previewTexto}>{invocacaoSelecionada.descricao}</div>
                {valoresPrevia.curaPvFinal !== null && (
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={aplicarCuraEmSiMesmo} onChange={(e) => setAplicarCuraEmSiMesmo(e.target.checked)} />
                    Aplicar cura de PV diretamente nos seus próprios PV
                  </label>
                )}
              </div>
            )}

            {atributoCincoMananciais && (
              <div className={styles.selectsRow}>
                <Button variant="ghost" size="sm" onClick={() => persistirInvocador({ atributoCincoMananciais: null })}>
                  <FaRedo /> Limpar Bônus Cinco Mananciais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <div><strong>Benefício Inicial:</strong> +5 {beneficioInicial.toUpperCase()} Máximos</div>
        <div><strong>Mananciais Ativos:</strong> {mananciaisCena.map((m) => MANANCIAIS_ELEMENTAIS[m]?.nome || m).join(', ')}</div>
        <div><strong>Invocações Disponíveis:</strong> {invocacoesDisponiveis.map((i) => i.nome).join(', ') || 'Nenhuma'}</div>
      </div>
    </Card>
  );
}
