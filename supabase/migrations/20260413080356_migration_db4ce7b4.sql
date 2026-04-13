-- Solución 2 (backup): Agregar políticas RLS para permitir INSERT durante el registro
-- Esto permite que el trigger inserte incluso si auth.uid() aún no está disponible

-- Política para credit_wallets: permitir INSERT desde el trigger
CREATE POLICY "system_insert_wallets" ON public.credit_wallets
  FOR INSERT
  WITH CHECK (true);

-- Política para credit_transactions: permitir INSERT de tipo bonus
CREATE POLICY "system_insert_bonus_transactions" ON public.credit_transactions
  FOR INSERT
  WITH CHECK (type = 'bonus');