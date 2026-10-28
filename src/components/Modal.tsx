import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
}

// مودال‌های باز به ترتیب باز شدن؛ قفل اسکرول با بسته شدن آخرین مودال برداشته می‌شود
// و Esc فقط بالاترین مودال را می‌بندد
const openStack: symbol[] = [];

export default function Modal({ children, onClose }: ModalProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Lock the layout scroll container (and body) while a modal is open
    const scrollRoot = document.getElementById('app-scroll');
    const id = Symbol('modal');
    openStack.push(id);
    if (scrollRoot) scrollRoot.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onCloseRef.current?.();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      openStack.splice(openStack.indexOf(id), 1);
      if (openStack.length === 0) {
        if (scrollRoot) scrollRoot.style.overflow = '';
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[100] bg-[#0C2D4E]/40 backdrop-blur-[2px] overflow-y-auto overscroll-contain">
      <div
        className="min-h-full flex items-center justify-center p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCloseRef.current?.();
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
