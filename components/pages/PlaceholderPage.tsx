import React from 'react';
import { PageContainer } from './PageContainer';

interface PlaceholderPageProps {
    title: string;
    message: string;
    onClose: () => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, message, onClose }) => {
    return (
        <PageContainer title={title} breadcrumbs={['Home', title]} onClose={onClose}>
            <div className="text-center">
                <p className="text-2xl text-slate-300">{message}</p>
            </div>
        </PageContainer>
    );
};