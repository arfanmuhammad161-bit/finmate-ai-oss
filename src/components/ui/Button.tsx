import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-primary-600 text-white shadow-sm hover:bg-primary-500 hover:shadow-md": variant === "default",
            "bg-secondary-100 text-secondary-600 hover:bg-secondary-200": variant === "secondary",
            "border border-border bg-white shadow-sm hover:bg-primary-50 hover:text-primary-600": variant === "outline",
            "hover:bg-primary-50 hover:text-primary-600": variant === "ghost",
            "text-primary-600 underline-offset-4 hover:underline": variant === "link",
            "bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-md hover:opacity-90 hover:shadow-lg": variant === "gradient",
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
