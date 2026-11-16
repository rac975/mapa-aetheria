-- =============================================================================
-- Migration: Corrigir Habilidades Oficiais da Classe Piloto (PT-BR)
-- Suplemento: Fabula Ultima - Atlas Tecno-Fantasia
-- Tabela: catalogo_classes
-- =============================================================================

UPDATE catalogo_classes
SET 
    descricao = 'Especialistas em combate mecanizado e condução de alta tecnologia, mestres em pilotar e sincronizar com andadores mecha, exoesqueletos cibernéticos e corcéis mecânicos armados.',
    beneficios_iniciais = '{"texto": "Aumente permanentemente seus Pontos de Vida (PV) máximos em 5. Você ganha proficiência com armas marciais corpo a corpo e armas marciais à distância."}'::jsonb,
    habilidades_padrao = '[
        {
            "nome": "Compressão Tecnológica",
            "nivel_maximo": 1,
            "descricao": "Seu veículo pessoal pode ser comprimido em um dispositivo compacto portátil quando estiver desocupado. Ao realizar uma ação de Inventário e gastar 2 Pontos de Inventário (PI), você invoca ou recolhe o veículo instantaneamente."
        },
        {
            "nome": "Configuração Flexível",
            "nivel_maximo": 4,
            "descricao": "Ao realizar a ação Guarda ou Equipamento enquanto pilota seu veículo pessoal durante um conflito, você pode desativar até [NP] módulos ativos e simultaneamente ativar até [NP] módulos inativos da sua reserva."
        },
        {
            "nome": "Coração no Motor",
            "nivel_maximo": 3,
            "descricao": "No início do seu turno durante um conflito, se estiver pilotando seu veículo pessoal, você pode gastar 10 PM para escolher uma opção: o próximo ataque que você realizar neste turno causa +[NP × 2] de dano; o próximo dano que você sofrer antes do início do seu próximo turno é reduzido em [NP × 2]; ou você cura imediatamente as condições Lento e/ou Fraco."
        },
        {
            "nome": "Pulso Firme",
            "nivel_maximo": 1,
            "descricao": "Ao realizar um Teste de Precisão utilizando um módulo de arma acoplado ao seu veículo pessoal, você pode substituir um dos dados de atributo por Vigor (VIG)."
        },
        {
            "nome": "Veículo Pessoal",
            "nivel_maximo": 5,
            "descricao": "Você adquire um Veículo Pessoal operacional e escolhe sua Estrutura (Exoesqueleto, Mecha ou Corcel). No NP 1, você escolhe 3 módulos de veículo para instalar. Cada nível adicional nesta habilidade concede +2 módulos adicionais à sua escolha (totalizando 3 + (NP - 1) × 2 módulos no total). Você pode embarcar e pilotar seu veículo em viagens e combates."
        }
    ]'::jsonb
WHERE LOWER(nome_classe) = 'piloto';

-- Caso o registro de Piloto não exista no banco, realiza o INSERT canônico
INSERT INTO catalogo_classes (nome_classe, descricao, beneficios_iniciais, habilidades_padrao)
SELECT 
    'Piloto',
    'Especialistas em combate mecanizado e condução de alta tecnologia, mestres em pilotar e sincronizar com andadores mecha, exoesqueletos cibernéticos e corcéis mecânicos armados.',
    '{"texto": "Aumente permanentemente seus Pontos de Vida (PV) máximos em 5. Você ganha proficiência com armas marciais corpo a corpo e armas marciais à distância."}'::jsonb,
    '[
        {
            "nome": "Compressão Tecnológica",
            "nivel_maximo": 1,
            "descricao": "Seu veículo pessoal pode ser comprimido em um dispositivo compacto portátil quando estiver desocupado. Ao realizar uma ação de Inventário e gastar 2 Pontos de Inventário (PI), você invoca ou recolhe o veículo instantaneamente."
        },
        {
            "nome": "Configuração Flexível",
            "nivel_maximo": 4,
            "descricao": "Ao realizar a ação Guarda ou Equipamento enquanto pilota seu veículo pessoal durante um conflito, você pode desativar até [NP] módulos ativos e simultaneamente ativar até [NP] módulos inativos da sua reserva."
        },
        {
            "nome": "Coração no Motor",
            "nivel_maximo": 3,
            "descricao": "No início do seu turno durante um conflito, se estiver pilotando seu veículo pessoal, você pode gastar 10 PM para escolher uma opção: o próximo ataque que você realizar neste turno causa +[NP × 2] de dano; o próximo dano que você sofrer antes do início do seu próximo turno é reduzido em [NP × 2]; ou você cura imediatamente as condições Lento e/ou Fraco."
        },
        {
            "nome": "Pulso Firme",
            "nivel_maximo": 1,
            "descricao": "Ao realizar um Teste de Precisão utilizando um módulo de arma acoplado ao seu veículo pessoal, você pode substituir um dos dados de atributo por Vigor (VIG)."
        },
        {
            "nome": "Veículo Pessoal",
            "nivel_maximo": 5,
            "descricao": "Você adquire um Veículo Pessoal operacional e escolhe sua Estrutura (Exoesqueleto, Mecha ou Corcel). No NP 1, você escolhe 3 módulos de veículo para instalar. Cada nível adicional nesta habilidade concede +2 módulos adicionais à sua escolha (totalizando 3 + (NP - 1) × 2 módulos no total). Você pode embarcar e pilotar seu veículo em viagens e combates."
        }
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM catalogo_classes WHERE LOWER(nome_classe) = 'piloto'
);
