// src/app/news/[id]/edit/EditForm.tsx
// [기능]: 뉴스 수정 폼 (클라이언트 컴포넌트)
// - 제목(title)과 본문(content)을 수정
// - '저장' 버튼 클릭 시 /api/news/[id]로 PATCH 요청

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // App Router의 라우터

// 이 폼에서 필요한 최소한의 타입
type NewsItem = {
  id: string
  title: string
  content: string | null
  tags: string[] | null
}

export default function EditForm({ newsItem }: { newsItem: NewsItem }) {
  const router = useRouter()
  const [title, setTitle] = useState(newsItem.title)
  const [content, setContent] = useState(newsItem.content || '')
  const [tags, setTags] = useState(newsItem.tags?.join(', ') || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const tagsArray = tags
      .split(',') // 쉼표로 자르기
      .map(t => t.trim()) // 앞뒤 공백 제거
      .filter(t => t.length > 0); // 빈 태그 제거

    try {
      const res = await fetch(`/api/news/${newsItem.id}`, {
        method: 'PATCH', // 1단계에서 만든 API 호출
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({ title, content, tags: tagsArray }),
      })

      const result = await res.json()

      if (result.success) {
        setMessage('✅ 저장이 완료되었습니다. 2초 후 상세 페이지로 이동합니다.')
        
        // 저장 성공 시 2초 후 상세 페이지로 리다이렉트
        setTimeout(() => {
          // [클린 코드] router.refresh()는 서버 데이터를 새로고침합니다.
          // 상세 페이지가 서버 컴포넌트이므로, PUSH 전에 refresh()를 호출하거나
          // PUSH 이후에 호출하여 새 데이터를 받도록 합니다.
          // 여기서는 PUSH 후 상세 페이지가 스스로 새 데이터를 fetch할 것을 기대합니다.
          router.push(`/news/${newsItem.id}`)
          // (선택) router.refresh()를 PUSH 직후에 호출할 수도 있습니다.
          // router.refresh(); 
        }, 2000)
      } else {
        throw new Error(result.error || '저장 중 오류가 발생했습니다.')
      }
    } catch (err: any) {
      setMessage(`❌ 오류: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 제목 입력 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          제목
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required // [클린 코드] 제목은 필수로
        />
      </div>

      {/* [신규] 태그 입력 */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          태그
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="예: #AI, #기술, #뉴스"
        />
        <p className="mt-2 text-sm text-gray-500">
          쉼표(,)로 구분하여 태그를 입력하세요.
        </p>
      </div>

      {/* 본문(HTML) 입력 */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          본문 (HTML)
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={25}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
          placeholder="HTML 코드를 입력하세요..."
        />
        <p className="mt-2 text-sm text-gray-500">
          이곳에 YouTube 퍼가기 
          <code className="text-xs bg-gray-100 p-1 rounded">&lt;iframe ...&gt;</code> 
          코드를 붙여넣으세요.
        </p>
      </div>

      {/* 하단 버튼 및 메시지 */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '변경사항 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.back()} // [클린 코드] 뒤로가기 버튼
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          취소
        </button>
      </div>

      {/* 상태 메시지 */}
      {message && (
         <p 
           className={`text-base ${message.startsWith('❌') ? 'text-red-600' : 'text-green-700'}`}
           role="status"
           aria-live="polite"
         >
           {message}
         </p>
      )}
    </form>
  )
}