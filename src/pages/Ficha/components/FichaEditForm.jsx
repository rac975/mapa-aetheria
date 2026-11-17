import React, { useState } from 'react';
import { FaSave, FaTimes, FaIdCard, FaDiceD20, FaBookOpen, FaHeart } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { Button } from '../../../components/ui';
import FichaFormGeral from '../forms/FichaFormGeral';
import FichaFormPeculiaridade from '../forms/FichaFormPeculiaridades';
import FichaFormAtributos from '../forms/FichaFormAtributos';
import FichaFormClasses from '../forms/FichaFormClasses';
import FichaFormRituais from '../forms/FichaFormRituais';
import FichaFormLacos from '../forms/FichaFormLacos';
import FichaFormMochila from '../forms/FichaFormMochila';
import FichaTabsNav from './FichaTabsNav';
import FichaDrawer from './FichaDrawer';
import styles from '../FichaPage.module.css';

export default function FichaEditForm({
  formData,
  setFormData,
  formClasses,
  setFormClasses,
  salvando,
  onSubmit,
  onCancelar
}) {
  const [activeTab, setActiveTab] = useState('geral');

  const tabsEdicao = [
    {
      id: 'geral',
      label: 'Identidade & Origem',
      icone: <FaIdCard />,
      badge: formData.nome || 'Herói',
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'atributos',
      label: 'Atributos & Rituais',
      icone: <FaDiceD20 />,
      badge: 'Dados',
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'classes',
      label: 'Classes & Habilidades',
      icone: <FaBookOpen />,
      badge: `${(formClasses || []).length} classes`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'diario',
      label: 'Laços & Diário',
      icone: <FaHeart />,
      badge: `${(formData.lacos || []).length} laços`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    }
  ];

  return (
    <form onSubmit={onSubmit} className={styles.formEditContainer}>
      {/* 1. BARRA DE ABAS DE EDIÇÃO */}
      <FichaTabsNav
        tabs={tabsEdicao}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 2. ÁREA DE CONTEÚDO MODULAR POR ABAS */}
      <div className={styles.tabContentArea}>
        {/* ABA 1: IDENTIDADE & GERAL */}
        {activeTab === 'geral' && (
          <div className={styles.tabPaneActive}>
            <FichaFormGeral formData={formData} setFormData={setFormData} />
            <FichaDrawer
              titulo="Peculiaridade de Origem / Cenário"
              icone={<LuSparkles />}
              badge="Opcional"
              badgeVariant="gold"
              isOpenDefault={Boolean(formData?.peculiaridade?.nome || formData?.peculiaridade?.efeito)}
            >
              <FichaFormPeculiaridade formData={formData} setFormData={setFormData} />
            </FichaDrawer>
          </div>
        )}

        {/* ABA 2: ATRIBUTOS & RITUAIS */}
        {activeTab === 'atributos' && (
          <div className={styles.tabPaneActive}>
            <div className={styles.gridRowTwoCols}>
              <FichaFormAtributos formData={formData} setFormData={setFormData} />
              <FichaDrawer
                titulo="Disciplinas de Rituais"
                icone={<FaDiceD20 />}
                badge="Grimório"
                badgeVariant="gold"
                isOpenDefault={true}
              >
                <FichaFormRituais
                  formData={formData}
                  setFormData={setFormData}
                  formClasses={formClasses}
                />
              </FichaDrawer>
            </div>
          </div>
        )}

        {/* ABA 3: CLASSES & HABILIDADES */}
        {activeTab === 'classes' && (
          <div className={styles.tabPaneActive}>
            <FichaFormClasses
              formClasses={formClasses}
              setFormClasses={setFormClasses}
              formData={formData}
              setFormData={setFormData}
            />
          </div>
        )}

        {/* ABA 4: LAÇOS & DIÁRIO */}
        {activeTab === 'diario' && (
          <div className={styles.tabPaneActive}>
            <div className={styles.gridRowTwoCols}>
              <FichaFormLacos formData={formData} setFormData={setFormData} />
              <FichaFormMochila formData={formData} setFormData={setFormData} />
            </div>
          </div>
        )}
      </div>

      {/* 3. BARRA FLUTUANTE DE AÇÕES FIXAS */}
      <div className={styles.saveFloatingBar}>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onCancelar}
          disabled={salvando}
        >
          <FaTimes /> Cancelar
        </Button>
        <Button
          type="submit"
          variant="core"
          size="md"
          disabled={salvando}
        >
          <FaSave /> {salvando ? 'Salvando...' : 'Salvar Alterações da Ficha'}
        </Button>
      </div>
    </form>
  );
}
