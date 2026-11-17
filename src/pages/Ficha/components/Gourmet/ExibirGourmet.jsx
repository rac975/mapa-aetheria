import {
  FaUtensils, FaBookOpen, FaCheck, FaExclamationTriangle,
  FaDice, FaPlus, FaMinus, FaCampground, FaRoute, FaRedo
} from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import { SABORES_GOURMET } from '../../../../domain/fabula/naturalFantasyRules';
import { useGourmet } from './useGourmet';
import GourmetReceitasModal from './GourmetReceitasModal';
import styles from './ExibirGourmet.module.css';

export default function ExibirGourmet(props) {
  const {
    catalogoEfeitosIguaria, nivelGourmet,
    nvCulinaria, nvCozinheiroViajante, nvFeitoComAmor, nvGarfoEFaca, nvSalEPimenta, nvDataDeValidade,
    capacidadeMax, ganhos, estoqueSabores, totalIngredientesAtual,
    livroReceitas, pratoAtivoCena, saboresEscolhidos, setSaboresEscolhidos,
    paresPrevia, modoAplicacao, setModoAplicacao, alvosExtrasAmor, setAlvosExtrasAmor,
    usarGarfoEFaca, setUsarGarfoEFaca, usarSalEPimenta, setUsarSalEPimenta,
    saborNovoSalEPimenta, setSaborNovoSalEPimenta, usarDataDeValidade, setUsarDataDeValidade,
    temRodizio, temEspecialidadeDaCasa, temDosagemPrecisa,
    isModalOpen, setIsModalOpen, feedback, erroMsg,
    handleAjustarIngrediente, handleGerarIngredientesAleatorios,
    handlePrepararIguaria, handleRerrolarParReceita, handleLimparPratoAtivo
  } = useGourmet(props);

  const totalReceitas = Object.keys(livroReceitas).length;
  const maxSlotsCozinha = temRodizio ? 4 : 3;

  const alterarSlotSabor = (idx, novoSabor) => {
    const copia = [...saboresEscolhidos];
    copia[idx] = novoSabor;
    setSaboresEscolhidos(copia);
  };

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaUtensils /> Alquimia Gastronômica — Gourmet</div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
            <FaBookOpen /> Receitas ({totalReceitas}/15)
          </Button>
          <Badge variant="pi" size="md">Nível {nivelGourmet}</Badge>
        </div>
      </div>

      <div className={styles.badgesRow}>
        {nvCozinheiroViajante > 0 && <Badge variant="core" size="sm">Cozinheiro Viajante: +{ganhos.ganhoViagem} Ing./Viagem</Badge>}
        {nvFeitoComAmor > 0 && <Badge variant="pm" size="sm">Feito com Amor: até +{nvFeitoComAmor} Aliados (10 PM/alvo)</Badge>}
        {nvGarfoEFaca > 0 && <Badge variant="gold" size="sm">Garfo e Faca (Ataque + Dano c/ 2 Ing.)</Badge>}
        {nvSalEPimenta > 0 && <Badge variant="pi" size="sm">Sal e Pimenta (2 PI muda Sabor)</Badge>}
        {temRodizio && <Badge variant="core" size="sm">Rodízio (Até 4 Ingredientes)</Badge>}
        {temDosagemPrecisa && <Badge variant="pv" size="sm">Dosagem Precisa (Cura até 150%)</Badge>}
        {temEspecialidadeDaCasa && <Badge variant="gold" size="sm">Especialidade da Casa</Badge>}
      </div>

      {pratoAtivoCena && (
        <div className={styles.ativaBox}>
          <div><strong>Iguaria Ativa ({pratoAtivoCena.pares?.join(' + ')}):</strong> {pratoAtivoCena.resumo}</div>
          <Button variant="ghost" size="sm" onClick={handleLimparPratoAtivo}><FaRedo /> Encerrar Prato</Button>
        </div>
      )}

      {/* Bolsa de Ingredientes */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Bolsa de Ingredientes ({totalIngredientesAtual}/{capacidadeMax || 0})</span>
          {nvCulinaria > 0 && (
            <div className={styles.badgesRow}>
              <Button variant="secondary" size="sm" onClick={() => handleGerarIngredientesAleatorios(ganhos.ganhoDescanso, 'Descanso')}>
                <FaCampground /> +Descanso (+{ganhos.ganhoDescanso})
              </Button>
              {ganhos.ganhoViagem > 0 && (
                <Button variant="secondary" size="sm" onClick={() => handleGerarIngredientesAleatorios(ganhos.ganhoViagem, 'Viagem')}>
                  <FaRoute /> +Viagem (+{ganhos.ganhoViagem})
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => handleGerarIngredientesAleatorios(1, 'Rolagem 1d6')}>
                <FaDice /> +1 Sabor (1d6)
              </Button>
            </div>
          )}
        </div>

        <div className={styles.saboresGrid}>
          {SABORES_GOURMET.map((sab) => {
            const qtd = parseInt(estoqueSabores[sab.key], 10) || 0;
            return (
              <div key={sab.key} className={styles.saborBox}>
                <span className={styles.saborLabel}>{sab.icone} {sab.nome}</span>
                <strong className={styles.saborQtd}>{qtd}</strong>
                <div className={styles.saborBtns}>
                  <Button variant="ghost" size="sm" onClick={() => handleAjustarIngrediente(sab.key, -1)} disabled={qtd <= 0}><FaMinus /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAjustarIngrediente(sab.key, 1)}><FaPlus /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preparar Iguaria */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}><FaUtensils /> Preparar Iguaria ({saboresEscolhidos.length} Ingredientes)</span>
          <div className={styles.badgesRow}>
            {saboresEscolhidos.length < maxSlotsCozinha && (
              <Button variant="ghost" size="sm" onClick={() => setSaboresEscolhidos([...saboresEscolhidos, 'umami'])}>
                <FaPlus /> +1 Ingrediente
              </Button>
            )}
            {saboresEscolhidos.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => setSaboresEscolhidos(saboresEscolhidos.slice(0, -1))}>
                <FaMinus /> -1 Ingrediente
              </Button>
            )}
          </div>
        </div>

        {nvCulinaria === 0 ? (
          <div className={styles.emptyBox}>Adquira níveis em <strong>Culinária</strong> para coletar ingredientes e preparar iguarias.</div>
        ) : (
          <div className={styles.composerBody}>
            <div className={styles.selectsRow}>
              {saboresEscolhidos.map((saborAtual, idx) => (
                <select key={idx} value={saborAtual} onChange={(e) => alterarSlotSabor(idx, e.target.value)} className={styles.selectCompact}>
                  {SABORES_GOURMET.map((s) => (
                    <option key={s.key} value={s.key}>Ing. {idx + 1}: {s.nome} (Disp: {estoqueSabores[s.key] || 0})</option>
                  ))}
                </select>
              ))}
              <select value={modoAplicacao} onChange={(e) => setModoAplicacao(e.target.value)} className={styles.selectCompact}>
                <option value="aliados">Alvo: Você / Aliado</option>
                <option value="ataque_livre">Ataque Livre (Inimigos)</option>
              </select>
              <Button variant="primary" size="sm" onClick={handlePrepararIguaria}><FaUtensils /> Cozinhar Iguaria</Button>
            </div>

            <div className={styles.badgesRow}>
              {nvFeitoComAmor > 0 && modoAplicacao === 'aliados' && (
                <select value={alvosExtrasAmor} onChange={(e) => setAlvosExtrasAmor(parseInt(e.target.value, 10) || 0)} className={styles.selectCompact}>
                  <option value={0}>Feito com Amor: 0 extras (0 PM)</option>
                  {[1, 2, 3, 4].slice(0, nvFeitoComAmor).map((n) => (
                    <option key={n} value={n}>+{n} Aliado(s) ({n * 10} PM)</option>
                  ))}
                </select>
              )}
              {nvSalEPimenta > 0 && (
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={usarSalEPimenta} onChange={(e) => setUsarSalEPimenta(e.target.checked)} />
                  Sal e Pimenta (-2 PI):
                  {usarSalEPimenta && (
                    <select value={saborNovoSalEPimenta} onChange={(e) => setSaborNovoSalEPimenta(e.target.value)} className={styles.selectCompact}>
                      {SABORES_GOURMET.map((s) => <option key={s.key} value={s.key}>{s.nome}</option>)}
                    </select>
                  )}
                </label>
              )}
              {nvGarfoEFaca > 0 && modoAplicacao === 'ataque_livre' && saboresEscolhidos.length === 2 && (
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={usarGarfoEFaca} onChange={(e) => setUsarGarfoEFaca(e.target.checked)} />
                  Garfo e Faca (Dano no ataque, RA = 0)
                </label>
              )}
              {nvDataDeValidade > 0 && (
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={usarDataDeValidade} onChange={(e) => setUsarDataDeValidade(e.target.checked)} />
                  Data de Validade (Cura PV vira Dano de Veneno)
                </label>
              )}
            </div>

            <div className={styles.previewBox}>
              {paresPrevia.map((parKey) => {
                const descoberta = livroReceitas[parKey];
                return (
                  <div key={parKey} className={styles.previewTexto}>
                    <strong>[{parKey.toUpperCase()}]:</strong>{' '}
                    {descoberta ? `${descoberta.nome} — ${descoberta.descricao}` : '❓ Combinação inédita (será sorteada 1d12 ao cozinhar!)'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <div><strong>Ingredientes ({totalIngredientesAtual}/{capacidadeMax}):</strong> {SABORES_GOURMET.map((s) => `${s.nome}: ${estoqueSabores[s.key] || 0}`).join(' | ')}</div>
        <div><strong>Receitas ({totalReceitas}/15):</strong> {Object.values(livroReceitas).map((r) => `${r.parKey}: ${r.nome}`).join(' • ') || 'Nenhuma'}</div>
      </div>

      {isModalOpen && (
        <GourmetReceitasModal
          onClose={() => setIsModalOpen(false)}
          livroReceitas={livroReceitas}
          catalogoEfeitos={catalogoEfeitosIguaria}
          onRolarOuAtualizarPar={handleRerrolarParReceita}
        />
      )}
    </Card>
  );
}
