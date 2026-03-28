import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, FileSpreadsheet, CheckCircle } from 'lucide-react'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onFilesSelected?: (files: File[]) => void
}

interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
}

export default function FileUpload({ accept = '.csv,.xlsx,.xls,.jpg,.jpeg,.png', multiple = true, onFilesSelected }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const simulateUpload = useCallback((newFiles: File[]) => {
    const uploadFiles = newFiles.map((f) => ({ file: f, progress: 0, status: 'uploading' as const }))
    setFiles((prev) => [...prev, ...uploadFiles])
    onFilesSelected?.(newFiles)

    // Simulate progress
    uploadFiles.forEach((uf, idx) => {
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.file === uf.file && f.status === 'uploading') {
              const newProgress = Math.min(f.progress + 15 + Math.random() * 20, 100)
              return {
                ...f,
                progress: newProgress,
                status: newProgress >= 100 ? 'done' : 'uploading',
              }
            }
            return f
          })
        )
      }, 200 + idx * 100)

      setTimeout(() => clearInterval(interval), 2000)
    })
  }, [onFilesSelected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length) simulateUpload(dropped)
  }, [simulateUpload])

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length) simulateUpload(selected)
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
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
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">拖拽文件至此处，或<span className="text-green-600 font-medium">点击选择</span></p>
        <p className="text-xs text-gray-400 mt-1">支持 CSV、Excel、图片格式</p>
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
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              {getFileIcon(f.file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{f.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        f.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {f.status === 'done' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 inline" />
                    ) : (
                      `${Math.round(f.progress)}%`
                    )}
                  </span>
                </div>
              </div>
              <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
