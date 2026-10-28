import { RefreshCw, ChevronDown, Menu, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  sidebarExpanded?: boolean;
  onOpenMobileSidebar?: () => void;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
}

function UserSolidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M3.5 20.2C3.5 16.5 7.3 14 12 14s8.5 2.5 8.5 6.2c0 .7-.5 1.3-1.2 1.3H4.7c-.7 0-1.2-.6-1.2-1.3z" />
    </svg>
  );
}

const todayLabel = () => {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(now);
  const date = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(now);
  return `${weekday} ${date}`;
};

/** Top application bar (white), spans the full width above the sidebar and the content */
export default function Header({ sidebarExpanded = true, onOpenMobileSidebar, privacyMode = false, onTogglePrivacy }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel = user?.role === 'admin' ? 'مدیر سیستم' : user?.role === 'manager' ? 'مدیر' : 'کارمند';

  return (
    <header className="h-12 bg-white text-[#333] flex items-center flex-shrink-0 relative z-40">
      {/* Brand column, as wide as the sidebar and in the sidebar's colour */}
      <div
        className={`h-full flex items-center gap-2 flex-shrink-0 px-3 md:px-0 md:justify-center md:bg-[#007DB2] border-b border-[#EAEAEA] md:border-b-0 transition-[width] duration-300 ${
          sidebarExpanded ? 'md:w-[240px]' : 'md:w-16'
        }`}
      >
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden w-9 h-9 rounded-md flex items-center justify-center text-[#007DB2] hover:bg-[#F3F4F8]"
          aria-label="باز کردن منوی کناری"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center" aria-label="نواتیک">
          <span
            className={`hidden md:inline font-bold leading-none text-white tracking-tight transition-all duration-300 ${
              sidebarExpanded ? 'text-[22px]' : 'text-[13px]'
            }`}
          >
            نواتیک
          </span>
          <span className="md:hidden text-[18px] font-bold leading-none text-[#007DB2]">نواتیک</span>
        </Link>
      </div>

      <div className="flex-1 h-full flex items-center justify-between pr-4 md:pr-[31px] pl-3 md:pl-8 min-w-0 border-b border-[#EAEAEA]">
        <span className="hidden sm:block text-[14px] font-bold whitespace-nowrap text-[#333]">{todayLabel()}</span>

        <div className="flex items-center mr-auto">
          {/* Privacy mode: blurs amounts on screen */}
          <button
            onClick={onTogglePrivacy}
            role="switch"
            aria-checked={privacyMode}
            className="flex items-center gap-[7px]"
            title="پنهان کردن مبالغ روی صفحه"
          >
            <span className="hidden sm:inline text-[14px] whitespace-nowrap text-[#555]">حالت امنیتی</span>
            <span
              className={`relative w-[42px] h-5 rounded-full transition-colors duration-200 ${privacyMode ? 'bg-[#BFE6F6]' : 'bg-[#E6E6E6]'}`}
            >
              <span
                className={`absolute top-[2px] w-4 h-4 rounded-full transition-all duration-200 ${
                  privacyMode ? 'right-[3px] bg-[#007DB2]' : 'right-[23px] bg-[#BBBBBB]'
                }`}
              />
            </span>
          </button>

          <span className="w-px h-[31px] bg-[#E3E3E3] mr-4 ml-[34px]" />

          <button
            onClick={() => window.location.reload()}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#555] hover:text-[#007DB2] hover:bg-[#F3F4F8] transition-colors duration-150"
            aria-label="بارگذاری دوباره"
            title="بارگذاری دوباره"
          >
            <RefreshCw className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* User menu */}
          <div className="relative mr-[17px]">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="h-8 px-1 rounded-md flex items-center gap-[10px] text-[#555] hover:text-[#007DB2] hover:bg-[#F3F4F8] transition-colors duration-150"
              aria-label="حساب کاربری"
            >
              <UserSolidIcon />
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserMenu(false)} />
                <div className="absolute left-0 top-full mt-2 w-56 bg-white text-slate-700 rounded-lg border border-[#EAEAEA] shadow-xl animate-scale-in">
                  <div className="p-4 border-b border-[#EFEFEF]">
                    <p className="font-semibold text-[#333] text-sm">{user?.full_name || 'کاربر'}</p>
                    <p className="text-xs text-[#888] mt-1">{roleLabel}</p>
                  </div>
                  <div className="p-1.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F3F4F8] rounded-md text-right text-sm">
                      <User className="w-4 h-4 text-[#656565]" />
                      پروفایل کاربری
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F3F4F8] rounded-md text-right text-sm">
                      <Settings className="w-4 h-4 text-[#656565]" />
                      تنظیمات
                    </button>
                    <hr className="my-1.5 border-[#EFEFEF]" />
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 text-red-600 rounded-md text-right text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      خروج از سیستم
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
