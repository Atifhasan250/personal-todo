import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    
    const todo = await Todo.findByIdAndUpdate(id, body, {
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
    await dbConnect();
    const { id } = await params;
    
    const deletedTodo = await Todo.deleteOne({ _id: id });
    
    if (!deletedTodo) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
