import { FaBolt } from 'react-icons/fa';
import { Badge } from '../../../../components/ui';
import styles from './ResultadoRolagemArma.module.css';

export default function ResultadoRolagemArma({ ultimaRolagem }) {
  if (!ultimaRolagem) return null;

  const tipoDanoExibicao = ultimaRolagem.usandoGolpe
    ? 'Trevas'
    : (ultimaRolagem.tipoDano || 'Normal');

  return (
    <div className={styles.resultadoCard}>
      {ultimaRolagem.statusCritico && (
        <div
          className={`${styles.criticoBanner} ${
            ultimaRolagem.statusCritico.includes('Sucesso')
              ? styles.criticoSucesso
              : styles.criticoFalha
          }`}
        >
          <FaBolt /> {ultimaRolagem.statusCritico}
        </div>
      )}

      <div className={styles.resultadoLinha}>
        <span>Precisão Final:</span>
        <span className={styles.resultadoValorDestaque}>{ultimaRolagem.testeAtaque}</span>
      </div>
      <div className={styles.detalhesDiscriminados}>
        <div>
          Atributos: {ultimaRolagem.attr1} e {ultimaRolagem.attr2} ({ultimaRolagem.res1}, {ultimaRolagem.res2})
        </div>
        <div>Precisão Bônus: +{ultimaRolagem.bonusPrecisaoTotal}</div>
        {(ultimaRolagem.usandoPsicocinese || ultimaRolagem.usandoConhecimentoEPoder) && (
          <div className={styles.badgesRow}>
            {ultimaRolagem.usandoPsicocinese && (
              <Badge variant="ether" size="sm">Psicocinese (VON)</Badge>
            )}
            {ultimaRolagem.usandoConhecimentoEPoder && (
              <Badge variant="gold" size="sm">Conhecimento é Poder (AST)</Badge>
            )}
          </div>
        )}
      </div>

      <div className={styles.resultadoLinha}>
        <span>Dano ({tipoDanoExibicao}):</span>
        <span className={styles.resultadoDanoDestaque}>{ultimaRolagem.danoTotal}</span>
      </div>
      <div className={styles.detalhesDiscriminados}>
        <div>Dado Mais Alto: {ultimaRolagem.dadoMaisAlto}</div>
        {ultimaRolagem.bonusDanoFixo > 0 && <div>Bônus Fixo Total: +{ultimaRolagem.bonusDanoFixo}</div>}
        {ultimaRolagem.danoAdrenalinaFurioso > 0 && <div>Adrenalina: +{ultimaRolagem.danoAdrenalinaFurioso}</div>}
        {ultimaRolagem.danoExtraHabilidade > 0 && <div>Golpe das Sombras: +{ultimaRolagem.danoExtraHabilidade}</div>}
        {ultimaRolagem.danoDancarinoGuerra > 0 && <div>Dançarino de Guerra: +{ultimaRolagem.danoDancarinoGuerra}</div>}
        {ultimaRolagem.danoDecretoBispo > 0 && <div>Decreto do Bispo: +{ultimaRolagem.danoDecretoBispo}</div>}
        {ultimaRolagem.danoSinergiaExtra > 0 && <div>Sinergias / Poderes: +{ultimaRolagem.danoSinergiaExtra}</div>}
        {ultimaRolagem.multiplo && <div>Propriedade: Alveja até {ultimaRolagem.multiplo} criaturas</div>}
      </div>
    </div>
  );
}
