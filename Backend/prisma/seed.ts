import { 
  PrismaClient, 
  Role, 
  FeedbackType, 
  FeedbackStatus, 
  NotificationType 
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1️⃣ Limpiar base de datos (orden inverso a dependencias)
  // Usamos deleteMany sin argumentos para borrar todo
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Base de datos limpiada");

  // 2️⃣ Password hasheado
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 3️⃣ Crear usuarios (Usando Enum Role)
  const ana = await prisma.user.create({
    data: {
      name: "Ana Martínez",
      email: "ana@sociallearning.com",
      role: Role.LEADER, // ✅ CORREGIDO
      password: hashedPassword,
    },
  });

  const pedro = await prisma.user.create({
    data: {
      name: "Pedro García",
      email: "pedro@sociallearning.com",
      role: Role.LEADER, // ✅ CORREGIDO
      password: hashedPassword,
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: "María González",
      email: "maria@sociallearning.com",
      role: Role.EMPLOYEE, // ✅ CORREGIDO
      password: hashedPassword,
    },
  });

  const carlos = await prisma.user.create({
    data: {
      name: "Carlos Ruiz",
      email: "carlos@sociallearning.com",
      role: Role.EMPLOYEE, // ✅ CORREGIDO
      password: hashedPassword,
    },
  });

  const juan = await prisma.user.create({
    data: {
      name: "Juan Pérez",
      email: "juan@sociallearning.com",
      role: Role.EMPLOYEE, // ✅ CORREGIDO
      password: hashedPassword,
    },
  });

  const laura = await prisma.user.create({
    data: {
      name: "Laura Torres",
      email: "laura@sociallearning.com",
      role: Role.EMPLOYEE, // ✅ CORREGIDO
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
      { leaderId: pedro.id, memberId: maria.id },
    ],
  });

  console.log("🧩 Relaciones de equipo creadas");

  // 5️⃣ Crear feedbacks (Usando Enums FeedbackType y Status)
  const feedbacksData = [
    {
      fromUserId: ana.id,
      toUserId: maria.id,
      type: FeedbackType.RECOGNITION, // ✅ CORREGIDO: Ya no es string
      status: FeedbackStatus.COMPLETED, // ✅ CORREGIDO
      content: "Excelente desempeño en el último proyecto.",
    },
    {
      fromUserId: ana.id,
      toUserId: carlos.id,
      type: FeedbackType.IMPROVEMENT, // ✅ CORREGIDO
      status: FeedbackStatus.IN_PROGRESS, // ✅ CORREGIDO
      content: "Podrías mejorar la comunicación con el equipo.",
    },
    {
      fromUserId: pedro.id,
      toUserId: laura.id,
      type: FeedbackType.GENERAL, // ✅ CORREGIDO
      status: FeedbackStatus.PENDING, // ✅ CORREGIDO
      content: "Buen comienzo, sigamos así.",
    },
    {
      fromUserId: pedro.id,
      toUserId: maria.id,
      type: FeedbackType.IMPROVEMENT, // ✅ CORREGIDO
      status: FeedbackStatus.COMPLETED, // ✅ CORREGIDO
      content: "Muy buena evolución en los últimos meses.",
    },
    {
      fromUserId: maria.id,
      toUserId: juan.id,
      type: FeedbackType.RECOGNITION, // ✅ CORREGIDO
      status: FeedbackStatus.COMPLETED, // ✅ CORREGIDO
      content: "Gran trabajo en equipo.",
    },
  ];

  const createdFeedbacks = [];

  for (const data of feedbacksData) {
    const feedback = await prisma.feedback.create({ data });
    createdFeedbacks.push(feedback);
  }

  console.log("💬 Feedbacks creados");

  // 6️⃣ Comentarios
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

  // 7️⃣ Notificaciones (Usando Enum NotificationType)
  await prisma.notification.createMany({
    data: [
      {
        userId: maria.id,
        type: NotificationType.FEEDBACK_RECEIVED, // ✅ CORREGIDO
        message: "Recibiste un nuevo feedback",
        read: false,
      },
      {
        userId: carlos.id,
        type: NotificationType.FEEDBACK_UPDATED, // ✅ CORREGIDO
        message: "Se actualizó uno de tus feedbacks",
        read: true,
      },
      {
        userId: laura.id,
        type: NotificationType.COMMENT_RECEIVED, // ✅ CORREGIDO
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
    // @ts-ignore
    process.exit(1); 
  })
  .finally(async () => {
    await prisma.$disconnect();
  });