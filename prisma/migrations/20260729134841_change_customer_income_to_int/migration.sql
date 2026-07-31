/*
  Warnings:

  - You are about to alter the column `customerIncome` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Proposal" ALTER COLUMN "customerIncome" SET DATA TYPE INTEGER;
