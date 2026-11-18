// src/hooks/useFichaData.js
import { useState, useEffect, useCallback } from 'react';
import { fichaService } from '../services/fichaService';
import { playerSessionService } from '../services/playerSessionService';
import { calcularStatusPersonagem } from '../utils/calculosFicha';

export function useFichaData(id, navigate, isMestre = false) {
    const [ficha, setFicha] = useState(null);
    const [classes, setClasses] = useState([]);
    const [magias, setMagias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const carregarDados = useCallback(async () => {
        setCarregando(true);
        setErro('');

        const modoMestreAtivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());

        try {
            let fichaData = null;

            if (modoMestreAtivo) {
                playerSessionService.ativarGodMode();
                const idAlvo = id || playerSessionService.obterUltimaFichaMestre() || (await fichaService.getPrimeiraFichaId());
                if (!idAlvo) {
                    if (navigate) navigate('/mestre/fichas', { replace: true });
                    return;
                }
                fichaData = await fichaService.getFichaByIdOrToken({ id: idAlvo });
                if (!fichaData) {
                    setErro('Ficha não encontrada no painel do Mestre.');
                    return;
                }
                playerSessionService.sincronizarSessaoAtiva(fichaData, { isMestre: true });
            } else {
                const validacao = playerSessionService.validarAcessoRotaFicha({ idRota: id, isMestre: false });
                if (!validacao.permitido) {
                    if (validacao.motivo && validacao.motivo !== 'sem_sessao') {
                        playerSessionService.encerrarSessao({
                            titulo: validacao.titulo,
                            mensagem: validacao.mensagem,
                            motivo: validacao.motivo
                        });
                    } else {
                        playerSessionService.encerrarSessao();
                    }
                    if (navigate) navigate('/ficha/login', { replace: true });
                    return;
                }

                fichaData = await fichaService.getFichaByIdOrToken({
                    id: validacao.fichaIdAlvo,
                    token: validacao.token
                });

                if (!fichaData) {
                    playerSessionService.encerrarSessao({
                        titulo: 'Ficha Não Encontrada',
                        mensagem: 'A ficha associada à sua sessão não foi encontrada. Reconecte seu crachá.',
                        motivo: 'ficha_removida'
                    });
                    if (navigate) navigate('/ficha/login', { replace: true });
                    return;
                }

                const sincronia = playerSessionService.sincronizarSessaoAtiva(fichaData, { isMestre: false });
                if (!sincronia.valida) {
                    playerSessionService.encerrarSessao({
                        titulo: sincronia.titulo,
                        mensagem: sincronia.mensagem,
                        motivo: sincronia.motivo
                    });
                    if (navigate) navigate('/ficha/login', { replace: true });
                    return;
                }
            }

            // Busca classes e itens para calibrar os máximos corretos na entrada
            const [classesData, magiasData, itensData] = await Promise.all([
                fichaService.getClassesByFichaId(fichaData.id),
                fichaService.getMagiasByFichaId(fichaData.id),
                fichaService.getItensByFichaId(fichaData.id)
            ]);

            const classesCarregadas = classesData || [];
            const itensEquipados = (itensData || []).filter(i => i.stats_personalizados?.slot);

            // Atributos atuais para o cálculo inicial
            const atributosParaCalculo = {
                destreza: fichaData.destreza,
                astucia: fichaData.astucia,
                vigor: fichaData.vigor || 8,
                vontade: fichaData.vontade || 8
            };

            // Calcula o teto real baseado nas regras do livro (inclui classes, terioformas, veículo e poderes heróicos)
            const statusCalculados = calcularStatusPersonagem(atributosParaCalculo, classesCarregadas, itensEquipados, fichaData);

            // Enriquece o objeto da ficha com os máximos matematicamente corretos
            const fichaCorrigida = {
                ...fichaData,
                hp_max: statusCalculados.pvMax,
                mp_max: statusCalculados.mpMax,
                pi_max: statusCalculados.piMax
            };

            setFicha(fichaCorrigida);
            setClasses(classesCarregadas);
            setMagias(magiasData || []);

        } catch (err) {
            console.error(err);
            setErro('Erro ao carregar dados do banco.');
        } finally {
            setCarregando(false);
        }
    }, [id, navigate, isMestre]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    return { 
        ficha, setFicha, 
        classes, setClasses, 
        magias, setMagias, 
        carregando, erro, 
        recarregar: carregarDados 
    };
}
