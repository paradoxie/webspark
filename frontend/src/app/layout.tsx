import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/providers/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>WebSpark.club - Web开发者作品展示平台</title>
        <meta name="description" content="为Web开发者社群创建的作品展示、灵感碰撞和交流互动的俱乐部" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased">
        <AuthProvider>
          <Header />
          <main className="relative">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
} 