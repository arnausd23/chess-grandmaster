import { useState, useEffect } from 'react';

export function useLastOnline(lastOnlineTimestamp: number): string {
  const [timeSince, setTimeSince] = useState<string>('00:00:00');

  useEffect(() => {
    if (!lastOnlineTimestamp || lastOnlineTimestamp === 0) {
      setTimeSince('00:00:00');
      return;
    }

    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = now - lastOnlineTimestamp;

      if (diff < 0) {
        setTimeSince('00:00:00');
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      const format = (n: number) => n.toString().padStart(2, '0');
      setTimeSince(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [lastOnlineTimestamp]);

  return timeSince;
}

