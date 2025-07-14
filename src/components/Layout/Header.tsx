import React from 'react';
import { Bell, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../UI/ThemeToggle';

interface HeaderProps {
  onNotificationClick: () => void;
  notificationCount: number;
  onBackToLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNotificationClick, notificationCount, onBackToLanding }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToLanding}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Back to landing page"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SourceHere</h1>
          <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
            <span>Dashboard</span>
            <span className="mx-1">•</span>
            <span>Smart Sourcing Platform</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={onNotificationClick}
            className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <Bell className="h-6 w-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors">
            <Settings className="h-6 w-6" />
          </button>
          
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};