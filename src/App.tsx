import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './components/Landing/LandingPage';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { RecommendationsList } from './components/Recommendations/RecommendationsList';
import { ApprovedRecommendations } from './components/Recommendations/ApprovedRecommendations';
import { RejectedRecommendations } from './components/Recommendations/RejectedRecommendations';
import { AnalyticsPage } from './components/Analytics/AnalyticsPage';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notificationCount] = useState(5);

  if (showLanding) {
    return (
      <ThemeProvider>
        <LandingPage onEnterDashboard={() => setShowLanding(false)} />
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'recommendations':
        return (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Selection</h2>
              <p className="text-gray-600">Review and approve alternative product selections</p>
            </div>
            <RecommendationsList status="pending" />
          </div>
        );
      case 'approved':
        return (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Approved Selections</h2>
              <p className="text-gray-600">View your approved product alternatives</p>
            </div>
            <ApprovedRecommendations />
          </div>
        );
      case 'rejected':
        return (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejected Selections</h2>
              <p className="text-gray-600">Review rejected product alternatives</p>
            </div>
            <RejectedRecommendations />
          </div>
        );
      case 'analytics':
        return (
          <AnalyticsPage />
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            onNotificationClick={() => console.log('Notifications clicked')}
            notificationCount={notificationCount}
            onBackToLanding={() => setShowLanding(true)}
          />
          
          <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;