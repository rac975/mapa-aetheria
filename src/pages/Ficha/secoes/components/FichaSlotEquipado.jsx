import { useState } from 'react';
import { FaExchangeAlt, FaDice } from 'react-icons/fa';
import { Badge, Button } from '../../../../components/ui';
import {
  SLOTS_EQUIPAMENTO,
  armaAtingeVoadores,
  extrairResumoCaracteristicasEquipamento
} from '../../../../domain/fabula/equipmentRules';
import { obterItemFormaAtivaArmaMutavel } from '../../../../domain/fabula/weaponForge';
import ResultadoRolagemArma from './ResultadoRolagemArma';
import styles from './FichaSlotEquipado.module.css';

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
  const [usarSegundaForma, setUsarSegundaForma] = useState(false);

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

  const resumoCarac = extrairResumoCaracteristicasEquipamento(itemEquipado);
  const temSegundaForma = Boolean(resumoCarac.segundaForma);
  const itemFormaAtiva = obterItemFormaAtivaArmaMutavel(itemEquipado, temSegundaForma && usarSegundaForma);
  const statsAtivos = itemFormaAtiva?.stats_personalizados || itemFormaAtiva?.stats || {};
  const efeitosLista = Array.isArray(statsAtivos.efeitos) ? statsAtivos.efeitos : (statsAtivos.efeito ? [statsAtivos.efeito] : []);

  return (
    <div className={styles.itemEquipadoCard}>
      <div className={styles.itemInfo}>
        <span className={styles.itemNome}>{itemFormaAtiva.nome}</span>
        <div className={styles.badgesCluster}>
          <Badge variant="gold" size="sm">{itemEquipado.tipo}</Badge>
          {statsAtivos.categoria && (
            <Badge variant="default" size="sm">{statsAtivos.categoria}</Badge>
          )}
          {armaAtingeVoadores(itemFormaAtiva) && (
            <Badge variant="ether" size="sm" title="Atinge alvos voadores">🦅 Atinge Voadores</Badge>
          )}
          {resumoCarac.especiesCacadora.length > 0 && (
            <Badge variant="crise" size="sm">🎯 Caçadora: {resumoCarac.especiesCacadora.join(' / ')}</Badge>
          )}
          {resumoCarac.resistencias.length > 0 && (
            <Badge variant="ether" size="sm">🛡️ Res: {resumoCarac.resistencias.join(' / ')}</Badge>
          )}
          {temSegundaForma && (
            <Badge variant="gold" size="sm">
              🔄 Mutável ({usarSegundaForma ? '2ª Forma' : '1ª Forma'})
            </Badge>
          )}
        </div>

        {(statsAtivos.precisao || statsAtivos.dano || statsAtivos.defesa || statsAtivos.defesa_magica) && (
          <div className={styles.statsResumoTexto}>
            {statsAtivos.precisao && <span>{statsAtivos.precisao} </span>}
            {statsAtivos.dano && <span>• {statsAtivos.dano} [{statsAtivos.tipo_dano || 'físico'}] </span>}
            {statsAtivos.alcance && <span>• {statsAtivos.alcance} </span>}
            {Boolean(statsAtivos.defesa) && <span>• DEF: {statsAtivos.defesa} </span>}
            {Boolean(statsAtivos.defesa_magica) && <span>• M.DEF: {statsAtivos.defesa_magica}</span>}
          </div>
        )}

        {efeitosLista.length > 0 && (
          <div className={styles.efeitosListaCompacta}>
            {efeitosLista.join(' • ')}
          </div>
        )}
      </div>

      {ehArmaOuEscudoAtacavel && (
        <div className={styles.ataqueArea}>
          {temSegundaForma && (
            <div className={styles.modoAtaqueSwitcher}>
              <button
                type="button"
                onClick={() => setUsarSegundaForma(false)}
                className={`${styles.modoAtaqueBtn} ${!usarSegundaForma ? styles.modoAtaqueBtnActive : ''}`}
              >
                1ª Forma ({itemEquipado.stats_personalizados?.categoria || 'Padrão'})
              </button>
              <button
                type="button"
                onClick={() => setUsarSegundaForma(true)}
                className={`${styles.modoAtaqueBtn} ${usarSegundaForma ? styles.modoAtaqueBtnActive : ''}`}
              >
                2ª Forma: {resumoCarac.segundaForma.nome || 'Alternativa'}
              </button>
            </div>
          )}

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
            onClick={() => onExecutarRolagem(itemFormaAtiva, slot.id)}
          >
            <FaDice /> Rolar Ataque e Dano{temSegundaForma && usarSegundaForma ? ` (${resumoCarac.segundaForma.nome})` : ''}
          </Button>

          <ResultadoRolagemArma ultimaRolagem={ultimaRolagem} />
        </div>
      )}

      <div className={styles.slotActions}>
        <Button type="button" variant="secondary" size="sm" onClick={onTrocar}>
          <FaExchangeAlt /> Trocar
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={onDesequipar}>
          Desequipar
        </Button>
      </div>
    </div>
  );
}
