/*
  Warnings:

  - A unique constraint covering the columns `[serverCode]` on the table `servers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serverCode` to the `servers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "codeGeneratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "serverCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "servers_serverCode_key" ON "servers"("serverCode");
