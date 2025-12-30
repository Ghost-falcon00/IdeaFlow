/**
 * AnimatedCounter - شمارنده انیمیشن‌دار
 */

import { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef(null);

    const animationFrameRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setHasAnimated(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!hasAnimated) return;

        const startTime = Date.now();
        const startValue = count;

        // If target reached, stop
        if (startValue === end) return;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutExpo)
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentValue = Math.floor(startValue + (end - startValue) * easeOut);
            setCount(currentValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [end, hasAnimated, duration]); // Removed animateCount dependency

    // Convert to Persian numbers
    const toPersianNumber = (num) => {
        if (num === null || num === undefined) return '۰';
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (d) => persianDigits[d]);
    };

    return (
        <span ref={ref} className="animated-counter">
            {toPersianNumber(count)}{suffix}
        </span>
    );
}

export default AnimatedCounter;
