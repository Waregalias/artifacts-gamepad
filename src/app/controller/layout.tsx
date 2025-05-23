'use client'

function RootLayout({children}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full h-full controller">{children}</main>
  );
}


export default RootLayout;
