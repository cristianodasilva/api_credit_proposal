-- AlterTable
ALTER TABLE "Proposal" ALTER COLUMN "customerIncome" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "requestedAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "interestRate" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "installmentAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "Proposal_corbanId_idx" ON "Proposal"("corbanId");

-- CreateIndex
CREATE INDEX "Proposal_customerCpf_idx" ON "Proposal"("customerCpf");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

