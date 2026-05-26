'use client'

interface UserAvatarProps {
  avatarId:  string | null
  name:      string
  size?:     number
  className?: string
  style?:    React.CSSProperties
}

export function UserAvatar({ avatarId, name, size = 48, className, style }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarId) {
    return (
      <img
        src={`/avatars/${avatarId}.png`}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: '50%',
          background: 'var(--surface-alt)',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size < 40 ? '50%' : '16px',
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        color: '#fff',
        background: 'var(--gradient-primary)',
        fontFamily: 'Poppins, sans-serif',
        ...style,
      }}
    >
      {initials}
    </div>
  )
}
