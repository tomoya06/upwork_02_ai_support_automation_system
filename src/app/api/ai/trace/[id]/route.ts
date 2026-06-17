import { NextResponse } from "next/server";
import { getPipelineTrace } from "@/lib/ai/pipeline-service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const run = await getPipelineTrace(params.id);

    if (!run) {
      return NextResponse.json({ run: null });
    }

    return NextResponse.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
