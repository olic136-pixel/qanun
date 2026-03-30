import { MarketingNav } from '@/components/marketing/MarketingNav'
import { Footer } from '@/components/qanun/marketing/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="pt-[68px]">{children}</main>
      <Footer />
    </>
  )
}
