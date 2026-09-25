import { useT } from '../../i18n/index.jsx'
import SiteLayout from '../../layout/SiteLayout.jsx'
import { details, EMAIL } from './details.js'
import styles from './LegalPage.module.css'

/**
 * /privacy and /imprint: plain reading pages. The words are in the language
 * files under legal.<doc>; a section's body is paragraphs, and an array in it
 * is a bulleted list. `{email}` anywhere becomes a mail link.
 */
export default function LegalPage({ doc }) {
  const { t } = useT()
  const base = `legal.${doc}`
  const email = <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
  const text = (key) => t(key, { email })

  return (
    <SiteLayout>
      <article className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>{t(`${base}.title`)}</h1>
          <p className={styles.intro}>{text(`${base}.intro`)}</p>
          <p className={styles.updated}>{t('legal.updated', { date: t('legal.date') })}</p>
        </header>

        {doc === 'imprint' && (
          <dl className={styles.details}>
            {details.map(([key, value]) => (
              <div key={key} className={styles.row}>
                <dt>{t(`legal.imprint.labels.${key}`)}</dt>
                <dd>
                  {key === 'email'
                    ? email
                    : Array.isArray(value)
                      ? value.map((line) => <span key={line}>{line}</span>)
                      : value}
                </dd>
              </div>
            ))}
            <div className={styles.row}>
              <dt>{t('legal.imprint.labels.form')}</dt>
              <dd>{t('legal.imprint.form')}</dd>
            </div>
          </dl>
        )}

        {t(`${base}.sections`).map((section, i) => (
          <section key={i} className={styles.section}>
            <h2 className={styles.heading}>{section.title}</h2>
            {section.body.map((part, j) => {
              const key = `${base}.sections.${i}.body.${j}`
              return Array.isArray(part) ? (
                <ul key={j} className={styles.list}>
                  {part.map((_, k) => (
                    <li key={k}>{text(`${key}.${k}`)}</li>
                  ))}
                </ul>
              ) : (
                <p key={j}>{text(key)}</p>
              )
            })}
          </section>
        ))}
      </article>
    </SiteLayout>
  )
}
