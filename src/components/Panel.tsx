import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: LucideIcon
  children: ReactNode
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        {Icon && <Icon />}
        <span>{title}</span>
      </div>
      {children}
    </section>
  )
}
