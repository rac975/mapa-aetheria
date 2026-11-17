import React from 'react';
import { FaMagic } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
<<<<<<< Updated upstream
import { useAlert } from '../../../../contexts/useAlert';
=======
>>>>>>> Stashed changes
import styles from './InventorTecnomagiaSecao.module.css';

export default function InventorTecnomagiaSecao({
  ficha,
  handleAjustarRecurso,
  temAvancadoTecnomagia,
  temSuperiorTecnomagia,
  onCriarMagicanhao,
  criandoCanhao
}) {
<<<<<<< Updated upstream
  const { showAlert } = useAlert();
=======
>>>>>>> Stashed changes
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
                const mpAtual = ficha?.mp_atual ?? 0;
                if (mpAtual < 10) {
<<<<<<< Updated upstream
                  showAlert("Você não tem MP suficiente (10 PM) para usar a Sobreposição Tecnomágica!");
                  return;
                }
                handleAjustarRecurso('mp_atual', -10);
                showAlert("✨ Sobreposição Tecnomágica ativada! 10 PM consumidos.");
=======
                  alert("Você não tem MP suficiente (10 PM) para usar a Sobreposição Tecnomágica!");
                  return;
                }
                handleAjustarRecurso('mp_atual', -10);
                alert("✨ Sobreposição Tecnomágica ativada! 10 PM consumidos.");
>>>>>>> Stashed changes
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
    </div>
  );
}
