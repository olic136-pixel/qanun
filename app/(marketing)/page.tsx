import { QanunWordmark } from '@/components/qanun/QanunWordmark'

export default function HomePage() {
  return (
    <div className="p-8 flex flex-col gap-8">
      <QanunWordmark size="lg" />
      <QanunWordmark size="md" />
      <div className="bg-[#0B1829] p-4 rounded-lg inline-block">
        <QanunWordmark size="sm" dark />
      </div>
    </div>
  )
}
