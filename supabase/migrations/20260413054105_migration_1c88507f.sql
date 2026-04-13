-- Trigger para crear perfil, wallet y suscripción automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- 1. Crear perfil
  INSERT INTO public.profiles (id, email, full_name, role, unlimited_credits, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Crear wallet con 100 créditos del plan Free
  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Crear suscripción Free
  INSERT INTO public.subscriptions (user_id, plan_type, status, auto_renew)
  VALUES (NEW.id, 'free', 'active', false)
  ON CONFLICT DO NOTHING;

  -- 4. Registrar transacción de bienvenida
  INSERT INTO public.credit_transactions (
    wallet_id,
    user_id,
    amount,
    type,
    description,
    metadata
  )
  SELECT 
    cw.id,
    NEW.id,
    100,
    'bonus',
    'Créditos de bienvenida - Plan Free',
    '{"source": "welcome_bonus", "plan": "free"}'::jsonb
  FROM public.credit_wallets cw
  WHERE cw.user_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger que se ejecuta después de registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill para usuarios existentes sin wallet/suscripción
DO $$
DECLARE
  user_record RECORD;
  wallet_id uuid;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.credit_wallets cw ON cw.user_id = u.id
    WHERE cw.id IS NULL
  LOOP
    -- Crear perfil si no existe
    INSERT INTO public.profiles (id, email, full_name, role, unlimited_credits, onboarding_completed)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      'user',
      false,
      false
    )
    ON CONFLICT (id) DO NOTHING;

    -- Crear wallet
    INSERT INTO public.credit_wallets (user_id, balance)
    VALUES (user_record.id, 100)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO wallet_id;

    -- Crear suscripción
    INSERT INTO public.subscriptions (user_id, plan_type, status, auto_renew)
    VALUES (user_record.id, 'free', 'active', false)
    ON CONFLICT DO NOTHING;

    -- Registrar transacción de bienvenida
    IF wallet_id IS NOT NULL THEN
      INSERT INTO public.credit_transactions (
        wallet_id,
        user_id,
        amount,
        type,
        description,
        metadata
      )
      VALUES (
        wallet_id,
        user_record.id,
        100,
        'bonus',
        'Créditos de bienvenida - Plan Free',
        '{"source": "welcome_bonus", "plan": "free"}'::jsonb
      );
    END IF;
  END LOOP;
END $$;