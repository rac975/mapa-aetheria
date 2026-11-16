import { useState } from 'react';
import { FaStore, FaTools, FaCoins, FaUserAlt } from 'react-icons/fa';
import { useLojaSupabase } from './hooks/useLojaSupabase';
import LojaClienteTab from './components/LojaClienteTab';
import LojaMestreTab from './components/LojaMestreTab';
import { Button, Badge } from '../../components/ui';
import styles from './LojaPage.module.css';

export default function LojaPage({ ficha, setFicha, isMestre }) {
    const [abaAtiva, setAbaAtiva] = useState('loja');

    const {
        lojas,
        lojaSelecionadaId,
        handleSelecionarLoja,
        itensDaLoja,
        todosItensCatalogo,
        recarregarDadosGlobais,
        fichaAtiva,
        fichasDisponiveis,
        fichaSelecionadaLocalId,
        setFichaSelecionadaLocalId
    } = useLojaSupabase(ficha, isMestre);

    return (
        <div className={styles.lojaWrapper}>
            {/* Cabeçalho Principal */}
            <header className={styles.lojaHeader}>
                <div className={styles.lojaTituloArea}>
                    <h2 className={styles.lojaTitulo}>
                        <FaStore className={styles.lojaTituloIcon} /> Mercado e Lojas
                    </h2>

                    {isMestre && (
                        <div className={styles.lojaAbasMestre}>
                            <Button
                                variant={abaAtiva === 'loja' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setAbaAtiva('loja')}
                            >
                                Ver Lojas
                            </Button>
                            <Button
                                variant={abaAtiva === 'gerenciar' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setAbaAtiva('gerenciar')}
                            >
                                <FaTools /> Gerenciar Lojas & Catálogo
                            </Button>
                        </div>
                    )}
                </div>

                {/* Área de Carteira e Simulação */}
                <div className={styles.lojaAcoesDireita}>
                    {isMestre && !ficha && fichasDisponiveis.length > 0 && (
                        <div className={styles.simuladorMestre}>
                            <FaUserAlt className={styles.simuladorIcon} size={12} />
                            <select
                                value={fichaSelecionadaLocalId || ''}
                                onChange={e => setFichaSelecionadaLocalId(e.target.value)}
                                className={styles.simuladorSelect}
                                aria-label="Simular ficha de jogador"
                            >
                                {fichasDisponiveis.map(f => (
                                    <option key={f.id} value={f.id} className={styles.simuladorOption}>
                                        Mestre simulando: {f.nome_personagem} ({f.zenit || 0}z)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {fichaAtiva ? (
                        <div className={styles.lojaCarteira}>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {fichaAtiva.zenit || 0} zênites
                                <span className={styles.personagemNome}>
                                    ({fichaAtiva.nome_personagem})
                                </span>
                            </Badge>
                        </div>
                    ) : (
                        <div className={styles.alertaSemFicha}>
                            ⚠️ Nenhuma ficha identificada para este jogador.
                        </div>
                    )}
                </div>
            </header>

            {/* Seletor de Lojas em Carrossel Horizontal (Apenas na Aba de Compras) */}
            {abaAtiva === 'loja' && lojas.length > 0 && (
                <nav className={styles.lojasCarrossel} aria-label="Estabelecimentos disponíveis">
                    {lojas.map(loja => {
                        const isAtivo = lojaSelecionadaId === loja.id;
                        return (
                            <button
                                key={loja.id}
                                type="button"
                                onClick={() => handleSelecionarLoja(loja.id)}
                                className={`${styles.lojaBtnItem} ${isAtivo ? styles.lojaBtnItemAtivo : ''}`}
                            >
                                <span className={styles.lojaBtnNome}>
                                    <FaStore size={12} /> {loja.nome}
                                </span>
                                {loja.cidade && (
                                    <span className={styles.lojaBtnCidade}>📍 {loja.cidade}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            )}

            {/* Conteúdo das Abas */}
            {abaAtiva === 'loja' ? (
                lojas.length > 0 ? (
                    <LojaClienteTab
                        itensCatalogo={itensDaLoja}
                        ficha={fichaAtiva}
                        setFicha={setFicha}
                        lojaAtual={lojas.find(l => l.id === lojaSelecionadaId)}
                    />
                ) : (
                    <div className={styles.lojaVazio}>
                        <p>Nenhuma loja cadastrada no mundo ainda. O Mestre pode criá-las na aba de Gerenciamento!</p>
                    </div>
                )
            ) : (
                <LojaMestreTab
                    itensCatalogo={todosItensCatalogo}
                    lojas={lojas}
                    recarregarDados={recarregarDadosGlobais}
                    ficha={ficha}
                />
            )}
        </div>
    );
}
