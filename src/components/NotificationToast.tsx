type NotificationToastProps = {
  message: string | null
}

export default function NotificationToast({ message }: NotificationToastProps) {
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message ?? ''}
      </div>
      {message ? (
        <div
          aria-hidden="true"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md font-mono text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 reduced-motion-instant z-50"
        >
          {message}
        </div>
      ) : null}
    </>
  )
}
