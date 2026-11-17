import { FaCalculator } from 'react-icons/fa';
import { Input, Badge } from '../../../components/ui';
import {
  POTENCIAS_PROJETO,
  AREAS_PROJETO,
  USOS_PROJETO,
  ATRIBUTOS_PROJETO_OPCOES
} from '../../../domain/fabula/projetoRules';
import styles from './ProjetoFormModal.module.css';

export default function ProjetoEscopoFields({
  form,
  calculo,
  nivelVisionario,
  onFieldChange,
  onPotenciaChange
}) {
  return (
    <>
      <div className={styles.row3}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Potência</label>
          <select
            className={styles.select}
            value={form.potencia}
            onChange={(e) => onPotenciaChange(e.target.value)}
          >
            {Object.values(POTENCIAS_PROJETO).map((p) => (
              <option key={p.key} value={p.key}>
                {p.nome} ({p.custoBase}z)
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Área</label>
          <select
            className={styles.select}
            value={form.area}
            onChange={(e) => onFieldChange('area', e.target.value)}
          >
            {Object.values(AREAS_PROJETO).map((a) => (
              <option key={a.key} value={a.key}>
                {a.nome} (×{a.multiplicador})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Usos</label>
          <select
            className={styles.select}
            value={form.usos}
            onChange={(e) => onFieldChange('usos', e.target.value)}
          >
            {Object.values(USOS_PROJETO).map((u) => (
              <option key={u.key} value={u.key}>
                {u.nome} (×{u.multiplicador})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.calcResumo}>
        <div className={styles.calcTitle}>
          <FaCalculator /> Resumo Oficial (Fabula Ultima)
        </div>
        <div className={styles.calcBadges}>
          <Badge variant="gold" size="sm">Custo Total: {calculo.custoMaterialTotal}z</Badge>
          <Badge variant="pm" size="sm">Progresso Necessário: {calculo.progressoTotal} pts</Badge>
          {nivelVisionario > 0 && (
            <Badge variant="core" size="sm">
              Visionário Nv.{nivelVisionario}: -{calculo.custoPagoAutomaticamente}z (Líquido: {calculo.custoLiquidoJogador}z)
            </Badge>
          )}
          {calculo.requerIngredienteRaro && (
            <Badge variant="pi" size="sm">Requer Ingrediente Raro</Badge>
          )}
        </div>
      </div>

      <div className={styles.row3}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Atributos do Teste</label>
          <select
            className={styles.select}
            value={form.atributos_teste}
            onChange={(e) => onFieldChange('atributos_teste', e.target.value)}
          >
            {ATRIBUTOS_PROJETO_OPCOES.map((op) => (
              <option key={op.key} value={op.key}>{op.nome}</option>
            ))}
          </select>
        </div>

        <Input
          label="ND do Teste"
          type="number"
          min={4}
          max={30}
          value={form.nd_teste}
          onChange={(e) => onFieldChange('nd_teste', e.target.value)}
        />

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Fatias do Relógio</label>
          <select
            className={styles.select}
            value={form.fatias_relogio}
            onChange={(e) => onFieldChange('fatias_relogio', Number(e.target.value))}
          >
            {[4, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n} Fatias</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
