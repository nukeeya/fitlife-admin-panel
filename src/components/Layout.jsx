import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import HorizontalNav from './HorizontalNav';
import CustomizerDrawer from './CustomizerDrawer';
import MemberAdmissionModal from './MemberAdmissionModal';
import QuickCheckInModal from './QuickCheckInModal';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { navStyle } = useTheme();
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const isVertical = navStyle === 'vertical';

  return (
    <div className={`app-layout ${isVertical ? 'layout-vertical' : 'layout-horizontal'}`}>
      {/* Vertical Sidebar */}
      {isVertical && <Sidebar />}

      <div className="main-wrapper">
        {/* Global Top Header */}
        <Header
          onOpenAdmission={() => setIsAdmissionOpen(true)}
          onOpenQuickCheckIn={() => setIsCheckInOpen(true)}
        />

        {/* Horizontal Navigation (if horizontal mode active) */}
        {!isVertical && <HorizontalNav />}

        {/* Main Content Area */}
        <main className="main-content">
          <Outlet context={{ openAdmission: () => setIsAdmissionOpen(true) }} />
        </main>
      </div>

      {/* Floating Theme Customizer Drawer */}
      <CustomizerDrawer />

      {/* Global Modals */}
      <MemberAdmissionModal
        isOpen={isAdmissionOpen}
        onClose={() => setIsAdmissionOpen(false)}
      />

      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />
    </div>
  );
}
