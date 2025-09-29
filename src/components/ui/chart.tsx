import * as React from "react"

// Simplified chart components that use recharts directly
export { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

// Basic container for chart styling
export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config?: any
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

// Re-export recharts components
export const ChartTooltip = ({ children, ...props }: any) => children
export const ChartTooltipContent = ({ children, ...props }: any) => children
export const ChartLegend = ({ children, ...props }: any) => children
export const ChartLegendContent = ({ children, ...props }: any) => children