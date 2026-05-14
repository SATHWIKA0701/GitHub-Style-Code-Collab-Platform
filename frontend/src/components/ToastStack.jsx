import { useApp } from '../contexts/AppContext';

export const ToastStack = () => {
  const { toasts } = useApp();
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>
      ))}
    </div>
  );
};
