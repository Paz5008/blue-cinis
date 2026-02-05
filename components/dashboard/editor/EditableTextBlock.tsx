import React, { useRef, useState, useEffect, useCallback } from 'react';
import { sanitizeTextHtml } from '@/lib/sanitize';
import { TextCommandApi } from '../inspectors/types';

interface EditableTextBlockProps {
    id: string;
    initialContent: string;
    textStyle?: React.CSSProperties;
    wrapperStyle?: React.CSSProperties;
    className?: string;
    isEdit: boolean;
    pageKey?: string;
    dataBlockId?: string;
    onUpdate: (content: string) => void;
    onRegister?: (id: string, api: TextCommandApi) => void;
    onAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void;
    children?: React.ReactNode; // For overlays like drag handles
}

export const EditableTextBlock: React.FC<EditableTextBlockProps> = ({
    id,
    initialContent,
    textStyle,
    wrapperStyle,
    className,
    isEdit,
    pageKey,
    dataBlockId,
    onUpdate,
    onRegister,
    onAlign,
    children
}) => {
    const [localContent, setLocalContent] = useState(initialContent);
    const elementRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmittedContentRef = useRef(initialContent);

    // Sync from parent if initialContent changes significantly (e.g. undo/redo)
    // We avoid syncing if we are currently editing (which we assume if localContent differs from lastEmitted but the parent hasn't caught up yet)
    // However, simple equality check is usually enough given the debounce.
    useEffect(() => {
        if (initialContent !== lastEmittedContentRef.current) {
            setLocalContent(initialContent);
            lastEmittedContentRef.current = initialContent;
            if (elementRef.current && elementRef.current.innerHTML !== initialContent) {
                elementRef.current.innerHTML = initialContent;
            }
        }
    }, [initialContent]);

    const commitUpdate = useCallback((content: string) => {
        const cleaned = sanitizeTextHtml(content, (pageKey || 'profile') as any);
        if (cleaned !== lastEmittedContentRef.current) {
            lastEmittedContentRef.current = cleaned;
            onUpdate(cleaned);
            // Correct the DOM if sanitization changed it
            if (elementRef.current && elementRef.current.innerHTML !== cleaned && elementRef.current.innerHTML === content) {
                elementRef.current.innerHTML = cleaned;
            }
        }
    }, [onUpdate, pageKey]);

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        const rawHtml = e.currentTarget.innerHTML;
        setLocalContent(rawHtml);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            commitUpdate(rawHtml);
        }, 500); // 500ms debounce
    }, [commitUpdate]);

    const handleBlur = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (elementRef.current) {
            commitUpdate(elementRef.current.innerHTML);
        }
    }, [commitUpdate]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        const meta = isMac ? (e.metaKey) : (e.ctrlKey);
        const k = e.key.toLowerCase();

        // Intercept Bold/Italic to force sync immediately or just allow browser behavior + debounce
        if (meta && (k === 'b' || k === 'i')) {
            e.preventDefault();
            document.execCommand(k === 'b' ? 'bold' : 'italic');
            // Trigger input handling manually since execCommand might not fire onInput uniformly across browsers for all ops,
            // though usually it does. Let's rely on onInput or manual sync.
            if (elementRef.current) {
                const content = elementRef.current.innerHTML;
                setLocalContent(content);
                // Force commit for command
                commitUpdate(content);
            }
        }
    }, [commitUpdate]);

    // Register API for Inspector
    useEffect(() => {
        if (!onRegister || !isEdit) return;

        const api: TextCommandApi = {
            focus: () => elementRef.current?.focus(),
            apply: (cmd: string, value?: string) => {
                elementRef.current?.focus();
                try { document.execCommand(cmd, false, value as any); } catch { }
                // Force sync after external command
                if (elementRef.current) {
                    handleInput({ currentTarget: elementRef.current } as any);
                }
            },
            setAlign: (align: 'left' | 'center' | 'right' | 'justify') => {
                if (onAlign) onAlign(align);
                // And maybe sync content? Alignment is usually a block property, not content HTML.
                // But if we wanted to enforce it in style inline.. usually it's style prop.
            }
        };
        onRegister(id, api);
    }, [id, isEdit, onRegister, onAlign, handleInput]);

    return (
        <div
            className={`${className || ''} relative`}
            style={{ ...wrapperStyle, position: 'relative' }} // For overlays
            data-block-id={dataBlockId}
        >
            {children}
            <div
                ref={elementRef}
                contentEditable={isEdit}
                suppressContentEditableWarning
                data-testid="text-editable"
                onInput={handleInput}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                    outline: 'none',
                    whiteSpace: 'pre-wrap',
                    ...textStyle
                }}
                dangerouslySetInnerHTML={{ __html: initialContent }}
            />
        </div>
    );
};
