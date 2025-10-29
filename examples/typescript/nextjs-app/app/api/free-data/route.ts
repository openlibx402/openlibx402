/**
 * Free Data Endpoint - No payment required
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: "This is free content available to everyone",
    price: 0,
    access: "public",
  });
}
