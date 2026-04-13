-- Crear función para que solo nexaapporg@gmail.com pueda ser superadmin
CREATE OR REPLACE FUNCTION check_superadmin_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo permitir role 'superadmin' al email específico
  IF NEW.role = 'superadmin' AND NEW.email != 'nexaapporg@gmail.com' THEN
    RAISE EXCEPTION 'Superadmin role is restricted';
  END IF;
  
  -- Auto-asignar superadmin al email correcto
  IF NEW.email = 'nexaapporg@gmail.com' THEN
    NEW.role := 'superadmin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_superadmin_email ON profiles;
CREATE TRIGGER enforce_superadmin_email
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_superadmin_email();

-- Si el usuario ya existe, actualizarlo a superadmin
UPDATE profiles 
SET role = 'superadmin'
WHERE email = 'nexaapporg@gmail.com';