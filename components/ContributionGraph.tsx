import React, { useMemo } from 'react';
import { format, eachDayOfInterval, subDays, getDay, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { DailyStat } from '../types';

interface ContributionGraphProps {
  stats: Record<string, DailyStat>;
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ stats }) => {
  // Generate last 365 days (approx 52 weeks)
  const data = useMemo(() => {
    const today = new Date();
    // Align start date to the previous Sunday to ensure the grid starts cleanly
    const endDate = today;
    const startDate = subWeeks(startOfWeek(today), 51); // Go back 51 weeks to fill the grid roughly
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const stat = stats[dateKey];
      const count = stat ? (stat.internalCount + stat.externalCount) : 0;
      return {
        date: day,
        dateKey,
        count,
        level: getLevel(count)
      };
    });
  }, [stats]);

  function getLevel(count: number) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
  }

  // Color mappings based on coffee theme
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-[#EACEAA]/20'; // Empty
      case 1: return 'bg-[#EACEAA]';    // Light Champagne
      case 2: return 'bg-[#D39858]';    // Whiskey Sour
      case 3: return 'bg-[#85431E]';    // Honey Garlic
      case 4: return 'bg-[#34150F]';    // Burnt Coffee
      default: return 'bg-[#EACEAA]/20';
    }
  };

  // Group by weeks for columns
  const weeks = useMemo(() => {
    const weekMap: any[][] = [];
    let currentWeek: any[] = [];
    
    data.forEach((item) => {
      currentWeek.push(item);
      if (currentWeek.length === 7) {
        weekMap.push(currentWeek);
        currentWeek = [];
      }
    });
    // Push remaining days if any (though we aligned to weeks)
    if (currentWeek.length > 0) weekMap.push(currentWeek);
    
    return weekMap;
  }, [data]);

  return (
    <div className="bg-white border border-[#EACEAA] rounded-xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#34150F]">Contribution Activity</h3>
        <div className="text-xs text-[#D39858] flex items-center gap-1">
          <span>Less</span>
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(0)}`} />
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(1)}`} />
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(2)}`} />
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(3)}`} />
          <div className={`w-3 h-3 rounded-sm ${getLevelColor(4)}`} />
          <span>More</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <div 
                  key={day.dateKey}
                  className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} transition-colors hover:ring-1 hover:ring-[#34150F] relative group cursor-default`}
                >
                   {/* Simple Tooltip */}
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#34150F] text-[#EACEAA] text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                     {day.count} contributions on {format(day.date, 'MMM d, yyyy')}
                   </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-[#D39858] mt-2 px-1 font-mono">
         <span>{format(data[0].date, 'MMM yyyy')}</span>
         <span>{format(new Date(), 'MMM yyyy')}</span>
      </div>
    </div>
  );
};

export default ContributionGraph;