import styles from './CombatOpportunityEffectFields.module.css';

const CONDICOES_AFLICAO = [
  { id: 'abalado', label: 'Abalado (VON d-2)' },
  { id: 'atordoado', label: 'Atordoado (AST d-2)' },
  { id: 'fraco', label: 'Fraco (VIG d-2)' },
  { id: 'lento', label: 'Lento (DES d-2)' }
];

const DELTAS_PROGRESSO = [
  { valor: 2, label: '+2 Seções (Avançar)' },
  { valor: 1, label: '+1 Seção (Avançar)' },
  { valor: -1, label: '-1 Seção (Recuar)' },
  { valor: -2, label: '-2 Seções (Recuar)' }
];

export default function CombatOpportunityEffectFields({
  codigo,
  dadosEfeito = {},
  onChange,
  participantes = [],
  relogios = []
}) {
  if (!codigo) return null;

  const alvoIdAtual = dadosEfeito.alvoId || '';
  const condicaoAtual = dadosEfeito.condicao || 'fraco';
  const relogioIdAtual = dadosEfeito.relogioId || relogios[0]?.id || '';
  const deltaAtual = Number(dadosEfeito.deltaRelogio ?? 1);

  if (codigo === 'AFLICAO') {
    return (
      <div className={styles.container}>
        <h4 className={styles.title}>Aplicação Mecânica da Aflição</h4>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="aflicao-alvo">Alvo da Condição:</label>
          <select
            id="aflicao-alvo"
            className={styles.select}
            value={alvoIdAtual}
            onChange={(e) => onChange({ ...dadosEfeito, alvoId: e.target.value, condicao: condicaoAtual })}
          >
            <option value="">-- Selecione o Alvo --</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.tipo === 'heroi' ? 'Herói' : 'Inimigo'})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Escolha a Condição (Livro Básico p. 41):</span>
          <div className={styles.buttonGroup}>
            {CONDICOES_AFLICAO.map((cond) => (
              <button
                key={cond.id}
                type="button"
                className={`${styles.condBtn} ${condicaoAtual === cond.id ? styles.condBtnActive : ''}`}
                onClick={() => onChange({ ...dadosEfeito, condicao: cond.id, alvoId: alvoIdAtual })}
              >
                {cond.label}
              </button>
            ))}
          </div>
          <p className={styles.hintText}>A condição reduz temporariamente o dado do atributo correspondente.</p>
        </div>
      </div>
    );
  }

  if (codigo === 'VANTAGEM') {
    return (
      <div className={styles.container}>
        <h4 className={styles.title}>Aplicação Mecânica de Vantagem</h4>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="vantagem-alvo">Beneficiário (+4 no Próximo Teste):</label>
          <select
            id="vantagem-alvo"
            className={styles.select}
            value={alvoIdAtual}
            onChange={(e) => onChange({ ...dadosEfeito, alvoId: e.target.value })}
          >
            <option value="">-- Selecione quem recebe o bônus --</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.tipo === 'heroi' ? 'Herói' : 'Inimigo'})
              </option>
            ))}
          </select>
          <p className={styles.hintText}>
            A criatura escolhida receberá +4 na rolagem do seu próximo teste (aplicado e consumido automaticamente).
          </p>
        </div>
      </div>
    );
  }

  if (codigo === 'PROGRESSO') {
    return (
      <div className={styles.container}>
        <h4 className={styles.title}>Aplicação em Relógio de Conflito</h4>
        {relogios.length === 0 ? (
          <p className={styles.warningText}>Não há relógios ativos na cena para ajustar.</p>
        ) : (
          <>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="progresso-relogio">Relógio da Cena:</label>
              <select
                id="progresso-relogio"
                className={styles.select}
                value={relogioIdAtual}
                onChange={(e) => onChange({ ...dadosEfeito, relogioId: e.target.value, deltaRelogio: deltaAtual })}
              >
                {relogios.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.titulo || r.nome} ({r.fatias_atuais ?? r.secoes_preenchidas ?? 0}/{r.fatias_total ?? r.secoes_max ?? 4})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Ajuste de Seções (até ±2 seções):</span>
              <div className={styles.buttonGroup}>
                {DELTAS_PROGRESSO.map((item) => (
                  <button
                    key={item.valor}
                    type="button"
                    className={`${styles.condBtn} ${deltaAtual === item.valor ? styles.condBtnActive : ''}`}
                    onClick={() => onChange({ ...dadosEfeito, deltaRelogio: item.valor, relogioId: relogioIdAtual })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (['AVALIAR', 'DESMASCARAR', 'MANCADA', 'ITEM_PERDIDO'].includes(codigo)) {
    return (
      <div className={styles.container}>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="tatico-alvo">Criatura Relacionada (Opcional):</label>
          <select
            id="tatico-alvo"
            className={styles.select}
            value={alvoIdAtual}
            onChange={(e) => onChange({ ...dadosEfeito, alvoId: e.target.value })}
          >
            <option value="">-- Nenhuma criatura específica / Geral --</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.tipo === 'heroi' ? 'Herói' : 'Inimigo'})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return null;
}
