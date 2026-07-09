import { NextRequest, NextResponse } from "next/server";
import { forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppState } from "@/lib/server-data";
import type { Department, ITRequest, ITStaff } from "@/lib/types";

type ImportBody = {
  departments: Department[];
  staff: ITStaff[];
  requests: ITRequest[];
};

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();
    if (session.role !== "IT") return forbidden();

    const body = (await request.json()) as ImportBody;

    await prisma.$transaction(async (tx: any) => {
      for (const department of body.departments) {
        await tx.department.upsert({
          where: { id: department.id },
          update: {
            name: department.name,
            isActive: department.isActive
          },
          create: department
        });
      }

      for (const member of body.staff) {
        await tx.iTStaff.upsert({
          where: { id: member.id },
          update: {
            fullName: member.fullName,
            isActive: member.isActive
          },
          create: member
        });
      }

      for (const item of body.requests) {
        await tx.request.upsert({
          where: { id: item.id },
          update: {
            departmentId: item.departmentId,
            requesterName: item.requesterName,
            content: item.content,
            priority: item.priority,
            status: item.status,
            assignedToId: item.assignedToId,
            resolutionNote: item.resolutionNote,
            attachmentName: item.attachmentName,
            rating: item.rating ?? null,
            updatedAt: new Date(item.updatedAt)
          },
          create: {
            id: item.id,
            departmentId: item.departmentId,
            requesterName: item.requesterName,
            content: item.content,
            priority: item.priority,
            status: item.status,
            assignedToId: item.assignedToId,
            resolutionNote: item.resolutionNote,
            attachmentName: item.attachmentName,
            rating: item.rating ?? null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          }
        });

        for (const history of item.history) {
          await tx.requestStatusHistory.upsert({
            where: { id: history.id },
            update: {
              oldStatus: history.oldStatus,
              newStatus: history.newStatus,
              changedById: history.changedById,
              note: history.note,
              changedAt: new Date(history.changedAt)
            },
            create: {
              id: history.id,
              requestId: history.requestId,
              oldStatus: history.oldStatus,
              newStatus: history.newStatus,
              changedById: history.changedById,
              note: history.note,
              changedAt: new Date(history.changedAt)
            }
          });
        }
      }
    });

    return NextResponse.json(await getAppState(session));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể import dữ liệu cũ." }, { status: 500 });
  }
}
