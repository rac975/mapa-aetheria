import {
  FaBookOpen,
  FaCheck,
  FaExclamationTriangle,
  FaHeart,
  FaBolt,
  FaRedo
} from 'react-icons/fa';
import { GiSpinningRibbons } from 'react-icons/gi';
import { Card, Button, Badge } from '../../../../components/ui';
import { useDancarino } from './useDancarino';
import DancarinoCatalogoModal from './DancarinoCatalogoModal';
import styles from './ExibirDancarino.module.css';

export default function ExibirDancarino(props) {
  const {
    catalogoDancas, nivelDancarino, nvDanca, maxDancas,
    nvDancarinoGuerra, nvMeAcompanhe, nvSapateado, nvTrocaFigurino,
    beneficioInicial, dancasAprendidas, dancasDisponiveis,
    dancaSelecionada, dancaSelecionadaKey, setDancaSelecionadaKey,
    ultimaDancaKey, dancaAtivaTurno, usarMeAcompanhe, setUsarMeAcompanhe,
    modoElemento, setModoElemento, temArmaduraMarcial, temPasoDoble, temEspetaculo,
    custoAtual, valoresDanca, isModalOpen, setIsModalOpen,
    feedback, erroMsg, handleEscolherBeneficio, handleSalvarDancasModal,
    handleApresentarDanca, handleEncerrarCena
  } = useDancarino(props);

  const temOpcaoElemento = Boolean(dancaSelecionada?.descricao?.includes('Resistente a dano'));

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <GiSpinningRibbons /> Fluxo Acrobático — Dançarino
        </div>
        <div className={styles.headerActions}>
          {nvDanca > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Danças ({dancasAprendidas.length}/{maxDancas})
            </Button>
          )}
          <Badge variant="core" size="md">Nível {nivelDancarino}</Badge>
        </div>
      </div>

      {/* Escolha do Benefício Inicial (+5 PV ou +5 PM) */}
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

      {/* Passivas e Sinergias */}
      <div className={styles.badgesRow}>
        {nvDancarinoGuerra > 0 && (
          <Badge variant="gold" size="sm">
            <FaBolt /> Dançarino de Guerra: +{nvDancarinoGuerra} Dano
          </Badge>
        )}
        {nvSapateado > 0 && (
          <Badge variant="ether" size="sm">
            Sapateado Frenético: +{nvSapateado * 2} Testes Opostos
          </Badge>
        )}
        {nvTrocaFigurino > 0 && (
          <Badge variant="core" size="sm">Troca de Figurino (Equip. Grátis)</Badge>
        )}
        {temEspetaculo && (
          <Badge variant="gold" size="sm">Espetáculo (3 Danças / 1 PF)</Badge>
        )}
      </div>

      {temArmaduraMarcial && (
        <div className={styles.erroBox}>
          <FaExclamationTriangle /> Armadura Marcial equipada: Danças não podem ser apresentadas.
        </div>
      )}

      {dancaAtivaTurno && (
        <div className={styles.ativaBox}>
          <div>
            <strong>Dança Ativa até o próximo turno:</strong> {dancaAtivaTurno.nome} — {dancaAtivaTurno.descricao}
          </div>
          <Button variant="ghost" size="sm" onClick={handleEncerrarCena}>
            <FaRedo /> Resetar Cena
          </Button>
        </div>
      )}

      {/* Apresentação de Dança */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <GiSpinningRibbons /> Apresentar Dança {nvDanca > 0 ? `(NP ${nvDanca})` : ''}
          </span>
          <div className={styles.badgesRow}>
            {custoAtual.descontoConsecutivoAplicado && (
              <Badge variant="core" size="sm">Consecutiva (-5 PM)</Badge>
            )}
            <Badge variant="pm" size="sm">Custo: {custoAtual.custoTotal} PM</Badge>
          </div>
        </div>

        {nvDanca === 0 ? (
          <div className={styles.emptyBox}>
            Adquira níveis em <strong>Dança</strong> para aprender coreografias mágicas.
          </div>
        ) : dancasDisponiveis.length === 0 ? (
          <div className={styles.emptyBox}>
            <span>Nenhuma dança selecionada ({dancasAprendidas.length}/{maxDancas}).</span>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Escolher Danças no Catálogo
            </Button>
          </div>
        ) : (
          <div className={styles.composerBody}>
            <div className={styles.selectsRow}>
              <select
                value={dancaSelecionada?.key || dancaSelecionadaKey}
                onChange={(e) => setDancaSelecionadaKey(e.target.value)}
                className={styles.select}
              >
                {dancasDisponiveis.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.nome} ({d.tipo_duracao === 'turno' ? 'Até próx. turno' : 'Instantânea'})
                  </option>
                ))}
              </select>

              {temOpcaoElemento && (
                <select value={modoElemento} onChange={(e) => setModoElemento(e.target.value)} className={styles.selectCompact}>
                  <option value="resistencia">Efeito: Resistência Elemental</option>
                  <option value="converter">Efeito: Converter Dano</option>
                </select>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleApresentarDanca}
                disabled={temArmaduraMarcial}
              >
                <GiSpinningRibbons /> Apresentar (-{custoAtual.custoTotal} PM)
              </Button>
            </div>

            {nvMeAcompanhe > 0 && dancaSelecionada?.tipo_duracao === 'turno' && (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={usarMeAcompanhe}
                  onChange={(e) => setUsarMeAcompanhe(e.target.checked)}
                />
                Me Acompanhe: Aliado com Laço de afeto também recebe a dança (
                {temPasoDoble && custoAtual.pasoDobleAplicado ? '0 PM — Paso Doble em Crise!' : '+10 PM'})
              </label>
            )}

            {dancaSelecionada && (
              <div className={styles.previewBox}>
                <div>
                  <Badge variant={dancaSelecionada.tipo_duracao === 'turno' ? 'ether' : 'gold'} size="sm">
                    {dancaSelecionada.duracao}
                  </Badge>
                </div>
                <div className={styles.previewTexto}>{dancaSelecionada.descricao}</div>
                {valoresDanca.curaUnicornio !== null && (
                  <Badge variant="pv" size="sm">Cura Atual (dDES + Nível): {valoresDanca.curaUnicornio} PV</Badge>
                )}
                {valoresDanca.perdaPmMenade !== null && (
                  <Badge variant="pm" size="sm">Perda de PM (dDES): {valoresDanca.perdaPmMenade} PM</Badge>
                )}
              </div>
            )}

            {ultimaDancaKey && !dancaAtivaTurno && (
              <div className={styles.resetRow}>
                <Button variant="ghost" size="sm" onClick={handleEncerrarCena}>
                  <FaRedo /> Reiniciar Sequência de Cena
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
        <div><strong>Danças Aprendidas:</strong> {dancasDisponiveis.map((d) => d.nome).join(', ') || 'Nenhuma'}</div>
      </div>

      {isModalOpen && (
        <DancarinoCatalogoModal
          onClose={() => setIsModalOpen(false)}
          catalogoDancas={catalogoDancas}
          dancasIniciais={dancasAprendidas}
          maxDancas={maxDancas}
          nvDanca={nvDanca}
          onSalvar={handleSalvarDancasModal}
        />
      )}
    </Card>
  );
}
