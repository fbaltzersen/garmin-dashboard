import type { ReactNode } from 'react'

export function ListRow({
  color,
  title,
  subtitle,
  value,
  onClick,
}: {
  color: string
  title: ReactNode
  subtitle?: ReactNode
  value?: ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="list-row" onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="list-row-dot" style={{ background: color }} />
      <span className="list-row-main">
        <span className="list-row-title">{title}</span>
        {subtitle && <span className="list-row-subtitle">{subtitle}</span>}
      </span>
      {value != null && <span className="list-row-value tabular">{value}</span>}
    </Tag>
  )
}

export function ListGroup({ children }: { children: ReactNode }) {
  return <div className="list-group">{children}</div>
}
