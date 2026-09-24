import styles from './Button.module.css'

/**
 * The one button. Variants are fills; sizes are padding and radius.
 * Pass `href` for navigation — it renders a real <a> so middle-click works.
 */
export default function Button({
  variant = 'primary',
  size = 'normal',
  iconOnly = false,
  href,
  className,
  children,
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
