import React from 'react';
import { FaCoins, FaShoppingCart, FaHandHoldingUsd } from 'react-icons/fa';
import {
  armaAtingeVoadores,
  extrairResumoCaracteristicasEquipamento,
  formatarValorStatEquipamento
} from '../../../../domain/fabula/equipmentRules';
import { Card, Badge, Button } from '../../../../components/ui';
import styles from '../LojaClienteTab.module.css';

const CHAVES_OCULTAS_STATS = [
  'slot',
  'equipado',
  'custo',
  'raridade',
  'marcial',
  'tipo_dano',
  'vagas',
  'atinge_voadores',
  'mutavel',
  'duas_maos',
  'caracteristica_especial',
  'especies_cacadora',
  'resistencias'
];

const NOMES_FORMATADOS_STATS = {
  dano: 'Dano',
  maos: 'Mãos',
  alcance: 'Alcance',
  precisao: 'Precisão',
  categoria: 'Categoria',
  defesa: 'Defesa',
  defesa_magica: 'Defesa Mágica',
  'defesa magica': 'Defesa Mágica',
  iniciativa: 'Iniciativa',
  segunda_forma: '2ª Forma (Mutável)',
  efeitos: 'Efeitos'
};

function getRaridadeVariant(raridade) {
  switch (raridade?.toLowerCase()) {
    case 'raro':
    case 'personalizada_rara':
      return 'ether';
    case 'epico':
    case 'épico':
      return 'core';
    case 'lendario':
    case 'lendário':
      return 'gold';
    default:
      return 'default';
  }
}

export function LojaCatalogoItemCard({ item, custoEfetivo, onComprar }) {
  const stats = item.stats || {};
  const ehMarcial = stats.marcial === true;
  const raridadeTexto = stats.raridade;
  const tipoDano = stats.tipo_dano;
  const vagasQualidade = stats.vagas || stats.vagas_qualidade;
  const resumoCarac = extrairResumoCaracteristicasEquipamento(item);

  return (
    <Card variant="default" className={styles.itemCard}>
      <div className={styles.cardTopo}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitulo}>{item.nome}</h4>
          <Badge variant="gold" size="sm">
            <FaCoins /> {custoEfetivo}z
          </Badge>
        </div>

        <div className={styles.tagsRow}>
          <Badge variant="default" size="sm">{item.tipo}</Badge>
          {'marcial' in stats && (
            <Badge variant={ehMarcial ? 'crise' : 'default'} size="sm">
              {ehMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
            </Badge>
          )}
          {raridadeTexto && (
            <Badge variant={getRaridadeVariant(raridadeTexto)} size="sm">
              ⭐ {raridadeTexto}
            </Badge>
          )}
          {tipoDano && <Badge variant="core" size="sm">{tipoDano}</Badge>}
          {vagasQualidade && <Badge variant="ether" size="sm">{vagasQualidade} Vagas</Badge>}
          {armaAtingeVoadores(item) && (
            <Badge variant="ether" size="sm" title="Atinge alvos voadores">🦅 Atinge Voadores</Badge>
          )}
          {resumoCarac.especiesCacadora.length > 0 && (
            <Badge variant="crise" size="sm">🎯 Caçadora: {resumoCarac.especiesCacadora.join(' / ')}</Badge>
          )}
          {resumoCarac.resistencias.length > 0 && (
            <Badge variant="ether" size="sm">🛡️ Res: {resumoCarac.resistencias.join(' / ')}</Badge>
          )}
          {resumoCarac.segundaForma && (
            <Badge variant="gold" size="sm">🔄 2ª Forma: {resumoCarac.segundaForma.nome}</Badge>
          )}
        </div>

        <p className={styles.cardDescricao}>{item.descricao || 'Sem descrição cadastrada.'}</p>

        {Object.keys(stats).length > 0 && (
          <div className={styles.statsBox}>
            {Object.entries(stats)
              .filter(([chave, valor]) => {
                const chaveLower = chave.toLowerCase();
                if (CHAVES_OCULTAS_STATS.includes(chaveLower)) return false;
                if (chaveLower === 'efeitos') {
                  return Array.isArray(valor) ? valor.length > 0 : Boolean(valor);
                }
                return valor !== null && valor !== undefined && valor !== '';
              })
              .map(([chave, valor]) => {
                const labelBonita = NOMES_FORMATADOS_STATS[chave.toLowerCase()] || chave.replace('_', ' ');
                const valorExibido = formatarValorStatEquipamento(chave, valor);
                const ehEfeitoOuLongo =
                  chave.toLowerCase() === 'efeitos' ||
                  chave.toLowerCase() === 'efeito' ||
                  chave.toLowerCase() === 'segunda_forma' ||
                  valorExibido.length > 35;

                return (
                  <div key={chave} className={`${styles.statLinha} ${ehEfeitoOuLongo ? styles.statLinhaEfeito : ''}`}>
                    <span className={styles.statChave}>{labelBonita}:</span>
                    <span className={styles.statValor}>{valorExibido}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className={styles.cardAcoes}>
        <Button variant="primary" size="sm" className={styles.btnAcaoPrincipal} onClick={() => onComprar(item)}>
          <FaShoppingCart /> Comprar Item
        </Button>
      </div>
    </Card>
  );
}

export function LojaVendaItemCard({ itemInv, onVender }) {
  const stats = itemInv.stats_personalizados || {};
  const custoOriginal = stats.valor_zenites || stats.custo || 100;
  const valorVenda = custoOriginal || Math.floor((custoOriginal || 100) / 2);
  const estaEquipado = Boolean(stats.slot || itemInv.equipado);
  const resumoCarac = extrairResumoCaracteristicasEquipamento(itemInv);

  return (
    <Card
      variant="default"
      className={`${styles.itemCard} ${estaEquipado ? styles.itemCardEquipado : ''}`}
    >
      <div className={styles.cardTopo}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitulo}>{itemInv.nome}</h4>
          <Badge variant="gold" size="sm">
            <FaCoins /> +{valorVenda}z (Venda)
          </Badge>
        </div>

        <div className={styles.tagsRow}>
          <Badge variant="default" size="sm">{itemInv.tipo}</Badge>
          {estaEquipado && <Badge variant="gold" size="sm">🔒 Equipado</Badge>}
          {resumoCarac.especiesCacadora.length > 0 && (
            <Badge variant="crise" size="sm">🎯 Caçadora: {resumoCarac.especiesCacadora.join(' / ')}</Badge>
          )}
          {resumoCarac.resistencias.length > 0 && (
            <Badge variant="ether" size="sm">🛡️ Res: {resumoCarac.resistencias.join(' / ')}</Badge>
          )}
          {resumoCarac.segundaForma && (
            <Badge variant="gold" size="sm">🔄 2ª Forma: {resumoCarac.segundaForma.nome}</Badge>
          )}
        </div>

        {Object.keys(stats).length > 0 && (
          <div className={styles.statsBox}>
            {Object.entries(stats)
              .filter(([chave, valor]) => {
                const chaveLower = chave.toLowerCase();
                if (CHAVES_OCULTAS_STATS.includes(chaveLower)) return false;
                return valor !== null && valor !== undefined && valor !== '';
              })
              .map(([chave, valor]) => {
                const labelBonita = NOMES_FORMATADOS_STATS[chave.toLowerCase()] || chave.replace('_', ' ');
                const valorStr = formatarValorStatEquipamento(chave, valor);
                const ehEfeitoOuLongo =
                  chave.toLowerCase() === 'efeitos' ||
                  chave.toLowerCase() === 'efeito' ||
                  chave.toLowerCase() === 'segunda_forma' ||
                  valorStr.length > 35;
                return (
                  <div key={chave} className={`${styles.statLinha} ${ehEfeitoOuLongo ? styles.statLinhaEfeito : ''}`}>
                    <span className={styles.statChave}>{labelBonita}:</span>
                    <span className={styles.statValor}>{valorStr}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className={styles.cardAcoes}>
        <Button
          variant={estaEquipado ? 'ghost' : 'secondary'}
          size="sm"
          fullWidth
          onClick={() => onVender(itemInv)}
          disabled={estaEquipado}
        >
          <FaHandHoldingUsd /> {estaEquipado ? 'Desequipe para Vender' : `Vender por ${valorVenda}z`}
        </Button>
      </div>
    </Card>
  );
}
