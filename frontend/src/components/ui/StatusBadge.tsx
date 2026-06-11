import { cn } from '@/lib/utils';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { LeadStatus } from '@/types';

const statusConfig: Record<LeadStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: 'New', variant: 'info' },
  contacted: { label: 'Contacted', variant: 'default' },
  qualified: { label: 'Qualified', variant: 'success' },
  unqualified: { label: 'Unqualified', variant: 'danger' },
  meeting_booked: { label: 'Meeting Booked', variant: 'warning' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'danger' },
};

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as BadgeVariant };

  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}

export { StatusBadge, type StatusBadgeProps };
