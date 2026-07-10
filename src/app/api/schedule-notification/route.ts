import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, message, url, sendAt } = await req.json();

    // Convert sendAt to UTC format required by Webpushr (YYYY-MM-DD HH:MM -00:00)
    // Example: 2026-07-15 14:30 -00:00
    const date = new Date(sendAt);
    const isoString = date.toISOString(); // e.g., "2026-07-15T14:30:00.000Z"
    
    // Format to Webpushr's expected UTC format
    const formattedDate = isoString.split('T')[0];
    const formattedTime = isoString.split('T')[1].substring(0, 5);
    const webpushrSendAt = `${formattedDate} ${formattedTime} -00:00`;

    console.log("Scheduling notification for:", webpushrSendAt);

    const payload = {
      title: title || 'Todo Reminder',
      message: message,
      target_url: url || 'https://todo.atifhasan.com',
      send_at: webpushrSendAt
    };

    const response = await fetch('https://api.webpushr.com/v1/notification/send/all', {
      method: 'POST',
      headers: {
        'webpushrKey': process.env.WEBPUSHR_REST_API_KEY || '',
        'webpushrAuthToken': process.env.WEBPUSHR_AUTH_TOKEN || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Webpushr response:", data);

    if (!response.ok || data.status === 'failure') {
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Error scheduling notification:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
