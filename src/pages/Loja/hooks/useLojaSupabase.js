import { useState, useEffect, useCallback, useRef } from 'react';
import { lojaService } from '../../../services/lojaService';
import { playerSessionService } from '../../../services/playerSessionService';

export function useLojaSupabase(fichaProp, isMestre) {
    const [lojas, setLojas] = useState([]);
    const [lojaSelecionadaId, setLojaSelecionadaId] = useState(null);
    const [itensDaLoja, setItensDaLoja] = useState([]);
    const [todosItensCatalogo, setTodosItensCatalogo] = useState([]);

    // Estados para simulação de fichas (caso o Mestre esteja testando) ou recuperação de sessão do jogador
    const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
    const [fichaSelecionadaLocalId, setFichaSelecionadaLocalId] = useState(null);

    // Ref para manter o ID da loja atual acessível dentro do Realtime sem recriar o canal
    const lojaSelecionadaRef = useRef(lojaSelecionadaId);
    useEffect(() => {
        lojaSelecionadaRef.current = lojaSelecionadaId;
    }, [lojaSelecionadaId]);

    // Carregar itens da loja selecionada
    const carregarItensDaLoja = useCallback(async (lojaId) => {
        if (!lojaId) {
            setItensDaLoja([]);
            return;
        }

        const itensFormatados = await lojaService.getItensDaLoja(lojaId);
        setItensDaLoja(itensFormatados);
    }, []);

    // Recarregar dados globais do catálogo, lojas e estoque atual
    const recarregarDadosGlobais = useCallback(async () => {
        const [dataLojas, dataCat] = await Promise.all([
            lojaService.getLojas(),
            lojaService.getItensCatalogo()
        ]);

        if (dataLojas) {
            setLojas(dataLojas);
            if (lojaSelecionadaRef.current && !dataLojas.some(l => l.id === lojaSelecionadaRef.current)) {
                const novaLojaId = dataLojas.length > 0 ? dataLojas[0].id : null;
                setLojaSelecionadaId(novaLojaId);
                carregarItensDaLoja(novaLojaId);
            }
        }

        if (dataCat) setTodosItensCatalogo(dataCat);

        if (lojaSelecionadaRef.current) {
            carregarItensDaLoja(lojaSelecionadaRef.current);
        }
    }, [carregarItensDaLoja]);

    // Carregamento inicial
    useEffect(() => {
        let isMounted = true;

        async function carregarTudo() {
            const [dataLojas, dataCat] = await Promise.all([
                lojaService.getLojas(),
                lojaService.getItensCatalogo()
            ]);

            if (!isMounted) return;

            if (dataLojas && dataLojas.length > 0) {
                setLojas(dataLojas);
                const primeiraLojaId = dataLojas[0].id;
                setLojaSelecionadaId(primeiraLojaId);
                carregarItensDaLoja(primeiraLojaId);
            }

            if (dataCat) {
                setTodosItensCatalogo(dataCat);
            }

            if (!fichaProp) {
                const isMestreEfetivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());
                const sessaoJogador = isMestreEfetivo ? null : playerSessionService.obterSessao();

                const dataFichas = await lojaService.getFichasParaLoja({
                    isMestre: isMestreEfetivo,
                    tokenJogador: sessaoJogador?.token || null,
                    fichaIdSessao: sessaoJogador?.fichaId || null
                });

                if (isMounted && dataFichas && dataFichas.length > 0) {
                    setFichasDisponiveis(dataFichas);
                    const idPreferido = isMestreEfetivo
                        ? playerSessionService.obterUltimaFichaMestre()
                        : sessaoJogador?.fichaId;
                    const fichaPreferida = dataFichas.find(f => String(f.id) === String(idPreferido));
                    setFichaSelecionadaLocalId(fichaPreferida ? fichaPreferida.id : dataFichas[0].id);
                } else if (isMounted) {
                    setFichasDisponiveis([]);
                    setFichaSelecionadaLocalId(null);
                }
            }
        }

        carregarTudo();

        return () => {
            isMounted = false;
        };
    }, [carregarItensDaLoja, fichaProp, isMestre]);

    // Sincronização em Tempo Real via lojaService
    useEffect(() => {
        const sub = lojaService.subscribeLojasRealtime({
            onCatalogoOuLojaChange: () => {
                recarregarDadosGlobais();
            },
            onEstoqueLojaChange: () => {
                if (lojaSelecionadaRef.current) {
                    carregarItensDaLoja(lojaSelecionadaRef.current);
                }
            }
        });

        return () => {
            sub.unsubscribe();
        };
    }, [recarregarDadosGlobais, carregarItensDaLoja]);

    const handleSelecionarLoja = (lojaId) => {
        setLojaSelecionadaId(lojaId);
        carregarItensDaLoja(lojaId);
    };

    const fichaAtiva = fichaProp || fichasDisponiveis.find(f => String(f.id) === String(fichaSelecionadaLocalId)) || null;

    return {
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
    };
}
