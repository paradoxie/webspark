'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  _count: {
    websites: number;
  };
}

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('加载分类失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">浏览分类</h2>
          <div className="w-24 h-8 bg-slate-200 animate-pulse rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="w-16 h-16 bg-slate-200 rounded-xl mx-auto mb-4"></div>
              <div className="h-6 bg-slate-200 rounded-md w-20 mx-auto mb-2"></div>
              <div className="h-4 bg-slate-100 rounded-md w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null; // 如果加载失败，不显示分类部分
  }

  // 只显示前8个分类
  const displayCategories = categories.slice(0, 8);

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">浏览分类</h2>
        <Link 
          href="/categories" 
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          查看全部
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayCategories.map(category => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center transform hover:-translate-y-1"
          >
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center text-2xl shadow-md"
              style={{ 
                backgroundColor: category.color + '20', 
                border: `2px solid ${category.color}30`
              }}
            >
              {category.icon}
            </div>
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
              {category.name}
            </h3>
            <p className="text-xs text-slate-500">
              {category._count.websites} 个作品
            </p>
            
            {/* 悬浮效果 */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"
              style={{ backgroundColor: category.color }}
            ></div>
          </Link>
        ))}
      </div>
    </div>
  );
} 