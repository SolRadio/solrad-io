'use client'

import { useState } from 'react'

interface TokenImageProps {
  src?: string | null
  symbol?: string | null
  size?: number
  className?: string
}

export function TokenImage({ src, symbol, size = 32, className = '' }: TokenImageProps) {
  const [errored, setErrored] = useState(false)

  const initial = symbol?.slice(0, 2)?.toUpperCase() ?? '??'

  if (!src || errored) {
    return (
      <div
        className={`rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-none ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="font-mono font-bold text-zinc-500"
          style={{ fontSize: Math.max(8, size * 0.28) }}
        >
          {initial}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${symbol ?? 'token'} logo`}
      width={size}
      height={size}
      className={`rounded-full flex-none object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  )
}
