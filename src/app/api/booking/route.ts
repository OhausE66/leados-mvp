import { NextResponse } from "next/server";
import { confirmBooking, createBooking, listBookings } from "@/lib/domain/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const actorId = url.searchParams.get("actorId");

  const all = await listBookings();

  if (role === "leader" && actorId) {
    return NextResponse.json({ bookings: all.filter((booking) => booking.leaderId === actorId) });
  }

  if (role === "coach" && actorId) {
    return NextResponse.json({ bookings: all.filter((booking) => booking.coachId === actorId) });
  }

  return NextResponse.json({ bookings: all });
}

export async function POST(request: Request) {
  try {
    const booking = await createBooking(await request.json());
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json(
      {
        error: "BOOKING_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const booking = await confirmBooking(await request.json());
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json(
      {
        error: "BOOKING_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 400 },
    );
  }
}
