// Cloudinary image upload utility

export interface CloudinaryUploadResponse {
  public_id: string
  version: number
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  tags: string[]
  bytes: number
  type: string
  etag: string
  placeholder: boolean
  url: string
  secure_url: string
  folder: string
  original_filename: string
  [key: string]: any
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  // Validate environment variables
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in environment variables')
  }

  if (!uploadPreset) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not set in environment variables')
  }

  // Validate file
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file: must be a File object')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: must be an image')
  }

  // Log for debugging
  console.log('Upload config:', {
    cloudName,
    uploadPreset,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  // Optional: Only add folder if your upload preset allows it
  // formData.append('folder', 'uhomes-mart/products')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100),
        }
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as CloudinaryUploadResponse
          console.log('Upload successful:', response)
          resolve(response)
        } catch (error) {
          console.error('Failed to parse response:', xhr.responseText)
          reject(new Error('Failed to parse upload response'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          console.error('Upload failed:', {
            status: xhr.status,
            error: error,
            cloudName,
            uploadPreset,
          })
          reject(new Error(error.error?.message || `Upload failed with status ${xhr.status}`))
        } catch (e) {
          console.error('Upload failed with unparseable error:', xhr.responseText)
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      console.error('Network error during upload')
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      console.error('Upload cancelled')
      reject(new Error('Upload cancelled'))
    })

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    console.log('Uploading to:', uploadUrl)
    
    xhr.open('POST', uploadUrl)
    xhr.send(formData)
  })
}

export function generateCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb'
    quality?: 'auto' | number
    format?: string
  }
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  if (!cloudName) {
    return `https://res.cloudinary.com/unknown/image/upload/${publicId}`
  }

  const params: string[] = []

  if (options?.width) params.push(`w_${options.width}`)
  if (options?.height) params.push(`h_${options.height}`)
  if (options?.crop) params.push(`c_${options.crop}`)
  if (options?.quality) {
    params.push(`q_${options.quality}`)
  }
  if (options?.format) params.push(`f_${options.format}`)

  const transformations = params.length > 0 ? `${params.join(',')}/` : ''

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}${publicId}`
}