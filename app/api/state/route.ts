import { NextResponse } from "next/server";
import { getAppState } from "@/lib/server-data";

export async function GET() {
  try {
    return NextResponse.json(await getAppState());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể tải dữ liệu từ database." }, { status: 500 });
  }
}
