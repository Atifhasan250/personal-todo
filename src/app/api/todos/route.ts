import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const todos = await Todo.find({ userId }).sort({ sortOrder: 1 });
    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    body.userId = userId; // Associate task with user
    
    // Idempotency check
    if (body._id) {
      const existing = await Todo.findOne({ userId, clientGeneratedId: body._id });
      if (existing) {
        return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
      body.clientGeneratedId = body._id;
    }

    delete body._id; // Remove the optimistic offline _id so MongoDB generates a new ObjectId
    const todo = await Todo.create(body);
    return NextResponse.json({ success: true, data: todo }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

// Bulk update for reordering
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    
    // Assuming body is an array of objects: { _id, sortOrder }
    const updates = body.map((item: { _id: string; sortOrder: number }) => ({
      updateOne: {
        filter: { _id: item._id, userId }, // Ensure they only reorder their own tasks
        update: { sortOrder: item.sortOrder },
      },
    }));

    if (updates.length > 0) {
      await Todo.bulkWrite(updates);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
