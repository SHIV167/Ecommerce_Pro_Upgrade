"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Use a namespace to avoid conflicts with existing declarations
namespace CustomDialog {
  export const Root = DialogPrimitive.Root
  export const Trigger = DialogPrimitive.Trigger
  export const Close = DialogPrimitive.Close

  export const Overlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  ))
  Overlay.displayName = DialogPrimitive.Overlay.displayName

  export const Content = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { 'data-state'?: 'open' | 'closed'; inert?: string | undefined }
  >(({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          className
        )}
        inert={props['data-state'] === 'closed' ? '' : undefined}
        {...props}
      >
        {children}
        <Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ))
  Content.displayName = DialogPrimitive.Content.displayName

  export const Header = ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
  Header.displayName = "DialogHeader"

  export const Footer = ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
  Footer.displayName = "DialogFooter"

  export const Title = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  ))
  Title.displayName = DialogPrimitive.Title.displayName

  export const Description = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  ))
  Description.displayName = DialogPrimitive.Description.displayName
}

// Export components with unique names to avoid conflicts
export const AppDialog = CustomDialog.Root
export const AppDialogTrigger = CustomDialog.Trigger
export const AppDialogClose = CustomDialog.Close
export const AppDialogOverlay = CustomDialog.Overlay
export const AppDialogContent = CustomDialog.Content
export const AppDialogHeader = CustomDialog.Header
export const AppDialogFooter = CustomDialog.Footer
export const AppDialogTitle = CustomDialog.Title
export const AppDialogDescription = CustomDialog.Description
