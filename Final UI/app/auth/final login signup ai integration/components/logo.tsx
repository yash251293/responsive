import Link from "next/link"

interface LogoProps {
  className?: string
  iconSize?: number
}

export function Logo({ className, iconSize = 28 }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center space-x-2 text-brand-text-dark ${className}`}>
      {/* <Briefcase size={iconSize} className="text-brand-blue" /> */}
      <span className="text-2xl font-bold" style={{fontFamily: 'Lora, serif'}}>
        <span style={{ color: '#000000' }}>100</span><span style={{ color: '#0056B3' }}>Networks</span>
      </span>
    </Link>
  )
}
