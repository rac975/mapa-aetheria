import { useState } from 'react';
import { FaHeartbeat, FaMagic, FaShieldAlt, FaHandsHelping } from 'react-icons/fa';
import { calcularCustoVismagus } from '../../../../domain/fabula/coreClassRules';
import styles from './ExibirEspiritualista.module.css';

export default function ExibirEspiritualista({ ficha, classeObjeto }) {
  const lacosIniciais = Array.isArray(ficha?.lacos) ? ficha.lacos.length : 1;
  const [quantidadeLacos, setQuantidadeLacos] = useState(lacosIniciais);

  const habilidades = classeObjeto?.habilidades || [];
  const nivelClasse = parseInt(classeObjeto?.nivel, 10) || 1;

  const habPoderCurativo = habilidades.find((h) => (h.nome || '').toLowerCase().includes('poder curativo'));
  const nivelPoderCurativo = parseInt(habPoderCurativo?.nivel, 10) || 0;

  const habMagiaSuporte = habilidades.find((h) => (h.nome || '').toLowerCase().includes('magia de suporte'));
  const temMagiaSuporte = parseInt(habMagiaSuporte?.nivel, 10) > 0;

  const habVismagus = habilidades.find((h) => (h.nome || '').toLowerCase().includes('vismagus'));
  const temVismagus = parseInt(habVismagus?.nivel, 10) > 0;

  const curaExtraPV = 3 + (nivelPoderCurativo * quantidadeLacos);
  const vismagusExemplo = calcularCustoVismagus(10, ficha?.hp_atual ?? 30);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}><FaMagic /> Painel de Controle: Espiritualista (Nível {nivelClasse})</span>
      </div>

      <div className={styles.infoBox}>
        💡 <strong>Benefícios Ativos:</strong> +5 PM máximos garantidos • Rituais de <i>Espiritualismo</i> liberados (Usa <b>AST + VON</b>).
      </div>

      {nivelPoderCurativo > 0 && (
        <div className={styles.poderCurativoBox}>
          <div className={styles.poderCurativoHeader}>
            <span className={styles.poderCurativoTitle}><FaHeartbeat /> Poder Curativo (Nv. {nivelPoderCurativo}):</span>
            <div className={styles.lacosInputGroup}>
              <span className={styles.lacosLabel}>Laços Ativos:</span>
              <input
                type="number"
                min="0"
                max="6"
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

      <div className={styles.suporteList}>
        {temMagiaSuporte && (
          <div className={styles.suporteItemBlue}>
            <FaHandsHelping /> <strong>Magia de Suporte:</strong> Alvo aliado com Laço ganha bônus no próximo teste igual à força do Laço (com arma arcana).
          </div>
        )}
        {temVismagus && (
          <div className={styles.suporteItemGold}>
            <FaShieldAlt /> <strong>Vismagus Ativo:</strong> Se faltar PM, sacrifique PVs <code>(10 + Custo PM)</code> (ex: feitiço 10 PM = {vismagusExemplo.custoPv} PV).
          </div>
        )}
      </div>
    </div>
  );
}
