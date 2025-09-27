import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = (file as File).name || "upload";
    const ext = path.extname(fileName) || ".bin";
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${safeName}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image upload failed", error);
    return NextResponse.json({ error: "Не удалось загрузить изображение" }, { status: 500 });
  }
}
