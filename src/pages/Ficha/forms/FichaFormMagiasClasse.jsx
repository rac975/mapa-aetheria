import { useState, useEffect } from 'react';
import { FaTrash, FaMagic } from 'react-icons/fa';
import { fichaService } from '../../../services/fichaService';
import { Badge } from '../../../components/ui';
import { useAlert } from '../../../contexts/useAlert';
import styles from './FichaFormMagiasClasse.module.css';

export default function FichaFormMagiasClasse({ classeObjeto, indexClasse, formClasses, setFormClasses }) {
    const { showAlert } = useAlert();
    const [catalogoMagias, setCatalogoMagias] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const nomeClasse = classeObjeto?.nome_classe || '';

    // 1. Carrega do banco o catálogo de feitiços desta classe específica via Service Layer
    useEffect(() => {
        let active = true;
        async function carregarCatalogoMagias() {
            setCarregando(true);
            try {
                const { data, error } = await fichaService.getCatalogoFeiticosPorClasse(nomeClasse);
                if (!active) return;
                if (!error && data) {
                    setCatalogoMagias(data);
                } else {
                    console.error("Erro ao carregar catálogo de feitiços:", error);
                }
            } catch (err) {
                console.error("Erro ao carregar feitiços:", err);
            } finally {
                if (active) setCarregando(false);
            }
        }

        if (nomeClasse) {
            carregarCatalogoMagias();
        }
        return () => { active = false; };
    }, [nomeClasse]);

    // 2. Descobre o nível da habilidade de magia da classe (Ex: "Magia Elemental", "Magia Espiritual", etc.)
    const habMagia = (classeObjeto?.habilidades || []).find(h => {
        const nomeH = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return nomeH.includes('magia elemental') || 
               nomeH.includes('magia espiritual') || 
               nomeH.includes('magia entropica') || 
               nomeH.includes('magia arcanista');
    });

    const nivelHabilidadeMagia = parseInt(habMagia?.nivel, 10) || 0;
    
    // Regra oficial: 1 magia por nível da habilidade de magia
    const limiteMagias = nivelHabilidadeMagia; 
    const magiasAtuais = classeObjeto?.magias || [];

    const adicionarMagiaDoCatalogo = (e) => {
        const idMagiaSelecionada = e.target.value;
        if (!idMagiaSelecionada) return;

        if (magiasAtuais.length >= limiteMagias) {
            showAlert(`⛔ Limite atingido! Sua habilidade de magia está no nível ${nivelHabilidadeMagia}, permitindo no máximo ${limiteMagias} ${limiteMagias === 1 ? 'magia' : 'magias'}. Aumente o nível da habilidade para aprender mais.`);
            e.target.value = "";
            return;
        }

        const magiaOficial = catalogoMagias.find(m => String(m.id) === String(idMagiaSelecionada));
        if (!magiaOficial) return;

        // Evita duplicar a mesma magia na mesma classe
        const jaPossui = magiasAtuais.some(m => m.catalogo_feitico_id === magiaOficial.id || m.nome === magiaOficial.nome);
        if (jaPossui) {
            showAlert(`⚠️ Esta magia já foi aprendida.`);
            e.target.value = "";
            return;
        }

        const atual = [...formClasses];
        if (!atual[indexClasse].magias) atual[indexClasse].magias = [];

        atual[indexClasse].magias.push({
            catalogo_feitico_id: magiaOficial.id,
            nome: magiaOficial.nome,
            custo_mp: magiaOficial.pm_custo,
            descricao: magiaOficial.descricao,
            customizacoes: {}
        });

        setFormClasses(atual);
        e.target.value = "";
    };

    const removerMagia = (mIndex) => {
        const atual = [...formClasses];
        atual[indexClasse].magias.splice(mIndex, 1);
        setFormClasses(atual);
    };

    if (nivelHabilidadeMagia === 0) {
        return (
            <div className={styles.avisoSemHabilidade}>
                💡 Distribua pontos na habilidade de magia da classe (ex: <i>Magia Elemental</i>) para desbloquear o grimório e aprender feitiços (1 magia por nível).
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <span className={styles.grimorioTitle}>
                    <FaMagic /> Grimório ({magiasAtuais.length} / {limiteMagias} Magias Conhecidas)
                </span>

                <select
                    onChange={adicionarMagiaDoCatalogo}
                    defaultValue=""
                    className={styles.selectMagia}
                    disabled={carregando || magiasAtuais.length >= limiteMagias}
                >
                    <option value="" disabled>+ Aprender Magia do Catálogo</option>
                    {catalogoMagias.map((catMagia) => {
                        const jaAdicionada = magiasAtuais.some(m => m.catalogo_feitico_id === catMagia.id || m.nome === catMagia.nome);
                        return (
                            <option key={catMagia.id} value={catMagia.id} disabled={jaAdicionada}>
                                {catMagia.nome} (MP: {catMagia.pm_custo}) {jaAdicionada ? ' ✓' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>

            {magiasAtuais.length === 0 ? (
                <div className={styles.emptyMagias}>
                    Nenhuma magia aprendida ainda. Selecione acima para adicionar do catálogo.
                </div>
            ) : (
                magiasAtuais.map((m, mIndex) => (
                    <div key={mIndex} className={styles.magiaItem}>
                        <div className={styles.magiaInfo}>
                            <div className={styles.magiaHeaderLine}>
                                <strong className={styles.magiaNome}>{m.nome}</strong>
                                <Badge variant="ether" size="sm">MP: {m.custo_mp}</Badge>
                            </div>
                            <span className={styles.magiaDescricao}>{m.descricao}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => removerMagia(mIndex)}
                            className={styles.btnRemover}
                            title="Esquecer Magia"
                        >
                            <FaTrash size={12} />
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
