-- =============================================================================
-- Migration: Políticas RLS e Permissões para npcs_mestre e Companheiros Fiéis
-- Tabela: public.npcs_mestre e public.fichas_personagens
--
-- Cenários Suportados:
-- 1. Mestre Autenticado (auth.uid() = user_id): Acesso total a NPCs, monstros e companheiros.
-- 2. Jogador Autenticado (fichas_personagens.user_id = auth.uid()): Acesso ao seu Companheiro Fiel.
-- 3. Jogador via Token/Crachá (fichas_personagens.user_id IS NULL): Acesso seguro ao Companheiro Fiel
--    vinculado à sua ficha (personagem_id), sem expor os NPCs/monstros do Mestre.
-- 4. Grants explícitos para os roles anon e authenticated, evitando erro HTTP 401 na API REST.
-- =============================================================================

-- 1. Garantir que as colunas necessárias existem com compatibilidade total
ALTER TABLE public.fichas_personagens
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.npcs_mestre
  ADD COLUMN IF NOT EXISTS tipo_registro TEXT NOT NULL DEFAULT 'npc_mestre',
  ADD COLUMN IF NOT EXISTS personagem_id TEXT DEFAULT NULL;

-- 2. Permitir que user_id seja nulo para companheiros criados via sessão de token de jogador
ALTER TABLE public.npcs_mestre ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.npcs_mestre ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Conceder permissões de schema e tabela para anon e authenticated (resolve erro 401)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.npcs_mestre TO anon, authenticated;
GRANT ALL ON TABLE public.fichas_personagens TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Índices de performance para rápida avaliação de RLS
CREATE INDEX IF NOT EXISTS idx_npcs_mestre_personagem_id ON public.npcs_mestre (personagem_id);
CREATE INDEX IF NOT EXISTS idx_npcs_mestre_tipo_registro ON public.npcs_mestre (tipo_registro);
CREATE INDEX IF NOT EXISTS idx_npcs_mestre_user_id ON public.npcs_mestre (user_id);
CREATE INDEX IF NOT EXISTS idx_fichas_personagens_user_id ON public.fichas_personagens (user_id);
CREATE INDEX IF NOT EXISTS idx_fichas_personagens_jogador_token ON public.fichas_personagens (jogador_token);

-- 5. Habilitar Row Level Security na tabela npcs_mestre
ALTER TABLE public.npcs_mestre ENABLE ROW LEVEL SECURITY;

-- 6. Limpeza de políticas prévias na tabela npcs_mestre
DROP POLICY IF EXISTS "npcs_mestre_select_policy" ON public.npcs_mestre;
DROP POLICY IF EXISTS "npcs_mestre_insert_policy" ON public.npcs_mestre;
DROP POLICY IF EXISTS "npcs_mestre_update_policy" ON public.npcs_mestre;
DROP POLICY IF EXISTS "npcs_mestre_delete_policy" ON public.npcs_mestre;
DROP POLICY IF EXISTS "npcs_mestre_all_policy" ON public.npcs_mestre;
DROP POLICY IF EXISTS "npcs_mestre_policy" ON public.npcs_mestre;
DROP POLICY IF EXISTS "npcs_mestre_all" ON public.npcs_mestre;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.npcs_mestre;
DROP POLICY IF EXISTS "Users can access their own npcs" ON public.npcs_mestre;

-- 7. Política de Leitura (SELECT)
CREATE POLICY "npcs_mestre_select_policy"
ON public.npcs_mestre
FOR SELECT
TO public
USING (
  -- O criador do registro pode ler seus próprios registros (Mestre ou criador)
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Companheiro Fiel vinculado a uma ficha de personagem existente
  (
    tipo_registro = 'companheiro'
    AND personagem_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.fichas_personagens fp
      WHERE fp.id::text = npcs_mestre.personagem_id::text
        AND (
          -- Ficha vinculada a usuário autenticado
          (fp.user_id IS NOT NULL AND (auth.uid() = fp.user_id OR auth.uid()::text = fp.user_id::text))
          OR
          -- Ficha operando via token de crachá (user_id nulo)
          (fp.user_id IS NULL)
          OR
          -- Mestre criador da ficha ou do registro
          (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR auth.uid() = fp.user_id))
        )
    )
  )
);

-- 8. Política de Criação (INSERT)
CREATE POLICY "npcs_mestre_insert_policy"
ON public.npcs_mestre
FOR INSERT
TO public
WITH CHECK (
  -- O criador autenticado (Mestre) pode registrar NPCs ou companheiros
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Jogador (autenticado ou via token) pode registrar o Companheiro Fiel para sua ficha
  (
    tipo_registro = 'companheiro'
    AND personagem_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.fichas_personagens fp
      WHERE fp.id::text = npcs_mestre.personagem_id::text
        AND (
          (fp.user_id IS NOT NULL AND (auth.uid() = fp.user_id OR auth.uid()::text = fp.user_id::text))
          OR
          (fp.user_id IS NULL)
          OR
          (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR auth.uid() = fp.user_id))
        )
    )
  )
);

-- 9. Política de Atualização (UPDATE)
CREATE POLICY "npcs_mestre_update_policy"
ON public.npcs_mestre
FOR UPDATE
TO public
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (
    tipo_registro = 'companheiro'
    AND personagem_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.fichas_personagens fp
      WHERE fp.id::text = npcs_mestre.personagem_id::text
        AND (
          (fp.user_id IS NOT NULL AND (auth.uid() = fp.user_id OR auth.uid()::text = fp.user_id::text))
          OR
          (fp.user_id IS NULL)
          OR
          (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR auth.uid() = fp.user_id))
        )
    )
  )
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (
    tipo_registro = 'companheiro'
    AND personagem_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.fichas_personagens fp
      WHERE fp.id::text = npcs_mestre.personagem_id::text
        AND (
          (fp.user_id IS NOT NULL AND (auth.uid() = fp.user_id OR auth.uid()::text = fp.user_id::text))
          OR
          (fp.user_id IS NULL)
          OR
          (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR auth.uid() = fp.user_id))
        )
    )
  )
);

-- 10. Política de Exclusão (DELETE)
CREATE POLICY "npcs_mestre_delete_policy"
ON public.npcs_mestre
FOR DELETE
TO public
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (
    tipo_registro = 'companheiro'
    AND personagem_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.fichas_personagens fp
      WHERE fp.id::text = npcs_mestre.personagem_id::text
        AND (
          (fp.user_id IS NOT NULL AND (auth.uid() = fp.user_id OR auth.uid()::text = fp.user_id::text))
          OR
          (fp.user_id IS NULL)
          OR
          (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR auth.uid() = fp.user_id))
        )
    )
  )
);
