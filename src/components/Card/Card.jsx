import styles from './Card.module.css'

/** A solid slab. Separated from the page by tone, never by an edge. */
export default function Card({ as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag className={[styles.card, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Tag>
  )
}
