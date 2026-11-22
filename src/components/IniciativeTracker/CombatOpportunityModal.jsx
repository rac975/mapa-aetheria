import { useState } from 'react';
import { FaStar, FaSkull, FaCheck, FaTimes, FaVoteYea, FaCrown } from 'react-icons/fa';
import { Button, Badge, Input } from '../ui';
import {
  CATALOGO_OPORTUNIDADES_FABULA,
  obterOportunidadeVencedora
} from '../../domain/fabula/combatOpportunitiesRules';
import styles from './CombatOpportunityModal.module.css';

/**
 * Modal de Oportunidades em Sucesso Crítico e Falha Crítica (Fabula Ultima - Livro Básico p. 41):
 * - Sucesso Crítico ou Falha Crítica de Herói -> Abre para o Mestre escolher.
 * - Sucesso Crítico ou Falha Crítica de Inimigo -> Abre para os Heróis escolherem/votarem.
 */
export default function CombatOpportunityModal({
  oportunidadeAtiva,
  isMestre,
  jogadorNome,
  jogadorFichaId,
  onVotarOportunidade,
  onConfirmarOportunidade,
  onDescartarOportunidade
}) {
  const [codigoSelecionado, setCodigoSelecionado] = useState(
    CATALOGO_OPORTUNIDADES_FABULA[0].codigo
  );
  const [detalheExtra, setDetalheExtra] = useState('');

  if (!oportunidadeAtiva) return null;

  const ehEscolhaDoMestre = oportunidadeAtiva.responsavelEscolha === 'mestre';
  const ehCritico = oportunidadeAtiva.tipoEvento === 'critico';
  const { contagemPorCodigo, totalVotos, codigoVencedor } = obterOportunidadeVencedora(
    oportunidadeAtiva,
    ehEscolhaDoMestre ? codigoSelecionado : null
  );

  const minhaChaveVoto = String(jogadorNome || jogadorFichaId || (isMestre ? 'Mestre' : 'Herói'));
  const meuVotoAtual = oportunidadeAtiva.votos?.[minhaChaveVoto] || null;

  const handleSelecionarOpcao = (codigo) => {
    setCodigoSelecionado(codigo);
    if (!ehEscolhaDoMestre) {
      onVotarOportunidade?.(codigo);
    }
  };

  const handleConfirmar = () => {
    const codigoFinal = ehEscolhaDoMestre
      ? codigoSelecionado
      : (meuVotoAtual || codigoVencedor || codigoSelecionado);
    onConfirmarOportunidade?.(codigoFinal, detalheExtra);
    setDetalheExtra('');
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modalCard} ${ehCritico ? styles.cardCritico : styles.cardFumble}`}>
        <div className={styles.header}>
          <div className={styles.titleCluster}>
            <span className={styles.eventIcon}>
              {ehCritico ? <FaStar /> : <FaSkull />}
            </span>
            <div>
              <div className={styles.badgesLine}>
                <Badge variant={ehCritico ? 'gold' : 'crise'} size="sm">
                  {oportunidadeAtiva.rotuloEvento} {oportunidadeAtiva.dadosRolados}
                </Badge>
                <Badge variant={ehEscolhaDoMestre ? 'villain' : 'core'} size="sm">
                  {ehEscolhaDoMestre ? '👑 Escolha do Mestre (Herói rolou)' : '🗳️ Escolha / Votação dos Heróis (Inimigo rolou)'}
                </Badge>
              </div>
              <h3 className={styles.title}>
                Oportunidade em Combate — {oportunidadeAtiva.autorNome}
              </h3>
              <p className={styles.subtitle}>
                Origem: <strong>{oportunidadeAtiva.tituloRolagem}</strong>
              </p>
            </div>
          </div>

          {isMestre && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onDescartarOportunidade}
              title="Ignorar / Fechar Oportunidade"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {ehEscolhaDoMestre && !isMestre ? (
          <div className={styles.waitingMestreBox}>
            <FaCrown className={styles.waitingIcon} />
            <p className={styles.waitingText}>
              Ocorreu um <strong>{oportunidadeAtiva.rotuloEvento}</strong> de <strong>{oportunidadeAtiva.autorNome}</strong>!
              Aguardando o <strong>Mestre</strong> escolher a Oportunidade a ser aplicada na cena...
            </p>
          </div>
        ) : (
          <>
            <div className={styles.optionsGrid}>
              {CATALOGO_OPORTUNIDADES_FABULA.map((op) => {
                const votosOp = contagemPorCodigo[op.codigo] || 0;
                const isAtiva = ehEscolhaDoMestre
                  ? codigoSelecionado === op.codigo
                  : (meuVotoAtual === op.codigo || (!meuVotoAtual && codigoVencedor === op.codigo));

                return (
                  <button
                    key={op.codigo}
                    type="button"
                    className={`${styles.optionCard} ${isAtiva ? styles.optionCardActive : ''}`}
                    onClick={() => handleSelecionarOpcao(op.codigo)}
                  >
                    <div className={styles.optionTop}>
                      <span className={styles.optionTitle}>
                        {op.icone} {op.titulo}
                      </span>
                      {!ehEscolhaDoMestre && (
                        <span className={`${styles.voteBadge} ${votosOp > 0 ? styles.voteBadgeHasVotes : ''}`}>
                          <FaVoteYea /> {votosOp} voto(s)
                        </span>
                      )}
                    </div>
                    <p className={styles.optionDesc}>{op.descricao}</p>
                  </button>
                );
              })}
            </div>

            <div className={styles.detailRow}>
              <Input
                value={detalheExtra}
                onChange={(e) => setDetalheExtra(e.target.value)}
                placeholder="Detalhe opcional (ex.: Alvo afetado, traço revelado ou elemento narrativo)..."
              />
            </div>

            <div className={styles.footer}>
              {!ehEscolhaDoMestre && (
                <span className={styles.voteSummary}>
                  Total de votos dos Heróis: <strong>{totalVotos}</strong>
                </span>
              )}
              {isMestre && (
                <Button variant="secondary" size="sm" onClick={onDescartarOportunidade}>
                  Dispensar
                </Button>
              )}
              <Button variant="gold" size="sm" onClick={handleConfirmar}>
                <FaCheck /> {ehEscolhaDoMestre ? 'Confirmar Escolha do Mestre' : 'Confirmar Oportunidade dos Heróis'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
