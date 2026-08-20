import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supports_search: true,
    supports_group_request: false,
    supported_resolutions: ["1", "5", "15", "60", "240", "D", "W", "M"],
    supports_marks: false,
    supports_timescale_marks: false,
    supports_time: true,
    exchanges: [{ value: "GCRM", name: "GCRM Exchange", desc: "GCRM Exchange" }],
    symbols_types: [{ name: "crypto", value: "crypto" }],
    supported_chart_types: ["candle", "line", "area", "bars"],
  });
}