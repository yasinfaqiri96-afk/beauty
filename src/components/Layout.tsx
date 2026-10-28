import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const readFlag = (key: string, fallback: boolean) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
};

const writeFlag = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore storage errors
  }
};

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => readFlag('sidebarExpanded', true));
  const [privacyMode, setPrivacyMode] = useState(() => readFlag('privacyMode', false));

  useEffect(() => {
    // Fast loading
    setIsLoading(false);
  }, []);

  const toggleSidebarExpanded = () => {
    setSidebarExpanded((v) => {
      writeFlag('sidebarExpanded', !v);
      return !v;
    });
  };

  const togglePrivacy = () => {
    setPrivacyMode((v) => {
      writeFlag('privacyMode', !v);
      return !v;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50/30 to-accent-100/50 flex items-center justify-center" dir="rtl">
        <div className="glass-card p-8 rounded-3xl text-center animate-scale-in">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <span className="text-white font-bold text-2xl">RB</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-accent-200 rounded animate-pulse w-32 mx-auto"></div>
            <div className="h-3 bg-accent-100 rounded animate-pulse w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-hidden bg-[#F3F4F8] flex flex-col ${privacyMode ? 'privacy-mode' : ''}`} dir="rtl">
      <Header
        sidebarExpanded={sidebarExpanded}
        onOpenMobileSidebar={() => setSidebarOpen((v) => !v)}
        privacyMode={privacyMode}
        onTogglePrivacy={togglePrivacy}
      />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isExpanded={sidebarExpanded}
          onToggleExpanded={toggleSidebarExpanded}
        />

        {sidebarOpen && (
          <div
            className="fixed inset-x-0 top-12 bottom-0 bg-black/40 z-40 md:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Scroll container: RTL places the scrollbar on the left edge, away from the sidebar */}
        <div id="app-scroll" className="flex-1 min-w-0 flex flex-col overflow-y-auto relative [&>*]:flex-shrink-0">
          <main className="px-4 sm:px-8 lg:px-12 xl:px-14 py-6 md:py-8 animate-fade-in flex-1">
            <div className="relative w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
