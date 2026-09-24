import styles from './Tag.module.css'

/** A pill for skills, labels and badges. `accent` uses the brand tint. */
export default function Tag({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={[styles.tag, styles[variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
