import { useRef, useState } from 'react'
import { Upload, X, FileText, Image, FileSpreadsheet } from 'lucide-react'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function FileUpload({
  accept = '.csv,.xlsx,.xls,.jpg,.jpeg,.png,.pdf',
  multiple = true,
  files,
  onFilesChange,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []))
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-purple-500" />
    if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />
    return <FileText className="w-4 h-4 text-blue-500" />
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-300 hover:bg-green-50/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          拖拽文件至此处，或<span className="text-green-600 font-medium">点击选择</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">支持 CSV、Excel、图片、PDF</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={`${file.name}-${file.size}-${file.lastModified}-${i}`} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
