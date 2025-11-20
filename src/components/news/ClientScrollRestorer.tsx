'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function ClientScrollRestorer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const getKey = () => {
      const paramsString = searchParams?.toString()
      return `scroll-pos-${pathname}${paramsString ? `?${paramsString}` : ''}`
    }

    const saveScrollPosition = () => {
      const key = getKey()
      sessionStorage.setItem(key, window.scrollY.toString())
    }

    const restoreScrollPosition = () => {
      const key = getKey()
      const savedPosition = sessionStorage.getItem(key)
      
      if (savedPosition) {
        const scrollPos = parseInt(savedPosition, 10)
        if (isNaN(scrollPos)) return

        const attemptRestore = (attempts = 0) => {
          if (attempts > 10) return 

          window.scrollTo(0, scrollPos)
          
          if (window.scrollY !== scrollPos && attempts < 10) {
            setTimeout(() => attemptRestore(attempts + 1), 50)
          }
        }
        
        setTimeout(attemptRestore, 50)
      }
    }

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        saveScrollPosition()
      }
    }

    const handleBeforeUnload = () => {
      saveScrollPosition()
    }

    document.addEventListener('click', handleLinkClick, true) // capture phase
    window.addEventListener('beforeunload', handleBeforeUnload)

    restoreScrollPosition()

    return () => {
      document.removeEventListener('click', handleLinkClick, true)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname, searchParams])

  return null
}