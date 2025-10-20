'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Upload, X, AlertCircle } from 'lucide-react'
import { client } from '@/lib/sanity'

interface ImageUploadProps {
  value?: string
  onChange: (value: string | null) => void
  className?: string
  maxSize?: number // in MB
  accept?: string[]
}

interface UploadedImage {
  _id: string
  url: string
  originalFilename: string
  size: number
}

export default function ImageUpload({
  value,
  onChange,
  className = '',
  maxSize = 10,
  accept = ['image/jpeg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)

  const uploadImage = async (file: File): Promise<UploadedImage> => {
    const asset = await client.assets.upload('image', file, {
      filename: file.name
    })

    return {
      _id: asset._id,
      url: asset.url,
      originalFilename: asset.originalFilename || file.name,
      size: file.size
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const uploaded = await uploadImage(file)
      setUploadedImage(uploaded)
      onChange(uploaded._id)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false
  })

  const removeImage = () => {
    setUploadedImage(null)
    onChange(null)
    setError(null)
  }

  const hasImage = value || uploadedImage

  return (
    <div className={`space-y-4 ${className}`}>
      {!hasImage ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop the image here' : 'Upload an image'}
              </p>
              <p className="text-xs text-gray-500">
                Drag and drop or click to select (max {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={uploadedImage?.url || value || ''}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {uploadedImage && (
            <div className="mt-2 text-xs text-gray-500">
              {uploadedImage.originalFilename} ({Math.round(uploadedImage.size / 1024)}KB)
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-blue-600">Uploading...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-sm text-red-700">
                <p className="font-medium">{file.name}</p>
                {errors.map((error) => (
                  <p key={error.code} className="text-xs">
                    {error.code === 'file-too-large' 
                      ? `File is too large (max ${maxSize}MB)`
                      : error.code === 'file-invalid-type'
                      ? 'Invalid file type'
                      : error.message
                    }
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}