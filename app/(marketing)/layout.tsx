import { NavBar } from '@/components/qanun/marketing/NavBar'
import { Footer } from '@/components/qanun/marketing/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
