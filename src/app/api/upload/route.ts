import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/r2';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    
    const result = await generatePresignedUploadUrl(contentType, extension);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
