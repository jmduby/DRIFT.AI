type Props = {
  label: string
  value: string | number
  deltaLabel?: string
  iconRight?: React.ReactNode
  className?: string
}

export function KpiTile({ label, value, deltaLabel, iconRight, className = "" }: Props) {
  return (
    <div className={["card-surface p-4 hover:shadow-elev-2 transition-shadow", className].join(" ")}>
      <div className="flex items-center justify-between">
        <span className="kpi-title">{label}</span>
        {iconRight}
      </div>
      <div className="kpi-value mt-2">{value}</div>
      {deltaLabel && <div className="mt-1 text-xs text-text-3">{deltaLabel}</div>}
    </div>
  )
}