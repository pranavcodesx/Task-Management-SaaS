import { CheckSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ light = false, to = '/', onClick }: { light?: boolean; to?: string; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2 no-underline">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4e84ff] to-[#2f66f6] text-white shadow-[0_6px_14px_rgba(47,102,246,0.25)]">
        <CheckSquare size={18} strokeWidth={2.4} />
      </span>
      <span className={`text-[17px] font-bold tracking-[-0.03em] ${light ? 'text-white' : 'text-ink'}`}>TaskFlow</span>
    </Link>
  )
}
