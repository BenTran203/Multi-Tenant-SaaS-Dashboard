/*
  Warnings:

  - You are about to drop the column `codeGeneratedAt` on the `servers` table. All the data in the column will be lost.
  - You are about to drop the column `invite_code` on the `servers` table. All the data in the column will be lost.
  - You are about to drop the column `serverCode` on the `servers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[server_code]` on the table `servers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `server_code` to the `servers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "servers_invite_code_key";

-- DropIndex
DROP INDEX "servers_serverCode_key";

-- AlterTable
ALTER TABLE "servers" DROP COLUMN "codeGeneratedAt",
DROP COLUMN "invite_code",
DROP COLUMN "serverCode",
ADD COLUMN     "code_generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "server_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "servers_server_code_key" ON "servers"("server_code");
