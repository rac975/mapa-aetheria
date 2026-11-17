import React, { useState, useEffect } from 'react';
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

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();

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
      <div className={`${styles.pageContainer} ${styles.centerWrapper}`}>
        <div className={styles.loaderBox}>
          <LuSparkles className={styles.spinnerIcon} />
          <p>Lendo dados do herói...</p>
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