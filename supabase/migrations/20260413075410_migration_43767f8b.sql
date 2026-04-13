-- 3. Arreglar trigger de créditos gratis - Asegurar que dé 100 créditos al registrarse
CREATE OR REPLACE FUNCTION auto_setup_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_wallet_id uuid;
BEGIN
  -- 1. Insertar perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Crear wallet con 100 créditos GRATIS
  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO UPDATE SET balance = 100
  RETURNING id INTO new_wallet_id;

  -- 3. Registrar transacción de bono inicial
  IF new_wallet_id IS NOT NULL THEN
    INSERT INTO public.credit_transactions (
      wallet_id,
      user_id,
      amount,
      type,
      description,
      metadata
    )
    VALUES (
      new_wallet_id,
      NEW.id,
      100,
      'bonus',
      'Créditos de bienvenida',
      jsonb_build_object('source', 'registration_bonus', 'auto', true)
    );
  END IF;

  -- 4. Crear suscripción Free
  INSERT INTO public.subscriptions (user_id, plan_type, status, auto_renew)
  VALUES (NEW.id, 'free', 'active', false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_setup_new_user();