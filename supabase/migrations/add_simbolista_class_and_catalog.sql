-- =============================================================================
-- Migration: Classe Simbolista e Catálogo de Símbolos (Atlas Alta Fantasia)
-- Tabelas: catalogo_classes, catalogo_simbolista_simbolos, fichas_personagens
-- =============================================================================

-- 1. Upsert da classe Simbolista em catalogo_classes
INSERT INTO public.catalogo_classes (nome_classe, descricao, beneficios_iniciais, habilidades_padrao)
VALUES (
  'Simbolista',
  'Estudiosos e artistas que tecem energias sobrenaturais em sigilos, runas, pinturas e talismãs para fortalecer aliados, enfraquecer inimigos e manipular a magia no campo de batalha. (Outros nomes: Calígrafo, Pintor, Runomante)',
  '{"texto": "Aumente permanentemente seus PI máximos em 2."}'::jsonb,
  '[
    {
      "nome": "Conexão Simbólica",
      "nivel_maximo": 1,
      "descricao": "Você sempre sabe a direção exata de qualquer criatura que esteja com um de seus símbolos, desde que ela esteja a até 2 dias de viagem de sua posição."
    },
    {
      "nome": "Miragem",
      "nivel_maximo": 1,
      "descricao": "Você pode fazer rituais da disciplina ritualismo; além disso, também pode usar ritualismo para criar ilusões visuais."
    },
    {
      "nome": "Simbolismo",
      "nivel_maximo": 5,
      "descricao": "Sempre que adquirir este poder, aprenda dois símbolos (pp. 144-147). Você pode ter até (NP + 1) símbolos ativos ao mesmo tempo; se criar mais símbolos além desse limite, antes deve escolher um de seus símbolos ativos para destruir. Você pode fazer a ação Inventário e gastar 2 PI para criar um dos símbolos que aprendeu e escolher um: aplicar esse símbolo em si mesmo; ou aplicar esse símbolo num aliado que você consegue ver; ou fazer um ataque livre usando uma arma equipada. Esse ataque não causa dano, mas você aplica uma cópia do símbolo escolhido a cada inimigo que atingir (cada cópia conta como um símbolo individual para seu limite de (NP + 1) símbolos ativos)."
    },
    {
      "nome": "Símbolos Mágicos",
      "nivel_maximo": 3,
      "descricao": "Se um aliado estiver com um de seus símbolos, ele pode fazer a ação Feitiço para destruir o símbolo e lançar um único feitiço entre aqueles que você conhece. Para isso, o custo total em PM do feitiço deve ser igual ou menor a (NP × 10) (e o aliado ainda deve pagar o custo de PM)."
    },
    {
      "nome": "Toque Pessoal",
      "nivel_maximo": 5,
      "descricao": "Quando uma criatura que você possa ver e que esteja com um de seus símbolos sofrer dano ou recuperar PV e/ou PM, você pode fazer a criatura sofrer (NP) de dano adicional (ou recuperar (NP) PV e/ou PM, respectivamente)."
    }
  ]'::jsonb
)
ON CONFLICT (nome_classe) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  beneficios_iniciais = EXCLUDED.beneficios_iniciais,
  habilidades_padrao = EXCLUDED.habilidades_padrao;

-- 2. Catálogo de Símbolos / Sigilos do Simbolista
CREATE TABLE IF NOT EXISTS public.catalogo_simbolista_simbolos (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  requer_escolha BOOLEAN NOT NULL DEFAULT false,
  tipo_escolha TEXT,
  opcoes_escolha JSONB NOT NULL DEFAULT '[]'::jsonb,
  efeito_resumido TEXT,
  descricao TEXT NOT NULL,
  fonte TEXT NOT NULL DEFAULT 'Atlas Alta Fantasia'
);

ALTER TABLE public.catalogo_simbolista_simbolos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalogo_simbolista_simbolos'
      AND policyname = 'Leitura publica catalogo_simbolista_simbolos'
  ) THEN
    CREATE POLICY "Leitura publica catalogo_simbolista_simbolos"
      ON public.catalogo_simbolista_simbolos
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

INSERT INTO public.catalogo_simbolista_simbolos (key, nome, requer_escolha, tipo_escolha, opcoes_escolha, efeito_resumido, descricao, fonte)
VALUES
  (
    'simbolo_amarras',
    'Símbolo das Amarras',
    false,
    NULL,
    '[]'::jsonb,
    'Trava atributos no dado básico',
    'O dado atual dos Atributos da criatura com este símbolo nunca pode ser maior que os respectivos dados básicos (isso não encerra qualquer efeito ou feitiço, mas impede sua influência sobre os Atributos da criatura).',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_crescimento',
    'Símbolo do Crescimento',
    false,
    NULL,
    '[]'::jsonb,
    'Magias até 3 alvos → 4 alvos',
    'Magias com “até três criaturas” como alvo que forem lançadas pela criatura com este símbolo passam a ter “até quatro criaturas” como alvo. A criatura ainda deve gastar a quantidade de PM necessária para atingir um quarto alvo.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_criacao',
    'Símbolo da Criação',
    false,
    NULL,
    '[]'::jsonb,
    'Destruir para ignorar custo de PI',
    'Quando a criatura com este símbolo precisar gastar Pontos de Inventário em um conflito, ela pode destruir este símbolo para não precisar gastar PI.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_desespero',
    'Símbolo do Desespero',
    false,
    NULL,
    '[]'::jsonb,
    'Recupera metade de PV/PM',
    'Quando a criatura com este símbolo recuperar PV e/ou PM durante conflitos, ela recupera apenas a metade da quantidade normal de PV e/ou PM.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_destino',
    'Símbolo do Destino',
    false,
    NULL,
    '[]'::jsonb,
    '1 PF: força rerrolagem de teste',
    'Depois que a criatura com este símbolo fizer um teste, se você puder vê-la, pode gastar 1 Ponto de Fabula para forçá-la a rolar novamente ambos os dados. Isso só pode ser feito uma vez por teste e apenas se o resultado não for um sucesso crítico ou uma falha crítica.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_elementos',
    'Símbolo dos Elementos',
    true,
    'elemento',
    '["ar","fogo","gelo","luz","raio","terra","trevas","veneno"]'::jsonb,
    'Gasta 1/3 dano em PM para converter tipo',
    'Ao criar este símbolo, escolha um tipo de dano: ar, fogo, gelo, luz, raio, terra, trevas ou veneno. Se puder ver a criatura com este símbolo quando ela causar dano a uma ou mais criaturas, você pode gastar um número de PM igual a um terço do total de dano causado (incluindo quaisquer fontes de dano adicional). Se fizer isso, todo dano causado dessa forma se transforma em dano do tipo escolhido na criação deste símbolo.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_feiticaria',
    'Símbolo da Feitiçaria',
    false,
    NULL,
    '[]'::jsonb,
    '-5 PM em magias contra o alvo',
    'O custo total em PM de magias que têm a criatura com este símbolo como alvo é reduzido em 5 PM (até o custo mínimo de 5 PM). Se o feitiço tiver mais de uma criatura com esse símbolo como alvo, o efeito é cumulativo.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_fluxo',
    'Símbolo do Fluxo',
    true,
    'condicao_fluxo',
    '["abalado (Imune)","atordoado (Imune)","lento (Imune)","fraco (Imune)","abalado (Remove Imunidade)","atordoado (Remove Imunidade)","lento (Remove Imunidade)","fraco (Remove Imunidade)"]'::jsonb,
    'Concede ou remove Imunidade a condição',
    'Ao criar este símbolo, escolha uma condição: abalado, atordoado, lento ou fraco. Então, escolha um: a criatura com este símbolo torna-se Imune à condição escolhida; ou a criatura com este símbolo perde sua Imunidade à condição escolhida e não pode recuperá-la.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_fraqueza',
    'Símbolo da Fraqueza',
    true,
    'elemento',
    '["ar","fogo","gelo","luz","raio","terra","trevas","veneno"]'::jsonb,
    '+5 de dano do tipo escolhido',
    'Ao criar esse símbolo, escolha um tipo de dano: ar, fogo, gelo, luz, raio, terra, trevas ou veneno. A criatura com este símbolo sofre 5 pontos de dano adicional de fontes causando dano do tipo escolhido.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_inimizade',
    'Símbolo da Inimizade',
    false,
    NULL,
    '[]'::jsonb,
    'Em crise, atrai ataques/feitiços',
    'Enquanto a criatura com este símbolo estiver em crise, qualquer inimigo da criatura que possa vê-la deve incluí-la entre os alvos de seus ataques e magias ofensivas (O), se possível.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_metamorfose',
    'Símbolo da Metamorfose',
    true,
    'especie',
    '["fera","construto","demônio","elemental","monstro","planta","morto-vivo"]'::jsonb,
    'Altera espécie para efeitos/poderes',
    'Ao criar esse símbolo, escolha uma espécie: fera, construto, demônio, elemental, monstro, planta ou morto-vivo. A criatura com este símbolo é considerada como pertencente à espécie escolhida para efeitos e poderes, em vez da sua espécie original (o símbolo não altera mais nada na ficha da criatura, como Afinidades ou quaisquer regras especiais). Esse símbolo não pode ser aplicado a PJs.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_proibicao',
    'Símbolo da Proibição',
    true,
    'acao',
    '["Ataque","Guarda","Feitiço","Objetivo","Poder"]'::jsonb,
    'Perde 5/15/25 PV e PM antes da ação',
    'Ao criar este símbolo, escolha uma ação: Ataque, Guarda, Feitiço, Objetivo ou Poder. Quando a criatura com este símbolo fizer a ação escolhida, ela perde 5 PV e 5 PM (antes de fazer a ação). Se você estiver no 20° nível ou acima, ambos os valores aumentam em 10; se estiver no 40° nível ou acima, ambos os valores aumentam em 20.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_prosperidade',
    'Símbolo da Prosperidade',
    false,
    NULL,
    '[]'::jsonb,
    '+100z ao invocar Traço ou Laço',
    'Quando a criatura com este símbolo gastar 1 Ponto de Fabula para invocar um Traço ou Laço, ela também recebe 100 zênites.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_protecao',
    'Símbolo da Proteção',
    true,
    'elemento',
    '["ar","fogo","gelo","luz","raio","terra","trevas","veneno"]'::jsonb,
    'Resistência ao tipo de dano escolhido',
    'Ao criar este símbolo, escolha um tipo de dano: ar, fogo, gelo, luz, raio, terra, trevas ou veneno. A criatura com este símbolo se torna Resistente ao tipo de dano escolhido.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_rebeliao',
    'Símbolo da Rebelião',
    false,
    NULL,
    '[]'::jsonb,
    'Crítico em testes opostos contra Vilão',
    'Se um vilão estiver na cena, quaisquer testes opostos feitos pela criatura com este símbolo têm sucesso crítico quando ambos os dados exibirem o mesmo número (desde que o resultado do teste não seja uma falha crítica).',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_renascimento',
    'Símbolo do Renascimento',
    false,
    NULL,
    '[]'::jsonb,
    'Destruir ao zerar PV para ficar com 1 PV',
    'Se a criatura com este símbolo estiver prestes a chegar a 0 PV, ela pode destruir este símbolo: se fizer isso, seus PV são reduzidos exatamente para 1 em vez disso.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_sacrificio',
    'Símbolo do Sacrifício',
    false,
    NULL,
    '[]'::jsonb,
    'Simbolista absorve dano ao destruir',
    'Quando uma criatura com este símbolo sofrer dano, se puder vê-la, você pode destruir este símbolo: se o fizer, em vez da criatura, você sofre a mesma quantidade de dano que ela receberia.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_verdade',
    'Símbolo da Verdade',
    false,
    NULL,
    '[]'::jsonb,
    '+2 Exame, Precisão e Magia contra alvo',
    'Testes feitos para examinar ou localizar a criatura com este símbolo, bem como testes de Precisão e testes de Magia para ataques e feitiços ofensivos (O) que a tiverem entre seus alvos, recebem um bônus de +2. Se um ataque ou feitiço tiver mais de uma criatura com este símbolo como alvo, o efeito é cumulativo.',
    'Atlas Alta Fantasia'
  ),
  (
    'simbolo_vinganca',
    'Símbolo da Vingança',
    false,
    NULL,
    '[]'::jsonb,
    'Atacante em crise recupera 5 PV e 5 PM',
    'Quando uma criatura em crise atingir a criatura com este símbolo com um ataque ou um feitiço ofensivo (O), a criatura em crise recupera 5 PV e 5 PM.',
    'Atlas Alta Fantasia'
  )
ON CONFLICT (key) DO UPDATE SET
  nome = EXCLUDED.nome,
  requer_escolha = EXCLUDED.requer_escolha,
  tipo_escolha = EXCLUDED.tipo_escolha,
  opcoes_escolha = EXCLUDED.opcoes_escolha,
  efeito_resumido = EXCLUDED.efeito_resumido,
  descricao = EXCLUDED.descricao,
  fonte = EXCLUDED.fonte;

-- 3. Coluna JSONB opcional na ficha para dados do Simbolista
ALTER TABLE public.fichas_personagens
  ADD COLUMN IF NOT EXISTS dados_simbolista JSONB DEFAULT NULL;

COMMENT ON COLUMN public.fichas_personagens.dados_simbolista IS 'Símbolos aprendidos, símbolos ativos em cena e selo ritual da classe Simbolista';
