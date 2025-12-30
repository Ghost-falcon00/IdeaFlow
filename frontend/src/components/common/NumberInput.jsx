/**
 * NumberInput Component - ورودی عدد با جداکننده هزارگان
 * 
 * Usage:
 * <NumberInput
 *   label="مبلغ"
 *   value={amount} // "1000000"
 *   onChange={(val) => setAmount(val)} // returns "1000000"
 * />
 */

import { useState, useEffect } from 'react';
import Input from './Input';

function NumberInput({ value, onChange, ...props }) {
    const [displayValue, setDisplayValue] = useState('');

    // Format initial value
    useEffect(() => {
        if (value) {
            setDisplayValue(formatNumber(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const formatNumber = (num) => {
        if (!num) return '';
        // Remove non-digits first
        const cleanNum = num.toString().replace(/[^0-9]/g, '');
        // Add commas
        return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleChange = (e) => {
        const val = e.target.value;
        // Remove commas to get raw number
        const rawValue = val.replace(/,/g, '');

        // Only allow digits
        if (/^\d*$/.test(rawValue)) {
            setDisplayValue(formatNumber(rawValue));
            onChange({ target: { name: props.name, value: rawValue } });
        }
    };

    return (
        <Input
            {...props}
            type="text" // Always text to allow commas
            value={displayValue}
            onChange={handleChange}
            style={{ direction: 'ltr', textAlign: 'left' }} // Numbers LTR
        />
    );
}

export default NumberInput;
