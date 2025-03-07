
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string;
    icon?: React.ReactNode;
    href: string;
    isActive?: boolean;
  }[];
  isCollapsed?: boolean;
  isResizable?: boolean;
}

export function Sidebar({
  className,
  items,
  isCollapsed = false,
  isResizable = false,
  ...props
}: SidebarProps) {
  const isMobile = useMobile();
  
  return (
    <div
      className={cn(
        "flex flex-col h-screen",
        isCollapsed ? "w-16" : "w-64",
        isResizable ? "transition-all duration-300 ease-in-out" : "",
        className
      )}
      {...props}
    >
      <ScrollArea className="flex-1 p-3">
        <div className={cn("space-y-2", isCollapsed ? "items-center" : "")}>
          {items.map((item, index) => (
            <Button
              key={index}
              variant={item.isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isCollapsed && "justify-center p-2"
              )}
              asChild
            >
              <a href={item.href}>
                {item.icon && (
                  <span className={cn("mr-2", isCollapsed && "mr-0")}>
                    {item.icon}
                  </span>
                )}
                {!isCollapsed && <span>{item.title}</span>}
              </a>
            </Button>
          ))}
        </div>
      </ScrollArea>
      {!isMobile && isResizable && (
        <div className="h-full w-1 bg-gray-200 dark:bg-gray-800 cursor-ew-resize absolute right-0 top-0" />
      )}
    </div>
  );
}
