import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, topic, spreads } = body as {
      email: string;
      topic: string;
      spreads: {
        title: string;
        paragraphs: string[];
        imageUrl?: string;
        status: string;
      }[];
    };

    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const plain = [
      `Topic: ${topic}`,
      "",
      ...spreads.map((s, i) =>
        [
          `#${i + 1} ${s.title}`,
          ...s.paragraphs,
          `Image: ${s.imageUrl ?? "(none)"}`,
          "",
        ].join("\n")
      ),
    ].join("\n");

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "Orders <orders@yourdomain.com>",
      to: [process.env.ORDERS_TO_EMAIL || "you@example.com"],
      subject: `New book request: ${topic}`,
      text: plain,
      reply_to: email,
    } as any);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: (data as any)?.id });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
