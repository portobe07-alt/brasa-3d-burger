import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Primitivas visuais compartilhadas. Centralizam a aparência dos controles. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ember text-white hover:bg-ember-soft active:bg-ember-deep shadow-ember disabled:bg-coal-3 disabled:text-ash disabled:shadow-none',
  secondary:
    'border border-cream/25 text-cream hover:border-cream/60 hover:bg-cream/5 active:bg-cream/10 disabled:border-cream/10 disabled:text-ash',
  ghost: 'text-ash hover:text-cream hover:bg-cream/5 active:bg-cream/10 disabled:text-ash/40',
  danger: 'text-ash hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[0.72rem] gap-1.5',
  md: 'h-11 px-5 text-[0.78rem] gap-2',
  lg: 'h-14 px-7 text-[0.85rem] gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ocupa toda a largura disponível. */
  block?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-full font-bold uppercase tracking-[0.1em]',
        'transition-all duration-200 ease-[var(--ease-brasa)] select-none',
        'disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

/** Botão circular de ícone. O rótulo acessível é obrigatório. */
export function IconButton({
  label,
  className = '',
  size = 'md',
  variant = 'secondary',
  children,
  ...rest
}: Omit<ButtonProps, 'block'> & { label: string; children: ReactNode }) {
  const dimension = size === 'sm' ? 'size-9' : size === 'lg' ? 'size-14' : 'size-11'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'inline-flex items-center justify-center rounded-full transition-all duration-200',
        'ease-[var(--ease-brasa)] active:scale-95 disabled:cursor-not-allowed',
        VARIANTS[variant],
        dimension,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

export type BadgeTone = 'neutral' | 'ember' | 'positive' | 'muted' | 'info'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-cream/10 text-cream border-cream/15',
  ember: 'bg-ember/15 text-ember-soft border-ember/35',
  positive: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/30',
  muted: 'bg-coal-3 text-ash border-white/5',
  info: 'bg-sky-500/12 text-sky-300 border-sky-400/25',
}

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        'text-[0.62rem] font-bold uppercase tracking-[0.14em] whitespace-nowrap',
        BADGE_TONES[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/** Título de seção com sobretítulo, usado no cardápio e no "como funciona". */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
}) {
  const alignment = align === 'center' ? 'text-center items-center mx-auto' : 'text-left items-start'
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignment}`}>
      {eyebrow && (
        <span className="text-[0.66rem] font-bold tracking-[0.3em] text-ember uppercase">{eyebrow}</span>
      )}
      <h2 className="text-balance text-3xl leading-[0.95] sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle && <p className="text-pretty text-[0.95rem] leading-relaxed text-ash">{subtitle}</p>}
    </div>
  )
}

/** Indicador de carregamento discreto. */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`anim-spin inline-block rounded-full border-2 border-cream/20 border-t-ember ${className || 'size-5'}`}
    />
  )
}

/** Separador tipográfico fino. */
export function Rule({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-white/8 ${className}`} />
}
