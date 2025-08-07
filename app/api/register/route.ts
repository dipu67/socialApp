import { connectDB } from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { User, Users } from "@/lib/db/users";

export async function POST(req: NextRequest,) {
  try {

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Connect to the database
    await connectDB();
    const user = await Users.create({
        name,
        email,
        password: hashedPassword,
    });


    // Respond with success
    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}