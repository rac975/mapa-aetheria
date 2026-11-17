import { FaBolt } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import styles from '../FichaEquipamentosSecao.module.css';

export default function FichaSinergiasAtaqueBar({ opcoesTaticas, toggles }) {
  const temSinergiasTaticas = Boolean(
    opcoesTaticas.temConhecimentoEPoder ||
    opcoesTaticas.nvAtaquePoderoso > 0 ||
    opcoesTaticas.nvTiroPoderoso > 0 ||
    opcoesTaticas.focoCognitivoAtivo ||
    opcoesTaticas.temSimboloVerdadeCena ||
    opcoesTaticas.temHoplita ||
    opcoesTaticas.temTrilhaEpica ||
    opcoesTaticas.precisaoPiloto > 0 ||
    opcoesTaticas.bonusDanoDecreto > 0 ||
    opcoesTaticas.bonusPrecisaoCascata > 0 ||
    opcoesTaticas.bonusDanoPragaAtiva > 0 ||
    opcoesTaticas.conversaoDanoNatural ||
    opcoesTaticas.bonusDanoBeladona > 0
  );

  if (!temSinergiasTaticas) return null;

  return (
    <div className={styles.sinergiasAtaqueBar}>
      <span className={styles.sinergiasTitulo}>
        <FaBolt /> Sinergias de Precisão e Dano:
      </span>
      <div className={styles.sinergiasBotoes}>
        {opcoesTaticas.precisaoPiloto > 0 && (
          <Badge variant="core" size="sm">Piloto +{opcoesTaticas.precisaoPiloto} Precisão</Badge>
        )}
        {opcoesTaticas.bonusDanoDecreto > 0 && (
          <Badge variant="crise" size="sm">Decreto do Bispo +{opcoesTaticas.bonusDanoDecreto} Dano</Badge>
        )}
        {opcoesTaticas.temHoplita && (
          <Badge variant="gold" size="sm">Hoplita: +5 Dano (Lança 1M)</Badge>
        )}
        {opcoesTaticas.focoCognitivoAtivo && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarFocoCognitivo ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarFocoCognitivo((p) => !p)}
          >
            Foco Cognitivo (+{opcoesTaticas.bonusFocoTeste})
          </Button>
        )}
        {opcoesTaticas.temSimboloVerdadeCena && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarSimboloVerdade ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarSimboloVerdade((p) => !p)}
          >
            Símbolo Verdade (+2)
          </Button>
        )}
        {opcoesTaticas.temConhecimentoEPoder && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarConhecimentoEPoder ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarConhecimentoEPoder((p) => !p)}
          >
            Conhecimento é Poder (AST)
          </Button>
        )}
        {opcoesTaticas.nvAtaquePoderoso > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarAtaquePoderoso ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarAtaquePoderoso((p) => !p)}
          >
            Ataque Poderoso (+{opcoesTaticas.nvAtaquePoderoso * 2})
          </Button>
        )}
        {opcoesTaticas.nvTiroPoderoso > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarTiroPoderoso ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarTiroPoderoso((p) => !p)}
          >
            Tiro Poderoso (+{opcoesTaticas.nvTiroPoderoso * 2})
          </Button>
        )}
        {opcoesTaticas.temTrilhaEpica && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarTrilhaEpica ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarTrilhaEpica((p) => !p)}
          >
            Trilha Épica (Crít.)
          </Button>
        )}
        {opcoesTaticas.bonusPrecisaoCascata > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarCascataInvocador ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarCascataInvocador((p) => !p)}
          >
            Cascata (+{opcoesTaticas.bonusPrecisaoCascata} Precisão)
          </Button>
        )}
        {opcoesTaticas.bonusDanoPragaAtiva > 0 && (
          <Button
            type="button"
            size="sm"
            variant={toggles.usarPragaElemental ? 'core' : 'secondary'}
            onClick={() => toggles.setUsarPragaElemental((p) => !p)}
          >
            {opcoesTaticas.nomePragaAtiva || 'Praga'} (+{opcoesTaticas.bonusDanoPragaAtiva} Dano)
          </Button>
        )}
        {opcoesTaticas.conversaoDanoNatural && (
          <Badge variant="gold" size="sm">
            Dano Convertido: {opcoesTaticas.conversaoDanoNatural.toUpperCase()}
          </Badge>
        )}
        {opcoesTaticas.bonusDanoBeladona > 0 && (
          <Badge variant="core" size="sm">
            Beladona: +{opcoesTaticas.bonusDanoBeladona} Dano Veneno
          </Badge>
        )}
      </div>
    </div>
  );
}
