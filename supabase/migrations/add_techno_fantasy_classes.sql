-- =============================================================================
-- Migration: Adicionar Classes Oficiais do Techno Fantasy Atlas
-- Classes: Esper, Mutante e Piloto
-- Tabela: catalogo_classes
-- =============================================================================

-- 1. Classe Esper
INSERT INTO catalogo_classes (nome_classe, descricao, beneficios_iniciais, habilidades_padrao)
VALUES (
    'Esper',
    'Sensitivos mentais capazes de sintonizar a rede de almas e manifestar poderes psíquicos impressionantes, projetando campos cinéticos, telepatia e alterando a realidade perceptiva ao seu redor.',
    '{"texto": "Aumente permanentemente seus Pontos de Magia (PM) máximos em 5."}'::jsonb,
    '[
        {
            "nome": "Foco Cognitivo",
            "nivel_maximo": 5,
            "descricao": "No início do seu turno em conflito, escolha um aliado que possa ouvi-lo ou um inimigo visível que esteja sofrendo de Confuso, Enfurecido ou Abalado: esse alvo torna-se seu Foco até o início do seu próximo turno. Você recebe +[SL] em testes para examinar seu Foco, +[SL] em Testes de Precisão e Magia que o incluam entre os alvos, e caso faça o Foco recuperar PV ou PM, ele recupera +[SL × 2] adicionais."
        },
        {
            "nome": "Hipercognição",
            "nivel_maximo": 5,
            "descricao": "Reduz o custo em PM de magias e versos que tenham seu Foco como alvo em [SL] PM, ou em [SL × 2] PM se o Foco for o único alvo da habilidade (custo mínimo de 0 PM)."
        },
        {
            "nome": "Navegador",
            "nivel_maximo": 1,
            "descricao": "Permite comunicar-se telepaticamente com qualquer aliado consciente a até 1 dia de viagem. Permite também realizar Rituais da disciplina Ritualismo sem necessidade de ingredientes ou componentes materiais."
        },
        {
            "nome": "Psicocinese",
            "nivel_maximo": 1,
            "descricao": "Ao realizar um Teste de Precisão com uma arma, você pode substituir um dos dados de atributo por Vontade (VON). Além disso, seus ataques corpo a corpo com armas da categoria arcana ou espada podem alvejar criaturas voadoras."
        },
        {
            "nome": "Dádivas Psíquicas",
            "nivel_maximo": 5,
            "descricao": "Cada nível concede 1 Dádiva Psíquica única à sua escolha e você adquire um Relógio de Ondas Cerebrais de 4 seções (que inicia o conflito vazio). Ativar uma dádiva custa 5 × seções preenchidas de PM (mínimo de 5 PM) e preenche 1 seção do relógio, alterando tipos de dano elemental, manipulando forças gravitacionais ou erguendo escudos cinéticos."
        }
    ]'::jsonb
);

-- 2. Classe Mutante
INSERT INTO catalogo_classes (nome_classe, descricao, beneficios_iniciais, habilidades_padrao)
VALUES (
    'Mutante',
    'Indivíduos alterados geneticamente ou biologicamente modificados que reconfiguram sua própria fisiologia e tecido celular em pleno combate, desenvolvendo terioformas e bio-armas aberrantes.',
    '{"texto": "Aumente permanentemente seus Pontos de Vida (PV) máximos em 5."}'::jsonb,
    '[
        {
            "nome": "Teriomorfose",
            "nivel_maximo": 6,
            "descricao": "Cada nível concede 1 Terioforma (mutação corporal) do catálogo genético. Em conflito, gaste 1 ação e 1/3 do seu PV atual (arredondado para baixo) para manifestar simultaneamente até 2 Terioformas aprendidas pela cena inteira. No fim da cena, pode gastar 10 PM para estender as formas ativas para a próxima cena."
        },
        {
            "nome": "Acromorfose",
            "nivel_maximo": 3,
            "descricao": "No início do seu turno, escolha uma categoria de armas: seus ataques desarmados contam temporariamente como pertencentes àquela categoria. Seus ataques desarmados recebem bônus permanente de +[SL] em Precisão e +[6 + (SL × 2)] no Dano Físico."
        },
        {
            "nome": "Biófago",
            "nivel_maximo": 5,
            "descricao": "Enquanto estiver em Crise (PV atual menor ou igual à metade do seu PV Máximo), ao causar dano a um ou mais inimigos, você recupera imediatamente [SL × 2] Pontos de Vida."
        },
        {
            "nome": "Écdise",
            "nivel_maximo": 4,
            "descricao": "Reação adaptativa: ao sofrer dano, gaste PV para descartar sua carapaça externa e receber Resistência temporária contra aquele tipo de dano até o final do seu próximo turno."
        },
        {
            "nome": "Genoclepsia",
            "nivel_maximo": 3,
            "descricao": "Permite absorver e sintetizar temporariamente características biológicas ou terioformas de monstros e criaturas caídas ou estudadas durante a jornada."
        }
    ]'::jsonb
);

-- 3. Classe Piloto
INSERT INTO catalogo_classes (nome_classe, descricao, beneficios_iniciais, habilidades_padrao)
VALUES (
    'Piloto',
    'Especialistas em combate mecanizado e direção de alta tecnologia, capazes de sincronizar neuralmente com andadores mecha, exoesqueletos cibernéticos e corcéis mecânicos armados.',
    '{"texto": "Aumente permanentemente seus Pontos de Vida (PV) máximos em 5. Você ganha proficiência com armas marciais corpo a corpo e armas marciais à distância."}'::jsonb,
    '[
        {
            "nome": "Veículo Pessoal",
            "nivel_maximo": 1,
            "descricao": "Você adquire um Veículo Pessoal operacional com um chassi à escolha (Exoesqueleto, Mecha ou Corcel Mecânico) e 3 Módulos iniciais instalados. Você pode embarcar e pilotá-lo em combate, combinando blindagem e sistemas de armas veiculares."
        },
        {
            "nome": "Configuração Flexível",
            "nivel_maximo": 4,
            "descricao": "Ao realizar a ação Guarda ou Equipamento enquanto pilota seu veículo pessoal, você pode desativar até [SL] módulos ativos e simultaneamente ativar até [SL] módulos reservas da sua configuração."
        },
        {
            "nome": "Coração no Motor",
            "nivel_maximo": 3,
            "descricao": "No início do seu turno, você pode gastar até [SL × 5] PM para energizar o núcleo do veículo: aumente o dano do seu próximo ataque em +[SL × 2] ou reduza o próximo dano sofrido em [SL × 3]."
        },
        {
            "nome": "Tecnologia de Compressão",
            "nivel_maximo": 4,
            "descricao": "Seu veículo pessoal pode ser armazenado em um dispositivo portátil condensado. Com uma ação de Inventário e gastando 2 Pontos de Inventário (PI), você invoca ou recolhe o veículo instantaneamente."
        },
        {
            "nome": "Interface",
            "nivel_maximo": 3,
            "descricao": "Sua sincronização ciber-sináptica aprimora todas as operações veiculares: você recebe bônus de +[SL] em todos os testes envolvendo condução, maquinário, perícias tecnológicas e mira veicular."
        }
    ]'::jsonb
);
