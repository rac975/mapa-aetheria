import { useState } from 'react';
import { FaHeartbeat, FaMagic, FaShieldAlt, FaHandsHelping } from 'react-icons/fa';
import styles from './ExibirEspiritualista.module.css';

export default function ExibirEspiritualista({ classeObjeto }) {
  // Estado para simular ou informar o número de Laços ativos (usado no Poder Curativo)
  const [quantidadeLacos, setQuantidadeLacos] = useState(1);

  const habilidades = classeObjeto?.habilidades || [];
  const nivelClasse = parseInt(classeObjeto?.nivel, 10) || 1;

  // Verifica se possui poderes específicos investidos
  const habPoderCurativo = habilidades.find(h => (h.nome || '').toLowerCase().includes('poder curativo'));
  const nivelPoderCurativo = parseInt(habPoderCurativo?.nivel, 10) || 0;

  const habMagiaSuporte = habilidades.find(h => (h.nome || '').toLowerCase().includes('magia de suporte'));
  const temMagiaSuporte = parseInt(habMagiaSuporte?.nivel, 10) > 0;

  const habVismagus = habilidades.find(h => (h.nome || '').toLowerCase().includes('vismagus'));
  const temVismagus = parseInt(habVismagus?.nivel, 10) > 0;

  // Cálculo oficial do Poder Curativo: 3 + (NP do Poder Curativo × número de Laços)
  const curaExtraPV = 3 + (nivelPoderCurativo * quantidadeLacos);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaMagic /> Painel de Controle: Espiritualista (Nível {nivelClasse})
        </span>
      </div>

      {/* Dica de Benefícios Iniciais e Testes */}
      <div className={styles.infoBox}>
        💡 <strong>Benefícios Ativos:</strong> +5 PM máximos garantidos • Rituais de <i>Espiritualismo</i> liberados (Usa <b>AST + VON</b>).
      </div>

      {/* Painel do Poder Curativo (se investido) */}
      {nivelPoderCurativo > 0 && (
        <div className={styles.poderCurativoBox}>
          <div className={styles.poderCurativoHeader}>
            <span className={styles.poderCurativoTitle}>
              <FaHeartbeat /> Poder Curativo (Nv. {nivelPoderCurativo}):
            </span>
            <div className={styles.lacosInputGroup}>
              <span className={styles.lacosLabel}>Laços Ativos:</span>
              <input
                type="number"
                min="0"
                max="5"
                value={quantidadeLacos}
                onChange={(e) => setQuantidadeLacos(parseInt(e.target.value, 10) || 0)}
                className={styles.lacosInput}
              />
            </div>
          </div>
          <div className={styles.poderCurativoDesc}>
            Ao usar arma arcana em feitiços de alvo aliado, cada alvo recupera PVs extras: <code>3 + ({nivelPoderCurativo} × {quantidadeLacos})</code> = <strong className={styles.highlightPv}>{curaExtraPV} PVs</strong>.
          </div>
        </div>
      )}

      {/* Informações de Magia de Suporte e Vismagus */}
      <div className={styles.suporteList}>
        {temMagiaSuporte && (
          <div className={styles.suporteItemBlue}>
            <FaHandsHelping /> <strong>Magia de Suporte:</strong> Alvo aliado com Laço ganha bônus de teste igual à força do Laço (com arma arcana).
          </div>
        )}
        {temVismagus && (
          <div className={styles.suporteItemGold}>
            <FaShieldAlt /> <strong>Vismagus Ativo:</strong> Você pode sacrificar PVs <code>(10 + Custo PM)</code> se faltarem pontos de magia.
          </div>
        )}
      </div>
    </div>
  );
}
