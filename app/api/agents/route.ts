import { NextResponse } from "next/server";
import { getAllAgents } from "@/services/agent.service";

export async function GET() {
  try {
    const agents = await getAllAgents();
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}
