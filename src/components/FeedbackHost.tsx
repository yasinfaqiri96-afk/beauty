import { useSyncExternalStore } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Trash2, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import { subscribe, getFeedbackState, dismissToast, resolveConfirm, type ToastType } from '../lib/feedback';

const toastStyles: Record<ToastType, { icon: typeof Info; chip: string; bar: string }> = {
  success: { icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: AlertCircle, chip: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
  info: { icon: Info, chip: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500' },
};

/** Renders toasts and the confirm dialog; mount once at the app root */
export default function FeedbackHost() {
  const { toasts, confirm } = useSyncExternalStore(subscribe, getFeedbackState);

  return (
    <>
      <div dir="rtl" className="fixed top-[84px] left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm px-4 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto relative overflow-hidden bg-white rounded-xl border border-[#E9ECF1] shadow-[0_10px_30px_rgba(12,45,78,0.12)] pr-3 pl-2 py-3 flex items-center gap-3 animate-scale-in"
            >
              <span className={`absolute right-0 top-0 bottom-0 w-[3px] ${style.bar}`} />
              <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.chip}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              </span>
              <p className="flex-1 text-sm text-slate-700 leading-6">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="بستن"
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {confirm && (
        <Modal key={confirm.id} onClose={() => resolveConfirm(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-[0_20px_50px_rgba(12,45,78,0.18)] text-center animate-scale-in"
          >
            <span
              className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
                confirm.danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#0C2D4E]'
              }`}
            >
              {confirm.danger ? <Trash2 className="w-6 h-6" strokeWidth={1.8} /> : <HelpCircle className="w-6 h-6" strokeWidth={1.8} />}
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-800">{confirm.title}</h3>
            {confirm.message && <p className="mt-2 text-sm text-slate-500 leading-6">{confirm.message}</p>}
            <div className="mt-6 flex gap-3">
              <button
                autoFocus
                onClick={() => resolveConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-[#EBEEF3] hover:bg-[#E2E6EC] text-slate-700 text-sm font-medium transition-colors duration-150"
              >
                {confirm.cancelText ?? 'انصراف'}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className={`flex-1 h-11 rounded-xl text-white text-sm font-medium transition-colors duration-150 ${
                  confirm.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0C2D4E] hover:bg-[#123a63]'
                }`}
              >
                {confirm.confirmText ?? 'تایید'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
