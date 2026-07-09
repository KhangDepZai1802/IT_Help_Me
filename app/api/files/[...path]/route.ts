import { NextRequest, NextResponse } from "next/server";
import { canAccessDepartment, forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadStorageObject } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();

    const { path: parts } = await params;
    const filePath = parts.join("/");
    const requestId = parts[1];

    if (!filePath || !requestId) {
      return NextResponse.json({ error: "File không hợp lệ." }, { status: 400 });
    }

    const attachment = await prisma.requestAttachment.findFirst({
      where: {
        fileUrl: filePath,
        requestId
      },
      include: {
        request: {
          select: { departmentId: true }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Không tìm thấy file." }, { status: 404 });
    }

    if (!canAccessDepartment(session, attachment.request.departmentId)) {
      return forbidden();
    }

    const storageResponse = await downloadStorageObject(filePath);
    const headers = new Headers();
    headers.set("Content-Type", storageResponse.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(attachment.fileName)}"`);

    return new NextResponse(storageResponse.body, { headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể tải file đính kèm." }, { status: 500 });
  }
}
