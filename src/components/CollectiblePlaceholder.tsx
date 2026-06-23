interface CollectiblePlaceholderProps {
  title: string
}

export default function CollectiblePlaceholder({ title }: CollectiblePlaceholderProps) {
  return (
    <section className="collectible-quest-group collectible-placeholder">
      <h3>
        {title} <span className="collectible-nyi">NYI</span>
      </h3>
    </section>
  )
}
