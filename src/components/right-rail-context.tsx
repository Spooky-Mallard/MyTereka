'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type RightRailContextValue = {
  content: ReactNode
  setContent: (node: ReactNode) => void
}

const RightRailContext = createContext<RightRailContextValue>({
  content: null,
  setContent: () => {},
})

export function RightRailProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null)
  return (
    <RightRailContext.Provider value={{ content, setContent }}>
      {children}
    </RightRailContext.Provider>
  )
}

export function useRightRail() {
  return useContext(RightRailContext).content
}

export function useSetRightRail(node: ReactNode) {
  const { setContent } = useContext(RightRailContext)
  useEffect(() => {
    setContent(node)
    return () => setContent(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
