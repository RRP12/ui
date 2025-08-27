import { useEffect, useRef, useMemo } from 'react';

const useRenderTracker = (componentName, trackedValues = {}) => {
    const renderCount = useRef(0);
    const lastRenderTime = useRef(performance.now());
    const prevValues = useRef(trackedValues);
    const isInitialRender = useRef(true);

    // Memoize tracked values to prevent unnecessary changes
    const stableTrackedValues = useMemo(() => trackedValues, [trackedValues]);

    useEffect(() => {
        // Track render timing
        const now = performance.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        renderCount.current += 1;
        const renderCountValue = renderCount.current;

        console.groupCollapsed(`[${componentName}] Render #${renderCountValue}`);
        console.log(`Time since last render: ${timeSinceLastRender.toFixed(2)}ms`);

        // Detect rapid re-renders
        if (timeSinceLastRender < 100 && renderCountValue > 1) {
            console.warn('⚠️ Rapid re-render detected! Potential render loop');
        }

        // Track value changes
        if (!isInitialRender.current) {
            const changes = {};
            let hasChanges = false;

            Object.keys(stableTrackedValues).forEach(key => {
                if (prevValues.current[key] !== stableTrackedValues[key]) {
                    changes[key] = {
                        from: prevValues.current[key],
                        to: stableTrackedValues[key]
                    };
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                console.log('Changed values:', changes);
            } else {
                console.log('No tracked values changed');
            }
        } else {
            console.log('Initial render');
            isInitialRender.current = false;
        }

        console.groupEnd();

        // Update previous values
        prevValues.current = stableTrackedValues;
    }, [stableTrackedValues, componentName]);
};

export default useRenderTracker;