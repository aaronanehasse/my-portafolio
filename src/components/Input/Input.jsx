import { useId } from 'react'
import styles from './Input.module.css'

/**
 * Text input with an optional label, hint and error.
 * Set `multiline` to render a <textarea>.
 */
export default function Input({
  label,
  hint,
  error,
  multiline = false,
  id,
  className,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-message`
  const message = error || hint
  const Field = multiline ? 'textarea' : 'input'

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <Field
        id={inputId}
        className={[
          styles.control,
          multiline && styles.multiline,
          error && styles.invalid,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...props}
      />
      {message && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {message}
        </p>
      )}
    </div>
  )
}
