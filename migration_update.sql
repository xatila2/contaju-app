-- --- INSTRUÇÕES ---
-- 1. Copie TODO o conteúdo deste arquivo.
-- 2. Cole no SQL Editor do Supabase (apague qualquer coisa que estiver lá antes).
-- 3. Clique em RUN.

alter table companies add column if not exists settings jsonb default '{}'::jsonb;

alter table companies add column if not exists capital_giro_necessario numeric default 0;

alter table companies add column if not exists notification_settings jsonb default '{}'::jsonb;

-- Se aparecer "Success", "No rows returned" ou similar, deu certo!
