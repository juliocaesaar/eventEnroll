import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'accent' | 'purple';
}

export default function StatsCard({ title, value, change, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary',
    secondary: 'bg-secondary-100 text-secondary',
    accent: 'bg-accent-100 text-accent',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-secondary mt-1">
              <i className="fas fa-arrow-up mr-1"></i>
              {change}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
