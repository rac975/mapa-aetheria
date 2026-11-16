import { useState, useMemo, useEffect } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { FaBookOpen, FaCheck, FaTimes } from 'react-icons/fa';
import { Card, Input, Button, Badge, Modal } from '../../../components/ui';
import { fichaService } from '../../../services/fichaService';
import {
  FONTES_MANUAIS,
  REGRAS_OFICIAIS_RESUMO,
  buscarPeculiaridadeNoCatalogo,
  extrairHeroicAndQuirksDaFicha
} from '../../../domain/fabula/heroicAndQuirksRules';
import styles from './FichaFormPeculiaridades.module.css';

const ABAS_PECULIARIDADES = [
  { key: 'todas', label: 'Todos os Atlas' },
  { key: 'alta_fantasia', label: FONTES_MANUAIS.ALTA_FANTASIA },
  { key: 'tecno_fantasia', label: FONTES_MANUAIS.TECNO_FANTASIA }
];

/**
 * Exibição da Peculiaridade na visualização da ficha (com suporte a @media print).
 */
export function ExibirPeculiaridadeFicha({ ficha }) {
  const [catalogo, setCatalogo] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoPeculiaridades()
      .then((dados) => {
        if (!cancelado && dados) setCatalogo(dados);
      })
      .catch((err) => console.error('Erro ao carregar catálogo de peculiaridades:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const { titulo_pecularidade, descricao_pecularidade, peculiaridade } = useMemo(
    () => extrairHeroicAndQuirksDaFicha(ficha || {}),
    [ficha]
  );

  const itemCatalogo = useMemo(
    () => buscarPeculiaridadeNoCatalogo(peculiaridade?.key || titulo_pecularidade, catalogo),
    [peculiaridade?.key, titulo_pecularidade, catalogo]
  );

  if (!titulo_pecularidade && !descricao_pecularidade) return null;

  const fonteExibicao = peculiaridade?.fonte || itemCatalogo?.fonte || 'Personalizada';

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>
          <LuSparkles className={styles.titleIcon} /> Peculiaridade (Regra Suplementar)
        </h3>
        <Badge variant="gold" size="sm">{fonteExibicao}</Badge>
      </div>

      <div className={styles.viewCardBody}>
        <div className={styles.quirkHeaderLine}>
          <div>
            <span className={styles.quirkName}>{titulo_pecularidade || 'Peculiaridade'}</span>
            {itemCatalogo?.nome_original && (
              <span className={styles.quirkOriginal}>({itemCatalogo.nome_original})</span>
            )}
          </div>
          {itemCatalogo && <Badge variant="ether" size="sm">Oficial • {itemCatalogo.fonte}</Badge>}
        </div>

        {itemCatalogo?.resumo && <p className={styles.quirkResumo}>{itemCatalogo.resumo}</p>}

        {(descricao_pecularidade || itemCatalogo?.descricao) && (
          <p className={styles.quirkDescricao}>{descricao_pecularidade || itemCatalogo?.descricao}</p>
        )}
      </div>
    </Card>
  );
}

/**
 * Formulário aprimorado de Peculiaridades (Quirks) permitindo selecionar do catálogo do Supabase
 * (Alta Fantasia / Tecno-Fantasia) ou editar título e descrição personalizados.
 */
export default function FichaFormPeculiaridade({ formData = {}, setFormData }) {
  const [abaCategoria, setAbaCategoria] = useState('todas');
  const [modalCatalogoAberto, setModalCatalogoAberto] = useState(false);
  const [catalogo, setCatalogo] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fichaService
      .getCatalogoPeculiaridades()
      .then((dados) => {
        if (!cancelado && dados) setCatalogo(dados);
      })
      .catch((err) => console.error('Erro ao carregar catálogo de peculiaridades:', err));

    return () => {
      cancelado = true;
    };
  }, []);

  const tituloAtual = formData.titulo_pecularidade || '';
  const descricaoAtual = formData.descricao_pecularidade || '';

  const peculiaridadeOficialAtual = useMemo(
    () => buscarPeculiaridadeNoCatalogo(formData.peculiaridade?.key || tituloAtual, catalogo),
    [formData.peculiaridade?.key, tituloAtual, catalogo]
  );

  const catalogoFiltrado = useMemo(() => {
    if (abaCategoria === 'todas') return catalogo;
    return catalogo.filter((q) => q.categoria === abaCategoria);
  }, [abaCategoria, catalogo]);

  const altaFantasiaList = useMemo(
    () => catalogo.filter((q) => q.categoria === 'alta_fantasia'),
    [catalogo]
  );
  const tecnoFantasiaList = useMemo(
    () => catalogo.filter((q) => q.categoria === 'tecno_fantasia'),
    [catalogo]
  );

  const aplicarPeculiaridadeDoCatalogo = (quirk) => {
    if (!quirk) return;
    setFormData({
      ...formData,
      titulo_pecularidade: quirk.nome,
      descricao_pecularidade: quirk.descricao,
      peculiaridade: { key: quirk.key, nome: quirk.nome, descricao: quirk.descricao, fonte: quirk.fonte }
    });
  };

  const handleSelectChange = (e) => {
    const item = catalogo.find((q) => q.key === e.target.value);
    if (item) aplicarPeculiaridadeDoCatalogo(item);
  };

  const handleTituloPersonalizado = (novoTitulo) => {
    const matchCatalogo = buscarPeculiaridadeNoCatalogo(novoTitulo, catalogo);
    setFormData({
      ...formData,
      titulo_pecularidade: novoTitulo,
      peculiaridade: {
        key: matchCatalogo?.key || null,
        nome: novoTitulo,
        descricao: descricaoAtual,
        fonte: matchCatalogo?.fonte || 'Personalizada'
      }
    });
  };

  const handleDescricaoPersonalizada = (novaDescricao) => {
    setFormData({
      ...formData,
      descricao_pecularidade: novaDescricao,
      peculiaridade: {
        key: peculiaridadeOficialAtual?.key || null,
        nome: tituloAtual,
        descricao: novaDescricao,
        fonte: peculiaridadeOficialAtual?.fonte || 'Personalizada'
      }
    });
  };

  const limparPeculiaridade = () => {
    setFormData({
      ...formData,
      titulo_pecularidade: '',
      descricao_pecularidade: '',
      peculiaridade: null
    });
  };

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>
          <LuSparkles className={styles.titleIcon} /> Peculiaridade (Regra Suplementar)
        </h3>
        <div className={`${styles.headerActions} ${styles.noPrint}`}>
          <Badge variant={peculiaridadeOficialAtual ? 'core' : 'gold'} size="sm">
            {peculiaridadeOficialAtual ? peculiaridadeOficialAtual.fonte : 'Personalizada / Livre'}
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => setModalCatalogoAberto(true)}>
            <FaBookOpen /> Explorar Catálogo Oficial
          </Button>
          {(tituloAtual || descricaoAtual) && (
            <Button variant="ghost" size="sm" onClick={limparPeculiaridade} title="Limpar Peculiaridade">
              <FaTimes /> Limpar
            </Button>
          )}
        </div>
      </div>

      <div className={styles.ruleNote}>{REGRAS_OFICIAIS_RESUMO.peculiaridades.regraOpcional}</div>

      <div className={styles.catalogSelectorBox}>
        <label className={styles.label}>Escolher Peculiaridade Oficial (Alta Fantasia / Tecno-Fantasia)</label>
        <select
          value={peculiaridadeOficialAtual?.key || ''}
          onChange={handleSelectChange}
          className={styles.selectCatalogo}
        >
          <option value="">-- Personalizada ou selecione uma Peculiaridade oficial --</option>
          <optgroup label={FONTES_MANUAIS.ALTA_FANTASIA}>
            {altaFantasiaList.map((q) => (
              <option key={q.key} value={q.key}>{q.nome} — {q.resumo}</option>
            ))}
          </optgroup>
          <optgroup label={FONTES_MANUAIS.TECNO_FANTASIA}>
            {tecnoFantasiaList.map((q) => (
              <option key={q.key} value={q.key}>{q.nome} — {q.resumo}</option>
            ))}
          </optgroup>
        </select>
      </div>

      <Input
        label="Nome / Título da Peculiaridade (Oficial ou Personalizado)"
        type="text"
        placeholder="Ex: Linhagem Celestial, Corpo Cibernético, Alma de Aço..."
        value={tituloAtual}
        onChange={(e) => handleTituloPersonalizado(e.target.value)}
      />

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Descrição e Efeitos Mecânicos</label>
        <textarea
          rows="4"
          placeholder="Descreva os efeitos narrativos e mecânicos desta peculiaridade..."
          value={descricaoAtual}
          onChange={(e) => handleDescricaoPersonalizada(e.target.value)}
          className={styles.textarea}
        />
      </div>

      <Modal
        isOpen={modalCatalogoAberto}
        onClose={() => setModalCatalogoAberto(false)}
        title="Catálogo Oficial de Peculiaridades (Quirks)"
        size="lg"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" size="sm" onClick={() => setModalCatalogoAberto(false)}>Fechar</Button>
          </div>
        }
      >
        <div className={styles.container}>
          <div className={styles.filterTabs}>
            {ABAS_PECULIARIDADES.map((aba) => (
              <button
                key={aba.key}
                type="button"
                onClick={() => setAbaCategoria(aba.key)}
                className={`${styles.tabBtn} ${abaCategoria === aba.key ? styles.tabBtnActive : ''}`}
              >
                {aba.label}
              </button>
            ))}
          </div>

          <div className={styles.modalGrid}>
            {catalogoFiltrado.map((q) => {
              const isSelected = peculiaridadeOficialAtual?.key === q.key;
              return (
                <div
                  key={q.key}
                  onClick={() => {
                    aplicarPeculiaridadeDoCatalogo(q);
                    setModalCatalogoAberto(false);
                  }}
                  className={`${styles.quirkCatalogCard} ${isSelected ? styles.quirkCatalogCardSelected : ''}`}
                >
                  <div className={styles.quirkHeaderLine}>
                    <span className={styles.quirkName}>{q.nome}</span>
                    <Badge variant={isSelected ? 'core' : 'gold'} size="sm">
                      {isSelected ? <><FaCheck /> Selecionada</> : q.fonte}
                    </Badge>
                  </div>
                  <p className={styles.quirkResumo}>{q.resumo}</p>
                  <p className={styles.quirkDescricao}>{q.descricao}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </Card>
  );
}
