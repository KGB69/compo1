
import React from 'react';
import { PageContainer } from './PageContainer';

interface HelpPageProps {
    onClose: () => void;
}

const ControlKey: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <code className="px-2 py-1 bg-slate-700 text-sky-300 rounded-md font-mono text-base">
        {children}
    </code>
);

export const HelpPage: React.FC<HelpPageProps> = ({ onClose }) => {
    return (
        <PageContainer title="Help & Instructions" breadcrumbs={['Home', 'Help']} onClose={onClose}>
            <div className="w-full h-full flex flex-col md:flex-row gap-8 p-4 text-slate-200">
                {/* Desktop Controls */}
                <div className="flex-1 bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-sky-500/50 pb-2">
                        Desktop Controls
                    </h2>
                    <ul className="space-y-4 text-lg">
                        <li className="flex items-center justify-between">
                            <span>Move</span>
                            <div className="flex gap-2">
                                <ControlKey>W</ControlKey>
                                <ControlKey>A</ControlKey>
                                <ControlKey>S</ControlKey>
                                <ControlKey>D</ControlKey>
                            </div>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Look Around</span>
                            <ControlKey>Click / T</ControlKey>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Open/Close Menu</span>
                            <ControlKey>M</ControlKey>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Go Back / Exit UI</span>
                            <ControlKey>Esc</ControlKey>
                        </li>
                         <li className="flex items-center justify-between">
                            <span>Select Menu Item</span>
                            <ControlKey>Enter</ControlKey>
                        </li>
                         <li className="flex items-center justify-between">
                            <span>Adjust UI Distance</span>
                            <div className="flex gap-2">
                                <ControlKey>Numpad 4</ControlKey>
                                <ControlKey>Numpad 6</ControlKey>
                            </div>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Adjust UI Height</span>
                            <div className="flex gap-2">
                                <ControlKey>Numpad 2</ControlKey>
                                <ControlKey>Numpad 8</ControlKey>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* VR Controls */}
                <div className="flex-1 bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-sky-500/50 pb-2">
                        VR Controls
                    </h2>
                     <ul className="space-y-4 text-lg">
                        <li className="flex items-center justify-between">
                            <span>Move</span>
                            <ControlKey>Left Stick</ControlKey>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Look Around</span>
                            <span className="text-slate-300">Move Your Head</span>
                        </li>
                         <li className="flex items-center justify-between">
                            <span>Open/Close Menu</span>
                            <ControlKey>Left 'Y' Button</ControlKey>
                        </li>
                        <li className="flex items-center justify-between">
                           <span>Go Back / Exit UI</span>
                           <ControlKey>Right 'B' Button</ControlKey>
                        </li>
                         <li className="flex items-center justify-between">
                            <span>Select Menu Item</span>
                             <span className="text-slate-300">Point & Trigger</span>
                        </li>
                    </ul>
                </div>
            </div>
        </PageContainer>
    );
};