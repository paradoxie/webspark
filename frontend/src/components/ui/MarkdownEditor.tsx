'use client';

import { useState } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '请输入Markdown格式的详细描述...',
  error,
  className = '',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // 简单的Markdown渲染函数
  const renderMarkdown = (text: string) => {
    let html = text
      // 标题
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-slate-900 mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-slate-900 mb-3 mt-6">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-slate-900 mb-4 mt-8">$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // 代码块
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // 无序列表
      .replace(/^\- (.*$)/gm, '<li class="ml-4">• $1</li>')
      // 有序列表
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      // 段落
      .replace(/\n\n/g, '</p><p class="mb-4">');

    // 包装段落
    if (html && !html.startsWith('<')) {
      html = '<p class="mb-4">' + html + '</p>';
    }

    return html;
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // 恢复选择
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    {
      label: '粗体',
      icon: 'B',
      action: () => insertMarkdown('**', '**'),
      className: 'font-bold',
    },
    {
      label: '斜体',
      icon: 'I',
      action: () => insertMarkdown('*', '*'),
      className: 'italic',
    },
    {
      label: '标题',
      icon: 'H',
      action: () => insertMarkdown('## '),
      className: 'font-bold',
    },
    {
      label: '链接',
      icon: '🔗',
      action: () => insertMarkdown('[', '](https://)'),
    },
    {
      label: '代码',
      icon: '</>',
      action: () => insertMarkdown('`', '`'),
      className: 'font-mono text-sm',
    },
    {
      label: '列表',
      icon: '•',
      action: () => insertMarkdown('- '),
    },
  ];

  return (
    <div className={`border border-slate-300 rounded-lg overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="bg-slate-50 border-b border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                onClick={button.action}
                className={`px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 transition-colors ${button.className || ''}`}
                title={button.label}
              >
                {button.icon}
              </button>
            ))}
          </div>

          {/* 标签切换 */}
          <div className="flex bg-white border border-slate-300 rounded">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 text-sm transition-colors ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              预览
            </button>
          </div>
        </div>
      </div>

      {/* 编辑器内容 */}
      <div className="min-h-64">
        {activeTab === 'edit' ? (
          <textarea
            className="markdown-textarea w-full h-64 p-4 border-0 resize-none focus:outline-none focus:ring-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <div className="h-64 p-4 overflow-y-auto bg-white">
            {value ? (
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
              />
            ) : (
              <div className="text-slate-400 italic">
                开始输入内容以查看预览...
              </div>
            )}
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 帮助信息 */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex flex-wrap gap-4">
          <span>支持Markdown语法：</span>
          <span>**粗体**</span>
          <span>*斜体*</span>
          <span>`代码`</span>
          <span>[链接](URL)</span>
          <span>## 标题</span>
          <span>- 列表</span>
        </div>
      </div>
    </div>
  );
} 