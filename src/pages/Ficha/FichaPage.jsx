import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaIdCard, FaSignInAlt } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import { useCharacterSheet } from '../../hooks/useCharacterSheet';
import { usePlayerSession } from '../../hooks/usePlayerSession';
import { Button, Card } from '../../components/ui';

// Importação das subcomponentes de visualização
import FichaHeader from './secoes/FichaHeader';
import FichaRecursos from './secoes/FichaRecursosSecao';
import FichaAtributos from './secoes/FichaAtributosSecao';
import FichaClassesSecao from './secoes/FichaClassesSecao';
import FichaEquipamentosSecao from './secoes/FichaEquipamentosSecao';
import FichaMagiasSecao from './secoes/FichaMagiasSecao';
import FichaRituaisSecao from './secoes/FichaRituaisSecao';
import FichaLacosSecao from './secoes/FichaLacosSecao';
import FichaMochilaSecao from './secoes/FichaMochilaSecao';
import FichaEstatisticasSecao from './secoes/FichaEstatisticasSecao';
import FichaPericiasSecao from './secoes/FichaPericiaSecao';
import FichaPIComponent from './components/FichaPIComponent';
import FichaProficienciasSecao from './secoes/FichaProficienciasSecao';
import FichaPoderesHeroicosSecao from './secoes/FichaPoderesHeroicosSecao';

// Importação dos subcomponentes de formulário (Edição)
import FichaFormGeral from './forms/FichaFormGeral';
import FichaFormPeculiaridade, { ExibirPeculiaridadeFicha } from './forms/FichaFormPeculiaridades';
import FichaFormAtributos from './forms/FichaFormAtributos';
import FichaFormClasses from './forms/FichaFormClasses';
import FichaFormRituais from './forms/FichaFormRituais';
import FichaFormLacos from './forms/FichaFormLacos';
import FichaFormMochila from './forms/FichaFormMochila';

import styles from './FichaPage.module.css';

export default function FichaPage({ isMestre, setFichaGlobal }) {
    const { id } = useParams();
    const navigate = useNavigate();

    // Hook customizado que gerencia persistência e ciclo de vida em tempo real (Clean Architecture)
    const {
        ficha, setFicha,
        classes,
        magias,
        itensEquipados,
        condicoesAtivas,
        modificadoresTemporarios, setModificadoresTemporarios,
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

    // Estado global que armazena o bônus do Golpe das Sombras para o próximo ataque
    const [opcoesGolpeAtivo, setOpcoesGolpeAtivo] = useState(null);
    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

    // Monitoramento automático de tempo de permanência e inatividade da sessão do jogador
    usePlayerSession({
        isMestre,
        onSessaoExpirada: () => {
            navigate('/ficha/login', { replace: true });
        }
    });

    // Sincronização com estado do Mestre
    useEffect(() => {
        if (ficha && setFichaGlobal) setFichaGlobal(ficha);
    }, [ficha, setFichaGlobal]);

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

        // Validação de pontos de habilidade antes de enviar
        for (const c of formClasses) {
            const somaHabs = (c.habilidades || []).reduce((acc, h) => acc + (parseInt(h.nivel, 10) || 0), 0);
            if (somaHabs > (parseInt(c.nivel, 10) || 0)) {
                setAlerta({
                    isOpen: true,
                    title: 'Atenção',
                    message: `A classe "${c.nome_classe || 'Sem Nome'}" tem habilidades somando nível ${somaHabs}, mas o nível da classe é ${c.nivel}!`
                });
                return;
            }
        }

        try {
            await salvarEdicaoCompleta({ formData, formClasses, formMagias });
            setEditando(false);
            setAlerta({ isOpen: true, title: 'Sucesso', message: 'Ficha atualizada com sucesso!' });
        } catch (err) {
            setAlerta({ isOpen: true, title: 'Erro', message: `Erro ao salvar: ${err.message}` });
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
        </div>
    );
}
