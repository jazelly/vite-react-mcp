'use client';

import { useState } from 'react';

export default function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1 id="next-title">Next Playground</h1>
      <button id="next-counter" onClick={() => setCount((value) => value + 1)}>
        Count: {count}
      </button>
      <p id="next-copy-target">Selection source test content for Next.</p>
    </main>
  );
}
