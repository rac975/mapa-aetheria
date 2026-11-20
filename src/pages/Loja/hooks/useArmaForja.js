import { useState, useEffect } from 'react';
import {
    ARMAS_BASE_COMUNS,
    mesclarCaracteristicasCatalogo,
    resolverCaracteristicaParametrizada
} from '../../../domain/fabula/equipmentRules';
import {
    podeAdicionarPersonalizacao,
    calcularVagasOcupadas,
    construirStatsArmaPersonalizada
} from '../../../domain/fabula/weaponForge';
import { lojaService } from '../../../services/lojaService';

export function useArmaForja(onSalvarItem, showAlert) {
    const [subMetodo, setSubMetodo] = useState('padrao_raro');

    // --- ESTADOS: ARMA RARA (LIVRO BÁSICO) ---
    const [itensBaseComuns, setItensBaseComuns] = useState([]);
    const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
    const [tipoDano, setTipoDano] = useState('Físico');
    const [modMao, setModMao] = useState('normal');
    const [bonusPrecisaoArma, setBonusPrecisaoArma] = useState(false);
    const [bonusDanoExtraArma, setBonusDanoExtraArma] = useState(false);
    const [atributoUnico, setAtributoUnico] = useState(false);
    const [atributoEscolhido, setAtributoEscolhido] = useState('Destreza');
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [paramsCaracteristica, setParamsCaracteristica] = useState({
        especie1: 'Fera',
        especie2: 'Monstro',
        tipoDano1: 'Fogo',
        tipoDano2: 'Gelo'
    });

    // --- ESTADOS: ARMA PERSONALIZADA (ATLAS) ---
    const [raridadePers, setRaridadePers] = useState('padrao');
    const [categoriaPers, setCategoriaPers] = useState('espada');
    const [alcancePers, setAlcancePers] = useState('Corpo a corpo');
    const [precisaoPers, setPrecisaoPers] = useState('(DES + AST)');
    const [personalizacoesAtlas, setPersonalizacoesAtlas] = useState([]);
    const [temMutavel, setTemMutavel] = useState(false);
    const [nomeSegundaForma, setNomeSegundaForma] = useState('');
    const [categoriaSegundaForma, setCategoriaSegundaForma] = useState('lança');
    const [alcanceSegundaForma, setAlcanceSegundaForma] = useState('Corpo a corpo');
    const [precisaoSegundaForma, setPrecisaoSegundaForma] = useState('(DES + VIG)');

    const [nomeItem, setNomeItem] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        async function carregarDadosForja() {
            try {
                if (subMetodo === 'padrao_raro') {
                    const dadosBanco = await lojaService.getBasesArmas();
                    const nomesExistentes = new Set((dadosBanco || []).map(b => (b.nome || '').trim().toLowerCase()));
                    const basesNaoCadastradas = ARMAS_BASE_COMUNS.filter(
                        a => !nomesExistentes.has(a.nome.trim().toLowerCase())
                    );
                    const listaCompleta = [...(dadosBanco || []), ...basesNaoCadastradas];
                    setItensBaseComuns(listaCompleta);
                    if (listaCompleta.length > 0) setItemBaseSelecionado(listaCompleta[0]);

                    const doBanco = await lojaService.getCaracteristicasArmas();
                    setCaracteristicasDisponiveis(
                        mesclarCaracteristicasCatalogo(doBanco, { incluirAtingirVoador: true })
                    );
                }
            } catch (err) {
                console.error('Erro ao carregar dados da forja de armas:', err);
            }

            setCaracteristicaSelecionada(null);
            setModMao('normal');
            setBonusPrecisaoArma(false);
            setBonusDanoExtraArma(false);
            setAtributoUnico(false);
        }
        carregarDadosForja();
    }, [subMetodo]);

    const copiarPrimeiraForma = () => {
        setCategoriaSegundaForma(categoriaPers);
        setAlcanceSegundaForma(alcancePers);
        setPrecisaoSegundaForma(precisaoPers);
    };

    // Análise da base rara
    const statsBase = itemBaseSelecionado?.stats || itemBaseSelecionado?.stats_personalizados || {};
    const baseEhDuasMaos = statsBase.maos === 2 || statsBase.duas_maos === true || String(statsBase.maos || '').toLowerCase().includes('duas');
    const nomeBaseLower = (itemBaseSelecionado?.nome || '').toLowerCase();
    const categoriaProibida = nomeBaseLower.includes('adaga') || nomeBaseLower.includes('arremessável') || nomeBaseLower.includes('luta');

    const custoBaseItem = itemBaseSelecionado?.custo || itemBaseSelecionado?.preco || 100;
    let modDanoFinal = 0;
    if (modMao === '1_para_2') modDanoFinal += 4;
    if (modMao === '2_para_1') modDanoFinal -= 4;
    if (bonusDanoExtraArma) modDanoFinal += 4;

    const extrairNumeroDano = (val) => {
        if (!val) return 6;
        if (typeof val === 'number') return val;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : 6;
    };
    const danoBaseOriginal = extrairNumeroDano(statsBase.dano || 6);
    const bonusDanoFinalNumerico = danoBaseOriginal + modDanoFinal;
    const ehMarcialRaro = bonusDanoFinalNumerico >= 10 || statsBase.marcial === true;
    const precoTotalRaro = custoBaseItem + (tipoDano !== 'Físico' ? 100 : 0) + (bonusPrecisaoArma ? 100 : 0) + (bonusDanoExtraArma ? 200 : 0) + (atributoUnico ? 50 : 0) + (caracteristicaSelecionada?.custo || 0);

    const caracResolvida = resolverCaracteristicaParametrizada(caracteristicaSelecionada, paramsCaracteristica);

    // Cálculos do Atlas
    const vagasOcupadasAtlas = calcularVagasOcupadas(personalizacoesAtlas);
    const statsAtlas = construirStatsArmaPersonalizada({
        categoria: categoriaPers,
        alcance: alcancePers,
        precisaoTipo: precisaoPers,
        personalizacoes: personalizacoesAtlas,
        temMutavel,
        segundaForma: {
            nome: nomeSegundaForma,
            categoria: categoriaSegundaForma,
            alcance: alcanceSegundaForma,
            precisaoTipo: precisaoSegundaForma
        },
        raridade: raridadePers === 'rara' ? 'personalizada_rara' : 'personalizada'
    });
    const precoAtlasFinal = statsAtlas.custo + (raridadePers === 'rara' ? 200 : 0);

    const togglePersAtlas = (item) => {
        if (personalizacoesAtlas.some(p => p.id === item.id)) {
            setPersonalizacoesAtlas(personalizacoesAtlas.filter(p => p.id !== item.id));
            if (item.id === 'mutavel') setTemMutavel(false);
        } else {
            if (!podeAdicionarPersonalizacao(personalizacoesAtlas, item)) {
                showAlert('Limite de 3 vagas de personalizações atingido!');
                return;
            }
            setPersonalizacoesAtlas([...personalizacoesAtlas, item]);
            if (item.id === 'mutavel') setTemMutavel(true);
        }
    };

    const ehDuasMaosFinal = baseEhDuasMaos ? (modMao !== '2_para_1') : (modMao === '1_para_2');
    const strMaosFinal = subMetodo === 'padrao_raro' ? (ehDuasMaosFinal ? 'Duas mãos' : 'Uma mão') : 'Duas mãos';

    let stringPrecisao = statsBase.precisao || '(DES + AST)';
    if (atributoUnico) {
        const sigla = atributoEscolhido.substring(0, 3).toUpperCase();
        stringPrecisao = `(${sigla} + ${sigla})`;
    }
    const precisaoFinalFormatada = bonusPrecisaoArma ? `${stringPrecisao} + 1` : stringPrecisao;

    const precoFinal = subMetodo === 'padrao_raro' ? precoTotalRaro : precoAtlasFinal;
    const danoFinalStr = subMetodo === 'padrao_raro' ? `RA + ${bonusDanoFinalNumerico}` : statsAtlas.dano;
    const ehMarcialFinal = subMetodo === 'padrao_raro' ? ehMarcialRaro : statsAtlas.marcial;

    const salvarArma = async () => {
        if (!nomeItem.trim()) return showAlert('Dê um nome para a arma!');
        if (subMetodo === 'padrao_raro' && !itemBaseSelecionado) return showAlert('Selecione um item base!');
        if (subMetodo === 'padrao_raro' && !caracResolvida.valido) return showAlert(caracResolvida.erroValidacao);
        if (subMetodo === 'personalizada_atlas' && temMutavel && !nomeSegundaForma.trim()) {
            return showAlert('Informe o nome da 2ª forma da arma mutável!');
        }

        setSalvando(true);
        try {
            const efeitosAplicados = caracResolvida.efeitoFormatado ? [caracResolvida.efeitoFormatado] : [];
            const atingeVoadores = Boolean(
                caracteristicaSelecionada?.atinge_voadores ||
                caracteristicaSelecionada?.id === 'atingir_voador' ||
                personalizacoesAtlas.some(p => p.id === 'atingir_voador' || p.atinge_voadores)
            );

            const stats = subMetodo === 'padrao_raro' ? {
                dano: danoFinalStr,
                maos: strMaosFinal,
                duas_maos: ehDuasMaosFinal,
                slot: ehDuasMaosFinal ? 'duas_maos' : 'mao_dominante',
                alcance: statsBase.alcance || 'Corpo a corpo',
                marcial: ehMarcialFinal,
                precisao: precisaoFinalFormatada,
                raridade: 'raro',
                categoria: statsBase.categoria || itemBaseSelecionado?.tipo || 'Arma',
                tipo_dano: tipoDano.toLowerCase(),
                custo: precoFinal,
                efeitos: efeitosAplicados,
                atinge_voadores: atingeVoadores,
                ...(caracResolvida.bonusDefesa !== 0 ? { defesa: caracResolvida.bonusDefesa } : {}),
                ...(caracResolvida.bonusDefMagica !== 0 ? { defesa_magica: caracResolvida.bonusDefMagica } : {}),
                ...(caracResolvida.bonusIniciativa !== 0 ? { iniciativa: caracResolvida.bonusIniciativa } : {}),
                ...(caracResolvida.especiesAlvo.length > 0 ? { especies_cacadora: caracResolvida.especiesAlvo } : {}),
                ...(caracResolvida.resistencias.length > 0 ? { resistencias: caracResolvida.resistencias.map(r => r.toLowerCase()) } : {}),
                ...(caracResolvida.caracteristicaMeta ? { caracteristica_especial: caracResolvida.caracteristicaMeta } : {})
            } : {
                ...statsAtlas,
                custo: precoFinal
            };

            const nomeFormatado = subMetodo === 'padrao_raro' ? `${nomeItem} (${tipoDano})` : nomeItem;
            await onSalvarItem({ nome: nomeFormatado, tipo: 'arma', custo: precoFinal, stats });
            setNomeItem('');
        } finally {
            setSalvando(false);
        }
    };

    return {
        subMetodo, setSubMetodo, itensBaseComuns, itemBaseSelecionado, setItemBaseSelecionado,
        tipoDano, setTipoDano, modMao, setModMao, bonusPrecisaoArma, setBonusPrecisaoArma,
        bonusDanoExtraArma, setBonusDanoExtraArma, atributoUnico, setAtributoUnico,
        atributoEscolhido, setAtributoEscolhido, caracteristicasDisponiveis,
        caracteristicaSelecionada, setCaracteristicaSelecionada,
        paramsCaracteristica, setParamsCaracteristica, caracResolvida, categoriaProibida,
        raridadePers, setRaridadePers, categoriaPers, setCategoriaPers,
        alcancePers, setAlcancePers, precisaoPers, setPrecisaoPers,
        personalizacoesAtlas, togglePersAtlas, vagasOcupadasAtlas, temMutavel,
        nomeSegundaForma, setNomeSegundaForma,
        categoriaSegundaForma, setCategoriaSegundaForma,
        alcanceSegundaForma, setAlcanceSegundaForma,
        precisaoSegundaForma, setPrecisaoSegundaForma,
        copiarPrimeiraForma, nomeItem, setNomeItem, salvando, salvarArma,
        statsBase, strMaosFinal, precoFinal, danoFinalStr, ehMarcialFinal,
        precisaoFinalFormatada, statsAtlas
    };
}
