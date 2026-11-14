// src/hooks/useFichaData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

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

            setFicha(fichaData);

            const [{ data: classesData }, { data: magiasData }] = await Promise.all([
                supabase.from('fichas_classes').select('*').eq('ficha_id', fichaData.id),
                supabase.from('fichas_magias').select('*').eq('ficha_id', fichaData.id)
            ]);

            setClasses(classesData || []);
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

    // EXpondo também setClasses e setMagias aqui:
    return { 
        ficha, setFicha, 
        classes, setClasses, 
        magias, setMagias, 
        carregando, erro, 
        recarregar: carregarDados 
    };
}