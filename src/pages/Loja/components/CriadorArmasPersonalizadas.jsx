import { useState } from 'react';
import { FaHammer, FaCoins } from 'react-icons/fa';
import {
    podeAdicionarPersonalizacao,
    calcularVagasOcupadas,
    construirStatsArmaPersonalizada
} from '../../../domain/fabula/weaponForge';
import { lojaService } from '../../../services/lojaService';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Badge, Card, Input } from '../../../components/ui';
import ArmaAtlasSecao from './armas/ArmaAtlasSecao';
import ArmaPreviewCard from './armas/ArmaPreviewCard';
import styles from './CriadorArmas.module.css';

export default function CriadorArmasPersonalizadas({ ficha, onCriado }) {
    const { showAlert } = useAlert();
    const [nomeItem, setNomeItem] = useState('');
    const [categoria, setCategoria] = useState('espada');
    const [alcance, setAlcance] = useState('Corpo a corpo');
    const [precisaoTipo, setPrecisaoTipo] = useState('(DES + AST)');
    const [raridadePers, setRaridadePers] = useState('padrao');
    const [personalizacoes, setPersonalizacoes] = useState([]);
    const [temMutavel, setTemMutavel] = useState(false);
    const [nomeSegundaForma, setNomeSegundaForma] = useState('');
    const [categoriaSegundaForma, setCategoriaSegundaForma] = useState('lança');
    const [alcanceSegundaForma, setAlcanceSegundaForma] = useState('Corpo a corpo');
    const [precisaoSegundaForma, setPrecisaoSegundaForma] = useState('(DES + VIG)');
    const [salvando, setSalvando] = useState(false);

    const copiarPrimeiraForma = () => {
        setCategoriaSegundaForma(categoria);
        setAlcanceSegundaForma(alcance);
        setPrecisaoSegundaForma(precisaoTipo);
    };

    const togglePersonalizacao = (item) => {
        if (personalizacoes.some(p => p.id === item.id)) {
            setPersonalizacoes(personalizacoes.filter(p => p.id !== item.id));
            if (item.id === 'mutavel') setTemMutavel(false);
        } else {
            if (!podeAdicionarPersonalizacao(personalizacoes, item)) {
                showAlert('Você só pode escolher o equivalente a 3 vagas de personalizações!');
                return;
            }
            setPersonalizacoes([...personalizacoes, item]);
            if (item.id === 'mutavel') setTemMutavel(true);
        }
    };

    const vagasOcupadas = calcularVagasOcupadas(personalizacoes);
    const statsAtlas = construirStatsArmaPersonalizada({
        categoria,
        alcance,
        precisaoTipo,
        personalizacoes,
        temMutavel,
        segundaForma: {
            nome: nomeSegundaForma,
            categoria: categoriaSegundaForma,
            alcance: alcanceSegundaForma,
            precisaoTipo: precisaoSegundaForma
        },
        raridade: raridadePers === 'rara' ? 'personalizada_rara' : 'personalizada'
    });
    const precoFinal = statsAtlas.custo + (raridadePers === 'rara' ? 200 : 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return showAlert('Dê um nome para a arma personalizada!');
        if (temMutavel && !nomeSegundaForma.trim()) {
            return showAlert('Informe o nome da 2ª forma da arma mutável!');
        }

        setSalvando(true);
        try {
            const stats = {
                ...statsAtlas,
                custo: precoFinal
            };

            let erroBanco = null;
            if (ficha && ficha.id) {
                const res = await lojaService.adicionarItemPersonagem({
                    fichaId: ficha.id,
                    nomeItem,
                    tipo: 'arma',
                    statsPersonalizados: stats
                });
                erroBanco = res.error;
            } else {
                const res = await lojaService.cadastrarItemCatalogo({
                    nome: nomeItem,
                    tipo: 'arma',
                    custo: precoFinal,
                    descricao: stats.efeitos?.join('; ') || 'Arma personalizada do Atlas.',
                    stats
                });
                erroBanco = res.error;
            }

            if (erroBanco) {
                showAlert('Erro ao salvar arma: ' + erroBanco.message);
            } else {
                showAlert('✨ Arma personalizada forjada com sucesso!');
                setNomeItem('');
                setPersonalizacoes([]);
                setTemMutavel(false);
                setNomeSegundaForma('');
                if (onCriado) onCriado();
            }
        } finally {
            setSalvando(false);
        }
    };

    const nomeExibicao = nomeItem || 'Arma Personalizada';

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.forjaCard}>
                <form onSubmit={handleSubmit} className={styles.formGrid}>
                    <Input
                        label="Nome da Arma Personalizada"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Espada Quebra-Dragões"
                        required
                    />

                    <ArmaAtlasSecao
                        raridadePers={raridadePers}
                        setRaridadePers={setRaridadePers}
                        categoriaPers={categoria}
                        setCategoriaPers={setCategoria}
                        alcancePers={alcance}
                        setAlcancePers={setAlcance}
                        precisaoPers={precisaoTipo}
                        setPrecisaoPers={setPrecisaoTipo}
                        personalizacoesAtlas={personalizacoes}
                        togglePersAtlas={togglePersonalizacao}
                        vagasOcupadasAtlas={vagasOcupadas}
                        temMutavel={temMutavel}
                        nomeSegundaForma={nomeSegundaForma}
                        setNomeSegundaForma={setNomeSegundaForma}
                        categoriaSegundaForma={categoriaSegundaForma}
                        setCategoriaSegundaForma={setCategoriaSegundaForma}
                        alcanceSegundaForma={alcanceSegundaForma}
                        setAlcanceSegundaForma={setAlcanceSegundaForma}
                        precisaoSegundaForma={precisaoSegundaForma}
                        setPrecisaoSegundaForma={setPrecisaoSegundaForma}
                        onCopiarPrimeiraForma={copiarPrimeiraForma}
                    />

                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Dano: <span className={styles.resumoDanoValor}>{statsAtlas.dano}</span> [{statsAtlas.tipo_dano.toUpperCase()}] | Precisão: <span className={styles.resumoDanoValor}>{statsAtlas.precisao}</span>
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {precoFinal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            <Button type="submit" variant="primary" size="md" disabled={salvando}>
                                <FaHammer /> {salvando ? 'Forjando...' : 'Forjar Arma Personalizada'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            <ArmaPreviewCard
                nomeExibicao={nomeExibicao}
                subtitulo={`${categoria.toUpperCase()} • ${alcance.toUpperCase()} • DUAS MÃOS`}
                precoTotal={precoFinal}
                raridadeTag={raridadePers === 'rara' ? 'Raro (Atlas)' : 'Personalizada'}
                ehMarcial={statsAtlas.marcial}
                atingeVoadores={statsAtlas.atinge_voadores}
                contaComoEscudo={Boolean(statsAtlas.escudo)}
                bonusDefesa={statsAtlas.defesa || 0}
                bonusDefMagica={statsAtlas.defesa_magica || 0}
                segundaForma={temMutavel ? statsAtlas.segunda_forma : null}
                precisaoTexto={statsAtlas.precisao}
                danoTexto={statsAtlas.dano}
                tipoDano={statsAtlas.tipo_dano}
                efeitos={statsAtlas.efeitos}
            />
        </div>
    );
}
