import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DashboardHeaderClockProps {
  theme: {
    cardBg: string;
    borderLuminous: string;
    shadowFlat: string;
    innerBg: string;
    primary: string;
    textSecondary: string;
    textPrimary: string;
  };
}

export const DashboardHeaderClock: React.FC<DashboardHeaderClockProps> = React.memo(({ theme }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPersianDateString = (d: Date = currentDate): string => {
    try {
      const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).formatToParts(d);
      const year = parts.find((p) => p.type === 'year')?.value || '1405';
      const month = parts.find((p) => p.type === 'month')?.value || '7';
      const day = parts.find((p) => p.type === 'day')?.value || '5';
      return `${year}/${month}/${day}`;
    } catch {
      return '1405/7/5';
    }
  };

  const getTimeString = (): string => {
    return currentDate.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderLuminous,
        boxShadow: theme.shadowFlat,
      }}
      className="liquid-glass rounded-3xl p-5 border flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            backgroundColor: theme.innerBg,
            color: theme.primary,
            borderColor: theme.borderLuminous,
          }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center border"
        >
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <span style={{ color: theme.textSecondary }} className="text-xs font-bold block">
            تقویم دانشگاهی امروز
          </span>
          <h3 style={{ color: theme.textPrimary }} className="text-base font-black">
            {getPersianDateString()}
          </h3>
        </div>
      </div>

      <div style={{ color: theme.primary }} className="font-mono text-xl font-black tracking-wider">
        {getTimeString()}
      </div>
    </div>
  );
});

DashboardHeaderClock.displayName = 'DashboardHeaderClock';
