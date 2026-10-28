import { Search, ArrowRightToLine, ArrowLeftFromLine, X } from 'lucide-react';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid';
import { NavLink, useNavigate } from 'react-router-dom';
import { Fragment, useState } from 'react';
import { menuItems } from './menuItems';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const footerInfo = ['نواتیک', 'نسخه ۱٫۰٫۰', '۱۴۰۵'];

/** Blue sidebar under the top bar: menu search, collapse button, menu, logout band and info row */
function SidebarBody({ expanded, onToggleExpanded, onNavigate }: { expanded: boolean; onToggleExpanded?: () => void; onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const q = query.trim();
  const items = q ? menuItems.filter((m) => m.label.includes(q)) : menuItems;

  return (
    <div className="h-full flex flex-col bg-[#007DB2] text-white">
      {/* Search + collapse */}
      <div className={`flex items-center gap-[10px] pt-4 pb-5 flex-shrink-0 ${expanded ? 'px-3' : 'px-[15px] justify-center'}`}>
        {expanded && (
          <label className="relative flex-1 h-8">
            <Search className="absolute right-[10px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-white" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="جستجو در منو"
              className="w-full h-full rounded-md border border-[#EAEAEA] bg-transparent pr-9 pl-2 text-[13px] text-white placeholder:text-white/60 outline-none focus:bg-white/10"
            />
          </label>
        )}
        {onToggleExpanded && (
          <button
            onClick={() => {
              setTooltip(null);
              onToggleExpanded();
            }}
            className="w-[34px] h-8 rounded-md border border-[#EAEAEA] flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors duration-150"
            aria-label={expanded ? 'بستن منوی کناری' : 'گسترش منوی کناری'}
            title={expanded ? 'بستن منو' : 'گسترش منو'}
          >
            {expanded ? <ArrowRightToLine className="w-[18px] h-[18px]" strokeWidth={2.2} /> : <ArrowLeftFromLine className="w-[18px] h-[18px]" strokeWidth={2.2} />}
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] ${expanded ? 'px-3' : 'px-2'}`}>
        <ul className="space-y-2 pb-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  aria-label={item.label}
                  onMouseEnter={(e) => {
                    if (expanded) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    setTooltip({ label: item.label, top: r.top + r.height / 2 });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className={({ isActive }) =>
                    `h-11 rounded-lg flex items-center gap-3 whitespace-nowrap text-white/90 hover:text-white transition-colors duration-200 ${
                      expanded ? 'pr-3 pl-2' : 'justify-center'
                    } ${isActive ? 'bg-[#006088] text-white' : 'hover:bg-white/[0.07]'}`
                  }
                >
                  <Icon className="w-[23px] h-[23px] flex-shrink-0 opacity-85" />
                  {expanded && <span className="text-[13.5px] font-normal tracking-[0.2px]">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
          {items.length === 0 && <li className="px-3 py-4 text-[13px] text-white/70">موردی پیدا نشد</li>}
        </ul>
      </nav>

      {tooltip && !expanded && (
        <span
          className="pointer-events-none fixed right-[72px] -translate-y-1/2 px-3 py-1.5 rounded-md bg-[#006088] text-white text-xs whitespace-nowrap shadow-lg animate-scale-in z-50"
          style={{ top: tooltip.top }}
        >
          {tooltip.label}
        </span>
      )}

      {/* Logout band */}
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="h-10 flex-shrink-0 bg-[#257DB2] hover:bg-[#2C88BF] flex items-center justify-center gap-[10px] text-[13.5px] font-normal transition-colors duration-150"
        title="خروج از سیستم"
      >
        <ArrowRightStartOnRectangleIcon className="w-[22px] h-[22px] opacity-85" />
        {expanded && 'خروج از سیستم'}
      </button>

      {/* Info row */}
      {expanded && (
        <div className="h-[53px] flex-shrink-0 bg-[#257DB2] border-t border-[#EAEAEA] flex items-center text-[14px]">
          {footerInfo.map((text, i) => (
            <Fragment key={text}>
              {i > 0 && <span className="w-px h-5 bg-white/90 flex-shrink-0" />}
              <span className="flex-1 text-center whitespace-nowrap">{text}</span>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ isOpen = false, onClose, isExpanded = true, onToggleExpanded }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:block h-full flex-shrink-0 transition-[width] duration-300 ${isExpanded ? 'w-[240px]' : 'w-16'}`}>
        <SidebarBody expanded={isExpanded} onToggleExpanded={onToggleExpanded} />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-12 right-0 bottom-0 w-[240px] z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {isOpen && (
          <button
            onClick={onClose}
            className="absolute top-[9px] -left-11 w-9 h-9 rounded-md bg-white text-[#007DB2] flex items-center justify-center shadow"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <SidebarBody expanded onNavigate={onClose} />
      </aside>
    </>
  );
}

export default Sidebar;
