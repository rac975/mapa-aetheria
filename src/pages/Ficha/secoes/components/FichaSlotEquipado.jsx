import { FaExchangeAlt, FaDice, FaBolt } from 'react-icons/fa';
import { Badge, Button } from '../../../../components/ui';
import { SLOTS_EQUIPAMENTO } from '../../../../domain/fabula/equipmentRules';
import styles from '../FichaEquipamentosSecao.module.css';

export default function FichaSlotEquipado({
  slot,
  itemEquipado,
  classes = [],
  ultimaRolagem,
  modoAtual = 'normal',
  setModoAtual,
  onExecutarRolagem,
  onTrocar,
  onDesequipar
}) {
  const tipoItemEquipado = (itemEquipado?.tipo || '').toLowerCase();
  const temDuploEscudeiro = classes.some((c) =>
    (c.habilidades || []).some(
      (h) => (h.nome || '').toLowerCase().includes('duplo escudeiro') && (parseInt(h.nivel, 10) || 0) > 0
    )
  );

  const ehArmaOuEscudoAtacavel =
    slot.id.includes('mao') &&
    itemEquipado &&
    (tipoItemEquipado.includes('arma') ||
      (slot.id === SLOTS_EQUIPAMENTO.MAO_DOMINANTE && tipoItemEquipado.includes('escudo') && temDuploEscudeiro));

  return (
    <div className={styles.itemEquipadoCard}>
      <div className={styles.itemInfo}>
        <span className={styles.itemNome}>{itemEquipado.nome}</span>
        <Badge variant="gold" size="sm">{itemEquipado.tipo}</Badge>
      </div>

      {ehArmaOuEscudoAtacavel && (
        <div className={styles.ataqueArea}>
          <div className={styles.modoAtaqueSwitcher}>
            <button
              type="button"
              onClick={() => setModoAtual('normal')}
              className={`${styles.modoAtaqueBtn} ${modoAtual === 'normal' ? styles.modoAtaqueBtnActive : ''}`}
            >
              Ataque Único
            </button>
            <button
              type="button"
              onClick={() => setModoAtual('multi')}
              className={`${styles.modoAtaqueBtn} ${modoAtual === 'multi' ? styles.modoAtaqueBtnActiveMulti : ''}`}
            >
              Multiataque / 2ª Arma
            </button>
          </div>

          <Button
            type="button"
            variant="core"
            size="sm"
            fullWidth
            onClick={() => onExecutarRolagem(itemEquipado, slot.id)}
          >
            <FaDice /> Rolar Ataque e Dano
          </Button>

          {ultimaRolagem && (
            <div className={styles.resultadoCard}>
              {ultimaRolagem.statusCritico && (
                <div
                  className={`${styles.criticoBanner} ${
                    ultimaRolagem.statusCritico.includes('Sucesso')
                      ? styles.criticoSucesso
                      : styles.criticoFalha
                  }`}
                >
                  <FaBolt /> {ultimaRolagem.statusCritico}
                </div>
              )}
              <div className={styles.resultadoLinha}>
                <span>Precisão Final:</span>
                <span className={styles.resultadoValorDestaque}>{ultimaRolagem.testeAtaque}</span>
              </div>
              <div className={styles.detalhesDiscriminados}>
                <div>
                  Atributos: {ultimaRolagem.attr1} e {ultimaRolagem.attr2} ({ultimaRolagem.res1}, {ultimaRolagem.res2})
                </div>
                <div>Precisão Bônus: +{ultimaRolagem.bonusPrecisaoTotal}</div>
                {ultimaRolagem.usandoPsicocinese && (
                  <div>
                    <Badge variant="ether" size="sm">Psicocinese (VON)</Badge>
                  </div>
                )}
              </div>
              <div className={styles.resultadoLinha}>
                <span>Dano ({ultimaRolagem.usandoGolpe ? 'Trevas' : 'Normal'}):</span>
                <span className={styles.resultadoDanoDestaque}>{ultimaRolagem.danoTotal}</span>
              </div>
              <div className={styles.detalhesDiscriminados}>
                <div>Dado Mais Alto: {ultimaRolagem.dadoMaisAlto}</div>
                {ultimaRolagem.bonusDanoFixo > 0 && <div>Bônus Fixo: +{ultimaRolagem.bonusDanoFixo}</div>}
                {ultimaRolagem.danoAdrenalinaFurioso > 0 && <div>Adrenalina: +{ultimaRolagem.danoAdrenalinaFurioso}</div>}
                {ultimaRolagem.danoExtraHabilidade > 0 && <div>Golpe das Sombras: +{ultimaRolagem.danoExtraHabilidade}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.slotActions}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onTrocar}
        >
          <FaExchangeAlt /> Trocar
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onDesequipar}
        >
          Desequipar
        </Button>
      </div>
    </div>
  );
}
