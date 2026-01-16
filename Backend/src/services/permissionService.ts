import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export async function canGiveFeedback(
  fromUserId: string,
  toUserId: string
): Promise<boolean> {

  // Obtener usuario que envía el feedback
  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { role: true }
  });

  if (!fromUser) return false;

  // 🟢 CASO 1: FROM USER ES LEADER
  if (fromUser.role === "LEADER") {


    // 1️⃣ Puede dar feedback a empleados directos
    const isMyEmployee = await prisma.teamMember.findUnique({
      where: {
        leaderId_memberId: {
          leaderId: fromUserId,
          memberId: toUserId,
        },
      },
    });

    if (isMyEmployee) return true;

    // 2️⃣ Puede dar feedback a sus propios líderes
    const isMyLeader = await prisma.teamMember.findUnique({
      where: {
        leaderId_memberId: {
          leaderId: toUserId,
          memberId: fromUserId,
        },
      },
    });

    return !!isMyLeader;
  }

  // 🟡 CASO 2: FROM USER ES EMPLOYEE
  // Solo puede dar feedback a sus líderes directos
  const isMyLeader = await prisma.teamMember.findUnique({
    where: {
      leaderId_memberId: {
        leaderId: toUserId,
        memberId: fromUserId,
      },
    },
  });

  return !!isMyLeader;
}
