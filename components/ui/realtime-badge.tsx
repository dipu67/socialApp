'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RealtimeBadgeProps {
  count: number;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  showZero?: boolean;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const RealtimeBadge: React.FC<RealtimeBadgeProps> = ({
  count,
  className,
  variant = 'destructive',
  showZero = false,
  animate = true,
  size = 'sm',
  pulse = false,
}) => {
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]',
  };

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <Badge
      variant={variant}
      className={cn(
        'p-0 flex items-center justify-center rounded-full font-bold transition-all duration-300',
        sizeClasses[size],
        animate && count > 0 && 'animate-in zoom-in-75 duration-200',
        pulse && count > 0 && 'animate-pulse',
        count > 0 && 'shadow-lg',
        className
      )}
    >
      {displayCount}
    </Badge>
  );
};

// Enhanced notification icon with pulsing animation
interface NotificationIconProps {
  hasNotifications: boolean;
  children: React.ReactNode;
  className?: string;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  hasNotifications,
  children,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-all duration-300',
          hasNotifications && 'animate-pulse'
        )}
      >
        {children}
      </div>
      
      {/* Notification indicator dot */}
      {hasNotifications && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  );
};
