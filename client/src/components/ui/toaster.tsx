import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-center space-x-2">
              {title && <ToastTitle className="text-sm font-medium">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="opacity-100 text-green-800" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
