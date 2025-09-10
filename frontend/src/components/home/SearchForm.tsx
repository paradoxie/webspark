'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function SearchForm() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-6 w-6 text-blue-300" aria-hidden="true" />
      </div>
      <input
        type="text"
        placeholder="搜索作品、标签、作者或技术栈..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="block w-full pl-12 pr-4 py-4 text-lg border-0 rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 focus:outline-none focus:ring-4 focus:ring-white/30 focus:bg-white/30 transition-all"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 pr-4 flex items-center"
      >
        <div className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors">
          <MagnifyingGlassIcon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
      </button>
    </form>
  )
}