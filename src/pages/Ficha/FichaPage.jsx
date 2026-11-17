import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaIdCard, FaSignInAlt } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { useCharacterSheet } from '../../hooks/useCharacterSheet';
import { usePlayerSession } from '../../hooks/usePlayerSession';
import { useAlert } from '../../contexts/useAlert';
import { Button, Card } from '../../components/ui';
import FichaHeader from './secoes/FichaHeader';
import FichaViewGrid from './components/FichaViewGrid';
import FichaEditForm from './components/FichaEditForm';
import styles from './FichaPage.module.css';

export default function FichaPage({ isMestre, setFichaGlobal }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const {
    ficha,
    setFicha,
    classes,
    magias,
    itensEquipados,
    condicoesAtivas,
    modificadoresTemporarios,
    setModificadoresTemporarios,
    atributosAtuaisParaCalculo,
    statusFicha,
    emCriseGlobal,
    carregando,
    salvando,
    erro,
    ajustarRecurso,
    atualizarDadosMutante,
    atualizarDadosClasseLocal,
    salvarEdicaoCompleta
  } = useCharacterSheet(id, navigate);

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});
  const [formClasses, setFormClasses] = useState([]);
  const [formMagias, setFormMagias] = useState([]);
  const [opcoesGolpeAtivo, setOpcoesGolpeAtivo] = useState(null);

  usePlayerSession({
    isMestre,
    onSessaoExpirada: () => {
      navigate('/ficha/login', { replace: true });
    }
  });

  useEffect(() => {
    if (ficha && setFichaGlobal) setFichaGlobal(ficha);
  }, [ficha, setFichaGlobal]);

  const handleToggleEdit = () => {
    if (!editando) {
      setFormData(ficha || {});
      setFormClasses(classes || []);
      setFormMagias(magias || []);
    }
    setEditando((prev) => !prev);
  };

<<<<<<< Updated upstream
  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
=======
    // Carrega os dados para os formulários de edição
    useEffect(() => {
        if (ficha && !editando) {
            setFormData(ficha);
            setFormClasses(classes);
            setFormMagias(magias);
        }
    }, [ficha, classes, magias, editando]);

    // Dispara o salvamento da edição através do hook
    const handleSalvarEdicao = async (e) => {
        e.preventDefault();
>>>>>>> Stashed changes

    for (const c of formClasses) {
      const somaHabs = (c.habilidades || []).reduce((acc, h) => acc + (parseInt(h.nivel, 10) || 0), 0);
      if (somaHabs > (parseInt(c.nivel, 10) || 0)) {
        showAlert({
          title: 'Atenção',
          type: 'warning',
          message: `A classe "${c.nome_classe || 'Sem Nome'}" tem habilidades somando nível ${somaHabs}, mas o nível da classe é ${c.nivel}!`
        });
        return;
      }
    }

    try {
      await salvarEdicaoCompleta({ formData, formClasses, formMagias });
      setEditando(false);
      showAlert({ title: 'Sucesso', type: 'success', message: 'Ficha atualizada com sucesso!' });
    } catch (err) {
      showAlert({ title: 'Erro', type: 'error', message: `Erro ao salvar: ${err.message}` });
    }
  };

  if (carregando) {
    return (
<<<<<<< Updated upstream
      <div className={`${styles.pageContainer} ${styles.centerWrapper}`}>
        <div className={styles.loaderBox}>
          <LuSparkles className={styles.spinnerIcon} />
          <p>Lendo dados do herói...</p>
=======
        <div className={styles.pageContainer}>
            <FichaHeader
                ficha={ficha}
                id={id}
                isMestre={isMestre}
                editando={editando}
                nivelAtual={statusFicha.nivelTotal}
                condicoesAtivas={condicoesAtivas}
                statusCalculados={statusFicha}
                setFicha={setFicha}
                handleAjustarRecurso={ajustarRecurso}
                onToggleEdit={() => {
                    if (!editando) {
                        setFormData(ficha);
                        setFormClasses(classes);
                        setFormMagias(magias);
                    }
                    setEditando(!editando);
                }}
            />

            {editando ? (
                <form onSubmit={handleSalvarEdicao} className={styles.formEditContainer}>
                    <FichaFormGeral formData={formData} setFormData={setFormData} />
                    <FichaFormPeculiaridade formData={formData} setFormData={setFormData} />
                    <FichaFormAtributos formData={formData} setFormData={setFormData} />
                    <FichaFormClasses formClasses={formClasses} setFormClasses={setFormClasses} formData={formData} setFormData={setFormData} />
                    <FichaFormRituais formData={formData} setFormData={setFormData} formClasses={formClasses} />
                    <FichaFormLacos formData={formData} setFormData={setFormData} setAlerta={setAlerta} />
                    <FichaFormMochila formData={formData} setFormData={setFormData} />

                    <div className={styles.saveFloatingBar}>
                        <Button type="submit" variant="core" size="lg" disabled={salvando}>
                            <FaSave /> {salvando ? 'Salvando...' : 'Salvar Alterações da Ficha'}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className={styles.viewContent}>
                    <FichaRecursos ficha={ficha} statusFicha={statusFicha} handleAjustarRecurso={ajustarRecurso} />
                    <ExibirPeculiaridadeFicha ficha={ficha} />
                    <FichaPericiasSecao atributos={atributosAtuaisParaCalculo} />
                    <FichaEstatisticasSecao statusFicha={statusFicha} />
                    <FichaPIComponent
                        ficha={ficha}
                        setFicha={setFicha}
                        piMaxCalculado={statusFicha.piMax}
                        statusFicha={statusFicha}
                        classes={classes}
                        onAtualizarDadosClasse={atualizarDadosClasseLocal}
                    />
                    <FichaAtributos
                        ficha={ficha}
                        atributosCalculados={statusFicha.atributosCalculados}
                        travaAmarras={Boolean(statusFicha?.sinergias?.simbolista?.travaAtributosBase)}
                        modificadoresTemporarios={modificadoresTemporarios}
                        setModificadoresTemporarios={setModificadoresTemporarios}
                        onRolarDado={(sigla, valor) => {
                            setAlerta({ isOpen: true, title: `Atributo ${sigla}`, message: `Rolando dado d${valor}...` });
                        }}
                    />
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
                        onAtivarGolpe={(opcoes) => {
                            setOpcoesGolpeAtivo(opcoes);
                            setAlerta({ isOpen: true, title: 'Golpe das Sombras', message: 'Seu próximo ataque usará o Golpe das Sombras!' });
                        }}
                    />
                    <FichaPoderesHeroicosSecao fichaId={id || ficha?.id} ficha={ficha} setFicha={setFicha} classes={classes} />
                    <FichaProficienciasSecao classes={classes} />
                    <FichaEquipamentosSecao
                        fichaId={ficha?.id}
                        classes={classes}
                        atributosAtuais={atributosAtuaisParaCalculo}
                        opcoesGolpeAtivo={opcoesGolpeAtivo}
                        limparGolpeAtivo={() => setOpcoesGolpeAtivo(null)}
                        emCriseGlobal={emCriseGlobal}
                        statusFicha={statusFicha}
                        onAtualizarMutante={atualizarDadosMutante}
                    />
                    <FichaMagiasSecao magias={magias} ficha={ficha} atributos={atributosAtuaisParaCalculo} statusFicha={statusFicha} handleAjustarRecurso={ajustarRecurso} />
                    <FichaRituaisSecao ficha={ficha} classes={classes} atributos={atributosAtuaisParaCalculo} statusFicha={statusFicha} handleAjustarRecurso={ajustarRecurso} />
                    <FichaLacosSecao lacos={ficha?.lacos} />
                    <FichaMochilaSecao mochila={ficha?.mochila} notas={ficha?.notas} />
                </div>
            )}

            <CustomAlert
                isOpen={alerta.isOpen}
                title={alerta.title}
                message={alerta.message}
                onClose={() => setAlerta({ isOpen: false, title: '', message: '' })}
            />
>>>>>>> Stashed changes
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={`${styles.pageContainer} ${styles.centerWrapper}`}>
        <Card variant="default" className={styles.errorCard}>
          <FaIdCard className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>Acesso Não Identificado</h2>
          <p className={styles.errorMsg}>{erro}</p>
          <Button variant="primary" onClick={() => navigate('/ficha/login')}>
            <FaSignInAlt /> Identificar-se no Sistema
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <FichaHeader
        ficha={ficha}
        id={id}
        isMestre={isMestre}
        editando={editando}
        nivelAtual={statusFicha.nivelTotal}
        condicoesAtivas={condicoesAtivas}
        statusCalculados={statusFicha}
        setFicha={setFicha}
        handleAjustarRecurso={ajustarRecurso}
        onToggleEdit={handleToggleEdit}
      />

      {editando ? (
        <FichaEditForm
          formData={formData}
          setFormData={setFormData}
          formClasses={formClasses}
          setFormClasses={setFormClasses}
          salvando={salvando}
          onSubmit={handleSalvarEdicao}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <FichaViewGrid
          id={id}
          ficha={ficha}
          setFicha={setFicha}
          classes={classes}
          magias={magias}
          itensEquipados={itensEquipados}
          atributosAtuaisParaCalculo={atributosAtuaisParaCalculo}
          statusFicha={statusFicha}
          emCriseGlobal={emCriseGlobal}
          modificadoresTemporarios={modificadoresTemporarios}
          setModificadoresTemporarios={setModificadoresTemporarios}
          opcoesGolpeAtivo={opcoesGolpeAtivo}
          limparGolpeAtivo={() => setOpcoesGolpeAtivo(null)}
          ajustarRecurso={ajustarRecurso}
          atualizarDadosMutante={atualizarDadosMutante}
          atualizarDadosClasseLocal={atualizarDadosClasseLocal}
          onRolarDado={(sigla, valor) => {
            showAlert({
              title: `Atributo ${sigla}`,
              type: 'info',
              message: `Rolando dado d${valor}...`
            });
          }}
          onAtivarGolpe={(opcoes) => {
            setOpcoesGolpeAtivo(opcoes);
            showAlert({
              title: 'Golpe das Sombras',
              type: 'info',
              message: 'Seu próximo ataque usará o Golpe das Sombras!'
            });
          }}
        />
      )}
    </div>
  );
}
