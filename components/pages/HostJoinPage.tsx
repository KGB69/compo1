import React, { useState } from 'react';
import { PageContainer } from './PageContainer';
import { UIButton } from './ui/UIButton';
import { UIInput } from './ui/UIInput';

type View = 'main' | 'create' | 'join';

const SESSIONS = [
    { id: '1', name: 'James\' Session' },
    { id: '2', name: 'Class B8\' Session' },
    { id: '3', name: 'Class C4\' Session' },
    { id: '4', name: 'Class D9\' Session' },
];

export const HostJoinPage: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const [view, setView] = useState<View>('main');
    const [participantCount, setParticipantCount] = useState(10);
    
    const increment = () => setParticipantCount(c => c + 1);
    const decrement = () => setParticipantCount(c => Math.max(1, c - 1));

    const renderContent = () => {
        switch (view) {
            case 'create':
                return (
                    <div className="w-full max-w-sm flex flex-col items-center space-y-4">
                        <h2 className="text-2xl font-semibold text-white">Create Session</h2>
                        <UIInput placeholder="Name" />
                         <div className="w-full text-center">
                            <label className="text-slate-300">Number of Participants</label>
                            <div className="flex items-center justify-center space-x-4 mt-2">
                                <button onClick={decrement} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md text-xl font-bold">-</button>
                                <span className="text-2xl font-bold w-16 text-center">{participantCount}</span>
                                <button onClick={increment} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md text-xl font-bold">+</button>
                            </div>
                        </div>
                        <div className="flex space-x-4 pt-4">
                            <UIButton onClick={() => alert('Session Created!')}>Finish</UIButton>
                            <UIButton onClick={() => setView('main')} variant="secondary">Cancel</UIButton>
                        </div>
                    </div>
                );
            case 'join':
                return (
                     <div className="w-full max-w-md flex flex-col items-center">
                        <h2 className="text-2xl font-semibold text-white mb-4">Join Session</h2>
                        <div className="w-full space-y-2 bg-slate-800/50 p-4 rounded-lg">
                           {SESSIONS.map(session => (
                               <div key={session.id} className="flex justify-between items-center p-2 rounded-md hover:bg-sky-900/50">
                                   <span className="text-lg">{session.name}</span>
                                   <UIButton onClick={() => alert(`Joining ${session.name}`)} size="sm">Enter</UIButton>
                               </div>
                           ))}
                        </div>
                        <div className="mt-6">
                           <UIButton onClick={() => setView('main')} variant="secondary">Cancel</UIButton>
                        </div>
                    </div>
                );
            case 'main':
            default:
                return (
                    <div className="flex flex-col space-y-6 items-center">
                         <h2 className="text-2xl font-semibold text-white">Multi-User Session</h2>
                         <div className="flex space-x-6">
                            <UIButton onClick={() => setView('create')}>Create</UIButton>
                            <UIButton onClick={() => setView('join')}>Join</UIButton>
                         </div>
                    </div>
                );
        }
    }
    
    const getBreadcrumbs = () => {
        const base = ['Home', 'Host/Join'];
        if (view === 'create') return [...base, 'Create'];
        if (view === 'join') return [...base, 'Join'];
        return base;
    }

    return (
        <PageContainer title="Host/Join Session" breadcrumbs={getBreadcrumbs()} onClose={onClose}>
           {renderContent()}
        </PageContainer>
    );
};