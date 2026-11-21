import { useState, useEffect } from 'react';
import { fichaService } from '../../../services/fichaService';
import {
  calcularNivelTotal,
  sanitizarNivelClasse,
  podeAdicionarClasse
} from '../../../domain/fabula/characterProgression';
import FichaFormClasseCard from './FichaFormClasseCard';
import { useAlert } from '../../../contexts/useAlert';
import styles from './FichaFormClasses.module.css';

export default function FichaFormClasses({ fichaId, formClasses = [], setFormClasses, setFormData }) {
  const { showAlert } = useAlert();
  const [catalogoClasses, setCatalogoClasses] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function carregarCatalogo() {
      try {
        const data = await fichaService.getCatalogoClasses();
        if (isMounted && data) {
          setCatalogoClasses(data);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar catálogo:', error);
      }
    }
    carregarCatalogo();
    return () => {
      isMounted = false;
    };
  }, []);

  const adicionarClasseDoCatalogo = (e) => {
    const nomeSelecionado = e.target.value;
    if (!nomeSelecionado) return;

    const validacao = podeAdicionarClasse(formClasses, nomeSelecionado);
    if (!validacao.permitido) {
      showAlert(validacao.motivo);
      e.target.value = '';
      return;
    }

    const classeOficial = catalogoClasses.find((c) => c.nome_classe === nomeSelecionado);
    if (!classeOficial) return;

    const beneficioTexto = typeof classeOficial.beneficios_iniciais === 'object'
      ? (classeOficial.beneficios_iniciais?.texto || '')
      : (classeOficial.beneficios_iniciais || '');

    const novaClasse = {
      nome_classe: classeOficial.nome_classe,
      nivel: 1,
      beneficios: beneficioTexto,
      habilidades: (classeOficial.habilidades_padrao || []).map((h) => ({
        nome: h.nome,
        nivel: 0,
        descricao: h.descricao
      })),
      magias: []
    };

    setFormClasses((prevClasses) => {
      const novas = [...prevClasses, novaClasse];
      const novoNivel = calcularNivelTotal(novas);
      setFormData((prevForm) => ({ ...prevForm, nivel: novoNivel }));
      return novas;
    });
    e.target.value = '';
  };

  const removerClasse = (index) => {
    setFormClasses((prevClasses) => {
      const atual = prevClasses.filter((_, i) => i !== index);
      const novoNivel = calcularNivelTotal(atual);
      setFormData((prevForm) => ({ ...prevForm, nivel: novoNivel }));
      return atual;
    });
  };

  const alterarNivelClasse = (index, rawValor) => {
    const val = sanitizarNivelClasse(rawValor);
    setFormClasses((prevClasses) => {
      const atual = prevClasses.map((c, i) => (i === index ? { ...c, nivel: val } : c));
      const novoNivel = calcularNivelTotal(atual);
      setFormData((prevForm) => ({ ...prevForm, nivel: novoNivel }));
      return atual;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.headerTitle}>Classes do Personagem</h3>

        <select
          onChange={adicionarClasseDoCatalogo}
          defaultValue=""
          className={styles.selectClasse}
        >
          <option value="" disabled>+ Adicionar Classe do Manual</option>
          {catalogoClasses.map((cat) => {
            const jaAdicionada = formClasses.some((c) => c.nome_classe === cat.nome_classe);
            return (
              <option key={cat.id} value={cat.nome_classe} disabled={jaAdicionada}>
                {cat.nome_classe} {jaAdicionada ? ' (Já adicionada)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {formClasses.length === 0 ? (
        <p className={styles.emptyClassesText}>
          Nenhuma classe adicionada. Selecione uma classe no menu acima para começar.
        </p>
      ) : (
        <div className={styles.classList}>
          {formClasses.map((c, index) => (
            <FichaFormClasseCard
              key={index}
              fichaId={fichaId}
              classe={c}
              index={index}
              formClasses={formClasses}
              setFormClasses={setFormClasses}
              classeCatalogoOficial={catalogoClasses.find((cat) => cat.nome_classe === c.nome_classe)}
              onAlterarNivelClasse={alterarNivelClasse}
              onRemoverClasse={removerClasse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
