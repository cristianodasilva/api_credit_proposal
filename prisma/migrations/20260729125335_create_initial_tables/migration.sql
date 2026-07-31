-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CORBAN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('RASCUNHO', 'EM_ANALISE', 'APROVADA', 'REPROVADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerCpf" TEXT NOT NULL,
    "customerIncome" DECIMAL(65,30) NOT NULL,
    "requestedAmount" DECIMAL(65,30) NOT NULL,
    "installments" INTEGER NOT NULL,
    "interestRate" DECIMAL(65,30) NOT NULL,
    "installmentAmount" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'RASCUNHO',
    "rejectionReason" TEXT,
    "corbanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_corbanId_fkey" FOREIGN KEY ("corbanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
