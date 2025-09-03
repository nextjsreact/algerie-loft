import { NextRequest, NextResponse } from 'next/server';

const AIRBNB_API_URL = "https://api.airbnb.com/v2";

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${AIRBNB_API_URL}/listings`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Airbnb-API-Key": process.env.AIRBNB_CLIENT_ID!,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}