// src/app/upload/page.tsx
// [기능]: HTML 파일 업로드를 테스트하기 위한 페이지 (경로: /upload)

'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false) // [클린 코드] 로딩 상태 추가

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 선택해주세요.')
      return
    }

    setLoading(true) // 로딩 시작
    setMessage('업로드 중...')

    try {
      const text = await file.text()

      // ✅ 수정된 부분: JSON 페이로드 생성
      const payload = {
        html: text,
      };

      const res = await fetch('/api/parse', {
        method: 'POST',
        // ✅ 수정된 부분: 헤더 추가
        headers: {
          'Content-Type': 'application/json',
        },
        // ✅ 수정된 부분: JSON 문자열로 변환하여 전송
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (result.success) {
        setMessage(`✅ 기사 저장 완료! (제목: ${result.title || '알 수 없음'})`)
      } else {
        throw new Error(result.error || '저장 중 오류 발생')
      }
    } catch (err: unknown) {
      // [클린 코드] 오류 메시지 표시
      setMessage(`❌ 오류: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false) // 로딩 종료
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">HTML 기사 업로드 (테스트용)</h1>
      <div className="flex flex-col gap-2">
        <input 
          type="file" 
          accept=".html,.htm" // [클린 코드] .htm 추가
          onChange={(e) => setFile(e.target.files?.[0] || null)} 
          disabled={loading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button 
          onClick={handleUpload} 
          disabled={loading || !file} // [클린 코드] 로딩 중이거나 파일 없으면 비활성화
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '업로드 중...' : '업로드하고 저장하기'}
        </button>
      </div>
      {/* [클린 코드] 메시지가 있을 때만 p 태그 렌더링 */}
      {message && (
        <p className={`mt-4 ${message.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}