export enum Role {
  User = 'user',
  Bot = 'bot',
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
}

export interface SidebarProps {
  onExampleClick: (text: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}