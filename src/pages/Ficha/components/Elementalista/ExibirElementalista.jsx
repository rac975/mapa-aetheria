import React, { useState } from 'react';
import { FaFire, FaBolt, FaMountain } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ExibirElementalista.module.css';

export default function ExibirElementalista({ ficha, handleAjustarRecurso }) {
  const [custoExtraCataclismo, setCustoExtraCataclismo] = useState(10);
  const [tipoArmaLamina, setTipoArmaLamina] = useState('des'); // 'des' ou 'outro'

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvArtilharia = getNivel('artilharia magica');
  const nvCataclismo = getNivel('cataclismo');
  const nvRitualista = getNivel('elementalismo ritualista');
  const nvLamina = getNivel('lamina magica');
  const nvMagiaElemental = getNivel('magia elemental');

  if (nvArtilharia + nvCataclismo + nvRitualista + nvLamina + nvMagiaElemental === 0) {
    return null;
  }

  // Cálculos baseados no Nível do Poder (NP)
  const bonusArtilharia = nvArtilharia * 2;
  const maxPmCataclismo = nvCataclismo * 10; // NP x 10 (Máximo 50 no Nv 5)
  const danoExtraCataclismo = Math.floor(custoExtraCataclismo / 10) * 5; // +5 de dano para cada 10 PM
  
  const maxPmLamina = nvLamina * 20; // NP x 20
  const bonusAtributoLamina = tipoArmaLamina === 'des' ? nvLamina : 0; // Se DEX, soma NP ao teste

  const usarCataclismo = () => {
    if (!handleAjustarRecurso) return;

    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < custoExtraCataclismo) {
      window.alert(`MP insuficiente! O custo extra selecionado é de ${custoExtraCataclismo} PM.`);
      return;
    }

    if (window.confirm(`Aplicar Cataclismo (+${custoExtraCataclismo} PM)?\n\nIsso aumentará o dano do feitiço instantâneo em +${danoExtraCataclismo} pontos de dano elemental.`)) {
      handleAjustarRecurso('mp_atual', -custoExtraCataclismo);
      window.alert(`💥 Cataclismo aplicado com sucesso! ${custoExtraCataclismo} PM consumidos e +${danoExtraCataclismo} de dano adicionado.`);
    }
  };

  // Gera dinamicamente as opções do Cataclismo baseadas no nível da habilidade (10 em 10 até maxPmCataclismo)
  const opcoesCataclismo = [];
  for (let pm = 10; pm <= maxPmCataclismo; pm += 10) {
    const dano = (pm / 10) * 5;
    opcoesCataclismo.push(
      <option key={pm} value={pm}>
        {pm} PM (+{dano} Dano)
      </option>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaFire /> Domínio Elemental — Elementalista
        </div>

        {nvRitualista > 0 && (
          <span className={styles.ritualistaBadge}>
            ✨ Ritualismo Elemental Ativo (AST + VON)
          </span>
        )}
      </div>

      <div className={styles.passivasRow}>
        {nvArtilharia > 0 && (
          <span className={styles.artilhariaBadge}>
            🎯 Artilharia Mágica Ativa (+{bonusArtilharia} em Testes de Magia Ofensiva com Arma Arcana)
          </span>
        )}
      </div>

      {/* Seção de Cataclismo */}
      {nvCataclismo > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.cataclismoTitle}>
            <FaBolt /> Cataclismo (Até +{maxPmCataclismo} PM):
          </div>
          <div className={styles.actionRow}>
            <label className={styles.label}>PM Extra a Gastar:</label>
            <select
              value={custoExtraCataclismo}
              onChange={(e) => setCustoExtraCataclismo(Number(e.target.value))}
              className={styles.select}
            >
              {opcoesCataclismo}
            </select>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={usarCataclismo}
            >
              Lançar Cataclismo (+{danoExtraCataclismo} Dano)
            </Button>
          </div>
        </div>
      )}

      {/* Seção de Lâmina Mágica */}
      {nvLamina > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.laminaTitle}>
            <FaMountain /> Lâmina Mágica (Limite máx. feitiço: {maxPmLamina} PM):
          </div>
          <div className={styles.actionRow}>
            <span className={styles.label}>Tipo de Arma Equipada:</span>
            <select
              value={tipoArmaLamina}
              onChange={(e) => setTipoArmaLamina(e.target.value)}
              className={styles.select}
            >
              <option value="des">Usa Destreza (Bônus de Atributo: +{bonusAtributoLamina})</option>
              <option value="outro">Outro Atributo (Sem bônus extra de DES)</option>
            </select>
          </div>
          <div className={styles.infoText}>
            ℹ️ Permite usar a fórmula de Precisão da arma física no teste de Magia para feitiços de alvo único. Se incluir Destreza, ganha bônus igual ao nível da habilidade (+{nvLamina}).
          </div>
        </div>
      )}
    </div>
  );
}
