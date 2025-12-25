import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp, colorClass = "text-[#EACEAA] bg-[#85431E]" }) => {
  return (
    <div className="bg-white border border-[#EACEAA] rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[#85431E] text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-[#34150F] mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trendUp ? 'text-[#85431E]' : 'text-[#D39858]'}`}>
            {trend}
          </span>
          <span className="text-[#D39858] ml-2">vs yesterday</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;