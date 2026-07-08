import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

const departments = [
  { id: "dept-accounting", name: "Kế toán", isActive: true },
  { id: "dept-hr", name: "Nhân sự", isActive: true },
  { id: "dept-marketing", name: "Marketing", isActive: true },
  { id: "dept-sales", name: "Kinh doanh", isActive: true },
  { id: "dept-warehouse", name: "Kho vận", isActive: true }
];

const staff = [
  { id: "it-minh", fullName: "Minh Nguyễn", isActive: true },
  { id: "it-linh", fullName: "Linh Trần", isActive: true },
  { id: "it-khoa", fullName: "Khoa Phạm", isActive: true }
];

async function main() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: {
        name: department.name,
        isActive: department.isActive
      },
      create: department
    });
  }

  for (const member of staff) {
    await prisma.iTStaff.upsert({
      where: { id: member.id },
      update: {
        fullName: member.fullName,
        isActive: member.isActive
      },
      create: member
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
