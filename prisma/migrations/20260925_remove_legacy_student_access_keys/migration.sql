-- KEKS Akademi: öğrenci giriş anahtarı sistemi e-posta + şifre kimlik doğrulamaya taşındı.
-- Uygulama bu sütunları artık okumaz veya aktif kimlik doğrulama için kullanmaz.
ALTER TABLE "Student" DROP COLUMN IF EXISTS "accessKeyHash";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "accessKeyCiphertext";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "accessKeyExpiresAt";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "credentialsDeliveryStatus";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "credentialsEmailedAt";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "credentialEmailAttempts";
