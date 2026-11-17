import { FaTimes, FaDice, FaUtensils, FaCheck } from 'react-icons/fa';
import { Modal, Button, Badge } from '../../../../components/ui';
import { PARES_SABORES_RECEITAS } from '../../../../domain/fabula/naturalFantasyRules';
import styles from './ExibirGourmet.module.css';

export default function GourmetReceitasModal({
  onClose,
  livroReceitas = {},
  catalogoEfeitos = [],
  onRolarOuAtualizarPar
}) {
  const totalDescobertas = Object.keys(livroReceitas).length;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Ficha de Receitas e Combinações (Gourmet)"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="primary" size="sm" onClick={onClose}>
            <FaTimes /> Fechar Livro de Receitas
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Cada uma das <strong>15 combinações possíveis de 2 sabores</strong> gera um efeito único (1d12). Duas combinações não podem ter efeitos idênticos.
          </span>
          <Badge variant={totalDescobertas === 15 ? 'core' : 'gold'} size="md">
            {totalDescobertas} / 15 Receitas Descobertas
          </Badge>
        </div>

        <div className={styles.catalogGrid}>
          {PARES_SABORES_RECEITAS.map((par) => {
            const reg = livroReceitas[par.key];
            const defCatalogo = reg
              ? catalogoEfeitos.find((e) => Number(e.numero_dado) === Number(reg.numero_dado))
              : null;
            const opcoesEscolha = defCatalogo?.opcoes_escolha || [];

            return (
              <div
                key={par.key}
                className={`${styles.catalogCard} ${reg ? styles.catalogCardSelected : ''}`}
              >
                <div className={styles.catalogCardHeader}>
                  <span className={styles.catalogCardTitle}>
                    <FaUtensils /> {par.label}
                  </span>
                  <Button
                    variant={reg ? 'ghost' : 'primary'}
                    size="sm"
                    onClick={() => onRolarOuAtualizarPar(par.key)}
                    title="Rolar 1d12 para descobrir ou substituir o efeito desta combinação"
                  >
                    <FaDice /> {reg ? 'Rerrolar d12' : 'Descobrir (d12)'}
                  </Button>
                </div>

                {reg ? (
                  <>
                    <div className={styles.badgesRow}>
                      <Badge variant="core" size="sm">
                        <FaCheck /> d12 = {reg.numero_dado}
                      </Badge>
                      {reg.somente_conflito && (
                        <Badge variant="crise" size="sm">Apenas Conflito</Badge>
                      )}
                    </div>
                    <div className={styles.catalogCardDesc}>{reg.descricao}</div>

                    {defCatalogo?.requer_escolha && opcoesEscolha.length > 0 && (
                      <select
                        value={reg.escolha || opcoesEscolha[0]}
                        onChange={(e) => onRolarOuAtualizarPar(par.key, reg.numero_dado, e.target.value)}
                        className={styles.selectCompact}
                      >
                        {opcoesEscolha.map((op) => (
                          <option key={op} value={op}>
                            Opção: {op.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                ) : (
                  <div className={styles.catalogCardDesc}>
                    Combinação ainda não experimentada. Cozinhe com estes sabores ou clique em Descobrir (d12).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
