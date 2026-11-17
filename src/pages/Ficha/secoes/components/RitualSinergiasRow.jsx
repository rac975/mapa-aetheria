import { FaBolt, FaScroll } from 'react-icons/fa';
import { Badge, Button } from '../../../../components/ui';
import styles from '../FichaRituaisSecao.module.css';

export default function RitualSinergiasRow({
  modificadores,
  calculo,
  bonusTeste,
  toggles
}) {
  const temAlgo = Boolean(
    modificadores.temRituaisAgeis ||
    modificadores.dobrarPmDecreto ||
    modificadores.temSelosRituais ||
    modificadores.temNavegadorRitualismo ||
    modificadores.bonusConcentrado > 0 ||
    modificadores.focoCognitivoAtivo ||
    modificadores.qtdSimbolosVerdadeInimigos > 0 ||
    modificadores.qtdSimbolosFeiticariaInimigos > 0 ||
    modificadores.nvHipercognicao > 0
  );

  if (!temAlgo) return null;

  return (
    <div className={styles.sinergiasRitualBox}>
      <div className={styles.sinergiasRitualHeader}>
        <span><FaBolt /> Sinergias Mágicas & Rituais Ativas</span>
        {bonusTeste > 0 && (
          <Badge variant="gold" size="sm">Bônus no Teste: +{bonusTeste}</Badge>
        )}
      </div>

      <div className={styles.sinergiasRitualLista}>
        {modificadores.temRituaisAgeis && (
          <Badge variant="ether" size="sm">Rituais Ágeis: -2 Seções (mín. 4)</Badge>
        )}
        {modificadores.dobrarPmDecreto && (
          <Badge variant="crise" size="sm">Decreto do Bispo: Custo de PM x2</Badge>
        )}
        {modificadores.temNavegadorRitualismo && (
          <Badge variant="core" size="sm">Navegador: Dispensa Componentes</Badge>
        )}
        {modificadores.temSelosRituais && (
          <Badge variant={calculo.custoTotal <= 60 ? 'core' : 'crise'} size="sm">
            <FaScroll /> Selos Rituais: {calculo.custoTotal <= 60 ? 'Armazenável (<= 60 PM)' : 'Acima de 60 PM'}
          </Badge>
        )}
        {modificadores.bonusConcentrado > 0 && (
          <Badge variant="gold" size="sm">Concentrado [AST+AST]: +{modificadores.bonusConcentrado}</Badge>
        )}

        {modificadores.focoCognitivoAtivo && (
          <Button
            type="button"
            size="sm"
            variant={toggles.incluirFoco ? 'core' : 'secondary'}
            onClick={() => toggles.setIncluirFoco((p) => !p)}
          >
            Foco Cognitivo (+{modificadores.bonusFocoBase})
          </Button>
        )}

        {modificadores.qtdSimbolosVerdadeInimigos > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.incluirSimboloVerdade ? 'core' : 'secondary'}
            onClick={() => toggles.setIncluirSimboloVerdade((p) => !p)}
          >
            Símbolo da Verdade (+{modificadores.qtdSimbolosVerdadeInimigos * 2})
          </Button>
        )}

        {modificadores.nvHipercognicao > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.incluirHipercognicao ? 'core' : 'secondary'}
            onClick={() => toggles.setIncluirHipercognicao((p) => !p)}
          >
            Hipercognição (-{modificadores.nvHipercognicao} PM)
          </Button>
        )}

        {modificadores.qtdSimbolosFeiticariaInimigos > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.incluirSimboloFeiticaria ? 'core' : 'secondary'}
            onClick={() => toggles.setIncluirSimboloFeiticaria((p) => !p)}
          >
            Símbolo Feitiçaria (-{modificadores.qtdSimbolosFeiticariaInimigos * 5} PM)
          </Button>
        )}
      </div>
    </div>
  );
}
