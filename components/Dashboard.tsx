import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  format, 
  subDays, 
  subMonths, 
  eachDayOfInterval, 
  isAfter, 
  startOfDay, 
  parseISO, 
  startOfYear, 
  endOfYear,
  isWithinInterval
} from 'date-fns';
import { DailyStat, AggregatedStat } from '../types';
import StatCard from './StatCard';
import ContributionGraph from './ContributionGraph';
import { Activity, TrendingUp, Calendar, BrainCircuit, ExternalLink, MessageSquare, ChevronDown, Plus } from 'lucide-react';

interface DashboardProps {
  stats: Record<string, DailyStat>;
  onManualLog: () => void;
  onNavigateToChat: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onManualLog, onNavigateToChat }) => {
  // Supports '7d', '30d', '6m', 'all' or specific year '2024', '2025'
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Calculate available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear); 
    
    // Explicitly add 2026 as requested for product launch preparation
    years.add('2026');

    Object.keys(stats).forEach(date => {
      const year = date.split('-')[0];
      if (year && year.length === 4) years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [stats]);

  // Filter stats based on Time Range
  const filteredStats = useMemo(() => {
    const today = startOfDay(new Date());
    let startDate: Date;
    let endDate: Date = today;

    // Handle Year Selection
    if (/^\d{4}$/.test(timeRange)) {
      const year = parseInt(timeRange);
      startDate = startOfYear(new Date(year, 0, 1));
      endDate = endOfYear(new Date(year, 0, 1));
      
      const filtered: Record<string, DailyStat> = {};
      Object.keys(stats).forEach(key => {
        const date = parseISO(key);
        if (isWithinInterval(date, { start: startDate, end: endDate })) {
          filtered[key] = stats[key];
        }
      });
      return filtered;
    }

    // Handle Relative Selection
    switch (timeRange) {
      case '7d': startDate = subDays(today, 6); break;
      case '30d': startDate = subDays(today, 29); break;
      case '6m': startDate = subMonths(today, 6); break;
      case 'all': return stats;
      default: startDate = subDays(today, 6);
    }

    const filtered: Record<string, DailyStat> = {};
    Object.keys(stats).forEach(key => {
      // For relative ranges, we want items AFTER the start date (inclusive via subDays logic usually, but let's be safe)
      // subDays(today, 6) gives 7 days total including today.
      if (isAfter(parseISO(key), subDays(startDate, 1))) {
        filtered[key] = stats[key];
      }
    });
    return filtered;
  }, [stats, timeRange]);

  // Prepare chart data based on the filtered range
  const chartData = useMemo(() => {
    // Determine the interval to display on the chart
    let start: Date;
    let end: Date = new Date(); // Default end is today

    if (/^\d{4}$/.test(timeRange)) {
        const year = parseInt(timeRange);
        start = startOfYear(new Date(year, 0, 1));
        
        // If selected year is current year, end at today, else end at Dec 31
        // But if it's a future year (like 2026 while in 2025), endOfYear is fine to show the full empty grid.
        const currentYear = new Date().getFullYear();
        if (year === currentYear) {
            end = new Date();
        } else {
            end = endOfYear(new Date(year, 0, 1));
        }
    } else if (timeRange === 'all') {
         // Find earliest date in stats
         const dates = Object.keys(stats).sort();
         if (dates.length > 0) {
             start = parseISO(dates[0]);
         } else {
             start = subDays(new Date(), 6);
         }
    } else {
        const today = new Date();
        switch (timeRange) {
            case '7d': start = subDays(today, 6); break;
            case '30d': start = subDays(today, 29); break;
            case '6m': start = subMonths(today, 6); break;
            default: start = subDays(today, 6);
        }
    }

    // Generate array of days for the interval
    // Note: For very long ranges ('all' or '6m'), showing every single day on x-axis might be crowded.
    // However, Recharts handles this reasonably well by just skipping labels if configured, 
    // or we can let the Bar width scale down.
    
    // Safety check: if start > end, swap or fix
    if (isAfter(start, end)) start = end;

    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const stat = stats[dateKey] || { internalCount: 0, externalCount: 0 };
      return {
        date: dateKey,
        dayName: format(day, 'MMM dd'), // Compact date format
        internal: stat.internalCount,
        external: stat.externalCount,
        total: stat.internalCount + stat.externalCount
      } as AggregatedStat;
    });
  }, [stats, timeRange]);

  // Calculate totals based on filteredStats (for the cards)
  const totals = useMemo(() => {
    let totalInRange = 0;
    let daysWithActivity = 0;
    
    Object.values(filteredStats).forEach((s: DailyStat) => {
      const count = s.internalCount + s.externalCount;
      if (count > 0) {
        totalInRange += count;
        daysWithActivity++;
      }
    });

    const average = daysWithActivity > 0 ? Math.round((totalInRange / Object.keys(filteredStats).length) * 10) / 10 : 0; 

    // Today specific stats (always same regardless of filter)
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const todayStat = stats[todayKey] || { internalCount: 0, externalCount: 0 };
    const yesterdayStat = stats[yesterdayKey] || { internalCount: 0, externalCount: 0 };
    const todayTotal = todayStat.internalCount + todayStat.externalCount;
    const yesterdayTotal = yesterdayStat.internalCount + yesterdayStat.externalCount;
    const diff = todayTotal - yesterdayTotal;
    const trendString = diff >= 0 ? `+${diff}` : `${diff}`;

    return {
      today: todayTotal,
      trend: trendString,
      trendUp: diff >= 0,
      totalInRange,
      activeDays: daysWithActivity,
      average
    };
  }, [filteredStats, stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#D39858] p-3 rounded-lg shadow-xl z-50">
          <p className="text-[#34150F] font-bold mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: p.color }}>
              {p.name === 'internal' ? 'Ask AI' : 'External'}: <span className="font-bold">{p.value}</span>
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-[#EACEAA]">
             <p className="text-[#85431E] font-bold text-sm">Total: {payload.reduce((acc: number, curr: any) => acc + curr.value, 0)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getRangeLabel = () => {
    if (/^\d{4}$/.test(timeRange)) {
        return timeRange;
    }
    switch(timeRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '6m': return 'Last 6 Months';
      case 'all': return 'All Time';
      default: return 'Custom';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#34150F]">Dashboard</h1>
          <p className="text-[#D39858] text-sm">Track your daily AI curiosity.</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="relative group">
          <div className="flex items-center gap-2 bg-white border border-[#D39858] rounded-lg px-4 py-2 cursor-pointer shadow-sm hover:border-[#85431E] transition-colors">
            <Calendar size={16} className="text-[#85431E]" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-transparent text-[#34150F] font-medium text-sm focus:outline-none cursor-pointer pr-8"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="6m">Last 6 Months</option>
              <optgroup label="Yearly">
                {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
              </optgroup>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={14} className="text-[#D39858] absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today is fixed, doesn't depend on filter */}
        <StatCard 
          title="Queries Today" 
          value={totals.today} 
          icon={Activity} 
          trend={totals.trend} 
          trendUp={totals.trendUp}
          colorClass="text-[#EACEAA] bg-[#85431E]"
        />
        
        {/* These depend on filter */}
        <StatCard 
          title={`Total (${getRangeLabel()})`}
          value={totals.totalInRange} 
          icon={BrainCircuit} 
          colorClass="text-[#EACEAA] bg-[#34150F]"
        />
        
        <StatCard 
          title="Avg / Day" 
          value={totals.average} 
          icon={TrendingUp} 
          colorClass="text-[#34150F] bg-[#D39858]"
        />
        
        <StatCard 
          title="Active Days" 
          value={totals.activeDays} 
          icon={Calendar} 
          colorClass="text-[#34150F] bg-[#EACEAA]"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={onNavigateToChat}
          className="bg-gradient-to-r from-[#85431E] to-[#5e2f15] hover:from-[#6e3618] hover:to-[#4a2410] text-[#EACEAA] p-4 rounded-xl shadow-md flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EACEAA]/20 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div className="text-left">
              <div className="font-bold">Ask AI (Internal)</div>
              <div className="text-xs opacity-80">Launch Gemini Chat</div>
            </div>
          </div>
          <ChevronDown size={20} className="-rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button 
          onClick={onManualLog}
          className="bg-white border border-[#D39858] hover:bg-[#EACEAA]/20 text-[#34150F] p-4 rounded-xl shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D39858]/20 rounded-lg text-[#85431E]">
              <ExternalLink size={20} />
            </div>
            <div className="text-left">
              <div className="font-bold">Log External Query</div>
              <div className="text-xs text-[#D39858]">ChatGPT, Claude, etc.</div>
            </div>
          </div>
          <Plus size={20} className="text-[#85431E]" />
        </button>
      </div>

      {/* Contribution Graph */}
      <ContributionGraph stats={stats} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-[#EACEAA] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#34150F] mb-6">Detailed Activity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EACEAA" />
                <XAxis 
                  dataKey="dayName" 
                  stroke="#85431E" 
                  tick={{ fill: '#85431E', fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false}
                  // Show roughly 7 ticks regardless of range length to keep it clean
                  interval={Math.ceil(chartData.length / 7)}
                />
                <YAxis 
                  stroke="#85431E" 
                  tick={{ fill: '#85431E' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EACEAA', opacity: 0.3 }} />
                <Legend wrapperStyle={{ color: '#34150F' }} />
                <Bar dataKey="internal" name="Ask AI" stackId="a" fill="#85431E" radius={[0, 0, 4, 4]} />
                <Bar dataKey="external" name="External" stackId="a" fill="#D39858" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Area Chart */}
        <div className="bg-white border border-[#EACEAA] rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-[#34150F] mb-6">Volume Trend</h3>
          <div className="h-64 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34150F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34150F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EACEAA" />
                <XAxis dataKey="dayName" hide />
                <YAxis stroke="#85431E" tick={{ fill: '#85431E' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#34150F" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;