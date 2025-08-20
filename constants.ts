import { PageContent } from './types';
import { Brain, Users, Clipboard, Settings, HelpCircle } from './components/icons';

export const PAGES: PageContent[] = [
  {
    id: 'visualise',
    title: 'Visualise',
    menuLabel: 'Visualise',
    Icon: Brain,
  },
  {
    id: 'host-join',
    title: 'Host/Join Session',
    menuLabel: 'Host/Join',
    Icon: Users,
  },
  {
    id: 'assessments',
    title: 'Assessments',
    menuLabel: 'Assessments',
    Icon: Clipboard,
  },
  {
    id: 'settings',
    title: 'Settings',
    menuLabel: 'Settings',
    Icon: Settings,
  },
  {
    id: 'help',
    title: 'Help',
    menuLabel: 'Help',
    Icon: HelpCircle,
  },
];

export const PLAYER_SPEED = 5;
export const PLAYER_HEIGHT = 1.6;
export const ROOM_SIZE = 20;
export const WALL_HEIGHT = 6;
