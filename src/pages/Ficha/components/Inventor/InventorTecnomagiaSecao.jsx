import React, { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './InventorTecnomagiaSecao.module.css';

export default function InventorTecnomagiaSecao({
  ficha,
  handleAjustarRecurso,
  temAvancadoTecnomagia,
  temSuperiorTecnomagia,
  onCriarMagicanhao,
  criandoCanhao
}) {
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

  return (
    <div className={styles.section}>
      <div className={styles.title}>
        <FaMagic /> Tecnomagia (Ferramentas & Feitiços)
      </div>
      <div className={styles.cardsContainer}>
        {/* Sobreposição Tecnomágica */}
        <div className={styles.card}>
          <strong className={styles.highlightPurple}>Sobreposição Tecnomágica (Básico):</strong> Gasta 10 PM para curar condições de um construto/elemental não-senciente, revelar ficha e forçar uma ação.
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={styles.actionBtn}
              onClick={() => {
                const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
                if (mpAtual < 10) {
                  setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: 'Sobreposição Tecnomágica exige 10 PM.' });
                  return;
                }
                if (handleAjustarRecurso) handleAjustarRecurso('mp_atual', -10);
                setAlerta({ isOpen: true, type: 'success', title: 'Sobreposição Ativada', message: '10 PM consumidos para Sobreposição Tecnomágica!' });
              }}
            >
              ⚡ Gastar 10 MP e Ativar Sobreposição
            </Button>
          </div>
        </div>

        {/* Magicanhão */}
        {temAvancadoTecnomagia && (
          <div className={styles.card}>
            <strong className={styles.highlightGold}>Magicanhão (Avançado):</strong> Ação Inventário + 2 PI para criar/equipar uma arma de fogo (Precisão: DES+AST+1, Dano: RA+10).
            <div>
              <Button
                type="button"
                variant="core"
                size="sm"
                className={styles.actionBtn}
                onClick={onCriarMagicanhao}
                disabled={criandoCanhao}
              >
                {criandoCanhao ? 'Criando...' : '🎯 Criar e Equipar Magicanhão (Ação Inventário + 2 PI)'}
              </Button>
            </div>
          </div>
        )}

        {/* Magisferas */}
        {temSuperiorTecnomagia && (
          <div className={styles.card}>
            <strong className={styles.highlightRed}>Magisferas (Superior):</strong> Cria magisferas de feitiços (Elementalista, Entropista, Espiritualista). Ação Inventário + 2 PI para lançar o feitiço instantaneamente pagando seus custos normais de MP.
          </div>
        )}
      </div>

      <CustomAlert
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
