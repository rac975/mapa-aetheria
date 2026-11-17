import React, { useState } from 'react';
import { FaFire, FaBolt, FaMountain } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './ExibirElementalista.module.css';

export default function ExibirElementalista({ ficha, classe, handleAjustarRecurso }) {
  const [custoExtraCataclismo, setCustoExtraCataclismo] = useState(10);
  const [tipoArmaLamina, setTipoArmaLamina] = useState('des');
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const habs = classe?.habilidades || ficha?.habilidades || [];
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

  if (nvArtilharia + nvCataclismo + nvRitualista + nvLamina + nvMagiaElemental === 0) return null;

  const bonusArtilharia = nvArtilharia * 2;
  const maxPmCataclismo = nvCataclismo * 10;
  const danoExtraCataclismo = Math.floor(custoExtraCataclismo / 10) * 5;
  const maxPmLamina = nvLamina * 20;
  const bonusAtributoLamina = tipoArmaLamina === 'des' ? nvLamina : 0;

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const usarCataclismo = () => {
    if (!handleAjustarRecurso) return;
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < custoExtraCataclismo) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: `Você tem ${mpAtual} PM e o Cataclismo selecionado exige +${custoExtraCataclismo} PM.` });
      return;
    }

    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Aplicar Cataclismo',
      message: `Gastar +${custoExtraCataclismo} PM para adicionar +${danoExtraCataclismo} pontos de dano ao feitiço instantâneo com arma arcana equipada?`,
      onConfirm: () => handleAjustarRecurso('mp_atual', -custoExtraCataclismo)
    });
  };

  const opcoesCataclismo = [];
  for (let pm = 10; pm <= maxPmCataclismo; pm += 10) {
    opcoesCataclismo.push(
      <option key={pm} value={pm}>{pm} PM (+{(pm / 10) * 5} Dano)</option>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaFire /> Domínio Elemental — Elementalista</div>
        {nvRitualista > 0 && <span className={styles.ritualistaBadge}>✨ Ritualismo Elemental Ativo (AST + VON)</span>}
      </div>

      <div className={styles.passivasRow}>
        {nvArtilharia > 0 && (
          <span className={styles.artilhariaBadge}>🎯 Artilharia Mágica (+{bonusArtilharia} em Magia Ofensiva com Arma Arcana)</span>
        )}
      </div>

      {nvCataclismo > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.cataclismoTitle}><FaBolt /> Cataclismo (Até +{maxPmCataclismo} PM):</div>
          <div className={styles.actionRow}>
            <label className={styles.label}>PM Extra:</label>
            <select value={custoExtraCataclismo} onChange={(e) => setCustoExtraCataclismo(Number(e.target.value))} className={styles.select}>
              {opcoesCataclismo}
            </select>
            <Button type="button" variant="danger" size="sm" onClick={usarCataclismo}>
              Lançar Cataclismo (+{danoExtraCataclismo} Dano)
            </Button>
          </div>
        </div>
      )}

      {nvLamina > 0 && (
        <div className={styles.cardBox}>
          <div className={styles.laminaTitle}><FaMountain /> Lâmina Mágica (Até {maxPmLamina} PM):</div>
          <div className={styles.actionRow}>
            <span className={styles.label}>Arma Equipada:</span>
            <select value={tipoArmaLamina} onChange={(e) => setTipoArmaLamina(e.target.value)} className={styles.select}>
              <option value="des">Usa Destreza (+{bonusAtributoLamina} Magia)</option>
              <option value="outro">Outro Atributo (+0 Magia)</option>
            </select>
          </div>
          <div className={styles.infoText}>
            ℹ️ Usa a fórmula de Precisão da arma equipada para feitiços de alvo único (≤ {maxPmLamina} PM); se incluir Destreza, soma +{nvLamina} no Teste de Magia.
          </div>
        </div>
      )}

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}