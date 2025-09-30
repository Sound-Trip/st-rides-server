import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const junctions = [
    { name: "Aba Main Park", lat: 5.1161, lng: 7.3667 },
    { name: "Ariaria Market", lat: 5.1034, lng: 7.3632 },
    { name: "Ngwa Road Junction", lat: 5.1120, lng: 7.3685 },
    { name: "Brass Junction", lat: 5.1155, lng: 7.3709 },
  ];

  for (const j of junctions) {
    await prisma.junction.upsert({
      where: { name: j.name },
      update: j,
      create: j,
    });
  }

  console.log("✅ Aba junctions added/updated!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });