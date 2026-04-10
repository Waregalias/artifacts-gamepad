import '@fortawesome/fontawesome-svg-core/styles.css'
import {config} from '@fortawesome/fontawesome-svg-core'
import {Toaster} from "@/components/ui/toaster";
import {ThemeProvider} from "@/components/ui/theme-provider";
import './globals.css'

config.autoAddCss = false

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <main>{children}</main>
      <Toaster/>
    </ThemeProvider>

    </body>
    </html>
  )
}
