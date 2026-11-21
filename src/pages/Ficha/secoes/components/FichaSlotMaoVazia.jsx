import { useState, useMemo } from 'react';
import { FaBoxOpen, FaCar } from 'react-icons/fa';
import { Badge, Button } from '../../../../components/ui';
import {
  obterAtaqueDesarmado,
  obterArmaImprovisada
} from '../../../../domain/fabula/equipmentRules';
import { calcularBonusAkromorphosis } from '../../../../domain/fabula/technoFantasyRules';
import FichaSlotDesarmadoCard from './FichaSlotDesarmadoCard';
import styles from './FichaSlotMaoVazia.module.css';

export default function FichaSlotMaoVazia({
  slotId,
  slotLabel,
  slotIcon,
  isOcupadoPor2H = false,
  ocultarDesarmado = false,
  temArmasVeiculoAtivas = false,
  nomeVeiculo = 'Veículo Pessoal',
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
  const terioformasAtivasRaw = dadosMutante.terioformasAtivas;

  // Objeto virtual da arma calculada conforme regras puras de domínio
  const itemVirtual = useMemo(() => {
    const terioformasAtivas = Array.isArray(terioformasAtivasRaw) ? terioformasAtivasRaw : [];
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
  }, [tipoArma, tipoAlcanceImprovisada, nvAcromorfose, bonusAcro, categoriaArma, terioformasAtivasRaw]);

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
          <Badge variant="default" size="sm">Ocupada (2 Mãos)</Badge>
        </div>
        <div className={styles.ocupadoCard}>
          <span className={styles.ocupadoTexto}>
            Empunhando arma de duas mãos na mão dominante.
          </span>
        </div>
        <div className={styles.slotActions}>
          <Button type="button" variant="secondary" size="sm" onClick={onAbrirModalEquipar}>
            <FaBoxOpen /> Trocar Equipamento
          </Button>
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
        <Badge variant={temArmasVeiculoAtivas ? 'gold' : 'core'} size="sm">
          {temArmasVeiculoAtivas ? 'Veículo Ativo' : 'Mão Livre'}
        </Badge>
      </div>

      {/* 2. CONTEÚDO DO SLOT: OCULTA DESARMADO CASO HAJA ARMAS ATIVAS OU EQUIPADAS */}
      {ocultarDesarmado ? (
        <div className={styles.itemVirtualCard}>
          <div className={styles.ocupadoCard}>
            {temArmasVeiculoAtivas ? (
              <span className={styles.ocupadoTexto}>
                <FaCar /> O Piloto está operando os módulos de armamento do <strong>{nomeVeiculo}</strong>.
                Consulte as armas veiculares na seção dedicada abaixo.
              </span>
            ) : (
              <span className={styles.ocupadoTexto}>
                Mão desocupada. Você pode empunhar uma segunda arma, escudo ou item de suporte.
              </span>
            )}
          </div>
        </div>
      ) : (
        <FichaSlotDesarmadoCard
          itemVirtual={itemVirtual}
          stats={stats}
          tipoArma={tipoArma}
          setTipoArma={setTipoArma}
          nvAcromorfose={nvAcromorfose}
          categoriaArma={categoriaArma}
          handleMudarCategoria={handleMudarCategoria}
          tipoAlcanceImprovisada={tipoAlcanceImprovisada}
          setTipoAlcanceImprovisada={setTipoAlcanceImprovisada}
          modoAtaque={modoAtaque}
          setModoAtaque={setModoAtaque}
          onExecutarRolagem={onExecutarRolagem}
          slotId={slotId}
          ultimaRolagem={ultimaRolagem}
        />
      )}

      {/* 3. AÇÕES DO SLOT */}
      <div className={styles.slotActions}>
        <Button type="button" variant="secondary" size="sm" onClick={onAbrirModalEquipar}>
          <FaBoxOpen /> + Equipar da Mochila
        </Button>
      </div>
    </div>
  );
}
