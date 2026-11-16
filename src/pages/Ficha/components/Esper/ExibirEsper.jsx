import { FaBrain, FaClock, FaEye, FaBolt, FaRedo, FaCheck, FaBookOpen } from 'react-icons/fa';
import { Button, Badge, Input } from '../../../../components/ui';
import { BRAINWAVE_CLOCK_MAX_SECTIONS } from '../../../../domain/fabula/technoFantasyRules';
import { useEsper } from './useEsper';
import EsperDonsModal from './EsperDonsModal';
import styles from './ExibirEsper.module.css';

export default function ExibirEsper(props) {
  const {
    nivelEsper,
    nvFocoCognitivo,
    nvHipercognicao,
    nvDons,
    maxDons,
    donsAprendidos,
    donsDisponiveis,
    isModalDonsOpen,
    setIsModalDonsOpen,
    relogioSecoes,
    focoAtivo,
    setFocoAtivo,
    alvoFoco,
    setAlvoFoco,
    tipoAlvo,
    setTipoAlvo,
    unicoAlvo,
    setUnicoAlvo,
    dadivaKey,
    setDadivaKey,
    tipoDano,
    setTipoDano,
    statusEscolhido,
    setStatusEscolhido,
    feedback,
    custoAtualDadiva,
    bonusFoco,
    reducaoHiper,
    dadivaSelecionada,
    handleToggleDomAprendido,
    handleSalvarDonsModal,
    handleToggleSecao,
    handleAvancarRelogio,
    handleResetarRelogio,
    handleAtivarDadiva
  } = useEsper(props);

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.title}>
          <FaBrain /> Sensitivo Psíquico — Esper
        </div>
        <div className={styles.clockButtons}>
          {nvDons > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIsModalDonsOpen(true)}>
              <FaBookOpen /> Gerenciar Dons ({donsAprendidos.length}/{maxDons})
            </Button>
          )}
          <Badge variant="ether" size="md">
            Nível {nivelEsper}
          </Badge>
        </div>
      </div>

      {/* 1. RELÓGIO DE ONDAS CEREBRAIS */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaClock /> Relógio de Ondas Cerebrais ({relogioSecoes}/{BRAINWAVE_CLOCK_MAX_SECTIONS} Seções)
          </span>
          <Badge variant="pm" size="sm">
            Custo Próximo Dom: {custoAtualDadiva} PM
          </Badge>
        </div>

        <div className={styles.clockTrack}>
          {[1, 2, 3, 4].map((num) => (
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAvancarRelogio}
              disabled={relogioSecoes >= BRAINWAVE_CLOCK_MAX_SECTIONS}
            >
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
            <FaEye /> Foco Cognitivo {nvFocoCognitivo > 0 ? `(NP ${nvFocoCognitivo})` : ''}
          </span>
          <Badge variant={focoAtivo ? 'core' : 'default'} size="sm">
            {focoAtivo ? 'Foco Fixado' : 'Sem Foco'}
          </Badge>
        </div>

        <div className={styles.focoForm}>
          <div className={styles.focoInputsRow}>
            <select
              value={tipoAlvo}
              onChange={(e) => setTipoAlvo(e.target.value)}
              className={styles.select}
            >
              <option value="aliado">Aliado (Audição)</option>
              <option value="inimigo">Inimigo (Confuso/Enfurecido/Abalado)</option>
            </select>
            <Input
              placeholder="Nome ou descrição do alvo..."
              value={alvoFoco}
              onChange={(e) => setAlvoFoco(e.target.value)}
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
              onChange={(e) => setUnicoAlvo(e.target.checked)}
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

      {/* 3. DONS PSÍQUICOS */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaBolt /> Dons Psíquicos {nvDons > 0 ? `(NP ${nvDons} • ${donsAprendidos.length}/${maxDons})` : ''}
          </span>
          <div className={styles.clockButtons}>
            {nvDons > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setIsModalDonsOpen(true)}>
                <FaBookOpen /> {donsAprendidos.length === 0 ? 'Aprender Dons' : 'Gerenciar Dons'}
              </Button>
            )}
            <Badge variant="pm" size="sm">Custo: {custoAtualDadiva} PM</Badge>
          </div>
        </div>

        {nvDons === 0 ? (
          <div className={styles.feedbackBox}>
            Adquira a habilidade <strong>Dons Psíquicos</strong> (ou <strong>Dádivas Psíquicas</strong>) para despertar poderes mentais e o Relógio de Ondas Cerebrais.
          </div>
        ) : donsAprendidos.length === 0 ? (
          <div className={styles.feedbackBox}>
            <span>
              Você possui nível <strong>{nvDons}</strong> em Dádivas Psíquicas, mas ainda não escolheu quais Dons aprendeu!
            </span>
            <div className={styles.clockControls}>
              <Button variant="primary" size="sm" onClick={() => setIsModalDonsOpen(true)}>
                <FaBookOpen /> Escolher {maxDons} Dom(ns) no Catálogo
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.dadivaForm}>
            {/* Badges dos Dons Aprendidos */}
            <div className={styles.donsBadgesRow}>
              {donsAprendidos.map((key) => {
                const domObj = donsDisponiveis.find((g) => g.key === key);
                const isSelected = dadivaKey === key;
                return (
                  <Badge
                    key={key}
                    variant={isSelected ? 'core' : 'default'}
                    size="sm"
                    className={styles.domBadgeAprendido}
                    onClick={() => {
                      setDadivaKey(key);
                      if (domObj?.tipos_dano?.length > 0) setTipoDano(domObj.tipos_dano[0]);
                    }}
                  >
                    {domObj?.nome?.split(' (')[0] || key} {isSelected ? '✦' : ''}
                  </Badge>
                );
              })}
            </div>

            <div className={styles.dadivaSelectRow}>
              <select
                value={dadivaKey}
                onChange={(e) => {
                  const k = e.target.value;
                  setDadivaKey(k);
                  const g = donsDisponiveis.find((item) => item.key === k);
                  if (g?.tipos_dano?.length > 0) setTipoDano(g.tipos_dano[0]);
                }}
                className={styles.select}
              >
                {donsDisponiveis.map((g) => (
                  <option key={g.key} value={g.key}>{g.nome}</option>
                ))}
              </select>

              {dadivaSelecionada?.tipos_dano?.length > 0 && (
                <select
                  value={tipoDano}
                  onChange={(e) => setTipoDano(e.target.value)}
                  className={styles.select}
                >
                  {dadivaSelecionada.tipos_dano.map((t) => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              )}

              {dadivaSelecionada?.key === 'retaliacao_psiquica' && (
                <select
                  value={statusEscolhido}
                  onChange={(e) => setStatusEscolhido(e.target.value)}
                  className={styles.select}
                >
                  <option value="Abalado">Condição: Abalado</option>
                  <option value="Confuso">Condição: Confuso</option>
                </select>
              )}

              <Button variant="primary" size="sm" onClick={handleAtivarDadiva}>
                <FaBolt /> Ativar Dom ({custoAtualDadiva} PM)
              </Button>
            </div>

            {dadivaSelecionada && (
              <div className={styles.dadivaDescricao}>
                <strong>{dadivaSelecionada.gatilho}:</strong> {dadivaSelecionada.descricao}
              </div>
            )}

            {feedback && (
              <div className={styles.feedbackBox}>
                <FaCheck /> {feedback}
              </div>
            )}
          </div>
        )}

        <div className={styles.printOnly}>
          Dons Psíquicos Aprendidos: {donsAprendidos.join(', ') || 'Nenhum'}.
        </div>
      </div>

      {/* Modal de Gestão de Dons Psíquicos */}
      <EsperDonsModal
        isOpen={isModalDonsOpen}
        onClose={() => setIsModalDonsOpen(false)}
        donsAprendidos={donsAprendidos}
        maxDons={maxDons}
        nvDons={nvDons}
        onToggleDom={handleToggleDomAprendido}
        onSalvarDons={handleSalvarDonsModal}
      />
    </div>
  );
}
