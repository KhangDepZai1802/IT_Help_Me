import { NextRequest, NextResponse } from "next/server";
import { canAccessDepartment, forbidden, getAuthSession, unauthorized } from "@/lib/auth";
import { safeStorageName, uploadStorageObject } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file");
    const requestId = String(formData.get("requestId") ?? "").trim();
    const formDepartmentId = String(formData.get("departmentId") ?? "").trim();
    const departmentId = session.role === "DEPARTMENT" ? session.departmentId ?? "" : formDepartmentId;

    if (!(file instanceof File) || !requestId || !departmentId) {
      return NextResponse.json({ error: "Thiếu file hoặc thông tin yêu cầu." }, { status: 400 });
    }

    if (!canAccessDepartment(session, departmentId)) {
      return forbidden();
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File vượt quá giới hạn 10MB." }, { status: 400 });
    }

    const fileName = file.name || "attachment";
    const safeName = safeStorageName(fileName);
    const path = `${departmentId}/${safeStorageName(requestId)}/${Date.now()}-${safeName}`;

    await uploadStorageObject(path, file);

    return NextResponse.json({
      fileName,
      fileUrl: path
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể upload file đính kèm." }, { status: 500 });
  }
}
