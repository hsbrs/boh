# Component Reference Guide

## Quick Reference for All UI Components

This guide provides a quick reference for all available UI components in the Broos Project FSM application.

## Button Component

**Import:** `import { Button, buttonVariants } from '@/components/ui/button'`

### Props
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}
```

### Variants
- `default` - Primary button (blue background)
- `destructive` - Red button for dangerous actions
- `outline` - Bordered button with transparent background
- `secondary` - Secondary button with muted colors
- `ghost` - Transparent button with hover effects
- `link` - Text button that looks like a link

### Sizes
- `sm` - Small button (h-8, px-3)
- `default` - Standard button (h-9, px-4)
- `lg` - Large button (h-10, px-6)
- `icon` - Square button for icons (size-9)

### Examples
```typescript
<Button>Default Button</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="lg">Large Outline</Button>
<Button asChild><Link href="/dashboard">Dashboard</Link></Button>
```

---

## Card Component

**Import:** `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card'`

### Subcomponents
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Card title
- `CardDescription` - Card description
- `CardContent` - Main content area
- `CardFooter` - Footer section
- `CardAction` - Action button in header

### Examples
```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
    <CardAction><Button size="sm">Edit</Button></CardAction>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

---

## Input Component

**Import:** `import { Input } from '@/components/ui/input'`

### Props
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

### Examples
```typescript
<Input type="email" placeholder="Enter email" />
<Input value={value} onChange={(e) => setValue(e.target.value)} />
<Input className="border-red-500" /> // Custom styling
```

---

## Label Component

**Import:** `import { Label } from '@/components/ui/label'`

### Props
```typescript
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
```

### Examples
```typescript
<Label htmlFor="email">Email Address</Label>
<Input id="email" />
```

---

## Badge Component

**Import:** `import { Badge } from '@/components/ui/badge'`

### Props
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

### Variants
- `default` - Primary badge
- `secondary` - Secondary badge
- `destructive` - Error/danger badge
- `outline` - Outlined badge

### Examples
```typescript
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge className="bg-green-500">Custom</Badge>
```

---

## Dialog Component

**Import:** `import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'`

### Subcomponents
- `Dialog` - Main dialog wrapper
- `DialogTrigger` - Element that opens the dialog
- `DialogContent` - Dialog content container
- `DialogHeader` - Dialog header section
- `DialogTitle` - Dialog title
- `DialogDescription` - Dialog description

### Examples
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description text</DialogDescription>
    </DialogHeader>
    <div>Content goes here</div>
  </DialogContent>
</Dialog>
```

---

## Select Component

**Import:** `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'`

### Subcomponents
- `Select` - Main select wrapper
- `SelectTrigger` - Select button
- `SelectValue` - Displayed value
- `SelectContent` - Dropdown content
- `SelectItem` - Individual options

### Examples
```typescript
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Table Component

**Import:** `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'`

### Subcomponents
- `Table` - Main table wrapper
- `TableHeader` - Table header section
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableBody` - Table body section
- `TableCell` - Data cell

### Examples
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Tabs Component

**Import:** `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'`

### Subcomponents
- `Tabs` - Main tabs wrapper
- `TabsList` - Tabs navigation
- `TabsTrigger` - Individual tab button
- `TabsContent` - Tab content

### Examples
```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## Calendar Component

**Import:** `import { Calendar } from '@/components/ui/calendar'`

### Props
```typescript
interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range'
  selected?: Date | Date[] | DateRange
  onSelect?: (date: Date | Date[] | DateRange | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
}
```

### Examples
```typescript
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>
```

---

## Tooltip Component

**Import:** `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'`

### Subcomponents
- `TooltipProvider` - Context provider
- `Tooltip` - Tooltip wrapper
- `TooltipTrigger` - Element that shows tooltip
- `TooltipContent` - Tooltip content

### Examples
```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Separator Component

**Import:** `import { Separator } from '@/components/ui/separator'`

### Props
```typescript
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}
```

### Examples
```typescript
<Separator /> // Horizontal
<Separator orientation="vertical" /> // Vertical
<Separator className="my-4" /> // Custom spacing
```

---

## Popover Component

**Import:** `import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'`

### Subcomponents
- `Popover` - Main popover wrapper
- `PopoverTrigger` - Element that opens popover
- `PopoverContent` - Popover content

### Examples
```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button>Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div>Popover content</div>
  </PopoverContent>
</Popover>
```

---

## Scroll Area Component

**Import:** `import { ScrollArea } from '@/components/ui/scroll-area'`

### Props
```typescript
interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'auto' | 'always' | 'scroll' | 'hover'
  scrollHideDelay?: number
}
```

### Examples
```typescript
<ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
  <div className="space-y-4">
    {/* Scrollable content */}
  </div>
</ScrollArea>
```

---

## Resizable Component

**Import:** `import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'`

### Subcomponents
- `ResizablePanelGroup` - Main container
- `ResizablePanel` - Individual panel
- `ResizableHandle` - Resize handle

### Examples
```typescript
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={50}>
    <div>Left panel</div>
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50}>
    <div>Right panel</div>
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## Sonner Component

**Import:** `import { Toaster } from '@/components/ui/sonner'`

### Usage
```typescript
// Add to layout
<Toaster />

// In components
import { toast } from 'sonner';

toast('Message');
toast.success('Success message');
toast.error('Error message');
toast.warning('Warning message');
toast.info('Info message');
```

---

## Accordion Component

**Import:** `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'`

### Subcomponents
- `Accordion` - Main accordion wrapper
- `AccordionItem` - Individual accordion item
- `AccordionTrigger` - Clickable trigger
- `AccordionContent` - Collapsible content

### Examples
```typescript
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Textarea Component

**Import:** `import { Textarea } from '@/components/ui/textarea'`

### Props
```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
```

### Examples
```typescript
<Textarea placeholder="Type your message here." />
<Textarea value={value} onChange={(e) => setValue(e.target.value)} />
```

---

## Common Patterns

### Form Layout
```typescript
<div className="space-y-4">
  <div>
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" />
  </div>
  <Button type="submit">Submit</Button>
</div>
```

### Card with Actions
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardAction>
      <Button size="sm">Action</Button>
    </CardAction>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid items */}
</div>
```

### Loading States
```typescript
{loading ? (
  <div className="flex items-center justify-center p-4">
    <div className="text-gray-500">Loading...</div>
  </div>
) : (
  // Content
)}
```

### Error Handling
```typescript
{error ? (
  <div className="text-red-500 text-sm">{error}</div>
) : null}
```

---

## Utility Functions

### CN Utility
```typescript
import { cn } from "@/lib/utils";

const className = cn(
  "base-class",
  condition && "conditional-class",
  "another-class"
);
```

### Common Tailwind Classes
- **Spacing**: `p-4`, `m-2`, `space-y-4`, `gap-4`
- **Colors**: `text-gray-900`, `bg-blue-500`, `border-gray-200`
- **Layout**: `flex`, `grid`, `hidden`, `block`
- **Responsive**: `md:flex`, `lg:hidden`, `sm:grid-cols-2`

---

## Best Practices

1. **Always use TypeScript interfaces** for component props
2. **Use the `cn` utility** for conditional class names
3. **Implement proper loading and error states**
4. **Use semantic HTML elements** for accessibility
5. **Follow the single responsibility principle**
6. **Implement proper keyboard navigation**
7. **Use consistent spacing** with Tailwind's scale
8. **Test components** with different screen sizes

---

This reference guide covers all the UI components available in the application. For detailed usage examples and advanced patterns, refer to the main API documentation.