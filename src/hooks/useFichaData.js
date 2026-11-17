// src/hooks/useFichaData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { calcularStatusPersonagem } from '../utils/calculosFicha';

export function useFichaData(id, navigate) {
    const [ficha, setFicha] = useState(null);
    const [classes, setClasses] = useState([]);
    const [magias, setMagias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const carregarDados = useCallback(async () => {
        setCarregando(true);
        setErro('');

        try {
            const tokenAtual = localStorage.getItem('aetheria_jogador_token');
            let query = supabase.from('fichas_personagens').select('*');

            if (id) {
                query = query.eq('id', id).single();
            } else if (tokenAtual) {
                query = query.eq('jogador_token', tokenAtual).single();
            } else {
                navigate('/ficha/login', { replace: true });
                return;
            }

            const { data: fichaData, error: fichaError } = await query;

            if (fichaError || !fichaData) {
                setErro('Ficha não encontrada ou ID inválido.');
                return;
            }

            if (fichaData.jogador_token) {
                localStorage.setItem('aetheria_jogador_token', fichaData.jogador_token);
            }
            localStorage.setItem('aetheria_ultima_ficha_id', fichaData.id);

            // Busca classes e itens para calibrar os máximos corretos na entrada
            const [{ data: classesData }, { data: magiasData }, { data: itensData }] = await Promise.all([
                supabase.from('fichas_classes').select('*').eq('ficha_id', fichaData.id),
                supabase.from('fichas_magias').select('*').eq('ficha_id', fichaData.id),
                supabase.from('itens_personagem').select('*').eq('ficha_id', fichaData.id)
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
    }, [id, navigate]);

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