import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1️⃣ Limpiar base de datos (orden inverso a dependencias)
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Base de datos limpiada");

  // 2️⃣ Password hasheado
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 3️⃣ Crear usuarios
  const ana = await prisma.user.create({
    data: {
      name: "Ana Martínez",
      email: "ana@sociallearning.com",
      role: "LEADER",
      password: hashedPassword,
    },
  });

  const pedro = await prisma.user.create({
    data: {
      name: "Pedro García",
      email: "pedro@sociallearning.com",
      role: "LEADER",
      password: hashedPassword,
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: "María González",
      email: "maria@sociallearning.com",
      role: "EMPLOYEE",
      password: hashedPassword,
    },
  });

  const carlos = await prisma.user.create({
    data: {
      name: "Carlos Ruiz",
      email: "carlos@sociallearning.com",
      role: "EMPLOYEE",
      password: hashedPassword,
    },
  });

  const juan = await prisma.user.create({
    data: {
      name: "Juan Pérez",
      email: "juan@sociallearning.com",
      role: "EMPLOYEE",
      password: hashedPassword,
    },
  });

  const laura = await prisma.user.create({
    data: {
      name: "Laura Torres",
      email: "laura@sociallearning.com",
      role: "EMPLOYEE",
      password: hashedPassword,
    },
  });

  console.log("👥 Usuarios creados");

  // 4️⃣ Relaciones TeamMember
  await prisma.teamMember.createMany({
    data: [
      { leaderId: ana.id, memberId: maria.id },
      { leaderId: ana.id, memberId: carlos.id },
      { leaderId: ana.id, memberId: juan.id },
      { leaderId: pedro.id, memberId: laura.id },
      { leaderId: pedro.id, memberId: maria.id }, // María reporta a 2 líderes
    ],
  });

  console.log("🧩 Relaciones de equipo creadas");

  // 5️⃣ Crear feedbacks (uno por uno para guardar IDs)
  const feedbacksData = [
    {
      fromUserId: ana.id,
      toUserId: maria.id,
      type: "RECOGNITION",
      status: "COMPLETED",
      content: "Excelente desempeño en el último proyecto.",
    },
    {
      fromUserId: ana.id,
      toUserId: carlos.id,
      type: "IMPROVEMENT",
      status: "IN_PROGRESS",
      content: "Podrías mejorar la comunicación con el equipo.",
    },
    {
      fromUserId: pedro.id,
      toUserId: laura.id,
      type: "GENERAL",
      status: "PENDING",
      content: "Buen comienzo, sigamos así.",
    },
    {
      fromUserId: pedro.id,
      toUserId: maria.id,
      type: "IMPROVEMENT",
      status: "COMPLETED",
      content: "Muy buena evolución en los últimos meses.",
    },
    {
      fromUserId: maria.id,
      toUserId: juan.id,
      type: "RECOGNITION",
      status: "COMPLETED",
      content: "Gran trabajo en equipo.",
    },
  ];

  const createdFeedbacks = [];

  for (const data of feedbacksData) {
    const feedback = await prisma.feedback.create({ data });
    createdFeedbacks.push(feedback);
  }

  console.log("💬 Feedbacks creados");

  // 6️⃣ Comentarios (2 por feedback)
  for (const feedback of createdFeedbacks) {
    await prisma.comment.createMany({
      data: [
        {
          feedbackId: feedback.id,
          userId: feedback.toUserId,
          content: "Gracias por el feedback, lo tendré en cuenta.",
        },
        {
          feedbackId: feedback.id,
          userId: feedback.fromUserId,
          content: "Seguimos trabajando para mejorar.",
        },
      ],
    });
  }

  console.log("🗨️ Comentarios creados");

  // 7️⃣ Notificaciones
  await prisma.notification.createMany({
    data: [
      {
        userId: maria.id,
        type: "FEEDBACK_RECEIVED",
        message: "Recibiste un nuevo feedback",
        read: false,
      },
      {
        userId: carlos.id,
        type: "FEEDBACK_UPDATED",
        message: "Se actualizó uno de tus feedbacks",
        read: true,
      },
      {
        userId: laura.id,
        type: "COMMENT_RECEIVED",
        message: "Comentaron uno de tus feedbacks",
        read: false,
      },
    ],
  });

  console.log("🔔 Notificaciones creadas");
  console.log("✅ Seed finalizado correctamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
