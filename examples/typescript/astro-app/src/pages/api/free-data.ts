/**
 * Free Data Endpoint - No payment required
 */

export async function GET() {
  return new Response(
    JSON.stringify({
      data: "This is free content available to everyone",
      price: 0,
      access: "public",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
