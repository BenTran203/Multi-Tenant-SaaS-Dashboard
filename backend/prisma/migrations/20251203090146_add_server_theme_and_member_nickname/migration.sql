-- AlterTable
ALTER TABLE "server_members" ADD COLUMN     "nickname" TEXT;

-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "theme" TEXT DEFAULT 'nature';
