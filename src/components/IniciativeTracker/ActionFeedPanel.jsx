import { FaHistory, FaTrash, FaDice, FaBolt } from 'react-icons/fa';
import { Button, Badge } from '../ui';
import styles from './ActionFeedPanel.module.css';

export default function ActionFeedPanel({
  acoesFeed = [],
  isMestre,
  onLimparHistorico
}) {
  return (
    <aside className={styles.feedCard}>
      <header className={styles.feedHeader}>
        <div className={styles.headerTitleWrap}>
          <h3 className={styles.feedTitle}><FaHistory /> Feed de Ações & Dados</h3>
          <Badge variant="ether" size="sm">{acoesFeed.length}</Badge>
        </div>
        {isMestre && acoesFeed.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onLimparHistorico} title="Limpar histórico da cena">
            <FaTrash /> Limpar
          </Button>
        )}
      </header>

      <div className={styles.feedList}>
        {acoesFeed.length === 0 ? (
          <div className={styles.emptyFeed}>
            Nenhuma ação ou rolagem registrada nesta cena ainda.
          </div>
        ) : (
          acoesFeed.map((item) => {
            if (item.acao_codigo === 'NOVA_RODADA') {
              return (
                <div key={item.id} className={styles.roundSeparator}>
                  <div className={styles.roundSeparatorLine} />
                  <div className={styles.roundSeparatorBadge}>
                    ⚔️ {item.acao_titulo || `Rodada ${item.metadata?.rodada || ''} Iniciada`}
                  </div>
                  <div className={styles.roundSeparatorLine} />
                </div>
              );
            }

            const rolagem = item.metadata?.rolagem;
            const ehRolagem = item.acao_codigo === 'ROLAGEM_DADOS' || Boolean(rolagem);

            return (
              <div
                key={item.id}
                className={`${styles.feedItem} ${ehRolagem ? styles.feedItemRoll : ''} ${
                  rolagem?.isCritico ? styles.feedItemCrit : rolagem?.isFumble ? styles.feedItemFumble : ''
                }`}
              >
                <div className={styles.feedItemHeader}>
                  <span className={styles.feedAutor}>{item.autor_nome}</span>
                  <div className={styles.feedBadgesWrap}>
                    {rolagem?.isCritico && (
                      <Badge variant="core" size="sm"><FaBolt /> Crítico!</Badge>
                    )}
                    {rolagem?.isFumble && (
                      <Badge variant="crise" size="sm">Fumble!</Badge>
                    )}
                    <Badge variant={ehRolagem ? 'ether' : 'gold'} size="sm">
                      {item.acao_titulo}
                    </Badge>
                  </div>
                </div>

                {rolagem ? (
                  <div className={styles.feedRollBody}>
                    <div className={styles.feedDiceChipRow}>
                      <span className={styles.feedDieChip}>
                        <FaDice /> {rolagem.sigla1} d{rolagem.faces1}: <strong>{rolagem.d1}</strong>
                      </span>
                      <span className={styles.feedDieChip}>
                        <FaDice /> {rolagem.sigla2} d{rolagem.faces2}: <strong>{rolagem.d2}</strong>
                      </span>
                      {rolagem.modificadorTotal !== 0 && (
                        <span className={styles.feedModChip}>
                          {rolagem.modificadorTotal > 0 ? `+${rolagem.modificadorTotal}` : rolagem.modificadorTotal}
                        </span>
                      )}
                      <span className={styles.feedTotalChip}>
                        Total: <strong>{rolagem.total}</strong>
                      </span>
                      <span className={styles.feedHrChip}>
                        HR: <strong>{rolagem.hr}</strong>
                      </span>
                      {rolagem.calcularDano && rolagem.danoTotal !== null && (
                        <span className={styles.feedDmgChip}>
                          Dano: <strong>{rolagem.danoTotal}</strong> ({rolagem.tipoDano})
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.feedDetalhes}>{item.detalhes}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
