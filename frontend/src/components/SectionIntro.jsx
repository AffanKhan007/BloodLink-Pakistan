export default function SectionIntro({ eyebrow, title, description, actions, compact = false }) {
  return (
    <div className={`section-heading ${compact ? "section-heading-compact" : ""}`}>
      <div className="section-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </div>
  );
}
