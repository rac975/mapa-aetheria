-- =============================================================================
-- Migration: Catálogo Oficial de Itens Raros e Módulos de Veículo (Piloto)
-- Suplementos Oficiais: Fabula Ultima - Alta Fantasia, Fantasia Bucólica e Atlas Tecno-Fantasia
-- Tabelas: catalogo_veiculos_estruturas, catalogo_veiculos_modulos, itens_catalogo
-- =============================================================================

-- =============================================================================
-- PARTE 1: ESTRUTURAS DE VEÍCULO (PILOTO) - catalogo_veiculos_estruturas
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.catalogo_veiculos_estruturas (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    tamanho TEXT NOT NULL,
    passageiros TEXT NOT NULL,
    defesa_base INTEGER NOT NULL DEFAULT 10,
    mdef_base INTEGER NOT NULL DEFAULT 10,
    bonus_defesa INTEGER NOT NULL DEFAULT 0,
    bonus_mdef INTEGER NOT NULL DEFAULT 0,
    modificador_iniciativa INTEGER NOT NULL DEFAULT 0,
    capacidade_modulos_base INTEGER NOT NULL DEFAULT 3,
    max_armas_ativas INTEGER NOT NULL DEFAULT 2,
    multiplicador_viagem INTEGER NOT NULL DEFAULT 1,
    descricao TEXT NOT NULL,
    regra_especial TEXT NOT NULL,
    fonte TEXT DEFAULT 'Atlas Tecno-Fantasia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.catalogo_veiculos_estruturas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalogo_veiculos_estruturas'
      AND policyname = 'Leitura publica catalogo_veiculos_estruturas'
  ) THEN
    CREATE POLICY "Leitura publica catalogo_veiculos_estruturas"
      ON public.catalogo_veiculos_estruturas
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

INSERT INTO public.catalogo_veiculos_estruturas (
    key, nome, tamanho, passageiros, defesa_base, mdef_base, bonus_defesa, bonus_mdef,
    modificador_iniciativa, capacidade_modulos_base, max_armas_ativas, multiplicador_viagem,
    descricao, regra_especial, fonte
)
VALUES
(
    'exoesqueleto',
    'Exoesqueleto (Exoskeleton)',
    'Pequeno',
    'Nenhum',
    10,
    10,
    0,
    0,
    0,
    3,
    2,
    1,
    'Armaduras energizadas e membros mecânicos vestidos diretamente sobre o piloto.',
    'Pode ter até 2 módulos de arma, 1 módulo de armadura e qualquer número de módulos de suporte ativos. Compressão Tecnológica custa 0 PI.',
    'Atlas Tecno-Fantasia'
),
(
    'mecha',
    'Mecha de Combate (Mecha Frame)',
    'Grande',
    'Nenhum',
    11,
    8,
    1,
    0,
    -2,
    4,
    2,
    2,
    'Grandes robôs de combate bípedes ou quadrúpedes blindados pilotados por dentro.',
    'Pode ter até 2 módulos de arma, 1 módulo de armadura e qualquer número de módulos de suporte ativos. Distância de viagem ×2.',
    'Atlas Tecno-Fantasia'
),
(
    'corcel',
    'Montaria / Corcel Mecânico (Steed Frame)',
    'Médio',
    'Até um',
    9,
    10,
    0,
    0,
    4,
    3,
    1,
    2,
    'Animais mecânicos de montaria, aeromotos, caças pequenos, skates voadores e similares.',
    'Pode ter até 1 módulo de arma, 1 módulo de armadura e qualquer número de módulos de suporte ativos. Coração no Motor custa 0 PM.',
    'Atlas Tecno-Fantasia'
)
ON CONFLICT (key) DO UPDATE SET
    nome = EXCLUDED.nome,
    tamanho = EXCLUDED.tamanho,
    passageiros = EXCLUDED.passageiros,
    defesa_base = EXCLUDED.defesa_base,
    mdef_base = EXCLUDED.mdef_base,
    bonus_defesa = EXCLUDED.bonus_defesa,
    bonus_mdef = EXCLUDED.bonus_mdef,
    modificador_iniciativa = EXCLUDED.modificador_iniciativa,
    capacidade_modulos_base = EXCLUDED.capacidade_modulos_base,
    max_armas_ativas = EXCLUDED.max_armas_ativas,
    multiplicador_viagem = EXCLUDED.multiplicador_viagem,
    descricao = EXCLUDED.descricao,
    regra_especial = EXCLUDED.regra_especial,
    fonte = EXCLUDED.fonte;

-- =============================================================================
-- PARTE 2: MÓDULOS DE VEÍCULO (PILOTO) - catalogo_veiculos_modulos
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.catalogo_veiculos_modulos (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'arma', 'armadura', 'escudo', 'suporte'
    categoria TEXT,
    alcance TEXT, -- 'corpo_a_corpo' ou 'distancia'
    atributos_precisao TEXT[],
    precisao_bonus INTEGER DEFAULT 0,
    dano_formula TEXT,
    dano_bonus INTEGER DEFAULT 0,
    tipo_dano TEXT DEFAULT 'fisico',
    bonus_defesa INTEGER DEFAULT 0,
    bonus_mdef INTEGER DEFAULT 0,
    bonus_iniciativa INTEGER DEFAULT 0,
    slot_cost INTEGER DEFAULT 1,
    def_fixa INTEGER,
    mdef_fixa INTEGER,
    custo INTEGER DEFAULT 100,
    propriedades TEXT,
    restricoes TEXT,
    descricao TEXT NOT NULL,
    fonte TEXT DEFAULT 'Atlas Tecno-Fantasia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.catalogo_veiculos_modulos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalogo_veiculos_modulos'
      AND policyname = 'Leitura publica catalogo_veiculos_modulos'
  ) THEN
    CREATE POLICY "Leitura publica catalogo_veiculos_modulos"
      ON public.catalogo_veiculos_modulos
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

INSERT INTO public.catalogo_veiculos_modulos (
    id, key, nome, tipo, categoria, alcance, atributos_precisao, precisao_bonus,
    dano_formula, dano_bonus, tipo_dano, bonus_defesa, bonus_mdef, bonus_iniciativa,
    slot_cost, def_fixa, mdef_fixa, custo, propriedades, restricoes, descricao, fonte
)
VALUES
-- Módulos Básicos de Suporte e Proteção
(
    'blindagem_padrao',
    'blindagem_padrao',
    'Blindagem Padrão',
    'armadura',
    'Armadura',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    1,
    1,
    0,
    1,
    NULL,
    NULL,
    100,
    NULL,
    'Apenas 1 módulo de armadura ativo por vez.',
    'Placas protetoras reforçadas instaladas na estrutura do veículo. Concede +1 na Defesa e +1 na Defesa Mágica.',
    'Atlas Tecno-Fantasia'
),
(
    'blindagem_pesada',
    'blindagem_pesada',
    'Blindagem Pesada',
    'armadura',
    'Armadura',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    0,
    0,
    -2,
    2,
    12,
    8,
    300,
    NULL,
    'Apenas 1 módulo de armadura ativo por vez. Ocupa 2 slots.',
    'Blindagem reforçada maciça: fixa a Defesa em 12 e a Defesa Mágica em 8, com penalidade de -2 na Iniciativa.',
    'Atlas Tecno-Fantasia'
),
(
    'blindagem_flexivel',
    'blindagem_flexivel',
    'Blindagem Flexível',
    'armadura',
    'Armadura',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    200,
    NULL,
    'Apenas 1 módulo de armadura ativo por vez.',
    'Estrutura leve e maleável: trata a Defesa como dado de DES + 2 e a Defesa Mágica como dado de AST + 1.',
    'Atlas Tecno-Fantasia'
),
(
    'modulo_escudo_padrao',
    'modulo_escudo_padrao',
    'Módulo de Escudo',
    'escudo',
    'Escudo',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    2,
    0,
    0,
    1,
    NULL,
    NULL,
    150,
    NULL,
    NULL,
    'Escudo integrado retrátil acoplado ao chassi do veículo pessoal. Concede +2 na Defesa.',
    'Atlas Tecno-Fantasia'
),
(
    'suporte_mira_avancada',
    'suporte_mira_avancada',
    'Mira Avançada',
    'suporte',
    'Suporte',
    NULL,
    NULL,
    1,
    NULL,
    0,
    NULL,
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    200,
    NULL,
    'Não pode ter módulos de suporte idênticos ativos.',
    'Sensores ópticos e telêmetros acoplados aumentam em +1 todos os testes de Precisão com armas veiculares.',
    'Atlas Tecno-Fantasia'
),
(
    'suporte_turbo',
    'suporte_turbo',
    'Turbo Propulsor',
    'suporte',
    'Suporte',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    0,
    0,
    4,
    1,
    NULL,
    NULL,
    200,
    NULL,
    'Não pode ter módulos de suporte idênticos ativos.',
    'Propulsores auxiliares que concedem +4 no modificador de Iniciativa do veículo.',
    'Atlas Tecno-Fantasia'
),
(
    'suporte_contragolpe',
    'suporte_contragolpe',
    'Módulo de Contragolpe',
    'suporte',
    'Suporte',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    250,
    NULL,
    'Não pode ter módulos de suporte idênticos ativos.',
    'Sistemas defensivos que reagem a ataques à distância sofridos pelo veículo pessoal.',
    'Atlas Tecno-Fantasia'
),

-- Módulos Raros de Veículo (Suplemento Piloto / Atlas Tecno-Fantasia - Anexo 1)
(
    'defletor_reativo',
    'defletor_reativo',
    'Defletor Reativo',
    'escudo',
    'Escudo',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    2,
    0,
    0,
    1,
    NULL,
    NULL,
    1500,
    'Tem todos os efeitos de um módulo de Escudo.',
    NULL,
    'Enquanto estiver pilotando seu veículo pessoal e tiver um módulo de suporte de Contragolpe ativo (p. 168), você pode aplicar seus efeitos mesmo quando um dos personagens a bordo do seu veículo pessoal for atingido por um ataque corpo a corpo (em vez de apenas à distância). ✦ Este módulo tem todos os efeitos de um módulo de Escudo (p. 167).',
    'Atlas Tecno-Fantasia'
),
(
    'mercurialis',
    'mercurialis',
    'Mercurialis',
    'arma',
    'Arcano',
    'corpo_a_corpo',
    ARRAY['des', 'von'],
    0,
    '【RA + 12】',
    12,
    'fogo',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1600,
    'Arcano ✦ Corpo a corpo',
    'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Arcano ✦ Corpo a corpo ✦ Quando um feitiço lançado por você causar dano a uma única criatura, ele causa 5 pontos de dano adicional ao alvo. ✦ Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Atlas Tecno-Fantasia'
),
(
    'morfescudo',
    'morfescudo',
    'Morfescudo',
    'escudo',
    'Escudo',
    NULL,
    NULL,
    0,
    NULL,
    0,
    NULL,
    2,
    0,
    0,
    1,
    NULL,
    NULL,
    1800,
    'Tem todos os efeitos de um módulo de Escudo.',
    NULL,
    'No começo do seu turno durante um conflito, você pode desativar este módulo para ativar um módulo de arma diferente inativo à sua escolha. Se fizer isso, no final do seu turno, você terá que desativar o módulo escolhido e ativar este módulo novamente. Este módulo tem todos os efeitos de um módulo de Escudo (p. 167).',
    'Atlas Tecno-Fantasia'
),
(
    'rifle_de_plasma',
    'rifle_de_plasma',
    'Rifle de Plasma',
    'arma',
    'Arma de fogo',
    'distancia',
    ARRAY['des', 'ast'],
    1,
    '【RA + 14】',
    14,
    'luz',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1800,
    'Arma de fogo ✦ À distância',
    NULL,
    'Arma de fogo ✦ À distância ✦ Testes de Precisão com esta arma são considerados um sucesso crítico se os dois dados mostrarem o mesmo número (e não for uma falha crítica).',
    'Atlas Tecno-Fantasia'
),
(
    'aerowitzer',
    'aerowitzer',
    'Aerowitzer',
    'arma',
    'Arma de fogo',
    'distancia',
    ARRAY['des', 'ast'],
    0,
    '【RA + 18】',
    18,
    'ar',
    2,
    0,
    0,
    1,
    NULL,
    NULL,
    2000,
    'Arma de fogo ✦ À distância ✦ +2 Defesa ao pilotar',
    'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Arma de fogo ✦ À distância ✦ Enquanto estiver pilotando seu veículo pessoal, você recebe +2 na Defesa. ✦ Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Atlas Tecno-Fantasia'
),
(
    'canhao_de_dobra',
    'canhao_de_dobra',
    'Canhão de Dobra',
    'arma',
    'Arma de fogo',
    'distancia',
    ARRAY['des', 'ast'],
    1,
    '【RA + 18】',
    18,
    'trevas',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    2800,
    'Arma de fogo ✦ À distância ✦ Multi (2) ✦ Ignora Resistência, Imunidades e Absorção',
    'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Arma de fogo ✦ À distância ✦ Ataques com esta arma têm multi (2). Além disso, dano causado por esta arma ignora Resistência, Imunidades e Absorção. Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Atlas Tecno-Fantasia'
),

-- Módulos Raros para Armas de Fantasia Tecnológica (Anexo 3)
(
    'alicate_richter',
    'alicate_richter',
    'Alicate Richter',
    'arma',
    'Luta',
    'corpo_a_corpo',
    ARRAY['des', 'ast'],
    0,
    '【RA + 12】',
    12,
    'terra',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    800,
    'Luta ✦ Corpo a corpo ✦ Sem características',
    NULL,
    'Luta ✦ Corpo a corpo ✦ Sem características ✦ Esta arma pode ser usada para interagir com a cena como se fosse uma mão livre normal.',
    'Atlas Tecno-Fantasia'
),
(
    'desmontador',
    'desmontador',
    'Desmontador',
    'arma',
    'Pesada',
    'corpo_a_corpo',
    ARRAY['des', 'ast'],
    1,
    '【RA + 12】',
    12,
    'fisico',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    900,
    'Pesada ✦ Corpo a corpo',
    NULL,
    'Pesada ✦ Corpo a corpo ✦ Causa 5 pontos de dano adicional a construtos.',
    'Atlas Tecno-Fantasia'
),
(
    'bateria_fimbulvetr',
    'bateria_fimbulvetr',
    'Bateria Fimbulvetr',
    'arma',
    'Arma de fogo',
    'distancia',
    ARRAY['des', 'ast'],
    0,
    '【RA + 10】',
    10,
    'gelo',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1000,
    'Arma de fogo ✦ À distância ✦ Ignora Resistências',
    NULL,
    'Arma de fogo ✦ À distância ✦ Dano causado por esta arma ignora Resistências.',
    'Atlas Tecno-Fantasia'
),
(
    'canhao_de_pem',
    'canhao_de_pem',
    'Canhão de PEM',
    'arma',
    'Arma de fogo',
    'distancia',
    ARRAY['des', 'ast'],
    0,
    '【RA + 14】',
    14,
    'raio',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1100,
    'Arma de fogo ✦ À distância',
    'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Arma de fogo ✦ À distância ✦ Todo construto atingido por um ataque desta arma fica atordoado. ✦ Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Atlas Tecno-Fantasia'
),
(
    'pique_de_vanguarda',
    'pique_de_vanguarda',
    'Pique de Vanguarda',
    'arma',
    'Lança',
    'corpo_a_corpo',
    ARRAY['des', 'ast'],
    1,
    '【RA + 14】',
    14,
    'fisico',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1100,
    'Lança ✦ Corpo a corpo',
    'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Lança ✦ Corpo a corpo ✦ Esta arma causa 5 pontos de dano adicional durante a primeira rodada de cada conflito. ✦ Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Atlas Tecno-Fantasia'
),
(
    'crescens',
    'crescens',
    'Crescens',
    'arma',
    'Espada',
    'corpo_a_corpo',
    ARRAY['des', 'ast'],
    1,
    '【RA + 12】',
    12,
    'fisico',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1200,
    'Espada ✦ Corpo a corpo',
    NULL,
    'Espada ✦ Corpo a corpo ✦ Esta arma causa dano adicional igual ao seu NP em Veículo Pessoal (página 160).',
    'Atlas Tecno-Fantasia'
),
(
    'garragancho',
    'garragancho',
    'Garragancho',
    'arma',
    'Malho',
    'corpo_a_corpo',
    ARRAY['des', 'ast'],
    0,
    '【RA + 10】',
    10,
    'fisico',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1200,
    'Malho ✦ Corpo a corpo',
    NULL,
    'Malho ✦ Corpo a corpo ✦ Ataques com esta arma podem atingir criaturas voadoras.',
    'Atlas Tecno-Fantasia'
),
(
    'arbalesta_mk_ii',
    'arbalesta_mk_ii',
    'Arbalesta Mk II',
    'arma',
    'Arco',
    'distancia',
    ARRAY['des', 'ast'],
    1,
    '【RA + 16】',
    16,
    'fisico',
    0,
    0,
    0,
    1,
    NULL,
    NULL,
    1300,
    'Arco ✦ À distância',
    'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Arco ✦ À distância ✦ Esta arma causa 5 pontos de dano adicional a criaturas voadoras ou que estejam no ar. Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    'Atlas Tecno-Fantasia'
)
ON CONFLICT (key) DO UPDATE SET
    nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo,
    categoria = EXCLUDED.categoria,
    alcance = EXCLUDED.alcance,
    atributos_precisao = EXCLUDED.atributos_precisao,
    precisao_bonus = EXCLUDED.precisao_bonus,
    dano_formula = EXCLUDED.dano_formula,
    dano_bonus = EXCLUDED.dano_bonus,
    tipo_dano = EXCLUDED.tipo_dano,
    bonus_defesa = EXCLUDED.bonus_defesa,
    bonus_mdef = EXCLUDED.bonus_mdef,
    bonus_iniciativa = EXCLUDED.bonus_iniciativa,
    slot_cost = EXCLUDED.slot_cost,
    def_fixa = EXCLUDED.def_fixa,
    mdef_fixa = EXCLUDED.mdef_fixa,
    custo = EXCLUDED.custo,
    propriedades = EXCLUDED.propriedades,
    restricoes = EXCLUDED.restricoes,
    descricao = EXCLUDED.descricao,
    fonte = EXCLUDED.fonte;

-- =============================================================================
-- PARTE 3: ITENS RAROS (ARMAS, ARMADURAS, ESCUDOS E ACESSÓRIOS) - itens_catalogo
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.itens_catalogo (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'arma', 'armadura', 'escudo', 'acessorio'
    custo INTEGER NOT NULL DEFAULT 100,
    descricao TEXT,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.itens_catalogo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'itens_catalogo'
      AND policyname = 'Leitura publica itens_catalogo'
  ) THEN
    CREATE POLICY "Leitura publica itens_catalogo"
      ON public.itens_catalogo
      FOR SELECT TO public
      USING (true);
  END IF;

  -- Garante que o nome do item no catálogo geral seja único para suportar UPSERT seguro
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'itens_catalogo_nome_unique'
  ) THEN
    ALTER TABLE public.itens_catalogo ADD CONSTRAINT itens_catalogo_nome_unique UNIQUE (nome);
  END IF;
END $$;

-- 3.1. ACESSÓRIOS RAROS (Tecno-Fantasia, Bucólica, Alta Fantasia)
INSERT INTO public.itens_catalogo (nome, tipo, custo, descricao, stats)
VALUES
-- Tecno-Fantasia (Anexo 2)
(
    'Pente Reserva',
    'acessorio',
    600,
    'Uma vez por cena, após fazer um teste de Precisão com uma arma de fogo, você pode rolar novamente um dos dados desse teste.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 600, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "Uma vez por cena, após fazer um teste de Precisão com uma arma de fogo, você pode rolar novamente um dos dados desse teste.", "efeitos": ["Uma vez por cena, após fazer um teste de Precisão com uma arma de fogo, você pode rolar novamente um dos dados desse teste."]}'::jsonb
),
(
    'Granadas de Atordoamento',
    'acessorio',
    800,
    'Quando você usar um fragmento elemental para causar dano a uma criatura, ela também fica atordoada.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 800, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "Quando você usar um fragmento elemental para causar dano a uma criatura, ela também fica atordoada.", "efeitos": ["Quando você usar um fragmento elemental para causar dano a uma criatura, ela também fica atordoada."]}'::jsonb
),
(
    'Máscara de Gás',
    'acessorio',
    900,
    'Você é Resistente a dano de veneno e é Imune a envenenado.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 900, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "resistencias": ["veneno"], "imunidades": ["envenenado"], "efeito": "Você é Resistente a dano de veneno e é Imune a envenenado.", "efeitos": ["Você é Resistente a dano de veneno e é Imune a envenenado."]}'::jsonb
),
(
    'Capacete de Piloto',
    'acessorio',
    1000,
    'No início do seu turno durante um conflito, se estiver em crise enquanto dirige seu veículo pessoal (p. 160), você pode se recuperar de uma única condição à sua escolha.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1000, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "No início do seu turno durante um conflito, se estiver em crise enquanto dirige seu veículo pessoal (p. 160), você pode se recuperar de uma única condição à sua escolha.", "efeitos": ["No início do seu turno durante um conflito, se estiver em crise enquanto dirige seu veículo pessoal (p. 160), você pode se recuperar de uma única condição à sua escolha."]}'::jsonb
),
(
    'Kit de Primeiros-socorros',
    'acessorio',
    1500,
    'Quando fizer com que uma ou mais criaturas recuperem Pontos de Vida com uma poção ou feitiço, se ao menos uma dessas criaturas estiver em crise, cada uma delas recupera 5 Pontos de Vida adicionais.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1500, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "Quando fizer com que uma ou mais criaturas recuperem Pontos de Vida com uma poção ou feitiço, se ao menos uma dessas criaturas estiver em crise, cada uma delas recupera 5 Pontos de Vida adicionais.", "efeitos": ["Quando fizer com que uma ou mais criaturas recuperem Pontos de Vida com uma poção ou feitiço, se ao menos uma dessas criaturas estiver em crise, cada uma delas recupera 5 Pontos de Vida adicionais."]}'::jsonb
),
(
    'Máscara de Ego',
    'acessorio',
    1500,
    'Após invocar um Arcano em seu turno durante um conflito, você pode fazer um ataque livre com uma arma equipada. Se o fizer, sua RA é considerada como 0 para calcular o dano causado por este ataque e você não pode dispensar seu Arcano neste turno por vontade própria.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1500, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "Após invocar um Arcano em seu turno durante um conflito, você pode fazer um ataque livre com uma arma equipada. Se o fizer, sua RA é considerada como 0 para calcular o dano causado por este ataque e você não pode dispensar seu Arcano neste turno por vontade própria.", "efeitos": ["Após invocar um Arcano em seu turno durante um conflito, você pode fazer um ataque livre com uma arma equipada. Se o fizer, sua RA é considerada como 0 para calcular o dano causado por este ataque e você não pode dispensar seu Arcano neste turno por vontade própria."]}'::jsonb
),
(
    'Montador Portátil',
    'acessorio',
    1500,
    'Uma vez por cena, quando tiver que gastar Pontos de Inventário, reduza esse custo à metade.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1500, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "Uma vez por cena, quando tiver que gastar Pontos de Inventário, reduza esse custo à metade.", "efeitos": ["Uma vez por cena, quando tiver que gastar Pontos de Inventário, reduza esse custo à metade."]}'::jsonb
),
(
    'Omnidex',
    'acessorio',
    2000,
    'Ao fazer um teste para examinar a ficha de um NPC (Livro Básico, p. 319), considere qualquer resultado 12 ou menor como 13, a menos que seja uma falha crítica.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 2000, "categoria": "Acessório", "suplemento": "Tecno-Fantasia", "efeito": "Ao fazer um teste para examinar a ficha de um NPC (Livro Básico, p. 319), considere qualquer resultado 12 ou menor como 13, a menos que seja uma falha crítica.", "efeitos": ["Ao fazer um teste para examinar a ficha de um NPC (Livro Básico, p. 319), considere qualquer resultado 12 ou menor como 13, a menos que seja uma falha crítica."]}'::jsonb
),
-- Bucólica (Anexo 7)
(
    'Regador',
    'acessorio',
    500,
    'Ao fazer uma invocação de água (p. 157), você pode preencher 1 seção do relógio de germinação (p. 140) de um PJ que você possa ver.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 500, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Ao fazer uma invocação de água (p. 157), você pode preencher 1 seção do relógio de germinação (p. 140) de um PJ que você possa ver.", "efeitos": ["Ao fazer uma invocação de água (p. 157), você pode preencher 1 seção do relógio de germinação (p. 140) de um PJ que você possa ver."]}'::jsonb
),
(
    'Pimenta em Pó',
    'acessorio',
    600,
    'Ao causar dano usando uma iguaria ou poção, você pode mudar o tipo desse dano para fogo. Esse efeito pode mudar o tipo de dano causado por Data de Validade (página 159).',
    '{"raridade": "raro", "slot": "acessorio", "custo": 600, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Ao causar dano usando uma iguaria ou poção, você pode mudar o tipo desse dano para fogo. Esse efeito pode mudar o tipo de dano causado por Data de Validade (página 159).", "efeitos": ["Ao causar dano usando uma iguaria ou poção, você pode mudar o tipo desse dano para fogo. Esse efeito pode mudar o tipo de dano causado por Data de Validade (página 159)."]}'::jsonb
),
(
    'Obi de Dente-de-leão',
    'acessorio',
    700,
    'Ao fazer uma invocação de ar (página 157), você pode se recuperar de uma única condição à sua escolha.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 700, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Ao fazer uma invocação de ar (página 157), você pode se recuperar de uma única condição à sua escolha.", "efeitos": ["Ao fazer uma invocação de ar (página 157), você pode se recuperar de uma única condição à sua escolha."]}'::jsonb
),
(
    'Coração Mecânico',
    'acessorio',
    800,
    'Você é Resistente a dano de raio e fogo. Quando entrar em crise, este acessório perde seus efeitos até seu próximo descanso.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 800, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "resistencias": ["raio", "fogo"], "efeito": "Você é Resistente a dano de raio e fogo. Quando entrar em crise, este acessório perde seus efeitos até seu próximo descanso.", "efeitos": ["Você é Resistente a dano de raio e fogo. Quando entrar em crise, este acessório perde seus efeitos até seu próximo descanso."]}'::jsonb
),
(
    'Manto de Sapo Venenoso',
    'acessorio',
    900,
    'Quando causa dano de veneno a uma ou mais criaturas durante um conflito, cada criatura que perder PV dessa forma não pode recuperar PV até o início do seu próximo turno.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 900, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Quando causa dano de veneno a uma ou mais criaturas durante um conflito, cada criatura que perder PV dessa forma não pode recuperar PV até o início do seu próximo turno.", "efeitos": ["Quando causa dano de veneno a uma ou mais criaturas durante um conflito, cada criatura que perder PV dessa forma não pode recuperar PV até o início do seu próximo turno."]}'::jsonb
),
(
    'Cachecol Artesanal',
    'acessorio',
    1000,
    'Ao receber 1 ou mais Pontos de Comércio usando Verdadeiro Tesouro (página 139), você também recebe 1 Ponto de Fabula.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1000, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Ao receber 1 ou mais Pontos de Comércio usando Verdadeiro Tesouro (página 139), você também recebe 1 Ponto de Fabula.", "efeitos": ["Ao receber 1 ou mais Pontos de Comércio usando Verdadeiro Tesouro (página 139), você também recebe 1 Ponto de Fabula."]}'::jsonb
),
(
    'Amuleto da Folha Caída',
    'acessorio',
    1500,
    'Ao usar Árvore da Vida (página 139), se você estiver em crise, escolha um aliado que você possa ver, também em crise: você e esse aliado se beneficiam da recuperação de PV que o poder oferece.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1500, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Ao usar Árvore da Vida (página 139), se você estiver em crise, escolha um aliado que você possa ver, também em crise: você e esse aliado se beneficiam da recuperação de PV que o poder oferece.", "efeitos": ["Ao usar Árvore da Vida (página 139), se você estiver em crise, escolha um aliado que você possa ver, também em crise: você e esse aliado se beneficiam da recuperação de PV que o poder oferece."]}'::jsonb
),
(
    'Livro de Receitas dos Excêntricos',
    'acessorio',
    1600,
    'Uma vez por descanso, você pode escolher uma única combinação de dois sabores cujo efeito já tenha descoberto (página 151). Se fizer isso, rola os dados novamente para determinar o efeito da combinação, substituindo o efeito anterior.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1600, "categoria": "Acessório", "suplemento": "Fantasia Bucólica", "efeito": "Uma vez por descanso, você pode escolher uma única combinação de dois sabores cujo efeito já tenha descoberto (página 151). Se fizer isso, rola os dados novamente para determinar o efeito da combinação, substituindo o efeito anterior.", "efeitos": ["Uma vez por descanso, você pode escolher uma única combinação de dois sabores cujo efeito já tenha descoberto (página 151). Se fizer isso, rola os dados novamente para determinar o efeito da combinação, substituindo o efeito anterior."]}'::jsonb
),
-- Alta Fantasia (Anexo 9)
(
    'Anel da Negação',
    'acessorio',
    600,
    'Quando lança Dissipar (Livro Básico, página 192), seu custo em PM torna-se “10 × A” e seu alvo torna-se “Até três criaturas”.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 600, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Quando lança Dissipar (Livro Básico, página 192), seu custo em PM torna-se 10 × A e seu alvo torna-se Até três criaturas.", "efeitos": ["Quando lança Dissipar (Livro Básico, página 192), seu custo em PM torna-se 10 × A e seu alvo torna-se Até três criaturas."]}'::jsonb
),
(
    'Anel do Ocultista',
    'acessorio',
    600,
    'Feitiços que você lança com alvo de “Até três criaturas” tornam-se feitiços com alvo de “Até quatro criaturas” (mas você ainda deve gastar os PM adicionais para atingir o quarto alvo).',
    '{"raridade": "raro", "slot": "acessorio", "custo": 600, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Feitiços que você lança com alvo de “Até três criaturas” tornam-se feitiços com alvo de “Até quatro criaturas” (mas você ainda deve gastar os PM adicionais para atingir o quarto alvo).", "efeitos": ["Feitiços que você lança com alvo de “Até três criaturas” tornam-se feitiços com alvo de “Até quatro criaturas” (mas você ainda deve gastar os PM adicionais para atingir o quarto alvo)."]}'::jsonb
),
(
    'Anel de Marfim',
    'acessorio',
    700,
    'Quando seu Companheiro Fiel (Livro Básico, página 177) perder PV, em vez disso você pode perder a mesma quantidade de PV no lugar dele.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 700, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Quando seu Companheiro Fiel (Livro Básico, página 177) perder PV, em vez disso você pode perder a mesma quantidade de PV no lugar dele.", "efeitos": ["Quando seu Companheiro Fiel (Livro Básico, página 177) perder PV, em vez disso você pode perder a mesma quantidade de PV no lugar dele."]}'::jsonb
),
(
    'Paleta Mágica',
    'acessorio',
    700,
    'Ao causar dano a uma criatura com um de seus símbolos (página 144), o dano causado ignora Resistências.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 700, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Ao causar dano a uma criatura com um de seus símbolos (página 144), o dano causado ignora Resistências.", "efeitos": ["Ao causar dano a uma criatura com um de seus símbolos (página 144), o dano causado ignora Resistências."]}'::jsonb
),
(
    'Diadema do Estrategista',
    'acessorio',
    800,
    'Quando um aliado age imediatamente após o seu turno na mesma rodada de conflito (como por Carruagem Devastadora, Dança do Ouroboros ou Tempo Roubado) esse aliado recupera 5 PM no início do turno dele.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 800, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Quando um aliado age imediatamente após o seu turno na mesma rodada de conflito (como por Carruagem Devastadora, Dança do Ouroboros ou Tempo Roubado) esse aliado recupera 5 PM no início do turno dele.", "efeitos": ["Quando um aliado age imediatamente após o seu turno na mesma rodada de conflito (como por Carruagem Devastadora, Dança do Ouroboros ou Tempo Roubado) esse aliado recupera 5 PM no início do turno dele."]}'::jsonb
),
(
    'Bolsa de Alquimia',
    'acessorio',
    1000,
    'Quando fabrica uma poção com o poder Engenhocas (Alquimia) (Livro Básico, página 208), você pode rolar 1d20 adicional.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1000, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Quando fabrica uma poção com o poder Engenhocas (Alquimia) (Livro Básico, página 208), você pode rolar 1d20 adicional.", "efeitos": ["Quando fabrica uma poção com o poder Engenhocas (Alquimia) (Livro Básico, página 208), você pode rolar 1d20 adicional."]}'::jsonb
),
(
    'Pingente de Feitiçaria',
    'acessorio',
    1200,
    'Se você tiver Golpe Baixo (Livro Básico, p. 213), seu dano adicional também se aplica a quaisquer feitiço ofensivos (⚡) que tiverem uma única criatura como alvo, desde que ela esteja sofrendo ao menos uma condição.',
    '{"raridade": "raro", "slot": "acessorio", "custo": 1200, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Se você tiver Golpe Baixo (Livro Básico, p. 213), seu dano adicional também se aplica a quaisquer feitiço ofensivos que tiverem uma única criatura como alvo, desde que ela esteja sofrendo ao menos uma condição.", "efeitos": ["Se você tiver Golpe Baixo (Livro Básico, p. 213), seu dano adicional também se aplica a quaisquer feitiço ofensivos que tiverem uma única criatura como alvo, desde que ela esteja sofrendo ao menos uma condição."]}'::jsonb
),
(
    'Fita de Dança',
    'acessorio',
    2000,
    'Enquanto este acessório estiver equipado, seu dado de Destreza aumenta em um passo (máximo de d12).',
    '{"raridade": "raro", "slot": "acessorio", "custo": 2000, "categoria": "Acessório", "suplemento": "Alta Fantasia", "efeito": "Enquanto este acessório estiver equipado, seu dado de Destreza aumenta em um passo (máximo de d12).", "efeitos": ["Enquanto este acessório estiver equipado, seu dado de Destreza aumenta em um passo (máximo de d12)."], "bonus_atributos": {"destreza_passo": 1}}'::jsonb
)
ON CONFLICT (nome) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    custo = EXCLUDED.custo,
    descricao = EXCLUDED.descricao,
    stats = EXCLUDED.stats;

-- 3.2. ARMADURAS E ESCUDOS RAROS (Tecno-Fantasia, Bucólica, Alta Fantasia)
INSERT INTO public.itens_catalogo (nome, tipo, custo, descricao, stats)
VALUES
-- Armaduras Tecno-Fantasia (Anexo 5)
(
    'Desdirecionador',
    'armadura',
    1000,
    'Enquanto não tiver um escudo equipado, você é Resistente a dano físico.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1000, "categoria": "Armadura", "suplemento": "Tecno-Fantasia", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 1", "iniciativa": -1, "marcial": false, "efeito": "Enquanto não tiver um escudo equipado, você é Resistente a dano físico.", "efeitos": ["Enquanto não tiver um escudo equipado, você é Resistente a dano físico."]}'::jsonb
),
(
    'Jaleco de Cientista',
    'armadura',
    1500,
    'Se tiver o poder Fórmula Secreta (Livro Básico, p. 207), considere seu NP nele como se fosse 2 pontos maior (até um máximo de NP 7).',
    '{"raridade": "raro", "slot": "armadura", "custo": 1500, "categoria": "Armadura", "suplemento": "Tecno-Fantasia", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 2", "iniciativa": -2, "marcial": false, "efeito": "Se tiver o poder Fórmula Secreta (Livro Básico, p. 207), considere seu NP nele como se fosse 2 pontos maior (até um máximo de NP 7).", "efeitos": ["Se tiver o poder Fórmula Secreta (Livro Básico, p. 207), considere seu NP nele como se fosse 2 pontos maior (até um máximo de NP 7)."]}'::jsonb
),
(
    'Biomanto',
    'armadura',
    1800,
    'Quando usar um poder que exija um gasto de PV, como Ecdise (p. 155) ou Vismagus (Livro Básico, p. 197), reduza esse custo à metade.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1800, "categoria": "Armadura", "suplemento": "Tecno-Fantasia", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 1", "iniciativa": 0, "marcial": false, "efeito": "Quando usar um poder que exija um gasto de PV, como Ecdise (p. 155) ou Vismagus (Livro Básico, p. 197), reduza esse custo à metade.", "efeitos": ["Quando usar um poder que exija um gasto de PV, como Ecdise (p. 155) ou Vismagus (Livro Básico, p. 197), reduza esse custo à metade."]}'::jsonb
),
(
    'Psiesqueleto',
    'armadura',
    2000,
    'Após realizar a ação Guarda, se seu Relógio Mental estiver cheio, você pode apagá-lo completamente.',
    '{"raridade": "raro", "slot": "armadura", "custo": 2000, "categoria": "Armadura", "suplemento": "Tecno-Fantasia", "defesa": 11, "defesa_magica": "Dado de AST + 1", "iniciativa": -3, "marcial": true, "efeito": "Após realizar a ação Guarda, se seu Relógio Mental estiver cheio, você pode apagá-lo completamente.", "efeitos": ["Após realizar a ação Guarda, se seu Relógio Mental estiver cheio, você pode apagá-lo completamente."]}'::jsonb
),
-- Escudos Tecno-Fantasia (Anexo 5)
(
    'Quebra-gelo',
    'escudo',
    700,
    'Todo o dano físico e de fogo que você causa ignora Resistências.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 700, "categoria": "Escudo", "suplemento": "Tecno-Fantasia", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Todo o dano físico e de fogo que você causa ignora Resistências.", "efeitos": ["Todo o dano físico e de fogo que você causa ignora Resistências."]}'::jsonb
),
(
    'Escudo Balístico',
    'escudo',
    800,
    'Você recebe +1 em testes de Precisão com armas à distância.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 800, "categoria": "Escudo", "suplemento": "Tecno-Fantasia", "defesa": 2, "defesa_magica": 0, "iniciativa": 0, "marcial": false, "efeito": "Você recebe +1 em testes de Precisão com armas à distância.", "efeitos": ["Você recebe +1 em testes de Precisão com armas à distância."]}'::jsonb
),
(
    'Para-brisa',
    'escudo',
    1000,
    'Enquanto estiver dirigindo seu veículo pessoal (p. 160), você é Resistente a dano de ar e gelo.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 1000, "categoria": "Escudo", "suplemento": "Tecno-Fantasia", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Enquanto estiver dirigindo seu veículo pessoal (p. 160), você é Resistente a dano de ar e gelo.", "efeitos": ["Enquanto estiver dirigindo seu veículo pessoal (p. 160), você é Resistente a dano de ar e gelo."]}'::jsonb
),
(
    'Escudo Hecat',
    'escudo',
    2000,
    'Você é Resistente a dano causado por feitiços. Quando um feitiço causar dano a você, recupere 5 Pontos de Mana.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 2000, "categoria": "Escudo", "suplemento": "Tecno-Fantasia", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Você é Resistente a dano causado por feitiços. Quando um feitiço causar dano a você, recupere 5 Pontos de Mana.", "efeitos": ["Você é Resistente a dano causado por feitiços. Quando um feitiço causar dano a você, recupere 5 Pontos de Mana."]}'::jsonb
),
-- Armaduras Bucólica (Anexo 6)
(
    'Couraça de Lã',
    'armadura',
    800,
    'Desde que não esteja em crise, você tem Resistência a dano de gelo e Imunidade à condição fraco.',
    '{"raridade": "raro", "slot": "armadura", "custo": 800, "categoria": "Armadura", "suplemento": "Fantasia Bucólica", "defesa": 11, "defesa_magica": "Dado de AST", "iniciativa": -3, "marcial": true, "efeito": "Desde que não esteja em crise, você tem Resistência a dano de gelo e Imunidade à condição fraco.", "efeitos": ["Desde que não esteja em crise, você tem Resistência a dano de gelo e Imunidade à condição fraco."]}'::jsonb
),
(
    'Jaqueta de Técnico',
    'armadura',
    1000,
    'Ao usar um fragmento elemental, você pode causar o dano dele em até três criaturas que você possa ver. Além disso, ao causar dano com um fragmento elemental, você causa 5 pontos de dano adicional.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1000, "categoria": "Armadura", "suplemento": "Fantasia Bucólica", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 1", "iniciativa": -1, "marcial": false, "efeito": "Ao usar um fragmento elemental, você pode causar o dano dele em até três criaturas que você possa ver. Além disso, ao causar dano com um fragmento elemental, você causa 5 pontos de dano adicional.", "efeitos": ["Ao usar um fragmento elemental, você pode causar o dano dele em até três criaturas que você possa ver. Além disso, ao causar dano com um fragmento elemental, você causa 5 pontos de dano adicional."]}'::jsonb
),
(
    'Traje Nobre',
    'armadura',
    1600,
    'Quando um aliado que possa ver você fizer você recuperar PV, se você estiver em crise, este aliado também recupera 5 PM.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1600, "categoria": "Armadura", "suplemento": "Fantasia Bucólica", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 1", "iniciativa": 0, "marcial": false, "efeito": "Quando um aliado que possa ver você fizer você recuperar PV, se você estiver em crise, este aliado também recupera 5 PM.", "efeitos": ["Quando um aliado que possa ver você fizer você recuperar PV, se você estiver em crise, este aliado também recupera 5 PM."]}'::jsonb
),
(
    'Trajes de Boticário',
    'armadura',
    1800,
    'Ao usar Chuva de Poções (Livro Básico, página 207), seu efeito de restauração não é dividido pela metade.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1800, "categoria": "Armadura", "suplemento": "Fantasia Bucólica", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 2", "iniciativa": -2, "marcial": false, "efeito": "Ao usar Chuva de Poções (Livro Básico, página 207), seu efeito de restauração não é dividido pela metade.", "efeitos": ["Ao usar Chuva de Poções (Livro Básico, página 207), seu efeito de restauração não é dividido pela metade."]}'::jsonb
),
(
    'Túnica Feérica',
    'armadura',
    2000,
    'Enquanto estiver sob efeito de um ou mais feitiços com duração “Cena”, sua Defesa Mágica aumenta em +2.',
    '{"raridade": "raro", "slot": "armadura", "custo": 2000, "categoria": "Armadura", "suplemento": "Fantasia Bucólica", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 2", "iniciativa": -2, "marcial": false, "efeito": "Enquanto estiver sob efeito de um ou mais feitiços com duração “Cena”, sua Defesa Mágica aumenta em +2.", "efeitos": ["Enquanto estiver sob efeito de um ou mais feitiços com duração “Cena”, sua Defesa Mágica aumenta em +2."]}'::jsonb
),
-- Escudos Bucólica (Anexo 6)
(
    'Manica de Placas',
    'escudo',
    800,
    'Desde que não esteja usando uma armadura marcial ou outro escudo, você pode usar os efeitos de Esquiva (Livro Básico, página 213).',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 800, "categoria": "Escudo", "suplemento": "Fantasia Bucólica", "defesa": 2, "defesa_magica": 0, "iniciativa": 0, "marcial": false, "efeito": "Desde que não esteja usando uma armadura marcial ou outro escudo, você pode usar os efeitos de Esquiva (Livro Básico, página 213).", "efeitos": ["Desde que não esteja usando uma armadura marcial ou outro escudo, você pode usar os efeitos de Esquiva (Livro Básico, página 213)."]}'::jsonb
),
(
    'Escudo-tampa',
    'escudo',
    1500,
    'Ao causar dano usando uma iguaria (página 151), você causa 5 pontos de dano adicional.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 1500, "categoria": "Escudo", "suplemento": "Fantasia Bucólica", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Ao causar dano usando uma iguaria (página 151), você causa 5 pontos de dano adicional.", "efeitos": ["Ao causar dano usando uma iguaria (página 151), você causa 5 pontos de dano adicional."]}'::jsonb
),
(
    'Braçadeira-lírio',
    'escudo',
    2000,
    'Se tiver o poder Jardinagem de Combate (página 139), você pode usá-lo para plantar uma magissemente com Enxerto.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 2000, "categoria": "Escudo", "suplemento": "Fantasia Bucólica", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Se tiver o poder Jardinagem de Combate (página 139), você pode usá-lo para plantar uma magissemente com Enxerto.", "efeitos": ["Se tiver o poder Jardinagem de Combate (página 139), você pode usá-lo para plantar uma magissemente com Enxerto."]}'::jsonb
),
-- Armaduras Alta Fantasia (Anexo 14)
(
    'Vestido de Dança',
    'armadura',
    1000,
    'Ao fazer uma dança (página 139) com duração de “Até o início de seu próximo turno”, você se recupera de uma condição à sua escolha.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1000, "categoria": "Armadura", "suplemento": "Alta Fantasia", "defesa": "Dado de DES", "defesa_magica": "Dado de AST + 2", "iniciativa": -1, "marcial": false, "efeito": "Ao fazer uma dança (página 139) com duração de “Até o início de seu próximo turno”, você se recupera de uma condição à sua escolha.", "efeitos": ["Ao fazer uma dança (página 139) com duração de “Até o início de seu próximo turno”, você se recupera de uma condição à sua escolha."]}'::jsonb
),
(
    'Traje Elemental',
    'armadura',
    1800,
    'Enquanto estiver em crise, qualquer feitiço que você lançar e que cause dano de ar, fogo, raio, gelo ou terra, causa 5 pontos de dano adicional.',
    '{"raridade": "raro", "slot": "armadura", "custo": 1800, "categoria": "Armadura", "suplemento": "Alta Fantasia", "defesa": "Dado de DES + 1", "defesa_magica": "Dado de AST + 1", "iniciativa": -2, "marcial": false, "efeito": "Enquanto estiver em crise, qualquer feitiço que você lançar e que cause dano de ar, fogo, raio, gelo ou terra, causa 5 pontos de dano adicional.", "efeitos": ["Enquanto estiver em crise, qualquer feitiço que você lançar e que cause dano de ar, fogo, raio, gelo ou terra, causa 5 pontos de dano adicional."]}'::jsonb
),
(
    'Oricalco',
    'armadura',
    2500,
    'Enquanto estiver com esta armadura equipada, seus PV máximos aumentam em 10. Essa armadura não pode ser destruída.',
    '{"raridade": "raro", "slot": "armadura", "custo": 2500, "categoria": "Armadura", "suplemento": "Alta Fantasia", "defesa": 12, "defesa_magica": "Dado de AST", "iniciativa": -4, "marcial": true, "efeito": "Enquanto estiver com esta armadura equipada, seus PV máximos aumentam em 10. Essa armadura não pode ser destruída.", "efeitos": ["Enquanto estiver com esta armadura equipada, seus PV máximos aumentam em 10. Essa armadura não pode ser destruída."], "bonus_recursos": {"pv_maximo": 10}}'::jsonb
),
-- Escudos Alta Fantasia (Anexo 14)
(
    'Escudo-mochila',
    'escudo',
    1000,
    'Quando um poder faz você recuperar Pontos de Inventário, você recupera 1 PI adicional.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 1000, "categoria": "Escudo", "suplemento": "Alta Fantasia", "defesa": 2, "defesa_magica": 0, "iniciativa": 0, "marcial": false, "efeito": "Quando um poder faz você recuperar Pontos de Inventário, você recupera 1 PI adicional.", "efeitos": ["Quando um poder faz você recuperar Pontos de Inventário, você recupera 1 PI adicional."]}'::jsonb
),
(
    'Escudo Percussivo',
    'escudo',
    1700,
    'Se tiver o poder Harmonia (página 149), considere que seu NP nele é 2 níveis maior (máximo de NP 5).',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 1700, "categoria": "Escudo", "suplemento": "Alta Fantasia", "defesa": 2, "defesa_magica": 0, "iniciativa": 0, "marcial": false, "efeito": "Se tiver o poder Harmonia (página 149), considere que seu NP nele é 2 níveis maior (máximo de NP 5).", "efeitos": ["Se tiver o poder Harmonia (página 149), considere que seu NP nele é 2 níveis maior (máximo de NP 5)."]}'::jsonb
),
(
    'Argus',
    'escudo',
    2000,
    'Quando usa Roque do Rei e Decreto do Bispo (página 137), escolha uma criatura que você possa ver para não sofrer seus efeitos.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 2000, "categoria": "Escudo", "suplemento": "Alta Fantasia", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Quando usa Roque do Rei e Decreto do Bispo (página 137), escolha uma criatura que você possa ver para não sofrer seus efeitos.", "efeitos": ["Quando usa Roque do Rei e Decreto do Bispo (página 137), escolha uma criatura que você possa ver para não sofrer seus efeitos."]}'::jsonb
),
(
    'Escudo Laminado',
    'escudo',
    2000,
    'Ao atacar com uma espada, lança ou arma pesada, se este ataque tiver a propriedade multi, ele causa 5 pontos de dano adicional.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 2000, "categoria": "Escudo", "suplemento": "Alta Fantasia", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Ao atacar com uma espada, lança ou arma pesada, se este ataque tiver a propriedade multi, ele causa 5 pontos de dano adicional.", "efeitos": ["Ao atacar com uma espada, lança ou arma pesada, se este ataque tiver a propriedade multi, ele causa 5 pontos de dano adicional."]}'::jsonb
),
(
    'Escudo do Aparo',
    'escudo',
    2500,
    'Se tiver o poder Contra-ataque (Livro Básico, p. 215), ele também é engatilhado se o resultado do teste de Precisão inimigo for um número ímpar.',
    '{"raridade": "raro", "slot": "mao_secundaria", "custo": 2500, "categoria": "Escudo", "suplemento": "Alta Fantasia", "defesa": 2, "defesa_magica": 2, "iniciativa": 0, "marcial": true, "efeito": "Se tiver o poder Contra-ataque (Livro Básico, p. 215), ele também é engatilhado se o resultado do teste de Precisão inimigo for um número ímpar.", "efeitos": ["Se tiver o poder Contra-ataque (Livro Básico, p. 215), ele também é engatilhado se o resultado do teste de Precisão inimigo for um número ímpar."]}'::jsonb
)
ON CONFLICT (nome) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    custo = EXCLUDED.custo,
    descricao = EXCLUDED.descricao,
    stats = EXCLUDED.stats;

-- 3.3. ARMAS RARAS (Tecno-Fantasia, Bucólica, Alta Fantasia)
INSERT INTO public.itens_catalogo (nome, tipo, custo, descricao, stats)
VALUES
-- Tecno-Fantasia (Anexo 8)
(
    'Conector',
    'arma',
    600,
    'Malho ✦ Duas mãos ✦ Corpo a corpo ✦ Você pode ignorar o custo em PM do poder Sobreposição Tecnomágica (Livro Básico, página 211).',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 600, "categoria": "Malho", "suplemento": "Tecno-Fantasia", "precisao": "【DES + DES】", "dano": "RA + 8", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": false, "efeito": "Você pode ignorar o custo em PM do poder Sobreposição Tecnomágica (Livro Básico, página 211).", "efeitos": ["Você pode ignorar o custo em PM do poder Sobreposição Tecnomágica (Livro Básico, página 211)."]}'::jsonb
),
(
    'Rasgador Therion',
    'arma',
    700,
    'Luta ✦ Uma mão ✦ Corpo a corpo ✦ Causa dano adicional igual ao seu NP em Acromorfose (p. 155) e sua categoria é sempre idêntica à de seus ataques desarmados. Esta arma também recebe os benefícios de Acromorfose Maior (p. 171) como se fosse um ataque desarmado.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 700, "categoria": "Luta", "suplemento": "Tecno-Fantasia", "precisao": "【DES + VIG】 +1", "dano": "RA + 10", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": true, "efeito": "Causa dano adicional igual ao seu NP em Acromorfose (p. 155) e sua categoria é sempre idêntica à de seus ataques desarmados. Esta arma também recebe os benefícios de Acromorfose Maior (p. 171) como se fosse um ataque desarmado.", "efeitos": ["Causa dano adicional igual ao seu NP em Acromorfose (p. 155) e sua categoria é sempre idêntica à de seus ataques desarmados."]}'::jsonb
),
(
    'Arco de Carbono',
    'arma',
    800,
    'Arco ✦ Duas mãos ✦ À distância ✦ Ataques com esta arma consideram a Defesa de cada alvo como igual ao dado de Destreza atual dele.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 800, "categoria": "Arco", "suplemento": "Tecno-Fantasia", "precisao": "【DES + DES】 +1", "dano": "RA + 8", "tipo_dano": "fisico", "alcance": "À distância", "maos": "Duas mãos", "marcial": false, "efeito": "Ataques com esta arma consideram a Defesa de cada alvo como igual ao dado de Destreza atual dele.", "efeitos": ["Ataques com esta arma consideram a Defesa de cada alvo como igual ao dado de Destreza atual dele."]}'::jsonb
),
(
    'Anel de Interface',
    'arma',
    1000,
    'Arcana ✦ Uma mão ✦ Corpo a corpo ✦ Você reduz pela metade o custo em PM de todos os rituais ligados à rede de almas que fizer através de Fantasma Cognitivo (p. 123) ou de Navegador (p. 151).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1000, "categoria": "Arcana", "suplemento": "Tecno-Fantasia", "precisao": "【VON + VON】", "dano": "RA + 6", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": false, "efeito": "Você reduz pela metade o custo em PM de todos os rituais ligados à rede de almas que fizer através de Fantasma Cognitivo (p. 123) ou de Navegador (p. 151).", "efeitos": ["Você reduz pela metade o custo em PM de todos os rituais ligados à rede de almas que fizer através de Fantasma Cognitivo (p. 123) ou de Navegador (p. 151)."]}'::jsonb
),
(
    'Lança de Ignição',
    'arma',
    1000,
    'Lança ✦ Duas mãos ✦ Corpo a corpo ✦ Quando você usa Compressão Tecnológica (p. 159) para invocar seu veículo pessoal, pode gastar 10 PM para fazer isso, em vez do custo normal em PI.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1000, "categoria": "Lança", "suplemento": "Tecno-Fantasia", "precisao": "【DES + VIG】", "dano": "RA + 16", "tipo_dano": "fogo", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Quando você usa Compressão Tecnológica (p. 159) para invocar seu veículo pessoal, pode gastar 10 PM para fazer isso, em vez do custo normal em PI.", "efeitos": ["Quando você usa Compressão Tecnológica (p. 159) para invocar seu veículo pessoal, pode gastar 10 PM para fazer isso, em vez do custo normal em PI."]}'::jsonb
),
(
    'Lança-granadas',
    'arma',
    1000,
    'Arma de fogo ✦ Duas mãos ✦ À distância ✦ Quando aplica uma infusão (Livro Básico, p. 210) a um ataque feito com esta arma, o ataque causa dano adicional igual ao seu NP em Engenhocas (Livro Básico, p. 207).',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1000, "categoria": "Arma de fogo", "suplemento": "Tecno-Fantasia", "precisao": "【DES + AST】", "dano": "RA + 16", "tipo_dano": "fisico", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Quando aplica uma infusão (Livro Básico, p. 210) a um ataque feito com esta arma, o ataque causa dano adicional igual ao seu NP em Engenhocas (Livro Básico, p. 207).", "efeitos": ["Quando aplica uma infusão (Livro Básico, p. 210) a um ataque feito com esta arma, o ataque causa dano adicional igual ao seu NP em Engenhocas (Livro Básico, p. 207)."]}'::jsonb
),
(
    'Esmagador',
    'arma',
    1100,
    'Pesada ✦ Duas mãos ✦ Corpo a corpo ✦ Quando usar esta arma com Trespassar (Livro Básico, p. 215) e atingir o alvo, você pode escolher duas das opções, em vez de uma. Se escolher apenas uma opção, o alvo perde uma quantidade de PV igual à sua RA no teste de Precisão.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1100, "categoria": "Pesada", "suplemento": "Tecno-Fantasia", "precisao": "【VIG + VIG】", "dano": "RA + 14", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Quando usar esta arma com Trespassar (Livro Básico, p. 215) e atingir o alvo, você pode escolher duas das opções, em vez de uma. Se escolher apenas uma opção, o alvo perde uma quantidade de PV igual à sua RA no teste de Precisão.", "efeitos": ["Quando usar esta arma com Trespassar e atingir o alvo, escolha 2 opções em vez de uma."]}'::jsonb
),
-- Bucólica (Anexo 10 e 11)
(
    'Concha',
    'arma',
    500,
    'Arremessável ✦ Uma mão ✦ À distância ✦ Se tiver o poder Feito com Amor (página 149), considere seu NP nele como se fosse 1 ponto maior (até um máximo de NP 4).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 500, "categoria": "Arremesso", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】", "dano": "RA + 8", "tipo_dano": "fisico", "alcance": "À distância", "maos": "Uma mão", "marcial": false, "efeito": "Se tiver o poder Feito com Amor (página 149), considere seu NP nele como se fosse 1 ponto maior (até um máximo de NP 4).", "efeitos": ["Se tiver o poder Feito com Amor (página 149), considere seu NP nele como se fosse 1 ponto maior (até um máximo de NP 4)."]}'::jsonb
),
(
    'Câmera Obscura',
    'arma',
    600,
    'Arcana ✦ Duas mãos ✦ Corpo a corpo ✦ Ao rolar 13 ou mais em um teste feito para examinar um ou mais inimigos que você possa ver, se tiver o poder Imitação Mágica (Livro Básico, página 219), escolha um desses inimigos. Se o inimigo escolhido souber um ou mais feitiços, você pode aprender um deles como se fosse um feitiço de quimerista.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 600, "categoria": "Arcana", "suplemento": "Fantasia Bucólica", "precisao": "【AST + AST】", "dano": "RA + 6", "tipo_dano": "trevas", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": false, "efeito": "Ao rolar 13 ou mais em um teste feito para examinar inimigos, se tiver Imitação Mágica, pode aprender um feitiço conhecido por um desses inimigos como quimerista.", "efeitos": ["Ao rolar 13 ou mais em exame, pode aprender feitiço do alvo como quimerista."]}'::jsonb
),
(
    'Memorialis',
    'arma',
    700,
    'Lança ✦ Duas mãos ✦ Corpo a corpo ✦ Ao usar Cascata (página 155), você recupera 5 PM.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 700, "categoria": "Lança", "suplemento": "Fantasia Bucólica", "precisao": "【DES + VIG】 +1", "dano": "RA + 12", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Ao usar Cascata (página 155), você recupera 5 PM.", "efeitos": ["Ao usar Cascata (página 155), você recupera 5 PM."]}'::jsonb
),
(
    'Leque das Chamas',
    'arma',
    800,
    'Luta ✦ Uma mão ✦ Corpo a corpo ✦ Suas invocações que tiverem como alvo duas ou mais criaturas causam dano adicional igual ao seu NP em Invocações Conectadas (página 155).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 800, "categoria": "Luta", "suplemento": "Fantasia Bucólica", "precisao": "【DES + VIG】 +1", "dano": "RA + 6", "tipo_dano": "fogo", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": false, "efeito": "Suas invocações que tiverem como alvo duas ou mais criaturas causam dano adicional igual ao seu NP em Invocações Conectadas (página 155).", "efeitos": ["Suas invocações com múltiplos alvos causam +NP de dano de fogo."]}'::jsonb
),
(
    'Garrucha',
    'arma',
    800,
    'Arma de fogo ✦ Uma mão ✦ À distância ✦ O primeiro ataque que você fizer com esta arma em cada cena causa 5 pontos de dano adicional. Além disso, mesmo que baseada na pistola, esta arma não é marcial (✦).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 800, "categoria": "Arma de fogo", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 8", "tipo_dano": "fisico", "alcance": "À distância", "maos": "Uma mão", "marcial": false, "efeito": "O primeiro ataque feito com esta arma em cada cena causa 5 pontos de dano adicional. Esta arma não é marcial.", "efeitos": ["O primeiro ataque em cada cena causa +5 de dano adicional."]}'::jsonb
),
(
    'Balança de Bronze',
    'arma',
    900,
    'Arcana ✦ Duas mãos ✦ Corpo a corpo ✦ Após fazer um teste de Magia, se o valor de um dos dados for um múltiplo do valor do outro, você recupera PI equivalentes à metade do seu NP em Ventos do Comércio (página 159).',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 900, "categoria": "Arcana", "suplemento": "Fantasia Bucólica", "precisao": "【AST + AST】", "dano": "RA + 6", "tipo_dano": "terra", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": false, "efeito": "Após fazer um teste de Magia, se um dado for múltiplo do outro, recupere PI igual à metade do NP em Ventos do Comércio.", "efeitos": ["Após teste de Magia com dados múltiplos, recupera PI."]}'::jsonb
),
(
    'Garfo Gigante',
    'arma',
    1000,
    'Lança ✦ Duas mãos ✦ Corpo a corpo ✦ Ao usar esta arma com o poder Garfo e Faca (página 149), você pode somar sua RA ao dano do ataque (você não precisa considerá-la como se fosse igual a 0).',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1000, "categoria": "Lança", "suplemento": "Fantasia Bucólica", "precisao": "【DES + VIG】", "dano": "RA + 16", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Ao usar com o poder Garfo e Faca (página 149), você soma sua RA ao dano (não precisa considerá-la como 0).", "efeitos": ["Pode somar RA ao dano de Garfo e Faca."]}'::jsonb
),
(
    'Pulso Firme',
    'arma',
    1200,
    'Luta ✦ Uma mão ✦ Corpo a corpo ✦ Enquanto o dado atual de um dos seus atributos for maior que o dado básico deste atributo, seus ataques com esta arma causam dano adicional igual ao seu NP em Resistir (Livro Básico, página 201).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1200, "categoria": "Luta", "suplemento": "Fantasia Bucólica", "precisao": "【DES + VIG】 +1", "dano": "RA + 10", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": true, "efeito": "Enquanto o dado atual de um dos seus atributos for maior que o básico, causa dano adicional igual ao seu NP em Resistir.", "efeitos": ["Causa dano adicional igual ao NP em Resistir se atributo atual > básico."]}'::jsonb
),
(
    'RNGerador',
    'arma',
    1200,
    'Arremesso ✦ Uma mão ✦ À distância ✦ Quando você lançar o feitiço Apostar (Livro Básico, p. 192), se tiver o poder Sete da Sorte (Livro Básico, p. 191), pode usá-lo para substituir um dos dados que rolou. Isso conta como o uso de Sete da Sorte dessa cena.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1200, "categoria": "Arremesso", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】", "dano": "RA + 8", "tipo_dano": "trevas", "alcance": "À distância", "maos": "Uma mão", "marcial": false, "efeito": "Ao lançar Apostar, se tiver Sete da Sorte, pode usá-lo para substituir um dos dados rolados (conta como uso da cena).", "efeitos": ["Permite usar Sete da Sorte ao lançar o feitiço Apostar."]}'::jsonb
),
(
    'Osso de víbora',
    'arma',
    1200,
    'Adaga ✦ Uma mão ✦ Corpo a corpo ✦ Ataques com esta arma causam 5 pontos de dano adicional desde que não seja o seu turno.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1200, "categoria": "Adaga", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 8", "tipo_dano": "veneno", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": false, "efeito": "Ataques com esta arma causam 5 pontos de dano adicional desde que não seja o seu turno.", "efeitos": ["Ataques fora do seu turno causam +5 de dano adicional."]}'::jsonb
),
(
    'Sonho da Borboleta',
    'arma',
    1300,
    'Espada ✦ Uma mão ✦ Corpo a corpo ✦ Ao atingir uma ou mais criaturas com esta arma, se estiver com três ou mais seções preenchidas em seu Relógio Mental (página 152), você pode apagar 1.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1300, "categoria": "Espada", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 10", "tipo_dano": "ar", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": true, "efeito": "Ao atingir uma ou mais criaturas com esta arma, se estiver com 3+ seções no Relógio Mental, você pode apagar 1.", "efeitos": ["Apaga 1 seção do Relógio Mental se tiver 3+ seções preenchidas ao atingir."]}'::jsonb
),
(
    'Espremedor Estival',
    'arma',
    1300,
    'Pesada ✦ Duas mãos ✦ Corpo a corpo ✦ Ao atingir apenas uma criatura com esta arma, se essa criatura for uma planta, o ataque causa 10 de dano adicional. Então, se essa criatura estiver em crise, você e todos os aliados que possam vê-lo recuperam uma quantidade de PM igual à sua RA no teste de Precisão.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1300, "categoria": "Pesada", "suplemento": "Fantasia Bucólica", "precisao": "【VIG + VIG】", "dano": "RA + 18", "tipo_dano": "gelo", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Causa +10 de dano contra plantas. Se o alvo estiver em crise, você e aliados visíveis recuperam PM igual à sua RA.", "efeitos": ["+10 de dano contra plantas e recupera PM igual à RA se alvo estiver em crise."]}'::jsonb
),
(
    'Azotóforo',
    'arma',
    1400,
    'Adaga ✦ Uma mão ✦ Corpo a corpo ✦ Feitiços que causam dano de gelo lançados por você causam 5 pontos de dano adicional.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1400, "categoria": "Adaga", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 8", "tipo_dano": "gelo", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": false, "efeito": "Feitiços que causam dano de gelo lançados por você causam 5 pontos de dano adicional.", "efeitos": ["Feitiços de gelo causam +5 de dano adicional."]}'::jsonb
),
(
    'Norimitsu',
    'arma',
    1400,
    'Espada ✦ Duas mãos ✦ Corpo a corpo ✦ Ataques com esta arma causam 6 pontos de dano adicional a inimigos de patente elite ou campeão.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1400, "categoria": "Espada", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 14", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Ataques com esta arma causam 6 pontos de dano adicional a inimigos de patente elite ou campeão.", "efeitos": ["Causa +6 de dano adicional a inimigos elite ou campeão."]}'::jsonb
),
(
    'Barril',
    'arma',
    1500,
    'Pesada ✦ Duas mãos ✦ Corpo a corpo ✦ Ao acertar uma ou mais criaturas com esta arma, você pode gastar 1 Ponto de Comércio (página 159). Se fizer isso, o ataque causa dano adicional igual a 【5 × seu NP em Estoque Pessoal】.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1500, "categoria": "Pesada", "suplemento": "Fantasia Bucólica", "precisao": "【VIG + VIG】", "dano": "RA + 18", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Ao acertar, gaste 1 Ponto de Comércio para causar dano adicional igual a 5 × seu NP em Estoque Pessoal.", "efeitos": ["Gaste 1 Ponto de Comércio para somar 5 × NP em Estoque Pessoal ao dano."]}'::jsonb
),
(
    'Pilar Sísmico',
    'arma',
    1600,
    'Pesada ✦ Duas mãos ✦ Corpo a corpo ✦ Dano causado por esta arma a criaturas cujo tipo de dado de Vigor seja menor que o seu ignora Imunidades e Resistências.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1600, "categoria": "Pesada", "suplemento": "Fantasia Bucólica", "precisao": "【VIG + AST】", "dano": "RA + 18", "tipo_dano": "terra", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Dano causado por esta arma a criaturas com dado de Vigor menor que o seu ignora Imunidades e Resistências.", "efeitos": ["Ignora Resistências e Imunidades contra criaturas com Vigor menor."]}'::jsonb
),
(
    'Cajado Cata-vento',
    'arma',
    1600,
    'Arcana ✦ Duas mãos ✦ Corpo a corpo ✦ Se um de seus feitiços ou invocações (p. 159) causar dano de ar, ele causa 10 pontos de dano adicional.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1600, "categoria": "Arcana", "suplemento": "Fantasia Bucólica", "precisao": "【VON + VON】", "dano": "RA + 6", "tipo_dano": "ar", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": false, "efeito": "Se um de seus feitiços ou invocações (p. 159) causar dano de ar, ele causa 10 pontos de dano adicional.", "efeitos": ["Feitiços e invocações de ar causam +10 de dano adicional."]}'::jsonb
),
(
    'Caçador Voltaico',
    'arma',
    1600,
    'Arma de fogo ✦ Duas mãos ✦ À distância ✦ Depois que esta arma causar dano a uma ou mais criaturas, se ao menos uma dessas criaturas for Vulnerável a dano de raio, você pode causar 10 pontos de dano de raio a cada inimigo que você possa ver.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1600, "categoria": "Arma de fogo", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 16", "tipo_dano": "raio", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Se atingir uma criatura Vulnerável a raio, causa 10 de dano de raio a cada inimigo visível.", "efeitos": ["Causa 10 de dano de raio em área ao atingir criatura Vulnerável a raio."]}'::jsonb
),
(
    'Rifle de Precisão',
    'arma',
    1800,
    'Arma de fogo ✦ Duas mãos ✦ À Distância ✦ Se você tiver o poder Olhos de Águia (Livro Básico, p. 185), considere seu NP nele como se fosse 3 pontos maior (até um máximo de NP 8).',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1800, "categoria": "Arma de fogo", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 16", "tipo_dano": "fisico", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Se você tiver o poder Olhos de Águia, considere seu NP nele como se fosse 3 pontos maior (até máximo de NP 8).", "efeitos": ["Aumenta o NP efetivo de Olhos de Águia em +3 (máximo 8)."]}'::jsonb
),
(
    'Hirundo',
    'arma',
    1800,
    'Arco ✦ Duas mãos ✦ À distância ✦ Após usar e resolver seu poder Encorajar (Livro Básico, página 217), você pode fazer um ataque livre com esta arma. Se fizer isso, sua RA é considerada como 0 ao calcular o dano causado por este ataque.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1800, "categoria": "Arco", "suplemento": "Fantasia Bucólica", "precisao": "【DES + DES】", "dano": "RA + 12", "tipo_dano": "luz", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Após usar Encorajar, pode fazer ataque livre com esta arma (RA considerada como 0 para o dano).", "efeitos": ["Ataque livre após usar Encorajar (com RA 0)."]}'::jsonb
),
(
    'Vulcão de Trovão',
    'arma',
    3000,
    'Arma de fogo ✦ Duas mãos ✦ À distância ✦ Você pode usar a ação Poder para executar até três ataques (contra um alvo ou vários). Se o fizer, todos esses ataques seguem as regras de ataque com duas armas (Livro Básico, página 69).',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 3000, "categoria": "Arma de fogo", "suplemento": "Fantasia Bucólica", "precisao": "【DES + AST】 +1", "dano": "RA + 16", "tipo_dano": "raio", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Pode usar a ação Poder para executar até 3 ataques (seguindo as regras de ataque com duas armas).", "efeitos": ["Ação Poder para executar até 3 ataques com duas armas."]}'::jsonb
),
-- Alta Fantasia (Anexo 12 e 13)
(
    'Emissária da Justiça',
    'arma',
    600,
    'Luta ✦ Uma mão ✦ Corpo a corpo ✦ Quando usa Provocar (Livro Básico, página 201) contra uma criatura com mais PV que você, considere que você obtém um sucesso automático (sem a necessidade de teste).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 600, "categoria": "Luta", "suplemento": "Alta Fantasia", "precisao": "【DES + VIG】 +1", "dano": "RA + 6", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": false, "efeito": "Sucesso automático ao usar Provocar contra criatura com mais PV que você.", "efeitos": ["Sucesso automático em Provocar contra alvos com maior PV."]}'::jsonb
),
(
    'Arcanos Maiores',
    'arma',
    900,
    'Arremessável ✦ Uma mão ✦ À distância ✦ Quando fundir-se a um Arcano (Livro Básico, p. 180), seus testes de Precisão feitos com esta arma têm sucesso crítico se ambos os dados rolarem o mesmo valor (e não for uma falha crítica).',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 900, "categoria": "Arremesso", "suplemento": "Alta Fantasia", "precisao": "【DES + AST】", "dano": "RA + 4", "tipo_dano": "fisico", "alcance": "À distância", "maos": "Uma mão", "marcial": false, "efeito": "Quando fundir-se a um Arcano, testes de Precisão têm sucesso crítico ao rolar números iguais.", "efeitos": ["Crítico em números iguais enquanto fundido a um Arcano."]}'::jsonb
),
(
    'Midas',
    'arma',
    900,
    'Adaga ✦ Uma mão ✦ Corpo a corpo ✦ Ao usar Roubo de Alma (Livro Básico, página 213) com sucesso contra uma criatura de patente elite ou campeão, o valor do tesouro de alma obtido aumenta em 100 zênites.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 900, "categoria": "Adaga", "suplemento": "Alta Fantasia", "precisao": "【DES + AST】 +1", "dano": "RA + 4", "tipo_dano": "trevas", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": false, "efeito": "Ao usar Roubo de Alma com sucesso contra inimigo elite ou campeão, o tesouro de alma aumenta em 100z.", "efeitos": ["+100z no tesouro de alma ao usar Roubo de Alma contra elite/campeão."]}'::jsonb
),
(
    'Rabo de Quimera',
    'arma',
    900,
    'Malho ✦ Duas mãos ✦ Corpo a corpo ✦ Ataques com essa arma causam 1 ponto de dano adicional para cada espécie de criatura diferente das quais você aprendeu seus feitiços de quimerista (Livro Básico, página 219). Feitiços que foram aprendidos e depois esquecidos não contam.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 900, "categoria": "Malho", "suplemento": "Alta Fantasia", "precisao": "【DES + DES】", "dano": "RA + 12", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Causa +1 de dano para cada espécie diferente de criatura da qual aprendeu feitiços de quimerista.", "efeitos": ["+1 de dano por espécie de feitiço de quimerista aprendido."]}'::jsonb
),
(
    'Aquiles',
    'arma',
    1000,
    'Lança ✦ Uma mão ✦ Corpo a corpo ✦ Desde que seus PV atuais sejam iguais ou maiores que seus PV máximos, você fica imune a todas as condições.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1000, "categoria": "Lança", "suplemento": "Alta Fantasia", "precisao": "【DES + VIG】", "dano": "RA + 12", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": true, "efeito": "Desde que seus PV atuais sejam iguais ou maiores que seus PV máximos, você fica imune a todas as condições.", "efeitos": ["Imune a todas as condições enquanto estiver com PV cheio."]}'::jsonb
),
(
    'Bestiário',
    'arma',
    1200,
    'Arcana ✦ Duas mãos ✦ Corpo a corpo ✦ Você recebe um bônus de +2 em testes de Magia que atinjam a Defesa Mágica de criaturas das quais você conhece dois ou mais Traços. Esse bônus também se aplica a testes Opostos contra estas criaturas.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1200, "categoria": "Arcana", "suplemento": "Alta Fantasia", "precisao": "【AST + AST】", "dano": "RA + 6", "tipo_dano": "luz", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": false, "efeito": "+2 em testes de Magia contra Def. Mágica e testes Opostos contra criaturas das quais conhece 2+ Traços.", "efeitos": ["+2 em testes de Magia e Opostos se conhecer 2+ Traços do alvo."]}'::jsonb
),
(
    'Chiaroscuro',
    'arma',
    1200,
    'Arcana ✦ Duas mãos ✦ Corpo a corpo ✦ Ao aplicar um símbolo (p. 144) em uma ou mais criaturas, você pode escolher um: cada uma das criaturas recupera 5 PV; ou cada uma das criaturas perde 5 PV.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1200, "categoria": "Arcana", "suplemento": "Alta Fantasia", "precisao": "【AST + VON】", "dano": "RA + 10", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Ao aplicar um símbolo, escolha um: cada criatura afetada recupera 5 PV; ou cada criatura afetada perde 5 PV.", "efeitos": ["Cura ou drena 5 PV ao aplicar um símbolo."]}'::jsonb
),
(
    'Fio Flutuante',
    'arma',
    1200,
    'Espada ✦ Duas mãos ✦ Corpo a corpo ✦ Todo dano causado por seus feitiços com custo total de PM igual ou menor que 20 ignora Imunidades e Resistências.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1200, "categoria": "Espada", "suplemento": "Alta Fantasia", "precisao": "【DES + AST】 +1", "dano": "RA + 10", "tipo_dano": "ar", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Todo dano causado por seus feitiços com custo total de PM igual ou menor que 20 ignora Imunidades e Resistências.", "efeitos": ["Feitiços de custo até 20 PM ignoram Resistências e Imunidades."]}'::jsonb
),
(
    'Heavy Metal',
    'arma',
    1200,
    'Pesada ✦ Duas mãos ✦ Corpo a corpo ✦ Ao atacar com essa arma usando Vibratto (página 149), todo o dano causado pelo ataque torna-se do mesmo tipo que o tipo da escala do último verso cantado.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1200, "categoria": "Pesada", "suplemento": "Alta Fantasia", "precisao": "【VIG + VIG】", "dano": "RA + 14", "tipo_dano": "raio", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Ao atacar usando Vibratto, todo o dano do ataque converte-se no mesmo tipo da escala do último verso cantado.", "efeitos": ["Converte dano de Vibratto no tipo da escala do último verso cantado."]}'::jsonb
),
(
    'Valsa Sombria',
    'arma',
    1200,
    'Lança ✦ Duas mãos ✦ Corpo a corpo ✦ Após reduzir uma criatura a 0 PV com essa arma, você pode apresentar uma dança de duração “Instantânea” entre as que aprendeu (página 139). O custo de PM de uma dança apresentada dessa forma nunca pode ser menor do que 10.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1200, "categoria": "Lança", "suplemento": "Alta Fantasia", "precisao": "【DES + VIG】", "dano": "RA + 12", "tipo_dano": "fisico", "alcance": "Corpo a corpo", "maos": "Duas mãos", "marcial": true, "efeito": "Após reduzir uma criatura a 0 PV, apresente uma dança Instantânea aprendida (custo mínimo de 10 PM).", "efeitos": ["Apresenta dança Instantânea livre após abater inimigo a 0 PV."]}'::jsonb
),
(
    'Tametomo',
    'arma',
    1500,
    'Arco ✦ Duas mãos ✦ À distância ✦ Ataques com esta arma causam 5 pontos de dano adicional a criaturas lentas ou abaladas.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1500, "categoria": "Arco", "suplemento": "Alta Fantasia", "precisao": "【DES + DES】", "dano": "RA + 12", "tipo_dano": "gelo", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Ataques com esta arma causam 5 pontos de dano adicional a criaturas lentas ou abaladas.", "efeitos": ["+5 de dano adicional contra criaturas Lentas ou Abaladas."]}'::jsonb
),
(
    'Noite Eterna',
    'arma',
    1800,
    'Arco ✦ Duas mãos ✦ À distância ✦ Quando você estiver entre os alvos de um feitiço ofensivo (⚡) enquanto estiver em crise, a criatura lançando esse feitiço deve gastar PV em vez de PM para fazer isso.',
    '{"raridade": "raro", "slot": "duas_maos", "custo": 1800, "categoria": "Arco", "suplemento": "Alta Fantasia", "precisao": "【DES + DES】", "dano": "RA + 8", "tipo_dano": "trevas", "alcance": "À distância", "maos": "Duas mãos", "marcial": true, "efeito": "Quando for alvo de feitiço ofensivo em crise, o conjurador deve gastar PV em vez de PM.", "efeitos": ["Conjurador que o alvejar em crise gasta PV em vez de PM."]}'::jsonb
),
(
    'Ultimato',
    'arma',
    1800,
    'Arma de fogo ✦ Uma mão ✦ À Distância ✦ Quando você estiver entre os alvos de um feitiço ofensivo (⚡), a criatura lançando esse feitiço deve gastar 5 PM adicionais. Caso contrário, você não pode ser um alvo.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 1800, "categoria": "Arma de fogo", "suplemento": "Alta Fantasia", "precisao": "【DES + AST】 +1", "dano": "RA + 12", "tipo_dano": "terra", "alcance": "À distância", "maos": "Uma mão", "marcial": true, "efeito": "Quando for alvo de feitiço ofensivo, o conjurador deve pagar +5 PM; caso contrário, você não pode ser alvo.", "efeitos": ["Conjuradores devem gastar +5 PM para alvejá-lo com feitiço ofensivo."]}'::jsonb
),
(
    'Vingador',
    'arma',
    2000,
    'Pesada ✦ Uma mão ✦ Corpo a corpo ✦ Quando uma criatura aplica uma condição a você, ela também sofre imediatamente a mesma condição – não funciona se você for imune à condição ou se já estava sofrendo dela.',
    '{"raridade": "raro", "slot": "mao_dominante", "custo": 2000, "categoria": "Pesada", "suplemento": "Alta Fantasia", "precisao": "【VIG + VIG】", "dano": "RA + 14", "tipo_dano": "fogo", "alcance": "Corpo a corpo", "maos": "Uma mão", "marcial": true, "efeito": "Quando uma criatura aplica uma condição a você, ela também sofre imediatamente a mesma condição.", "efeitos": ["Reflete condições aplicadas de volta ao agressor."]}'::jsonb
)
ON CONFLICT (nome) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    custo = EXCLUDED.custo,
    descricao = EXCLUDED.descricao,
    stats = EXCLUDED.stats;
