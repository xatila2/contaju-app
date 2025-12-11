import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    className = '',
    placeholder = 'R$ 0,00',
    autoFocus = false
}) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        setDisplayValue(formatCurrency(value));
    }, [value]);

    const formatCurrency = (val: number) => {
        if (val === 0) return '';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');

        if (rawValue === '') {
            onChange(0);
            return;
        }

        const numberValue = parseInt(rawValue, 10) / 100;
        onChange(numberValue);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            className={className}
            placeholder={placeholder}
            autoFocus={autoFocus}
        />
    );
};
