-- CreateTable
CREATE TABLE "ClusterSummary" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClusterSummary_pkey" PRIMARY KEY ("id")
);
