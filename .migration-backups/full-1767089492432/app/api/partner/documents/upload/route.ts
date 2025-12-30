import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST /api/partner/documents/upload - Upload partner verification documents
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const partnerId = formData.get('partnerId') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const uploadedFiles: Array<{
      url: string
      name: string
      size: number
      type: string
      path: string
    }> = []

    // Validate and upload each file
    for (const file of files) {
      // Validate file size (max 5MB for documents)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB.` },
          { status: 400 }
        )
      }

      // Validate file type for verification documents
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ]

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has an invalid type. Only PDF, JPEG, and PNG files are allowed.` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${fileExtension}`
      const filePath = `partner-documents/${partnerId}/${fileName}`

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
          { error: `Failed to upload file ${file.name}` },
          { status: 500 }
        )
      }

      // Get public URL (note: this might be private depending on bucket settings)
      const { data: urlData } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(filePath)

      uploadedFiles.push({
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath
      })
    }

    // Update partner profile with document paths
    const documentPaths = uploadedFiles.map(file => file.path)
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        verification_documents: documentPaths,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId)

    if (updateError) {
      console.error('Error updating partner documents:', updateError)
      // Don't fail the upload, just log the error
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    })

  } catch (error) {
    console.error('Unexpected error in partner document upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/partner/documents/upload - Get partner documents (for admin review)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get partner documents
    const { data: partner, error } = await supabase
      .from('partners')
      .select('verification_documents')
      .eq('id', partnerId)
      .single()

    if (error || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Generate signed URLs for document access (for admin review)
    const documentUrls = []
    if (partner.verification_documents && partner.verification_documents.length > 0) {
      for (const docPath of partner.verification_documents) {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('partner-documents')
          .createSignedUrl(docPath, 3600) // 1 hour expiry

        if (!urlError && signedUrl) {
          documentUrls.push({
            path: docPath,
            url: signedUrl.signedUrl,
            name: docPath.split('/').pop()
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      documents: documentUrls
    })

  } catch (error) {
    console.error('Unexpected error in get partner documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}