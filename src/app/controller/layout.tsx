'use client'

function RootLayout({children}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full">{children}</main>
  );
}


export default RootLayout;
