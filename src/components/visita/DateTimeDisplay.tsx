import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DateTimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(now, 'HH:mm:ss');

  return (
    <div className="text-center space-y-2">
      <p className="text-lg text-muted-foreground capitalize">{formattedDate}</p>
      <p className="text-5xl font-bold text-foreground tracking-tight">{formattedTime}</p>
    </div>
  );
}
