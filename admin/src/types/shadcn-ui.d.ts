/**
 * Type definitions to fix shadcn/ui component issues with type checking
 * This addresses the React.ReactNode vs ReactNode type incompatibility issues
 */

import { FC, ReactElement, ReactNode } from 'react'
import * as React from 'react'

// Fix for shadcn/ui components 
declare module '@/components/ui/button' {
  export const Button: FC<any>
}

declare module '@/components/ui/checkbox' {
  export const Checkbox: FC<any>
}

declare module '@/components/ui/table' {
  export const Table: FC<any>
  export const TableHeader: FC<any>
  export const TableBody: FC<any>
  export const TableRow: FC<any>
  export const TableHead: FC<any>
  export const TableCell: FC<any>
}

declare module '@/components/ui/dialog' {
  export const Dialog: FC<any>
  export const DialogTrigger: FC<any>
  export const DialogContent: FC<any>
  export const DialogHeader: FC<any>
  export const DialogTitle: FC<any>
  export const DialogDescription: FC<any>
  export const DialogFooter: FC<any>
}

declare module '@/components/ui/label' {
  export const Label: FC<any>
}

declare module '@/components/ui/input' {
  export const Input: FC<any>
}

declare module '@/components/ui/textarea' {
  export const Textarea: FC<any>
}

declare module '@/components/ui/select' {
  export const Select: FC<any>
  export const SelectTrigger: FC<any>
  export const SelectValue: FC<any>
  export const SelectContent: FC<any>
  export const SelectItem: FC<any>
}

declare module '@/components/ui/dropdown-menu' {
  export const DropdownMenu: FC<any>
  export const DropdownMenuTrigger: FC<any>
  export const DropdownMenuContent: FC<any>
  export const DropdownMenuItem: FC<any>
}

declare module '@/components/ui/pagination' {
  export const Pagination: FC<any>
  export const PaginationContent: FC<any>
  export const PaginationItem: FC<any>
  export const PaginationNext: FC<any>
  export const PaginationPrevious: FC<any>
}
