
'use client';

export default function ContributeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#0a0a23] text-white min-h-screen">
      <main>{children}</main>
    </div>
  )
}
