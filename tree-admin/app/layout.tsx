// app/layout.tsx
import './styles.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Urban Tree Inventory',
  description: 'Admin dashboard for managing urban tree inventory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background text-text-primary`}>
        <DarkModeScript />
        <div className="min-h-full">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--background-card)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--secondary-light)',
              boxShadow: 'var(--shadow-md)',
            },
            success: {
              iconTheme: {
                primary: 'var(--primary)',
                secondary: 'var(--background-card)',
              },
            },
          }}
        />
        
        {/* Debugging script */}
        <script dangerouslySetInnerHTML={{ __html: `
          console.log('Button click debugger loaded');
          
          // Log all button and link clicks
          document.addEventListener('click', function(e) {
            const target = e.target;
            console.log('Click event:', e);
            
            if (target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.closest('button') || 
                target.closest('a')) {
              console.log('Button/link clicked:', target);
            }
          });
        `}} />
      </body>
    </html>
  )
}

// Client component to handle dark mode
function DarkModeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Check for saved theme preference or prefer-color-scheme
          (function() {
            function getThemePreference() {
              if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
              }
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            const theme = getThemePreference();
            
            // Apply the theme class to html element
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            
            // Make theme available immediately to avoid FOUC (Flash of Unstyled Content)
            window.isDark = theme === 'dark';
          })();
        `,
      }}
    />
  );
}