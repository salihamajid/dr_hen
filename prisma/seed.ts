import { PrismaClient } from "@prisma/client";
import { APPROVED_MEDICINES, MEDICINE_MANUFACTURER, DISEASE_PROTOCOL } from "../src/lib/ai/diseaseProtocol";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding medicines...");
  for (const name of APPROVED_MEDICINES) {
    await prisma.medicine.upsert({
      where: { name },
      update: {},
      create: {
        name,
        manufacturer: MEDICINE_MANUFACTURER[name],
        category: MEDICINE_MANUFACTURER[name] === "ST Vet Pharma" ? "Antibiotic" : "Vitamin/Nutrient",
      },
    });
  }

  console.log("Seeding disease protocol...");
  for (const [diseaseCode, entry] of Object.entries(DISEASE_PROTOCOL)) {
    await prisma.medicineProtocol.upsert({
      where: { diseaseCode: diseaseCode as keyof typeof DISEASE_PROTOCOL },
      update: {},
      create: {
        diseaseCode: diseaseCode as keyof typeof DISEASE_PROTOCOL,
        diseaseName: entry.diseaseName,
        primaryMedicines: entry.medicines,
        notes: entry.notes,
        isAntibiotic: entry.isAntibiotic,
      },
    });
  }

  console.log("Seeding field vets...");
  await prisma.fieldVet.upsert({
    where: { id: "field-vet-rawalpindi" },
    update: {},
    create: {
      id: "field-vet-rawalpindi",
      name: "Dr. Farhan Iqbal",
      region: "Rawalpindi",
      phoneNumber: "+923001234567",
      whatsappNumber: "+923001234567",
    },
  });
  await prisma.fieldVet.upsert({
    where: { id: "field-vet-kotli-sattian" },
    update: {},
    create: {
      id: "field-vet-kotli-sattian",
      name: "Dr. Sana Malik",
      region: "Kotli Sattian",
      phoneNumber: "+923007654321",
      whatsappNumber: "+923007654321",
    },
  });

  console.log("Seeding demo farmers...");
  const farmers = [
    {
      name: "Ahmad Khan",
      location: "Rawalpindi",
      whatsappNumber: "+923011111111",
      flockSize: 5000,
      numberOfSheds: 3,
      flockAgeWeeks: 5,
      breed: "Broiler",
      status: "UNDER_TREATMENT" as const,
    },
    {
      name: "Sara Mehmood",
      location: "Lahore",
      whatsappNumber: "+923022222222",
      flockSize: 12000,
      numberOfSheds: 6,
      flockAgeWeeks: 3,
      breed: "Layer",
      status: "AT_RISK" as const,
    },
    {
      name: "Bilal Ahmed",
      location: "Faisalabad",
      whatsappNumber: "+923033333333",
      flockSize: 8500,
      numberOfSheds: 4,
      flockAgeWeeks: 7,
      breed: "Broiler",
      status: "UNDER_TREATMENT" as const,
    },
    {
      name: "Ayesha Farm",
      location: "Gujranwala",
      whatsappNumber: "+923044444444",
      flockSize: 3000,
      numberOfSheds: 2,
      flockAgeWeeks: 4,
      breed: "Broiler",
      status: "HEALTHY" as const,
    },
    {
      name: "Usman Poultry",
      location: "Multan",
      whatsappNumber: "+923055555555",
      flockSize: 10000,
      numberOfSheds: 5,
      flockAgeWeeks: 6,
      breed: "Layer",
      status: "AT_RISK" as const,
    },
  ];

  for (const f of farmers) {
    const farmer = await prisma.farmer.upsert({
      where: { whatsappNumber: f.whatsappNumber },
      update: {},
      create: f,
    });

    await prisma.dailyReport.create({
      data: {
        farmerId: farmer.id,
        fcr: 1.6 + Math.random() * 0.4,
        avgWeightGrams: 800 + Math.random() * 600,
        mortalityCount: Math.floor(Math.random() * 20),
      },
    });
  }

  const ahmad = await prisma.farmer.findUnique({ where: { whatsappNumber: "+923011111111" } });
  const bilal = await prisma.farmer.findUnique({ where: { whatsappNumber: "+923033333333" } });
  const sara = await prisma.farmer.findUnique({ where: { whatsappNumber: "+923022222222" } });
  const usman = await prisma.farmer.findUnique({ where: { whatsappNumber: "+923055555555" } });

  if (ahmad) {
    await prisma.treatment.create({
      data: {
        farmerId: ahmad.id,
        diseaseCode: "COCCIDIOSIS",
        medicinesGiven: DISEASE_PROTOCOL.COCCIDIOSIS.medicines,
        status: "IN_PROGRESS",
        startedAt: new Date("2026-09-05"),
        nextActionAt: new Date("2026-09-12"),
        nextActionNote: "2nd Round",
      },
    });
  }
  if (sara) {
    await prisma.vaccination.create({
      data: {
        farmerId: sara.id,
        vaccineName: "ND Lasota Vaccine",
        scheduledDate: new Date("2026-09-29"),
        status: "SCHEDULED",
        notes: "Booster dose",
      },
    });
  }
  if (bilal) {
    await prisma.treatment.create({
      data: {
        farmerId: bilal.id,
        diseaseCode: "CRD",
        medicinesGiven: DISEASE_PROTOCOL.CRD.medicines,
        status: "IN_PROGRESS",
        startedAt: new Date("2026-09-03"),
        nextActionAt: new Date("2026-09-10"),
        nextActionNote: "2nd Round",
      },
    });
  }
  if (usman) {
    await prisma.treatment.create({
      data: {
        farmerId: usman.id,
        diseaseCode: "IB",
        medicinesGiven: DISEASE_PROTOCOL.IB.medicines,
        status: "SCHEDULED",
        nextActionAt: new Date("2026-09-23"),
        nextActionNote: "Next Dose",
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
