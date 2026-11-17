import { useState, useMemo } from 'react';
import { FaSave } from 'react-icons/fa';
import { Modal, Input, Button } from '../../../components/ui';
import {
  POTENCIAS_PROJETO,
  STATUS_PROJETO,
  extrairNivelVisionario,
  calcularParametrosProjeto
} from '../../../domain/fabula/projetoRules';
import ProjetoEscopoFields from './ProjetoEscopoFields';
import styles from './ProjetoFormModal.module.css';

const FORM_INICIAL = {
  titulo: '',
  descricao: '',
  ficha_id: '',
  responsavel_nome: '',
  potencia: 'menor',
  area: 'individual',
  usos: 'consumivel',
  possui_defeito: false,
  descricao_defeito: '',
  ingrediente_raro: '',
  ingrediente_obtido: true,
  fatias_relogio: 4,
  nd_teste: 7,
  atributos_teste: 'AST+DES',
  progresso_atual: 0,
  status: 'em_andamento',
  visivel: true,
  notas_mestre: ''
};

export default function ProjetoFormModal({
  isOpen,
  onClose,
  projetoInicial = null,
  personagens = [],
  onSalvar,
  isSaving = false
}) {
  const [form, setForm] = useState(() => (
    projetoInicial
      ? { ...FORM_INICIAL, ...projetoInicial, ficha_id: projetoInicial.ficha_id || '' }
      : FORM_INICIAL
  ));

  const personagemSelecionado = useMemo(
    () => personagens.find((p) => p.id === form.ficha_id) || null,
    [personagens, form.ficha_id]
  );

  const visionarioInfo = useMemo(
    () => extrairNivelVisionario(personagemSelecionado?.fichas_classes || []),
    [personagemSelecionado]
  );

  const calculo = useMemo(
    () => calcularParametrosProjeto({
      potencia: form.potencia,
      area: form.area,
      usos: form.usos,
      possuiDefeito: form.possui_defeito,
      nivelVisionario: visionarioInfo.nivelVisionario,
      zenitDisponivel: personagemSelecionado?.zenit ?? null
    }),
    [form.potencia, form.area, form.usos, form.possui_defeito, visionarioInfo.nivelVisionario, personagemSelecionado]
  );

  const handleField = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handlePersonagemChange = (fichaId) => {
    const p = personagens.find((item) => item.id === fichaId);
    setForm((prev) => ({
      ...prev,
      ficha_id: fichaId,
      responsavel_nome: p ? p.nome_personagem : prev.responsavel_nome
    }));
  };

  const handlePotenciaChange = (novaPotencia) => {
    const potObj = POTENCIAS_PROJETO[novaPotencia] || POTENCIAS_PROJETO.menor;
    const calcTemp = calcularParametrosProjeto({ ...form, potencia: novaPotencia });
    setForm((prev) => ({
      ...prev,
      potencia: novaPotencia,
      nd_teste: potObj.ndSugerida,
      fatias_relogio: calcTemp.fatiasRelogioSugeridas,
      ingrediente_obtido: potObj.requerIngredienteRaro ? prev.ingrediente_obtido : true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    await onSalvar({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      ficha_id: form.ficha_id || null,
      responsavel_nome: form.responsavel_nome.trim(),
      potencia: form.potencia,
      area: form.area,
      usos: form.usos,
      possui_defeito: Boolean(form.possui_defeito),
      descricao_defeito: form.possui_defeito ? form.descricao_defeito.trim() : '',
      ingrediente_raro: form.ingrediente_raro.trim(),
      ingrediente_obtido: Boolean(form.ingrediente_obtido),
      custo_zenit: calculo.custoMaterialTotal,
      progresso_total: calculo.progressoTotal,
      progresso_atual: Math.min(calculo.progressoTotal, Math.max(0, parseInt(form.progresso_atual, 10) || 0)),
      fatias_relogio: Math.max(2, Math.min(16, parseInt(form.fatias_relogio, 10) || calculo.fatiasRelogioSugeridas)),
      nd_teste: Math.max(4, parseInt(form.nd_teste, 10) || 7),
      atributos_teste: form.atributos_teste || 'AST+DES',
      status: form.status || 'em_andamento',
      visivel: Boolean(form.visivel),
      notas_mestre: form.notas_mestre.trim()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={projetoInicial ? 'Editar Projeto' : 'Novo Projeto de Oficina'} size="lg">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row2}>
          <Input label="Título do Projeto *" value={form.titulo} onChange={(e) => handleField('titulo', e.target.value)} placeholder="Ex: Canhão de Éter Portátil" required />
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Personagem Responsável</label>
            <select className={styles.select} value={form.ficha_id} onChange={(e) => handlePersonagemChange(e.target.value)}>
              <option value="">Grupo / Outro Responsável</option>
              {personagens.map((p) => (
                <option key={p.id} value={p.id}>{p.nome_personagem}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row2}>
          <Input label="Nome do Autor / Grupo (exibição)" value={form.responsavel_nome} onChange={(e) => handleField('responsavel_nome', e.target.value)} placeholder="Ex: Lyra & Tripulação" />
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Status</label>
            <select className={styles.select} value={form.status} onChange={(e) => handleField('status', e.target.value)}>
              {Object.values(STATUS_PROJETO).map((s) => (
                <option key={s.key} value={s.key}>{s.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Descrição do Efeito / Criação</label>
          <textarea className={styles.textarea} rows={3} value={form.descricao} onChange={(e) => handleField('descricao', e.target.value)} placeholder="Descreva o que a invenção faz, propriedades e efeitos..." />
        </div>

        <ProjetoEscopoFields form={form} calculo={calculo} nivelVisionario={visionarioInfo.nivelVisionario} onFieldChange={handleField} onPotenciaChange={handlePotenciaChange} />

        <div className={styles.row2}>
          <Input label="Ingrediente Especial / Raro (opcional)" value={form.ingrediente_raro} onChange={(e) => handleField('ingrediente_raro', e.target.value)} placeholder="Ex: Núcleo de Titã Cristalizado" />
          <Input label="Progresso Atual" type="number" min={0} max={calculo.progressoTotal} value={form.progresso_atual} onChange={(e) => handleField('progresso_atual', e.target.value)} />
        </div>

        <div className={styles.checksRow}>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.possui_defeito} onChange={(e) => handleField('possui_defeito', e.target.checked)} />
            Defeito Terrível (-25% no custo)
          </label>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.ingrediente_obtido} onChange={(e) => handleField('ingrediente_obtido', e.target.checked)} />
            Ingrediente obtido / disponível
          </label>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.visivel} onChange={(e) => handleField('visivel', e.target.checked)} />
            Visível para os Jogadores
          </label>
        </div>

        {form.possui_defeito && (
          <Input label="Descrição do Defeito Terrível" value={form.descricao_defeito} onChange={(e) => handleField('descricao_defeito', e.target.value)} placeholder="Ex: Superaquece após cada disparo ou emite som ensurdecedor..." />
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Notas Privadas do Mestre (oculto dos jogadores)</label>
          <textarea className={styles.textarea} rows={2} value={form.notas_mestre} onChange={(e) => handleField('notas_mestre', e.target.value)} placeholder="Segredos de fabricação, consequências de desastre, ganchos..." />
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            <FaSave /> {isSaving ? 'Salvando...' : 'Salvar Projeto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
