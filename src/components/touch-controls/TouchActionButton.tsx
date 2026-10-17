import React, { useEffect, useRef } from 'react';
import type { VirtualButtonAction } from '../../types/input';

interface TouchActionButtonProps {
    action: VirtualButtonAction;
    className: string;
    onActionChange: (action: VirtualButtonAction, isPressed: boolean) => void;
    title?: string;
    children: React.ReactNode;
}

export const TouchActionButton: React.FC<TouchActionButtonProps> = ({
    action,
    className,
    onActionChange,
    title,
    children,
}) => {
    const activePointerId = useRef<number | null>(null);
    const onActionChangeRef = useRef(onActionChange);
    onActionChangeRef.current = onActionChange;

    useEffect(() => () => {
        if (activePointerId.current !== null) {
            onActionChangeRef.current(action, false);
        }
    }, [action]);

    const release = (pointerId: number) => {
        if (activePointerId.current !== pointerId) return;
        activePointerId.current = null;
        onActionChange(action, false);
    };

    return (
        <button
            type="button"
            title={title}
            className={className}
            onPointerDown={(event) => {
                event.preventDefault();
                if (activePointerId.current !== null) return;
                activePointerId.current = event.pointerId;
                event.currentTarget.setPointerCapture(event.pointerId);
                onActionChange(action, true);
            }}
            onPointerUp={(event) => release(event.pointerId)}
            onPointerCancel={(event) => release(event.pointerId)}
            onLostPointerCapture={(event) => release(event.pointerId)}
        >
            {children}
        </button>
    );
};
