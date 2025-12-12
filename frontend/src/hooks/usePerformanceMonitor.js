import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current} (${timeSinceLastRender}ms since last render)`);
    }
  });

  return {
    renderCount: renderCount.current,
    timeSinceLastRender: Date.now() - lastRenderTime.current
  };
};

export const useAPIPerformanceMonitor = (queryKey, isLoading, error) => {
  const startTime = useRef(Date.now());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isLoading && isFirstLoad.current) {
      startTime.current = Date.now();
      isFirstLoad.current = false;
    }

    if (!isLoading && !isFirstLoad.current) {
      const loadTime = Date.now() - startTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${queryKey.join('.')} loaded in ${loadTime}ms`);
      }
    }
  }, [isLoading, queryKey]);

  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.error(`[API] ${queryKey.join('.')} error:`, error);
    }
  }, [error, queryKey]);
};

