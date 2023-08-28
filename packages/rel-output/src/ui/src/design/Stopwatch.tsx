import { useEffect, useState } from 'react';

import { timeToString } from '@relationalai/utils';

type StopwatchProps = {
  startValue: number;
};

export function Stopwatch({ startValue }: StopwatchProps) {
  const [elapsed, setElapsed] = useState(Date.now() - startValue);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - startValue);
    }, 123);

    return () => {
      clearInterval(id);
    };
  }, [startValue]);

  return <span data-testid='stop-watch'>{timeToString(elapsed)}</span>;
}
