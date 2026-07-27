import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type WorkReportType = "MORNING" | "EVENING";
type SavedWorkReport = {
  owner: string;
  data: unknown;
};
type WorkReportDelegate = {
  findUnique(args: {
    where: {
      reportDate_type_owner: { reportDate: Date; type: WorkReportType; owner: string };
    };
  }): Promise<SavedWorkReport | null>;
  findMany(args: {
    where: { reportDate: Date; type: WorkReportType };
    select: { owner: true };
    orderBy: { owner: "asc" };
  }): Promise<{ owner: string }[]>;
  upsert(args: {
    where: {
      reportDate_type_owner: { reportDate: Date; type: WorkReportType; owner: string };
    };
    update: {
      companyName: string;
      recipient: string;
      data: unknown;
    };
    create: {
      reportDate: Date;
      type: WorkReportType;
      companyName: string;
      recipient: string;
      owner: string;
      data: unknown;
    };
  }): Promise<SavedWorkReport>;
};

const workReports = (prisma as unknown as { workReport: WorkReportDelegate }).workReport;

function parseType(value: string | null): WorkReportType {
  return value === "evening" ? "EVENING" : "MORNING";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const type = parseType(searchParams.get("type"));
    const owner = searchParams.get("owner");

    if (!date) {
      return NextResponse.json({ message: "Thiếu tham số 'date'." }, { status: 400 });
    }

    // Không có owner -> trả về danh sách tên đã gửi báo cáo trong ngày đó,
    // dùng để hiển thị dropdown "Bạn là ai?" ở trang cuối ngày.
    if (!owner) {
      const reports = await workReports.findMany({
        where: { reportDate: new Date(date), type },
        select: { owner: true },
        orderBy: { owner: "asc" },
      });
      const owners = reports.map((r) => r.owner).filter(Boolean);
      return NextResponse.json({ owners });
    }

    const report = await workReports.findUnique({
      where: { reportDate_type_owner: { reportDate: new Date(date), type, owner } },
    });

    if (!report) {
      return NextResponse.json({ message: "Không tìm thấy báo cáo." }, { status: 404 });
    }

    return NextResponse.json(report.data);
  } catch (error) {
    console.error("Failed to fetch work report:", error);
    return NextResponse.json({ message: "Không thể tải báo cáo." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportDate } = body;
    const type = parseType(body.type);
    const owner = (body.owner ?? "").trim();

    if (!reportDate) {
      return NextResponse.json({ message: "Thiếu 'reportDate'." }, { status: 400 });
    }
    if (!owner) {
      return NextResponse.json(
        { message: "Vui lòng nhập tên người phụ trách trước khi lưu." },
        { status: 400 },
      );
    }

    const saved = await workReports.upsert({
      where: { reportDate_type_owner: { reportDate: new Date(reportDate), type, owner } },
      update: {
        companyName: body.companyName ?? "",
        recipient: body.recipient ?? "",
        data: body,
      },
      create: {
        reportDate: new Date(reportDate),
        type,
        companyName: body.companyName ?? "",
        recipient: body.recipient ?? "",
        owner,
        data: body,
      },
    });

    return NextResponse.json(saved.data, { status: 201 });
  } catch (error) {
    console.error("Failed to save work report:", error);
    return NextResponse.json({ message: "Không thể lưu báo cáo." }, { status: 500 });
  }
}