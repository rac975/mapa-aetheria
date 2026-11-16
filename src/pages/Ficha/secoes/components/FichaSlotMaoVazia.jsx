import { useState, useMemo } from 'react';
import { FaFistRaised, FaDice, FaBolt, FaBoxOpen, FaShieldAlt } from 'react-icons/fa';
import { GiBrokenBottle } from 'react-icons/gi';
import { Badge, Button } from '../../../../components/ui';
import {
  obterAtaqueDesarmado,
  obterArmaImprovisada
} from '../../../../domain/fabula/equipmentRules';
import { calcularBonusAkromorphosis } from '../../../../domain/fabula/technoFantasyRules';
import styles from './FichaSlotMaoVazia.module.css';

export default function FichaSlotMaoVazia({
  slotId,
  slotLabel,
  slotIcon,
  isOcupadoPor2H = false,
  classes = [],
  onAbrirModalEquipar,
  onExecutarRolagem,
  ultimaRolagem,
  modoAtaque = 'normal',
  setModoAtaque,
  onAtualizarMutante
}) {
  const [tipoArma, setTipoArma] = useState('desarmado');
  const [tipoAlcanceImprovisada, setTipoAlcanceImprovisada] = useState('corpo_a_corpo');

  // Identificação e cálculo da Acromorfose e Terioformas do Mutante
  const mutanteClass = useMemo(() => {
    return (classes || []).find((c) =>
      (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('mutant')
    );
  }, [classes]);

  const habAcro = useMemo(() => {
    return (mutanteClass?.habilidades || []).find((h) =>
      (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('acromorfose')
    );
  }, [mutanteClass]);

  const nvAcromorfose = parseInt(habAcro?.nivel, 10) || 0;
  const bonusAcro = useMemo(() => calcularBonusAkromorphosis(nvAcromorfose), [nvAcromorfose]);

  const habTerio = useMemo(() => {
    return (mutanteClass?.habilidades || []).find((h) =>
      (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('teriomorfose')
    );
  }, [mutanteClass]);

  const dadosMutante = mutanteClass?.dados_mutante || habTerio?.dados_mutante || {};
  const categoriaArma = dadosMutante.categoriaArma || 'Armas de Luta';
  const terioformasAtivas = Array.isArray(dadosMutante.terioformasAtivas) ? dadosMutante.terioformasAtivas : [];

  // Objeto virtual da arma calculada conforme regras puras de domínio
  const itemVirtual = useMemo(() => {
    if (tipoArma === 'improvisada') {
      return obterArmaImprovisada({ tipoAlcance: tipoAlcanceImprovisada });
    }
    return obterAtaqueDesarmado({
      acromorfose: {
        nvAcromorfose,
        bonusPrecisao: bonusAcro.bonusPrecisao,
        bonusDanoFisico: bonusAcro.bonusDanoFisico,
        categoriaArma
      },
      terioformasAtivas
    });
  }, [tipoArma, tipoAlcanceImprovisada, nvAcromorfose, bonusAcro, categoriaArma, terioformasAtivas]);

  const stats = itemVirtual.stats_personalizados || {};

  const handleMudarCategoria = (novaCat) => {
    if (onAtualizarMutante) {
      onAtualizarMutante({
        ...dadosMutante,
        categoriaArma: novaCat
      });
    }
  };

  if (isOcupadoPor2H) {
    return (
      <div className={styles.container}>
        <div className={styles.slotHeader}>
          <div className={styles.slotHeaderTitle}>
            {slotIcon} <span>{slotLabel}</span>
          </div>
          <Badge variant="default" size="sm">Ocupada</Badge>
        </div>
        <div className={styles.ocupadoCard}>
          <span className={styles.ocupadoTexto}>
            Empunhando arma de duas mãos na mão dominante.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. CABEÇALHO DO SLOT */}
      <div className={styles.slotHeader}>
        <div className={styles.slotHeaderTitle}>
          {slotIcon} <span>{slotLabel}</span>
        </div>
        <Badge variant="core" size="sm">Mão Livre</Badge>
      </div>

      {/* 2. TOGGLE RÁPIDO ENTRE DESARMADO E IMPROVISADA */}
      <div className={styles.toggleTipoArma}>
        <button
          type="button"
          onClick={() => setTipoArma('desarmado')}
          className={`${styles.toggleBtn} ${tipoArma === 'desarmado' ? styles.toggleBtnActive : ''}`}
        >
          <FaFistRaised /> Ataque Desarmado
        </button>
        <button
          type="button"
          onClick={() => setTipoArma('improvisada')}
          className={`${styles.toggleBtn} ${tipoArma === 'improvisada' ? styles.toggleBtnActive : ''}`}
        >
          <GiBrokenBottle /> Arma Improvisada
        </button>
      </div>

      {/* 3. INFORMAÇÕES DA ARMA SELECIONADA */}
      <div className={styles.armaInfo}>
        <div className={styles.armaNomeRow}>
          <span className={styles.armaNome}>{itemVirtual.nome}</span>
          <div className={styles.badgesRow}>
            <Badge variant="gold" size="sm">{stats.categoria}</Badge>
            <Badge variant="default" size="sm">
              {stats.alcance === 'distancia' ? 'À Distância' : 'Corpo a Corpo'}
            </Badge>
            <Badge variant="default" size="sm">
              Dano {stats.tipo_dano?.toUpperCase()}
            </Badge>
            {stats.multiplo && (
              <Badge variant="ether" size="sm">Múltiplo ({stats.multiplo})</Badge>
            )}
          </div>
        </div>

        {/* Integração de Acromorfose: Seletor de Categoria e Bônus */}
        {tipoArma === 'desarmado' && nvAcromorfose > 0 && (
          <div className={styles.acroCategoriaRow}>
            <span className={styles.acroLabel}>Acromorfose Categoria:</span>
            <select
              value={categoriaArma}
              onChange={(e) => handleMudarCategoria(e.target.value)}
              className={styles.acroSelect}
            >
              <option value="Armas de Luta">Armas de Luta (Brawling)</option>
              <option value="Armas Brancas / Espadas">Armas Brancas / Espadas</option>
              <option value="Armas Pesadas">Armas Pesadas (Heavy)</option>
              <option value="Adagas">Adagas (Daggers)</option>
              <option value="Arcos">Arcos (Distância)</option>
              <option value="Armas de Fogo">Armas de Fogo (Distância)</option>
              <option value="Armas de Arremesso">Armas de Arremesso (Distância)</option>
            </select>
          </div>
        )}

        {/* Seletor de Alcance para Arma Improvisada */}
        {tipoArma === 'improvisada' && (
          <div className={styles.acroCategoriaRow}>
            <span className={styles.acroLabel}>Tipo de Uso:</span>
            <select
              value={tipoAlcanceImprovisada}
              onChange={(e) => setTipoAlcanceImprovisada(e.target.value)}
              className={styles.acroSelect}
            >
              <option value="corpo_a_corpo">Corpo a Corpo (DES + VIG | HR + 2 Físico)</option>
              <option value="distancia">Arremesso à Distância (DES + VIG | HR + 2 Físico)</option>
            </select>
          </div>
        )}

        {/* Fórmulas Oficiais */}
        <div className={styles.formulaBox}>
          <div className={styles.formulaLinha}>
            <span>Precisão:</span>
            <strong className={styles.formulaValor}>{stats.precisao}</strong>
          </div>
          <div className={styles.formulaLinha}>
            <span>Dano:</span>
            <strong className={styles.formulaValor}>{stats.dano} [{stats.tipo_dano}]</strong>
          </div>
          {stats.qualidade && (
            <div className={styles.qualidadeTexto}>{stats.qualidade}</div>
          )}
        </div>
      </div>

      {/* 4. ÁREA DE ATAQUE E ROLAGEM */}
      <div className={styles.ataqueArea}>
        <div className={styles.modoAtaqueSwitcher}>
          <button
            type="button"
            onClick={() => setModoAtaque('normal')}
            className={`${styles.modoAtaqueBtn} ${modoAtaque === 'normal' ? styles.modoAtaqueBtnActive : ''}`}
          >
            Ataque Único
          </button>
          <button
            type="button"
            onClick={() => setModoAtaque('multi')}
            className={`${styles.modoAtaqueBtn} ${modoAtaque === 'multi' ? styles.modoAtaqueBtnActiveMulti : ''}`}
          >
            Multiataque / 2ª Arma
          </button>
        </div>

        <Button
          type="button"
          variant="core"
          size="sm"
          fullWidth
          onClick={() => onExecutarRolagem(itemVirtual, slotId)}
        >
          <FaDice /> Rolar Ataque e Dano
        </Button>

        {/* Resultado Detalhado */}
        {ultimaRolagem && (
          <div className={styles.resultadoCard}>
            {ultimaRolagem.statusCritico && (
              <div className={`${styles.criticoBanner} ${ultimaRolagem.statusCritico.includes('Sucesso') ? styles.criticoSucesso : styles.criticoFalha}`}>
                <FaBolt /> {ultimaRolagem.statusCritico}
              </div>
            )}
            <div className={styles.resultadoLinha}>
              <span>Precisão Final:</span>
              <span className={styles.resultadoValorDestaque}>{ultimaRolagem.testeAtaque}</span>
            </div>
            <div className={styles.detalhesDiscriminados}>
              <div>Atributos: {ultimaRolagem.attr1} e {ultimaRolagem.attr2} ({ultimaRolagem.res1}, {ultimaRolagem.res2})</div>
              <div>Precisão Bônus: +{ultimaRolagem.bonusPrecisaoTotal}</div>
              {ultimaRolagem.usandoPsicocinese && (
                <div>
                  <Badge variant="ether" size="sm">Psicocinese (VON)</Badge>
                </div>
              )}
            </div>
            <div className={styles.resultadoLinha}>
              <span>Dano ({ultimaRolagem.usandoGolpe ? 'Trevas' : ultimaRolagem.tipoDano || 'Físico'}):</span>
              <span className={styles.resultadoDanoDestaque}>{ultimaRolagem.danoTotal}</span>
            </div>
            <div className={styles.detalhesDiscriminados}>
              <div>Dado Mais Alto: {ultimaRolagem.dadoMaisAlto}</div>
              {ultimaRolagem.bonusDanoFixo > 0 && <div>Bônus Fixo: +{ultimaRolagem.bonusDanoFixo}</div>}
              {ultimaRolagem.danoAdrenalinaFurioso > 0 && <div>Adrenalina: +{ultimaRolagem.danoAdrenalinaFurioso}</div>}
              {ultimaRolagem.danoExtraHabilidade > 0 && <div>Golpe das Sombras: +{ultimaRolagem.danoExtraHabilidade}</div>}
              {ultimaRolagem.multiplo && <div>Propriedade: Alveja até {ultimaRolagem.multiplo} criaturas</div>}
            </div>
          </div>
        )}
      </div>

      {/* 5. AÇÕES DO SLOT */}
      <div className={styles.slotActions}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAbrirModalEquipar}
        >
          <FaBoxOpen /> + Equipar da Mochila
        </Button>
      </div>
    </div>
  );
}
