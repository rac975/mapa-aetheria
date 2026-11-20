-- =============================================================================
-- MIGRATION: Adição de Escudos Base Comuns (Livro Básico de Fabula Ultima)
-- Tabela afetada: itens_catalogo
-- =============================================================================

INSERT INTO public.itens_catalogo (nome, tipo, custo, descricao, stats)
VALUES
(
    'Escudo de Bronze',
    'escudo',
    100,
    'Um escudo resistente forjado em bronze para bloquear ataques comuns.',
    '{
        "raridade": "comum",
        "slot": "mao_secundaria",
        "categoria": "Escudo",
        "escudo": true,
        "defesa": 2,
        "defesa_magica": 0,
        "iniciativa": 0,
        "marcial": false
    }'::jsonb
),
(
    'Escudo Pesado',
    'escudo',
    150,
    'Um escudo maciço reforçado. Exige proficiência marcial e reduz a agilidade.',
    '{
        "raridade": "comum",
        "slot": "mao_secundaria",
        "categoria": "Escudo",
        "escudo": true,
        "defesa": 2,
        "defesa_magica": 0,
        "iniciativa": -2,
        "marcial": true
    }'::jsonb
),
(
    'Escudo Rúnico',
    'escudo',
    150,
    'Um escudo gravado com runas protetoras que repelem tanto lâminas quanto feitiços.',
    '{
        "raridade": "comum",
        "slot": "mao_secundaria",
        "categoria": "Escudo",
        "escudo": true,
        "defesa": 1,
        "defesa_magica": 1,
        "iniciativa": 0,
        "marcial": false
    }'::jsonb
)
ON CONFLICT (nome) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    custo = EXCLUDED.custo,
    descricao = EXCLUDED.descricao,
    stats = EXCLUDED.stats;
