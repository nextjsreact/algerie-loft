import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Comment submission schema
const commentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  author: z.string().min(1, 'Author name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = commentSchema.parse(body);
    
    // In a real implementation, you would:
    // 1. Save the comment to your database (marked as pending moderation)
    // 2. Send notification to moderators
    // 3. Optionally send confirmation email to commenter
    
    // For now, we'll just simulate the process
    console.log('Comment submitted:', {
      postId: validatedData.postId,
      author: validatedData.author,
      email: validatedData.email,
      content: validatedData.content,
      submittedAt: new Date().toISOString(),
      status: 'pending_moderation',
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      { 
        success: true, 
        message: 'Comment submitted successfully and is pending moderation' 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error processing comment submission:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json(
        { success: false, message: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would fetch approved comments from your database
    // For now, return empty array
    const comments = [];
    
    return NextResponse.json({
      success: true,
      comments,
    });
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}