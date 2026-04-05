import { ReactNode } from 'react';

type CardVariant = 'primary' | 'secondary' | 'dark' | 'outline';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({
  variant = 'primary',
  padding = 'md',
  children,
  className = '',
  hoverable = false,
  onClick,
}: CardProps) {
  // 基础样式
  const baseClasses = 'rounded-3xl transition-all duration-300';
  
  // 变体样式
  const variantClasses = {
    primary: 'bg-surface border border-border-light shadow-lg shadow-slate-200/50 backdrop-blur-sm',
    secondary: 'bg-slate-50/80 border border-border-light shadow-md',
    dark: 'bg-surface-dark text-white shadow-xl shadow-slate-900/30',
    outline: 'border-2 border-dashed border-border-light',
  };
  
  // 内边距样式
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  };
  
  // 悬停效果
  const hoverClass = hoverable ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  
  // 点击效果
  const clickClass = onClick ? 'cursor-pointer' : '';
  
  // 组合所有样式
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${clickClass} ${className}`.trim();
  
  return (
    <div className={combinedClasses} onClick={onClick}>
      {children}
    </div>
  );
}

// Card 子组件
export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-xl font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mt-2 text-text-secondary ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 pt-6 border-t border-border-light ${className}`}>
      {children}
    </div>
  );
}