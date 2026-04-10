import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Markdown from '@/fronted/components/shared/markdown/Markdown';

describe('Markdown', () => {
    it('能把未编码的 switch 链接渲染成切换按钮', () => {
        const fullText = 'Well, the reason we know the answer to all of these questions is because of a strange math feud in Russia that took place over 100 years ago.';
        render(
            <Markdown>
                {`[切换到完整版](switch:${fullText})`}
            </Markdown>,
        );

        expect(screen.getByText(fullText)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '切换到完整版' })).toBeInTheDocument();
        expect(screen.queryByText(/switch:/)).not.toBeInTheDocument();
    });

    it('能继续兼容旧的双中括号 switch 标记', () => {
        const fullText = 'Well, the reason we know the answer to all of these questions is because of a strange math feud in Russia that took place over 100 years ago.';
        render(
            <Markdown>
                {`[[switch:${fullText}|切换到完整版]]`}
            </Markdown>,
        );

        expect(screen.getByText(fullText)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '切换到完整版' })).toBeInTheDocument();
    });
});
