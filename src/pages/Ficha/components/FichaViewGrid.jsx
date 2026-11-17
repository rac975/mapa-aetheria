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
import styles from '../FichaPage.module.css';

export default function FichaViewGrid({
  id,
  ficha,
  setFicha,
  classes,
  magias,
  itensEquipados,
  atributosAtuaisParaCalculo,
  statusFicha,
  emCriseGlobal,
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
  return (
    <div className={styles.viewContent}>
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
        atributosCalculados={statusFicha.atributosCalculados}
        travaAmarras={Boolean(statusFicha?.sinergias?.simbolista?.travaAtributosBase)}
        modificadoresTemporarios={modificadoresTemporarios}
        setModificadoresTemporarios={setModificadoresTemporarios}
        onRolarDado={onRolarDado}
      />

      <div className={styles.gridRowTwoCols}>
        <FichaPIComponent
          ficha={ficha}
          setFicha={setFicha}
          piMaxCalculado={statusFicha.piMax}
          statusFicha={statusFicha}
          classes={classes}
          onAtualizarDadosClasse={atualizarDadosClasseLocal}
        />
        <div className={styles.stackCol}>
          <FichaPericiasSecao atributos={atributosAtuaisParaCalculo} />
          <ExibirPeculiaridadeFicha ficha={ficha} />
        </div>
      </div>

      <FichaClassesSecao
        fichaId={id || ficha?.id}
        ficha={ficha}
        classes={classes}
        itensEquipados={itensEquipados}
        handleAjustarRecurso={ajustarRecurso}
        pvMaxCalculado={statusFicha.pvMax}
        temArmaduraMarcial={statusFicha.temArmaduraMarcial}
        reducaoCustoPi={statusFicha.reducaoCustoPi}
        nivelTotal={statusFicha.nivelTotal}
        onAtualizarMutante={atualizarDadosMutante}
        onAtualizarDadosClasse={atualizarDadosClasseLocal}
        onAtivarGolpe={onAtivarGolpe}
      />

      <div className={styles.gridRowTwoCols}>
        <FichaPoderesHeroicosSecao
          fichaId={id || ficha?.id}
          ficha={ficha}
          setFicha={setFicha}
          classes={classes}
        />
        <FichaProficienciasSecao classes={classes} />
      </div>

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

      <FichaMagiasSecao
        magias={magias}
        ficha={ficha}
        atributos={atributosAtuaisParaCalculo}
        statusFicha={statusFicha}
        handleAjustarRecurso={ajustarRecurso}
      />

      <FichaRituaisSecao
        ficha={ficha}
        classes={classes}
        atributos={atributosAtuaisParaCalculo}
        statusFicha={statusFicha}
        handleAjustarRecurso={ajustarRecurso}
      />

      <div className={styles.gridRowTwoCols}>
        <FichaLacosSecao lacos={ficha?.lacos} />
        <FichaMochilaSecao mochila={ficha?.mochila} notas={ficha?.notas} />
      </div>
    </div>
  );
}
