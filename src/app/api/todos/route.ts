import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function GET() {
  try {
    await dbConnect();
    const todos = await Todo.find({}).sort({ sortOrder: 1 });
    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
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
    await dbConnect();
    const body = await req.json();
    
    // Assuming body is an array of objects: { _id, sortOrder }
    const updates = body.map((item: { _id: string; sortOrder: number }) => ({
      updateOne: {
        filter: { _id: item._id },
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
