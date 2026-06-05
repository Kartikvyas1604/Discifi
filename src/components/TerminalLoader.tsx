import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { theme } from '../theme';

interface TerminalLoaderProps {
  dots?: number;
}

export function TerminalLoader({ dots = 4 }: TerminalLoaderProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => (c + 1) % (dots + 1));
    }, 400);
    return () => clearInterval(interval);
  }, [dots]);

  return (
    <Text
      style={{
        fontFamily: theme.fontMono,
        fontSize: 16,
        color: theme.muted,
        letterSpacing: 2,
      }}
    >
      {'.'.repeat(count)}
    </Text>
  );
}
