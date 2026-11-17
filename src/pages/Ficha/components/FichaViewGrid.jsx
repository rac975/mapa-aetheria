import React, { useState } from 'react';
import { FaShieldAlt, FaBookOpen, FaMagic, FaBoxOpen, FaHeart } from 'react-icons/fa';
import FichaRecursos from '../secoes/FichaRecursosSecao';
import FichaAtributos from '../secoes/FichaAtributosSecao';
import FichaClassesSecao from '../secoes/FichaClassesSecao';
import FichaEquipamentosSecao from '../secoes/FichaEquipamentosSecao';
import FichaMagiasSecao from '../secoes/FichaMagiasSecao';
import FichaRituaisSecao from '../secoes/FichaRituaisSecao';
import FichaLacosSecao from '../secoes/FichaLacosSecao';
import FichaMochilaSecao from '../secoes/FichaMochilaSecao';
import FichaEstatisticasSecao from '../secoes/FichaEstatisticasSecao';
import FichaPericiasSecao from '../secoes/FichaPericiaSecao';
import FichaPIComponent from './FichaPIComponent';
import FichaProficienciasSecao from '../secoes/FichaProficienciasSecao';
import FichaPoderesHeroicosSecao from '../secoes/FichaPoderesHeroicosSecao';
import { ExibirPeculiaridadeFicha } from '../forms/FichaFormPeculiaridades';
import FichaTabsNav from './FichaTabsNav';
import FichaDrawer from './FichaDrawer';
import styles from '../FichaPage.module.css';

export default function FichaViewGrid({
  id,
  ficha,
  setFicha,
  classes = [],
  magias = [],
  itensEquipados = [],
  atributosAtuaisParaCalculo = {},
  statusFicha = {},
  emCriseGlobal = false,
  modificadoresTemporarios,
  setModificadoresTemporarios,
  opcoesGolpeAtivo,
  limparGolpeAtivo,
  ajustarRecurso,
  atualizarDadosMutante,
  atualizarDadosClasseLocal,
  onRolarDado,
  onAtivarGolpe
}) {
  const [activeTab, setActiveTab] = useState('combate');

  const qtdEquipados = (itensEquipados || []).filter((i) => i.stats_personalizados?.slot).length;
  const qtdClasses = (classes || []).length;
  const qtdMagias = (magias || []).length;
  const qtdLacos = (ficha?.lacos || []).length;

  const tabsConfig = [
    {
      id: 'combate',
      label: 'Combate & Equipamentos',
      icone: <FaShieldAlt />,
      badge: `${qtdEquipados} eq.`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'classes',
      label: 'Classes & Habilidades',
      icone: <FaBookOpen />,
      badge: `${qtdClasses} classes`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'magias',
      label: 'Grimório & Rituais',
      icone: <FaMagic />,
      badge: `${qtdMagias} feitiços`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'inventario',
      label: 'Inventário & Perícias',
      icone: <FaBoxOpen />,
      badge: `${statusFicha?.piMax || 6} PI Max`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    },
    {
      id: 'diario',
      label: 'Laços & Diário',
      icone: <FaHeart />,
      badge: `${qtdLacos} laços`,
      badgeVariant: 'default',
      badgeVariantActive: 'gold'
    }
  ];

  return (
    <div className={styles.viewContent}>
      {/* 1. HUD OPERACIONAL FIXO: Recursos, Estatísticas Calculadas e Atributos Básicos */}
      <div className={styles.gridRowTwoCols}>
        <FichaRecursos
          ficha={ficha}
          statusFicha={statusFicha}
          handleAjustarRecurso={ajustarRecurso}
        />
        <FichaEstatisticasSecao statusFicha={statusFicha} />
      </div>

      <FichaAtributos
        ficha={ficha}
        atributosCalculados={statusFicha?.atributosCalculados}
        travaAmarras={Boolean(statusFicha?.sinergias?.simbolista?.travaAtributosBase)}
        modificadoresTemporarios={modificadoresTemporarios}
        setModificadoresTemporarios={setModificadoresTemporarios}
        onRolarDado={onRolarDado}
      />

      {/* 2. BARRA DE NAVEGAÇÃO POR ABAS TÁTICAS */}
      <FichaTabsNav
        tabs={tabsConfig}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 3. CONTEÚDO DAS SEÇÕES ORGANIZADAS POR ABAS E GAVETAS (COM SUPORTE A IMPRESSÃO FÍSICA) */}
      <div className={styles.tabContentArea}>
        {/* ABA: COMBATE & EQUIPAMENTOS */}
        <section
          className={`${styles.tabPane} ${activeTab === 'combate' ? styles.tabPaneActive : styles.tabPaneHidden} ${styles.printVisible}`}
        >
          <FichaEquipamentosSecao
            fichaId={ficha?.id}
            classes={classes}
            atributosAtuais={atributosAtuaisParaCalculo}
            opcoesGolpeAtivo={opcoesGolpeAtivo}
            limparGolpeAtivo={limparGolpeAtivo}
            emCriseGlobal={emCriseGlobal}
            statusFicha={statusFicha}
            onAtualizarMutante={atualizarDadosMutante}
          />

          <FichaDrawer
            titulo="Proficiências Marciais da Classe"
            icone={<FaShieldAlt />}
            badge="Regra Oficial"
            badgeVariant="gold"
            isOpenDefault={false}
          >
            <FichaProficienciasSecao classes={classes} />
          </FichaDrawer>
        </section>

        {/* ABA: CLASSES & HABILIDADES */}
        <section
          className={`${styles.tabPane} ${activeTab === 'classes' ? styles.tabPaneActive : styles.tabPaneHidden} ${styles.printVisible}`}
        >
          <FichaClassesSecao
            fichaId={id || ficha?.id}
            ficha={ficha}
            classes={classes}
            itensEquipados={itensEquipados}
            handleAjustarRecurso={ajustarRecurso}
            pvMaxCalculado={statusFicha?.pvMax}
            temArmaduraMarcial={statusFicha?.temArmaduraMarcial}
            reducaoCustoPi={statusFicha?.reducaoCustoPi}
            nivelTotal={statusFicha?.nivelTotal}
            onAtualizarMutante={atualizarDadosMutante}
            onAtualizarDadosClasse={atualizarDadosClasseLocal}
            onAtivarGolpe={onAtivarGolpe}
          />

          <FichaDrawer
            titulo="Poderes Heróicos & Talentos Especiais"
            icone={<FaBookOpen />}
            badge={`${(statusFicha?.poderesHeroicosAtivos || []).length} ativos`}
            badgeVariant="gold"
            isOpenDefault={true}
          >
            <FichaPoderesHeroicosSecao
              fichaId={id || ficha?.id}
              ficha={ficha}
              setFicha={setFicha}
              classes={classes}
            />
            <ExibirPeculiaridadeFicha ficha={ficha} />
          </FichaDrawer>
        </section>

        {/* ABA: MAGIAS & RITUAIS */}
        <section
          className={`${styles.tabPane} ${activeTab === 'magias' ? styles.tabPaneActive : styles.tabPaneHidden} ${styles.printVisible}`}
        >
          <FichaMagiasSecao
            magias={magias}
            ficha={ficha}
            atributos={atributosAtuaisParaCalculo}
            statusFicha={statusFicha}
            handleAjustarRecurso={ajustarRecurso}
          />

          <FichaDrawer
            titulo="Rituais Arcanos & Disciplinas"
            icone={<FaMagic />}
            badge="Cálculo PM"
            badgeVariant="gold"
            isOpenDefault={true}
          >
            <FichaRituaisSecao
              ficha={ficha}
              classes={classes}
              atributos={atributosAtuaisParaCalculo}
              statusFicha={statusFicha}
              handleAjustarRecurso={ajustarRecurso}
            />
          </FichaDrawer>
        </section>

        {/* ABA: INVENTÁRIO & PERÍCIAS */}
        <section
          className={`${styles.tabPane} ${activeTab === 'inventario' ? styles.tabPaneActive : styles.tabPaneHidden} ${styles.printVisible}`}
        >
          <div className={styles.gridRowTwoCols}>
            <FichaPIComponent
              ficha={ficha}
              setFicha={setFicha}
              piMaxCalculado={statusFicha?.piMax}
              statusFicha={statusFicha}
              classes={classes}
              onAtualizarDadosClasse={atualizarDadosClasseLocal}
            />
            <FichaDrawer
              titulo="Perícias Táticas & Testes Combinados"
              icone={<FaBoxOpen />}
              badge="Regra Oficial"
              badgeVariant="gold"
              isOpenDefault={true}
            >
              <FichaPericiasSecao atributos={atributosAtuaisParaCalculo} />
            </FichaDrawer>
          </div>
        </section>

        {/* ABA: LAÇOS & DIÁRIO */}
        <section
          className={`${styles.tabPane} ${activeTab === 'diario' ? styles.tabPaneActive : styles.tabPaneHidden} ${styles.printVisible}`}
        >
          <div className={styles.gridRowTwoCols}>
            <FichaLacosSecao lacos={ficha?.lacos} />
            <FichaMochilaSecao mochila={ficha?.mochila} notas={ficha?.notas} />
          </div>
        </section>
      </div>
    </div>
  );
}
