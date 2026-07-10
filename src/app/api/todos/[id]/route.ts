import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { auth } from '@clerk/nextjs/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    
    // Find one and update by ID and userId
    const todo = await Todo.findOneAndUpdate({ _id: id, userId }, body, {
      new: true,
      runValidators: true,
    });
    
    if (!todo) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = await params;
    
    // Delete only if it matches ID and userId
    const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId });
    
    if (!deletedTodo) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
