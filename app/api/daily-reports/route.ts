import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.fullName || !body.reportDate) {
      return NextResponse.json(
        { message: "Thiếu thông tin bắt buộc (họ tên, ngày báo cáo)." },
        { status: 400 }
      );
    }

    const report = await prisma.dailyReport.create({
      data: {
        reportDate: new Date(body.reportDate),
        fullName: body.fullName,
        internId: body.internId ?? "",
        mentor: body.mentor ?? "",
        position: body.position ?? "",
        team: body.team ?? "",
        project: body.project ?? "",

        learnedItems: body.learnedItems ?? [],
        learnedChecklist: body.learnedChecklist ?? {},
        learnedOther: body.learnedOther ?? "",

        appliedItems: body.appliedItems ?? [],
        appliedChecklist: body.appliedChecklist ?? {},
        appliedOther: body.appliedOther ?? "",

        tasks: body.tasks ?? [],

        achievements: body.achievements ?? {},

        difficulties: body.difficulties ?? [],
        planTomorrow: body.planTomorrow ?? [],

        selfRating: body.selfRating ?? {},
        selfNote: body.selfNote ?? "",

        mentorComment: body.mentorComment ?? "",
        mentorOverallRating: body.mentorOverallRating ?? 0,
        mentorSignature: body.mentorSignature ?? "",

        totalHours: body.totalHours ?? 0
      }
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to save intern daily report:", error);
    return NextResponse.json(
      { message: "Không thể lưu báo cáo. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const internId = searchParams.get("internId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const reports = await prisma.dailyReport.findMany({
      where: {
        ...(internId ? { internId } : {}),
        ...(from || to
          ? {
              reportDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {})
              }
            }
          : {})
      },
      orderBy: { reportDate: "desc" }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch intern daily reports:", error);
    return NextResponse.json(
      { message: "Không thể tải danh sách báo cáo." },
      { status: 500 }
    );
  }
}