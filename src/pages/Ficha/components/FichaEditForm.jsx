import { FaSave, FaTimes } from 'react-icons/fa';
import { Button } from '../../../components/ui';
import FichaFormGeral from '../forms/FichaFormGeral';
import FichaFormPeculiaridade from '../forms/FichaFormPeculiaridades';
import FichaFormAtributos from '../forms/FichaFormAtributos';
import FichaFormClasses from '../forms/FichaFormClasses';
import FichaFormRituais from '../forms/FichaFormRituais';
import FichaFormLacos from '../forms/FichaFormLacos';
import FichaFormMochila from '../forms/FichaFormMochila';
import styles from '../FichaPage.module.css';

const SECOES_EDICAO = [
  { id: 'sec-geral', label: 'Geral' },
  { id: 'sec-peculiaridade', label: 'Peculiaridade' },
  { id: 'sec-atributos', label: 'Atributos' },
  { id: 'sec-classes', label: 'Classes' },
  { id: 'sec-rituais', label: 'Rituais' },
  { id: 'sec-lacos', label: 'Laços' },
  { id: 'sec-mochila', label: 'Mochila & Notas' }
];

export default function FichaEditForm({
  formData,
  setFormData,
  formClasses,
  setFormClasses,
  salvando,
  onSubmit,
  onCancelar
}) {
  const irParaSecao = (idSecao) => {
    const el = document.getElementById(idSecao);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.formEditContainer}>
      <nav className={styles.editQuickNav} aria-label="Atalhos das seções de edição">
        {SECOES_EDICAO.map((sec) => (
          <button
            key={sec.id}
            type="button"
            className={styles.editQuickNavBtn}
            onClick={() => irParaSecao(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </nav>

      <div id="sec-geral">
        <FichaFormGeral formData={formData} setFormData={setFormData} />
      </div>

      <div id="sec-peculiaridade">
        <FichaFormPeculiaridade formData={formData} setFormData={setFormData} />
      </div>

      <div id="sec-atributos" className={styles.gridRowTwoCols}>
        <FichaFormAtributos formData={formData} setFormData={setFormData} />
        <div id="sec-rituais">
          <FichaFormRituais formData={formData} setFormData={setFormData} formClasses={formClasses} />
        </div>
      </div>

      <div id="sec-classes">
        <FichaFormClasses
          formClasses={formClasses}
          setFormClasses={setFormClasses}
          formData={formData}
          setFormData={setFormData}
        />
      </div>

      <div id="sec-lacos" className={styles.gridRowTwoCols}>
        <FichaFormLacos formData={formData} setFormData={setFormData} />
        <div id="sec-mochila">
          <FichaFormMochila formData={formData} setFormData={setFormData} />
        </div>
      </div>

      <div className={styles.saveFloatingBar}>
        <Button type="button" variant="ghost" size="md" onClick={onCancelar} disabled={salvando}>
          <FaTimes /> Cancelar
        </Button>
        <Button type="submit" variant="core" size="md" disabled={salvando}>
          <FaSave /> {salvando ? 'Salvando...' : 'Salvar Alterações da Ficha'}
        </Button>
      </div>
    </form>
  );
}
