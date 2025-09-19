'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  type: 'avatar' | 'screenshot';
  onUpload?: (url: string) => void;
  onUploadMultiple?: (urls: string[]) => void;
  currentImage?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export default function ImageUpload({ 
  type, 
  onUpload, 
  onUploadMultiple,
  currentImage, 
  multiple = false,
  maxFiles = 5,
  className = '' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // 验证文件数量
    if (multiple && files.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 张图片`);
      return;
    }

    // 验证文件类型和大小
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是有效的图片文件`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 文件大小超过 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      if (multiple) {
        await handleMultipleUpload(validFiles);
      } else {
        await handleSingleUpload(validFiles[0]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleSingleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append(type, file);

    const response = await fetch(`/api/upload/${type}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    onUpload?.(data.data.url);
    toast.success('上传成功！');
  };

  const handleMultipleUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('screenshots', file);
    });

    const response = await fetch('/api/upload/screenshots', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    const urls = data.data.map((item: any) => item.url);
    onUploadMultiple?.(urls);
    toast.success(`成功上传 ${files.length} 张图片！`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getUploadText = () => {
    if (type === 'avatar') {
      return '上传头像';
    }
    return multiple ? '上传截图' : '上传截图';
  };

  const getHelpText = () => {
    if (type === 'avatar') {
      return '支持 JPG、PNG 格式，建议尺寸 200x200px，最大 5MB';
    }
    if (multiple) {
      return `支持 JPG、PNG 格式，最多 ${maxFiles} 张，每张最大 5MB`;
    }
    return '支持 JPG、PNG 格式，建议尺寸 1200px 宽度，最大 5MB';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 当前图片预览 */}
      {currentImage && !multiple && (
        <div className=\"relative inline-block\">
          <Image
            src={currentImage}
            alt=\"当前图片\"
            width={type === 'avatar' ? 120 : 300}
            height={type === 'avatar' ? 120 : 200}
            className={`object-cover border-2 border-slate-200 ${
              type === 'avatar' ? 'rounded-full' : 'rounded-lg'
            }`}
          />
        </div>
      )}

      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : uploading
            ? 'border-slate-300 bg-slate-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type=\"file\"
          accept=\"image/*\"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className=\"hidden\"
        />

        {uploading ? (
          <div className=\"space-y-3\">
            <div className=\"w-12 h-12 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin\"></div>
            <p className=\"text-slate-600\">上传中...</p>
          </div>
        ) : (
          <div className=\"space-y-3\">
            <div className=\"w-12 h-12 mx-auto bg-slate-100 rounded-lg flex items-center justify-center\">
              {type === 'avatar' ? (
                <svg className=\"w-6 h-6 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\" />
                </svg>
              ) : (
                <svg className=\"w-6 h-6 text-slate-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\" />
                </svg>
              )}
            </div>
            <div>
              <p className=\"text-lg font-medium text-slate-900\">{getUploadText()}</p>
              <p className=\"text-sm text-slate-500 mt-1\">
                点击或拖拽文件到此处
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 帮助文本 */}
      <p className=\"text-xs text-slate-500 text-center\">{getHelpText()}</p>
    </div>
  );
}