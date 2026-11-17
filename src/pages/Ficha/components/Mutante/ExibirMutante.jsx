import { FaDna, FaHeart, FaFistRaised, FaShieldAlt, FaExclamationTriangle, FaCheck, FaRedo, FaBookOpen } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT } from '../../../../domain/fabula/technoFantasyRules';
import { useMutante } from './useMutante';
import MutanteTerioformasModal from './MutanteTerioformasModal';
import styles from './ExibirMutante.module.css';

export default function ExibirMutante(props) {
  const {
    catalogoTerioformas, terioformasAprendidasObjetos,
    nivelMutante, nvTeriomorfose, maxTerioformas, nvAcromorfose, nvBiofagia, nvEcdise,
    limiteCrise, isCrise, pvAtual, terioformasAprendidas, terioformasAtivas,
    teriomorfoseManifestada, categoriaArma, setCategoriaArma, handleSetCategoriaArma, resistenciaEcdise,
    tipoDanoEcdise, setTipoDanoEcdise, isModalTerioOpen, setIsModalTerioOpen,
    feedback, custoTeriomorfose, bonusAcro, defesaPlacophora, biofagiaInfo,
    handleToggleTerioformaAprendida, handleToggleTerioformaAtiva,
    handleAtivarTeriomorfose, handleEncerrarCena, handleCuraBiofagia, handleAtivarEcdise
  } = useMutante(props);

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.title}>
          <FaDna /> Aberração Biológica — Mutante
        </div>
        <div className={styles.terioActionsRow}>
          {nvTeriomorfose > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIsModalTerioOpen(true)}>
              <FaBookOpen /> Catálogo Genético ({terioformasAprendidas.length}/{maxTerioformas})
            </Button>
          )}
          <Badge variant="core" size="md">Nível {nivelMutante}</Badge>
        </div>
      </div>

      {/* 1. ALERTA DE CURA DA BIOFAGIA EM CRISE */}
      {nvBiofagia > 0 && isCrise ? (
        <div className={styles.criseAlertBox}>
          <div className={styles.criseContent}>
            <div className={styles.criseTitle}>
              <FaExclamationTriangle /> Biofagia Ativa (Em Crise!)
            </div>
            <div className={styles.criseDesc}>
              Seu PV está em Crise (≤ {limiteCrise} PV). Ao causar dano a um ou mais inimigos, recupere +{biofagiaInfo.curaPv} PV
              {biofagiaInfo.curaMp > 0 ? ` e +${biofagiaInfo.curaMp} PM (Neurofagóide)` : ''} imediatamente.
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleCuraBiofagia}>
            <FaHeart /> Aplicar Biofagia (+{biofagiaInfo.curaPv} PV{biofagiaInfo.curaMp > 0 ? ` / +${biofagiaInfo.curaMp} PM` : ''})
          </Button>
        </div>
      ) : nvBiofagia > 0 ? (
        <div className={styles.sectionHeader}>
          <Badge variant="default" size="sm">
            Biofagia: Inativa (Requer Crise: PV ≤ {limiteCrise})
          </Badge>
        </div>
      ) : null}

      {/* 2. TERIOMORFOSE E FORMAS MANIFESTADAS */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaDna /> Teriomorfose {nvTeriomorfose > 0 ? `(NP ${nvTeriomorfose})` : ''}
          </span>
          <div className={styles.ecdiseRow}>
            {defesaPlacophora && (
              <Badge variant="gold" size="sm">
                <FaShieldAlt /> Defesa Placófora: {defesaPlacophora}
              </Badge>
            )}
            <Badge variant={teriomorfoseManifestada ? 'core' : 'default'} size="sm">
              {terioformasAtivas.length}/{THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT} Formas Ativas
            </Badge>
          </div>
        </div>

        {nvTeriomorfose > 0 && terioformasAprendidas.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <span>Nenhuma Terioforma aprendida ainda. Desperte mutações para usar a Teriomorfose!</span>
            <Button variant="primary" size="sm" onClick={() => setIsModalTerioOpen(true)}>
              <FaBookOpen /> Aprender {maxTerioformas} Terioformas
            </Button>
          </div>
        ) : (
          <div className={styles.terioformasGrid}>
            {terioformasAprendidasObjetos.map((tf) => {
              const isSelected = terioformasAtivas.includes(tf.key);
              return (
                <div
                  key={tf.key}
                  onClick={() => handleToggleTerioformaAtiva(tf.key)}
                  className={`${styles.terioCard} ${isSelected ? styles.terioCardActive : ''}`}
                >
                  <div className={styles.terioCardHeader}>
                    <span>{tf.nome}</span>
                    {isSelected && (
                      <Badge variant="core" size="sm">
                        <FaCheck /> Ativa
                      </Badge>
                    )}
                  </div>
                  <div className={styles.terioCardDesc}>{tf.descricao}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.terioActionsRow}>
          <div>
            <Badge variant="pv" size="sm">
              Custo Ativação: {custoTeriomorfose} PV (1/3 de {pvAtual} PV)
            </Badge>
          </div>
          <div className={styles.ecdiseRow}>
            <Button
              variant={teriomorfoseManifestada ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleAtivarTeriomorfose}
              disabled={terioformasAtivas.length === 0}
            >
              <FaDna /> {teriomorfoseManifestada ? 'Renovar Teriomorfose' : 'Manifestar na Cena'} (-{custoTeriomorfose} PV)
            </Button>
            {teriomorfoseManifestada && (
              <Button variant="ghost" size="sm" onClick={handleEncerrarCena}>
                <FaRedo /> Dissipar Formas
              </Button>
            )}
          </div>
        </div>

        <div className={styles.printOnly}>
          {terioformasAtivas.length > 0 ? (
            <div>Terioformas Ativas: {terioformasAtivas.join(', ')}</div>
          ) : (
            <div>Nenhuma terioforma ativa na cena.</div>
          )}
        </div>
      </div>

      {/* 3. ACROMORFOSE */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaFistRaised /> Acromorfose {nvAcromorfose > 0 ? `(NP ${nvAcromorfose})` : ''}
          </span>
          <Badge variant="gold" size="sm">
            +{bonusAcro.bonusPrecisao} Precisão • +{bonusAcro.bonusDanoFisico} Dano Desarmado
          </Badge>
        </div>

        <div className={styles.acromorfoseRow}>
          <label className={styles.criseDesc}>Categoria de Armas:</label>
          <select
            value={categoriaArma}
            onChange={(e) => handleSetCategoriaArma ? handleSetCategoriaArma(e.target.value) : setCategoriaArma(e.target.value)}
            className={styles.select}
          >
            <option value="Armas de Luta">Armas de Luta (Brawling)</option>
            <option value="Armas Brancas / Espadas">Armas Brancas / Espadas</option>
            <option value="Armas Pesadas">Armas Pesadas (Heavy)</option>
            <option value="Adagas">Adagas (Daggers)</option>
            <option value="Arcos">Arcos (Distância)</option>
            <option value="Armas de Fogo">Armas de Fogo (Distância)</option>
            <option value="Armas de Arremesso">Armas de Arremesso (Distância)</option>
          </select>
          <Badge variant="core" size="sm">Desarmado conta como {categoriaArma}</Badge>
        </div>
      </div>

      {/* 4. ÉCDISE */}
      {nvEcdise > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <FaShieldAlt /> Écdise (NP 1)
            </span>
            {resistenciaEcdise && (
              <Badge variant="core" size="sm">
                Resistência Atual: {resistenciaEcdise.toUpperCase()}
              </Badge>
            )}
          </div>

          <div className={styles.ecdiseRow}>
            <label className={styles.criseDesc}>Dano não-físico sofrido:</label>
            <select
              value={tipoDanoEcdise}
              onChange={(e) => setTipoDanoEcdise(e.target.value)}
              className={styles.select}
            >
              <option value="fogo">Fogo</option>
              <option value="gelo">Gelo</option>
              <option value="raio">Raio</option>
              <option value="ar">Ar</option>
              <option value="terra">Terra</option>
              <option value="luz">Luz</option>
              <option value="trevas">Trevas</option>
              <option value="veneno">Veneno</option>
            </select>
            <Button variant="danger" size="sm" onClick={handleAtivarEcdise}>
              <FaShieldAlt /> Ativar Écdise (-10 PV)
            </Button>
          </div>
        </div>
      )}

      {feedback && (
        <div className={styles.feedbackBox}>
          <FaCheck /> {feedback}
        </div>
      )}

      {/* Modal de Catálogo Genético de Terioformas */}
      <MutanteTerioformasModal
        isOpen={isModalTerioOpen}
        onClose={() => setIsModalTerioOpen(false)}
        catalogoTerioformas={catalogoTerioformas}
        terioformasAprendidas={terioformasAprendidas}
        maxTerioformas={maxTerioformas}
        nvTeriomorfose={nvTeriomorfose}
        onToggleTerioforma={handleToggleTerioformaAprendida}
      />
    </div>
  );
}
