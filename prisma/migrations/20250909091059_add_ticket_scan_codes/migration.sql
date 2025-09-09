/*
  Warnings:

  - A unique constraint covering the columns `[scanCode]` on the table `ride_passengers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scanCode` to the `ride_passengers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketCode` to the `ride_passengers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ride_passengers" ADD COLUMN     "scanCode" TEXT NOT NULL,
ADD COLUMN     "ticketCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ride_passengers_scanCode_key" ON "public"."ride_passengers"("scanCode");
