-- =============================================================================
-- Migration: Classes e Catálogos Oficiais do Atlas Alta Fantasia (High Fantasy)
-- Classes: Virtuoso (Cantor), Comandante e Dançarino
-- Tabelas: catalogo_classes, catalogo_virtuoso_escalas, catalogo_virtuoso_tons, catalogo_dancas
-- =============================================================================

-- 1. Upsert das 3 classes oficiais em catalogo_classes
INSERT INTO public.catalogo_classes (nome_classe, descricao, beneficios_iniciais, habilidades_padrao)
VALUES
(
  'Virtuoso',
  'Orquestras mágicas de uma pessoa só que contam com a força de suas almas e tecem energia mágica em canções e versos para apoiar aliados e manipular o conflito. (Outros nomes: Bardo, Cantor, Idol, Trovador)',
  '{"texto": "Aumente permanentemente seus PM máximos em 5."}'::jsonb,
  '[
    {
      "nome": "Barreira Sonora",
      "nivel_maximo": 5,
      "descricao": "Após cantar um verso em um volume médio ou forte, qualquer quantidade de dano físico que você sofrer até o início do seu próximo turno é reduzido em (NP) (antes de aplicar quaisquer Afinidades a dano)."
    },
    {
      "nome": "Canto da Sereia",
      "nivel_maximo": 1,
      "descricao": "Você pode fazer rituais da disciplina ritualismo; além disso, também pode usar ritualismo para criar ilusões sonoras."
    },
    {
      "nome": "Harmonia",
      "nivel_maximo": 3,
      "descricao": "Após afetar um ou mais inimigos com um verso, se tiver uma arma arcana equipada, você pode escolher um: até o início do seu próximo turno, seus aliados causam (NP) de dano adicional a estes inimigos; ou até o início de seu próximo turno, você recupera (NP) Pontos de Mana cada vez que estes inimigos sofrerem dano (se a mesma fonte causar dano a dois ou mais inimigos ao mesmo tempo, você recupera (NP) PM para cada inimigo que sofreu esse dano)."
    },
    {
      "nome": "Magicanto",
      "nivel_maximo": 10,
      "descricao": "Em seu turno durante uma cena de conflito, você pode usar uma ação e gastar uma quantidade variável de PM para tecer sua voz e música num efeito mágico conhecido como verso. Você só pode cantar um verso por turno, mesmo se puder fazer mais de uma ação. Regras detalhadas para versos estão descritas nas pp. 150-151. Quando você adquire esse poder, você aprende todos os três volumes, além de uma escala e um tom. Sempre que adquiri-lo novamente, você pode aprender mais uma escala ou um tom (à sua escolha)."
    },
    {
      "nome": "Vibrato",
      "nivel_maximo": 1,
      "descricao": "Após cantar um verso em volume fraco ou médio, você pode fazer um ataque livre com uma arma equipada, considerando sua RA como 0 ao calcular o dano."
    }
  ]'::jsonb
),
(
  'Comandante',
  'Líderes e figuras inspiradoras que mereceram a lealdade de seus companheiros no campo de batalha por meio de vontade de ferro e talentos táticos. (Outros nomes: Príncipe, Rainha, Shôgun)',
  '{"texto": "Aumente permanentemente seus PV máximos em 5. Você pode equipar armas corpo a corpo e armas à distância marciais."}'::jsonb,
  '[
    {
      "nome": "Carga de Cavalaria",
      "nivel_maximo": 5,
      "descricao": "Em um conflito, você pode usar uma ação e gastar 10 PM para escolher um aliado que possa ouvi-lo. O aliado pode fazer imediatamente um ataque livre com uma arma equipada (ou um ataque básico, se for um NPC). Ele recebe um bônus no teste de Precisão igual ao seu (NP), mas considera sua RA como 0 ao calcular o dano causado por este ataque."
    },
    {
      "nome": "Carruagem Devastadora",
      "nivel_maximo": 1,
      "descricao": "Após usar Decreto do Bispo, Carga de Cavalaria ou Roque do Rei, você pode escolher outro PJ que possa ouvi-lo e ainda não teve seu turno nesta rodada. O turno deste personagem acontece imediatamente após o seu nesta rodada."
    },
    {
      "nome": "Decreto do Bispo",
      "nivel_maximo": 5,
      "descricao": "Em um conflito, você pode usar uma ação e gastar 10 PM para escolher um: todos os custos em PM são dobrados; ou todas as fontes de dano causam (NP × 3) de dano adicional."
    },
    {
      "nome": "Gambito da Dama",
      "nivel_maximo": 6,
      "descricao": "Em um conflito, você pode usar uma ação para fazer um ataque livre com uma arma equipada, considerando sua RA como 0 ao calcular o dano. Após o ataque ser resolvido, escolha um: você usa imediatamente um poder que possui entre Decreto do Bispo, Carga de Cavalaria ou Roque do Rei sem precisar usar uma ação (mas gasta a quantidade apropriada de PM); ou um aliado que possa ouvir você recupera (5 + (NP × 5)) PV."
    },
    {
      "nome": "Roque do Rei",
      "nivel_maximo": 4,
      "descricao": "Em um conflito, você pode usar uma ação e gastar 10 PM para escolher um: nenhuma criatura pode recuperar PV ou PM; ou todos os efeitos que restauram PM restauram (NP × 5) PM adicionais. O efeito escolhido dura até o início de seu próximo turno."
    }
  ]'::jsonb
),
(
  'Dançarino',
  'Combatentes acrobáticos e dramáticos que direcionam o fluxo das forças espirituais com movimentos precisos e repetitivos, manifestando efeitos mágicos. (Outros nomes: Acrobata, Bufão, Bucaneiro)',
  '{"texto": "Aumente permanentemente seus PV ou PM máximos em 5 (à sua escolha)."}'::jsonb,
  '[
    {
      "nome": "Dança",
      "nivel_maximo": 10,
      "descricao": "Sempre que adquirir esse poder, aprenda uma dança (pp. 140-141). Em seu turno numa cena de conflito, se não tiver uma armadura marcial equipada, você pode gastar 10 PM para apresentar uma das danças que aprendeu. Isso não exige uso de ação, mas a dança só pode ser apresentada antes ou depois da sua ação e apenas uma vez por turno. Se já apresentou uma dança diferente em seu turno anterior na mesma cena, o custo da nova dança é reduzido em 5 PM. Algumas danças têm efeito instantâneo, sendo resolvidas imediatamente; outras têm efeitos que duram até o final do seu próximo turno."
    },
    {
      "nome": "Dançarino de Guerra",
      "nivel_maximo": 5,
      "descricao": "Após apresentar uma dança, seus ataques feitos com armas das categorias adaga, arremesso, luta e malho causam (NP) pontos de dano adicional até o início de seu próximo turno. Se tiver uma arma arcana equipada, feitiços ofensivos (O) que você lançar também causam (NP) pontos de dano adicional até o início de seu próximo turno."
    },
    {
      "nome": "Me Acompanhe",
      "nivel_maximo": 1,
      "descricao": "Ao apresentar uma dança com uma duração de “até o início de seu próximo turno”, você pode gastar 10 PM adicionais. Se fizer isso, escolha um personagem com quem você tem um Laço de afeto: o aliado também recebe os benefícios da dança como se fosse você (e tais benefícios duram até o início de seu próximo turno)."
    },
    {
      "nome": "Sapateado Frenético",
      "nivel_maximo": 2,
      "descricao": "Ao apresentar uma dança com uma duração de “até o início de seu próximo turno”, todos os testes opostos que dependam de acrobacia, coordenação ou velocidade recebem um bônus igual a (NP × 2) até o início de seu próximo turno."
    },
    {
      "nome": "Troca de Figurino",
      "nivel_maximo": 1,
      "descricao": "Após apresentar uma dança, você pode fazer a ação Equipamento sem usar ações."
    }
  ]'::jsonb
)
ON CONFLICT (nome_classe) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  beneficios_iniciais = EXCLUDED.beneficios_iniciais,
  habilidades_padrao = EXCLUDED.habilidades_padrao;

-- 2. Catálogo de Escalas (Chaves) do Virtuoso / Cantor
CREATE TABLE IF NOT EXISTS public.catalogo_virtuoso_escalas (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  tipo_dano TEXT NOT NULL,
  condicao TEXT NOT NULL,
  atributo TEXT NOT NULL,
  recuperacao TEXT NOT NULL,
  fonte TEXT NOT NULL DEFAULT 'Atlas Alta Fantasia'
);

ALTER TABLE public.catalogo_virtuoso_escalas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalogo_virtuoso_escalas'
      AND policyname = 'Leitura publica catalogo_virtuoso_escalas'
  ) THEN
    CREATE POLICY "Leitura publica catalogo_virtuoso_escalas"
      ON public.catalogo_virtuoso_escalas
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

INSERT INTO public.catalogo_virtuoso_escalas (key, nome, tipo_dano, condicao, atributo, recuperacao, fonte)
VALUES
  ('chama', 'Chama', 'fogo', 'abalado', 'Vigor', 'PV', 'Atlas Alta Fantasia'),
  ('geada', 'Geada', 'gelo', 'fraco', 'Vontade', 'PM', 'Atlas Alta Fantasia'),
  ('ferro', 'Ferro', 'físico', 'lento', 'Vontade', 'PM', 'Atlas Alta Fantasia'),
  ('resplendor', 'Resplendor', 'luz', 'atordoado', 'Astúcia', 'PV', 'Atlas Alta Fantasia'),
  ('sombra', 'Sombra', 'trevas', 'fraco', 'Destreza', 'PM', 'Atlas Alta Fantasia'),
  ('pedra', 'Pedra', 'terra', 'atordoado', 'Vigor', 'PV', 'Atlas Alta Fantasia'),
  ('trovao', 'Trovão', 'raio', 'abalado', 'Destreza', 'PV', 'Atlas Alta Fantasia'),
  ('vento', 'Vento', 'ar', 'lento', 'Astúcia', 'PM', 'Atlas Alta Fantasia')
ON CONFLICT (key) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo_dano = EXCLUDED.tipo_dano,
  condicao = EXCLUDED.condicao,
  atributo = EXCLUDED.atributo,
  recuperacao = EXCLUDED.recuperacao,
  fonte = EXCLUDED.fonte;

-- 3. Catálogo de Tons do Virtuoso / Cantor
CREATE TABLE IF NOT EXISTS public.catalogo_virtuoso_tons (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  fonte TEXT NOT NULL DEFAULT 'Atlas Alta Fantasia'
);

ALTER TABLE public.catalogo_virtuoso_tons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalogo_virtuoso_tons'
      AND policyname = 'Leitura publica catalogo_virtuoso_tons'
  ) THEN
    CREATE POLICY "Leitura publica catalogo_virtuoso_tons"
      ON public.catalogo_virtuoso_tons
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

INSERT INTO public.catalogo_virtuoso_tons (key, nome, descricao, fonte)
VALUES
  ('agitado', 'Agitado', 'Cada alvo sofre dano de (tipo da escala) equivalente ao dobro de seu dado atual de Vontade. Se você estiver no 20° nível ou acima, esse dano aumenta em 10; se estiver no 40° nível ou acima, esse dano aumenta em 20.', 'Atlas Alta Fantasia'),
  ('ameacador', 'Ameaçador', 'Na primeira vez que o alvo sofrer dano antes do início do seu próximo turno, esse dano se torna (tipo da escala). Esse efeito pode se ativar separadamente, uma vez para cada alvo do verso.', 'Atlas Alta Fantasia'),
  ('animado', 'Animado', 'Até o início do seu próximo turno, quando um alvo passar em um teste com (atributo da escala) que o permita avançar ou recuar um Relógio, o alvo pode preencher ou apagar uma seção adicional deste Relógio.', 'Atlas Alta Fantasia'),
  ('calmo', 'Calmo', 'Cada alvo recupera (recuperação da escala) igual a (10 + o dobro de seu dado de Vontade). Se você estiver no 20° nível ou acima, essa quantidade aumenta em 10; se estiver no 40° nível ou acima, essa quantidade aumenta em 20. Se esse tom recuperar PM, ele não afeta o personagem que o cantar.', 'Atlas Alta Fantasia'),
  ('morbido', 'Mórbido', 'Cada alvo sofre (condição da escala) e também perde sua Resistência a dano de (tipo da escala) (se a tiver) até o início de seu próximo turno.', 'Atlas Alta Fantasia'),
  ('solene', 'Solene', 'Cada alvo se recupera de (condição da escala) e também torna-se Resistente a dano de (tipo da escala) até o início de seu próximo turno.', 'Atlas Alta Fantasia'),
  ('vibrante', 'Vibrante', 'Cada alvo trata seu (atributo da escala) como sendo um tipo maior (até o máximo de d12) até o início de seu próximo turno.', 'Atlas Alta Fantasia')
ON CONFLICT (key) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  fonte = EXCLUDED.fonte;

-- 4. Catálogo de Danças do Dançarino
CREATE TABLE IF NOT EXISTS public.catalogo_dancas (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  duracao TEXT NOT NULL,
  tipo_duracao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  fonte TEXT NOT NULL DEFAULT 'Atlas Alta Fantasia'
);

ALTER TABLE public.catalogo_dancas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalogo_dancas'
      AND policyname = 'Leitura publica catalogo_dancas'
  ) THEN
    CREATE POLICY "Leitura publica catalogo_dancas"
      ON public.catalogo_dancas
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

INSERT INTO public.catalogo_dancas (key, nome, duracao, tipo_duracao, descricao, fonte)
VALUES
  ('danca_anjo', 'Dança do Anjo', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de luz; ou todos os danos causados por seus ataques e magias se tornam dano de luz.', 'Atlas Alta Fantasia'),
  ('danca_banshee', 'Dança da Banshee', 'Instantânea', 'instantanea', 'Escolha uma criatura que possa ver você. Se ela já estiver lenta, imediatamente fica abalada.', 'Atlas Alta Fantasia'),
  ('danca_fenix', 'Dança da Fênix', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de fogo; ou todos os danos causados por seus ataques e magias se tornam dano de fogo.', 'Atlas Alta Fantasia'),
  ('danca_golem', 'Dança do Golem', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de raio; ou todos os danos causados por seus ataques e magias se tornam dano de raio.', 'Atlas Alta Fantasia'),
  ('danca_grifo', 'Dança do Grifo', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de ar; ou todos os danos causados por seus ataques e magias se tornam dano de ar.', 'Atlas Alta Fantasia'),
  ('danca_hidra', 'Dança da Hidra', 'Até o início do seu próximo turno', 'turno', 'Após sofrer dano, escolha um: você recupera 5 PV; ou você recupera 5 PM.', 'Atlas Alta Fantasia'),
  ('danca_ieti', 'Dança do Ieti', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de gelo; ou todos os danos causados por seus ataques e magias se tornam do tipo gelo.', 'Atlas Alta Fantasia'),
  ('danca_kraken', 'Dança do Kraken', 'Instantânea', 'instantanea', 'Escolha uma criatura que possa ver você. Se ela já estiver atordoada, imediatamente fica lenta.', 'Atlas Alta Fantasia'),
  ('danca_leao', 'Dança do Leão', 'Instantânea', 'instantanea', 'Você se recupera imediatamente de uma única condição à sua escolha.', 'Atlas Alta Fantasia'),
  ('danca_menade', 'Dança da Mênade', 'Instantânea', 'instantanea', 'Escolha uma criatura que possa ver você. Essa criatura perde uma quantidade de PM igual ao seu dado atual de Destreza.', 'Atlas Alta Fantasia'),
  ('danca_mirmidao', 'Dança do Mirmidão', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de terra; ou todos os danos causados por seus ataques e magias se tornam dano de terra.', 'Atlas Alta Fantasia'),
  ('danca_morcego', 'Dança do Morcego', 'Até o início do seu próximo turno', 'turno', 'Escolha um: você se torna Resistente a dano de trevas; ou todos os danos causados por seus ataques e magias se tornam dano de trevas.', 'Atlas Alta Fantasia'),
  ('danca_ouroboros', 'Dança do Ouroboros', 'Instantânea', 'instantanea', 'Escolha um aliado que você possa ver e ainda não teve seu turno nesta rodada. O turno desse aliado acontece imediatamente após o seu nesta rodada.', 'Atlas Alta Fantasia'),
  ('danca_pavao', 'Dança do Pavão', 'Instantânea', 'instantanea', 'Escolha uma criatura que possa ver você. Da próxima vez nesta cena que ela fizer um ataque ou lançar um feitiço ofensivo (O), esse ataque ou feitiço deve ter você entre os alvos, se possível.', 'Atlas Alta Fantasia'),
  ('danca_pesadelo', 'Dança do Pesadelo', 'Instantânea', 'instantanea', 'Escolha uma criatura que possa ver você. Se ela já estiver abalada, imediatamente fica fraca.', 'Atlas Alta Fantasia'),
  ('danca_satiro', 'Dança do Sátiro', 'Instantânea', 'instantanea', 'Escolha uma criatura que possa ver você. Se ela já estiver fraca, imediatamente fica atordoada.', 'Atlas Alta Fantasia'),
  ('danca_unicornio', 'Dança do Unicórnio', 'Instantânea', 'instantanea', 'Escolha um aliado que possa vê-lo e que tenha um Laço com você: vocês dois recuperam uma quantidade de PV igual ao seu dado atual de Destreza. Se você estiver no 20° nível ou acima, essa quantidade aumenta em 5 PV; se estiver no 40° nível ou acima, essa quantidade aumenta em 10 PV.', 'Atlas Alta Fantasia')
ON CONFLICT (key) DO UPDATE SET
  nome = EXCLUDED.nome,
  duracao = EXCLUDED.duracao,
  tipo_duracao = EXCLUDED.tipo_duracao,
  descricao = EXCLUDED.descricao,
  fonte = EXCLUDED.fonte;

-- 5. Colunas JSONB opcionais na ficha para dados específicos de Alta Fantasia
ALTER TABLE public.fichas_personagens
  ADD COLUMN IF NOT EXISTS dados_virtuoso JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dados_comandante JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dados_dancarino JSONB DEFAULT NULL;

COMMENT ON COLUMN public.fichas_personagens.dados_virtuoso IS 'Escalas/Tons aprendidos e último verso cantado da classe Virtuoso (Cantor)';
COMMENT ON COLUMN public.fichas_personagens.dados_comandante IS 'Estado tático e registros de ordens da classe Comandante';
COMMENT ON COLUMN public.fichas_personagens.dados_dancarino IS 'Benefício inicial (+5 PV/+5 PM), danças aprendidas e dança ativa da classe Dançarino';
