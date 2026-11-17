import { FaMagic, FaDice, FaBolt, FaFire } from 'react-icons/fa';
import { Card, Badge, Button } from '../../../components/ui';
import { useMagiasSecao } from '../../../hooks/useMagiasSecao';
import styles from './FichaMagiasSecao.module.css';

export default function FichaMagiasSecao({
  magias = [],
  ficha = null,
  atributos = {},
  statusFicha = null,
  handleAjustarRecurso = null
}) {
  const {
    resumo,
    mpAtual,
    extraCataclismoPm,
    setExtraCataclismoPm,
    aplicarHipercognicao,
    setAplicarHipercognicao,
    focoAlvoUnico,
    setFocoAlvoUnico,
    aplicarFeiticaria,
    setAplicarFeiticaria,
    resultadosRolagem,
    feedback,
    calcularCustoMagia,
    rolarTesteMagia,
    lancarMagia
  } = useMagiasSecao({ ficha, atributos, statusFicha, handleAjustarRecurso });

  if (!magias || magias.length === 0) return null;

  const temSinergias = Boolean(
    resumo.bonusArtilharia > 0 ||
    resumo.nvCataclismo > 0 ||
    resumo.bonusDanoDancarinoGuerra > 0 ||
    resumo.bonusPoderCurativo > 0 ||
    resumo.bonusCuraHarmoniaElemental > 0 ||
    resumo.bonusDanoPragaElemental > 0 ||
    resumo.limitePmJardinagemMarcial > 0 ||
    resumo.bonusFeiticoPoderoso > 0 ||
    resumo.nvSimbolosMagicos > 0 ||
    resumo.nvHipercognicao > 0 ||
    resumo.decretoDobrarPmAtivo ||
    resumo.bonusDanoDecreto > 0 ||
    resumo.qtdSimbolosVerdade > 0 ||
    resumo.qtdSimbolosFeiticaria > 0 ||
    resumo.bonusFocoTeste > 0 ||
    resumo.nvConsumir > 0
  );

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.sectionHeader}>
          <FaMagic /> Magias/Arcanas ({magias.length})
        </h3>
        <Badge variant={mpAtual > 0 ? 'pm' : 'crise'} size="sm">
          PM Atual: {mpAtual} {resumo.bonusTesteMagia > 0 ? `| Teste Magia +${resumo.bonusTesteMagia}` : ''}
        </Badge>
      </div>

      {temSinergias && (
        <div className={styles.sinergiasMagiaBox}>
          <div className={styles.sinergiasBadges}>
            {resumo.bonusArtilharia > 0 && (
              <Badge variant="ether" size="sm">Artilharia Mágica: +{resumo.bonusArtilharia} Teste (O)</Badge>
            )}
            {resumo.bonusFocoTeste > 0 && (
              <Badge variant="ether" size="sm">Foco Cognitivo: +{resumo.bonusFocoTeste} Teste (O)</Badge>
            )}
            {resumo.qtdSimbolosVerdade > 0 && (
              <Badge variant="gold" size="sm">Símbolo Verdade: +{resumo.qtdSimbolosVerdade * 2} Teste (O)</Badge>
            )}
            {resumo.bonusDanoDancarinoGuerra > 0 && (
              <Badge variant="pv" size="sm">Dançarino de Guerra: +{resumo.bonusDanoDancarinoGuerra} Dano (O)</Badge>
            )}
            {resumo.bonusFeiticoPoderoso > 0 && (
              <Badge variant="pv" size="sm">Feitiço Poderoso: +{resumo.bonusFeiticoPoderoso} Dano</Badge>
            )}
            {resumo.bonusPoderCurativo > 0 && (
              <Badge variant="core" size="sm">Poder Curativo: +{resumo.bonusPoderCurativo} PV (Aliados)</Badge>
            )}
            {resumo.bonusCuraHarmoniaElemental > 0 && (
              <Badge variant="core" size="sm">Harmonia Elemental: +{resumo.bonusCuraHarmoniaElemental} PV Cura</Badge>
            )}
            {resumo.bonusDanoPragaElemental > 0 && (
              <Badge variant="ether" size="sm">Praga Elemental: +{resumo.bonusDanoPragaElemental} Dano Elemental</Badge>
            )}
            {resumo.limitePmJardinagemMarcial > 0 && (
              <Badge variant="gold" size="sm">Jardinagem Marcial: Feitiço Livre ≤ {resumo.limitePmJardinagemMarcial} PM</Badge>
            )}
            {resumo.nvSimbolosMagicos > 0 && (
              <Badge variant="pi" size="sm">Símbolos Mágicos: Aliados até {resumo.limitePmSimbolosMagicos} PM</Badge>
            )}
            {resumo.nvConsumir > 0 && (
              <Badge variant="pm" size="sm">Consumir: +{resumo.nvConsumir * 2} PM ao ferir</Badge>
            )}
            {resumo.decretoDobrarPmAtivo && (
              <Badge variant="crise" size="sm">Decreto do Bispo: Custo PM x2</Badge>
            )}
            {resumo.bonusDanoDecreto > 0 && (
              <Badge variant="crise" size="sm">Decreto do Bispo: +{resumo.bonusDanoDecreto} Dano</Badge>
            )}
          </div>

          <div className={styles.sinergiasControles}>
            {resumo.nvCataclismo > 0 && [0, 10, 20, 30].filter((v) => v <= resumo.maxCataclismoPm).map((val) => (
              <Button
                key={val}
                type="button"
                size="sm"
                variant={extraCataclismoPm === val ? 'core' : 'secondary'}
                onClick={() => setExtraCataclismoPm(val)}
              >
                <FaFire /> Cataclismo {val === 0 ? 'Off' : `+${val} PM (+${val / 2} Dano)`}
              </Button>
            ))}

            {resumo.nvHipercognicao > 0 && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={aplicarHipercognicao ? 'core' : 'secondary'}
                  onClick={() => setAplicarHipercognicao((p) => !p)}
                >
                  Hipercognição (-{resumo.nvHipercognicao * (focoAlvoUnico ? 2 : 1)} PM)
                </Button>
                {aplicarHipercognicao && (
                  <Button
                    type="button"
                    size="sm"
                    variant={focoAlvoUnico ? 'core' : 'ghost'}
                    onClick={() => setFocoAlvoUnico((p) => !p)}
                  >
                    Alvo Único ({resumo.nvHipercognicao * 2} PM)
                  </Button>
                )}
              </>
            )}

            {resumo.qtdSimbolosFeiticaria > 0 && (
              <Button
                type="button"
                size="sm"
                variant={aplicarFeiticaria ? 'core' : 'secondary'}
                onClick={() => setAplicarFeiticaria((p) => !p)}
              >
                Símbolo Feitiçaria (-{resumo.qtdSimbolosFeiticaria * 5} PM, mín. 5)
              </Button>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <div className={`${styles.feedbackMagia} ${feedback.tipo === 'sucesso' ? styles.feedbackSucesso : styles.feedbackErro}`}>
          {feedback.texto}
        </div>
      )}

      <div className={styles.magiasList}>
        {magias.map((m, i) => {
          const calc = calcularCustoMagia(m);
          const rolagem = resultadosRolagem[i];
          const podeLancar = mpAtual >= calc.custoFinal;
          return (
            <div key={m.id || i} className={styles.magiaCard}>
              <div className={styles.magiaHeader}>
                <strong className={styles.magiaNome}>{m.nome}</strong>
                <div className={styles.magiaMeta}>
                  <Badge variant="ether" size="sm">PM: {m.custo_mp} {calc.custoFinal !== calc.base ? `(Final: ${calc.custoFinal})` : ''}</Badge>
                  {m.alvos && <span>Alvos: {m.alvos}</span>}
                  {m.duracao && <span>Duração: {m.duracao}</span>}
                </div>
              </div>
              {m.descricao && <p className={styles.magiaDescricao}>{m.descricao}</p>}

              <div className={styles.magiaAcoes}>
                <Button type="button" variant="secondary" size="sm" onClick={() => rolarTesteMagia(i, m)}>
                  <FaDice /> Teste [AST + VON]{resumo.bonusTesteMagia > 0 ? ` +${resumo.bonusTesteMagia}` : ''}
                </Button>
                {handleAjustarRecurso && (
                  <Button
                    type="button"
                    variant={podeLancar ? 'primary' : 'disabled'}
                    size="sm"
                    disabled={!podeLancar}
                    onClick={() => lancarMagia(m)}
                  >
                    <FaBolt /> Lançar (-{calc.custoFinal} PM)
                  </Button>
                )}
              </div>

              {rolagem && (
                <div className={styles.resultadoMagia}>
                  <span>
                    Teste [d{rolagem.facesAst}: {rolagem.d1} + d{rolagem.facesVon}: {rolagem.d2}
                    {rolagem.bonus > 0 ? ` + ${rolagem.bonus}` : ''}] ={' '}
                    <span className={styles.resultadoDestaque}>{rolagem.total}</span>
                    {' '}| HR: <strong>{rolagem.hr}</strong>
                    {rolagem.bonusDanoOfensivo > 0 ? ` (+${rolagem.bonusDanoOfensivo} bônus dano ofensivo)` : ''}
                  </span>
                  {rolagem.critico && <Badge variant="core" size="sm">Sucesso Crítico!</Badge>}
                  {rolagem.desastre && <Badge variant="crise" size="sm">Desastre!</Badge>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
