
import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useLogContext } from "../contexts/LogContext";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const FileUploader = ({ onFileUpload, isProcessing, setIsProcessing }: FileUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadLog } = useLogContext();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    // Validate file type
    const validTypes = ['.log', '.txt', '.json'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      alert('Please upload a .log, .txt, or .json file');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setIsProcessing(true);
    
    try {
      await uploadLog(file);
      onFileUpload(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading the log file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Processing Log File</h3>
        <p className="text-slate-400">Uploading and parsing entries...</p>
      </div>
    );
  }

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
        ${isDragOver 
          ? 'border-blue-400 bg-blue-400/10' 
          : 'border-slate-600 hover:border-slate-500'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".log,.txt,.json"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-slate-700 rounded-full">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">Upload Your Log File</h3>
          <p className="text-slate-400 mb-4">
            Drag and drop your .log, .txt, or .json file here, or click to browse
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <FileText className="w-4 h-4" />
            Supports .log, .txt, .json files up to 50MB
          </div>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
          Choose File
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
