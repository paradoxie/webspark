'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  // 生成结构化数据
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Thing",
        "@id": item.url.startsWith('http') ? item.url : `https://webspark.club${item.url}`,
        "name": item.name
      }
    }))
  }

  // 注入结构化数据到页面头部
  useEffect(() => {
    if (items.length > 0) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(breadcrumbJsonLd)
      script.id = 'breadcrumb-jsonld'
      
      // 移除之前的面包屑结构化数据（如果存在）
      const existingScript = document.getElementById('breadcrumb-jsonld')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
      
      document.head.appendChild(script)
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    }
  }, [JSON.stringify(breadcrumbJsonLd)])

  if (items.length === 0) {
    return null
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 mx-2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {index === items.length - 1 ? (
              <span
                className="text-slate-500"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                itemProp="item"
                itemScope
                itemType="https://schema.org/Thing"
              >
                <span itemProp="name">{item.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}