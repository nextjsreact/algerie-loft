import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SmartDashboard } from '@/components/dashboard/smart-dashboard';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';
import { UserRole } from '@/lib/types';

// Mock the translation context
jest.mock('@/lib/i18n/context', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Overview',
      'dashboard.welcomeBack': `Welcome back, ${params?.name || 'User'}`,
      'dashboard.someDataError': 'Some data could not be loaded',
      'dashboard.unableToLoadTasks': 'Unable to load your tasks',
      'dashboard.unableToLoadData': 'Unable to load dashboard data',
      'dashboard.errorLoadingYour': 'Error loading your dashboard',
      'dashboard.errorLoadingData': 'Error loading dashboard data'
    };
    return translations[key] || key;
  }
}));

// Mock the data filter service
jest.mock('@/lib/services/data-filter', () => ({
  DataFilterService: {
    filterDashboardData: jest.fn((data, config) => {
      const { userRole } = config;
      
      if (userRole === 'member') {
        return {
          tasks: { 
            data: data.tasks?.filter((t: any) => t.assigned_to === config.userId) || [],
            filteredCount: 2,
            hasSecurityFiltering: true
          },
          lofts: { 
            data: data.lofts?.slice(0, 1) || [],
            filteredCount: 1,
            hasSecurityFiltering: true
          },
          notifications: { 
            data: data.notifications?.filter((n: any) => n.user_id === config.userId) || [],
            filteredCount: 1,
            hasSecurityFiltering: true
          },
          transactions: { 
            data: [],
            filteredCount: data.transactions?.length || 0,
            hasSecurityFiltering: true
          }
        };
      }
      
      return {
        tasks: { data: data.tasks || [], filteredCount: 0, hasSecurityFiltering: false },
        lofts: { data: data.lofts || [], filteredCount: 0, hasSecurityFiltering: false },
        notifications: { data: data.notifications || [], filteredCount: 0, hasSecurityFiltering: false },
        transactions: { data: data.transactions || [], filteredCount: 0, hasSecurityFiltering: false }
      };
    }),
    getAssignedLoftIds: jest.fn(() => ['loft-1']),
    sanitizeLoftForMember: jest.fn((loft) => ({
      id: loft.id,
      name: loft.name,
      address: loft.address,
      status: loft.status
    }))
  }
}));

// Mock the member data transformers
jest.mock('@/lib/types/member-views', () => ({
  MemberDataTransformers: {
    transformTask: jest.fn((task, userId) => ({
      ...task,
      isAssignedToMe: task.assigned_to === userId,
      isCreatedByMe: task.user_id === userId,
      daysUntilDue: task.due_date ? Math.floor((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      priority: task.priority || 'normal'
    })),
    transformNotification: jest.fn((notification) => ({
      ...notification,
      isTaskRelated: notification.type?.includes('task') || false
    })),
    transformLoft: jest.fn((loft, taskCount) => ({
      ...loft,
      hasActiveTasks: taskCount > 0,
      assignedTasksCount: taskCount
    }))
  }
}));

// Mock child components
jest.mock('@/components/dashboard/member-dashboard', () => ({
  MemberDashboard: ({ userTasks, userName, userRole }: any) => (
    <div data-testid="member-dashboard">
      <div data-testid="member-name">{userName}</div>
      <div data-testid="member-role">{userRole}</div>
      <div data-testid="task-count">{userTasks?.length || 0}</div>
    </div>
  )
}));

jest.mock('@/components/dashboard/dashboard-wrapper', () => ({
  DashboardWrapper: ({ userRole, userName, stats, recentTasks, monthlyRevenue, errors }: any) => (
    <div data-testid="dashboard-wrapper">
      <div data-testid="wrapper-role">{userRole}</div>
      <div data-testid="wrapper-name">{userName}</div>
      <div data-testid="wrapper-stats">{JSON.stringify(stats)}</div>
      <div data-testid="wrapper-tasks">{recentTasks?.length || 0}</div>
      <div data-testid="wrapper-revenue">{monthlyRevenue?.length || 0}</div>
      <div data-testid="wrapper-errors">{errors?.length || 0}</div>
    </div>
  ),
  DashboardError: ({ userRole, error }: any) => (
    <div data-testid="dashboard-error">
      <div data-testid="error-role">{userRole}</div>
      <div data-testid="error-message">{error}</div>
    </div>
  )
}));

describe('Dashboard Routing Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockData = {
    tasks: [
      { id: '1', title: 'Task 1', assigned_to: 'user-123', user_id: 'user-456', status: 'todo' },
      { id: '2', title: 'Task 2', assigned_to: 'user-456', user_id: 'user-123', status: 'in_progress' },
      { id: '3', title: 'Task 3', assigned_to: 'user-789', user_id: 'user-789', status: 'completed' }
    ],
    lofts: [
      { id: 'loft-1', name: 'Loft 1', address: '123 Main St', status: 'available' },
      { id: 'loft-2', name: 'Loft 2', address: '456 Oak Ave', status: 'occupied' }
    ],
    notifications: [
      { id: '1', type: 'task_assigned', user_id: 'user-123', is_read: false },
      { id: '2', type: 'financial_report', user_id: 'user-456', is_read: false }
    ],
    transactions: [
      { id: '1', amount: 1000, type: 'income', loft_id: 'loft-1' },
      { id: '2', amount: 500, type: 'expense', loft_id: 'loft-2' }
    ],
    stats: { totalTasks: 10, completedTasks: 5, revenue: 5000 },
    recentTasks: [
      { id: '1', title: 'Recent Task 1' },
      { id: '2', title: 'Recent Task 2' }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 1000 },
      { month: 'Feb', revenue: 1200 }
    ]
  };

  describe('SmartDashboard role-based routing', () => {
    it('should route member to MemberDashboard with filtered data', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('member-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('member-role')).toHaveTextContent('member');
      
      // Should show security filtering notice
      expect(screen.getByText(/Your dashboard shows only information relevant to your assigned tasks/)).toBeInTheDocument();
    });

    it('should route admin to DashboardWrapper with full data', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'admin' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-wrapper')).toBeInTheDocument();
      });

      expect(screen.getByTestId('wrapper-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('wrapper-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('wrapper-tasks')).toHaveTextContent('2'); // recentTasks length
      expect(screen.getByTestId('wrapper-revenue')).toHaveTextContent('2'); // monthlyRevenue length
    });

    it('should route manager to DashboardWrapper with appropriate data', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'manager' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-wrapper')).toBeInTheDocument();
      });

      expect(screen.getByTestId('wrapper-role')).toHaveTextContent('manager');
      expect(screen.getByTestId('wrapper-name')).toHaveTextContent('Test User');
    });

    it('should route executive to DashboardWrapper with financial data', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'executive' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-wrapper')).toBeInTheDocument();
      });

      expect(screen.getByTestId('wrapper-role')).toHaveTextContent('executive');
      expect(screen.getByTestId('wrapper-revenue')).toHaveTextContent('2'); // Should have revenue data
    });

    it('should show guest dashboard for guest role', () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'guest' }}
          data={mockData}
        />
      );

      expect(screen.getByText('Welcome, Guest')).toBeInTheDocument();
      expect(screen.getByText(/You have limited access to the system/)).toBeInTheDocument();
      expect(screen.getByText('View public information')).toBeInTheDocument();
    });
  });

  describe('data filtering integration', () => {
    it('should apply security filtering for member role', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
      });

      // Should show security notice with filtered count
      expect(screen.getByText(/3 items were filtered for security/)).toBeInTheDocument();
    });

    it('should not show security filtering for admin role', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'admin' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-wrapper')).toBeInTheDocument();
      });

      // Should not show security filtering notice
      expect(screen.queryByText(/items were filtered for security/)).not.toBeInTheDocument();
    });

    it('should handle empty data gracefully', async () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={{}}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('task-count')).toHaveTextContent('0');
    });
  });

  describe('loading and error states', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
          isLoading={true}
        />
      );

      // Should show loading skeleton
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();
    });

    it('should show error state when data filtering fails', () => {
      // Mock DataFilterService to throw error
      const mockFilterService = require('@/lib/services/data-filter');
      mockFilterService.DataFilterService.filterDashboardData.mockImplementationOnce(() => {
        throw new Error('Filter error');
      });

      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
        />
      );

      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
      expect(screen.getByTestId('error-role')).toHaveTextContent('member');
    });

    it('should display errors from props', async () => {
      const errors = ['Database connection failed', 'API timeout'];

      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
          errors={errors}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Some data could not be loaded/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Database connection failed, API timeout/)).toBeInTheDocument();
    });
  });

  describe('role transition scenarios', () => {
    it('should handle role changes correctly', async () => {
      const { rerender } = render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
      });

      // Change role to admin
      rerender(
        <SmartDashboard
          user={{ ...mockUser, role: 'admin' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-wrapper')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('member-dashboard')).not.toBeInTheDocument();
    });

    it('should update data filtering when role changes', async () => {
      const { rerender } = render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/items were filtered for security/)).toBeInTheDocument();
      });

      // Change to admin role
      rerender(
        <SmartDashboard
          user={{ ...mockUser, role: 'admin' }}
          data={mockData}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/items were filtered for security/)).not.toBeInTheDocument();
      });
    });
  });

  describe('performance integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeData = {
        tasks: Array.from({ length: 1000 }, (_, i) => ({
          id: i.toString(),
          title: `Task ${i}`,
          assigned_to: i % 2 === 0 ? 'user-123' : 'user-456',
          status: 'todo'
        })),
        lofts: Array.from({ length: 100 }, (_, i) => ({
          id: `loft-${i}`,
          name: `Loft ${i}`,
          address: `${i} Main St`,
          status: 'available'
        })),
        notifications: Array.from({ length: 500 }, (_, i) => ({
          id: i.toString(),
          type: 'task_assigned',
          user_id: i % 2 === 0 ? 'user-123' : 'user-456',
          is_read: false
        }))
      };

      const startTime = performance.now();

      render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={largeData}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should render within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should not cause memory leaks with frequent re-renders', async () => {
      const { rerender } = render(
        <SmartDashboard
          user={{ ...mockUser, role: 'member' }}
          data={mockData}
        />
      );

      // Simulate frequent updates
      for (let i = 0; i < 100; i++) {
        rerender(
          <SmartDashboard
            user={{ ...mockUser, role: 'member' }}
            data={{
              ...mockData,
              stats: { ...mockData.stats, totalTasks: i }
            }}
          />
        );
      }

      await waitFor(() => {
        expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
      });

      // Should complete without errors
      expect(screen.getByTestId('member-name')).toHaveTextContent('Test User');
    });
  });
});

describe('DashboardWrapper Integration Tests', () => {
  const mockStats = { totalTasks: 10, completedTasks: 5, revenue: 5000 };
  const mockTasks = [
    { id: '1', title: 'Task 1', status: 'todo' },
    { id: '2', title: 'Task 2', status: 'in_progress' }
  ];
  const mockRevenue = [
    { month: 'Jan', revenue: 1000 },
    { month: 'Feb', revenue: 1200 }
  ];

  describe('legacy dashboard with role-based access', () => {
    it('should render member dashboard with security notice', () => {
      render(
        <DashboardWrapper
          userRole="member"
          userName="Test Member"
          userId="user-123"
          userTasks={mockTasks}
          useSmartDashboard={false}
        />
      );

      expect(screen.getByText(/You are using the legacy dashboard/)).toBeInTheDocument();
      expect(screen.getByTestId('member-dashboard')).toBeInTheDocument();
    });

    it('should render admin dashboard with all components', () => {
      render(
        <DashboardWrapper
          userRole="admin"
          userName="Test Admin"
          stats={mockStats}
          recentTasks={mockTasks}
          monthlyRevenue={mockRevenue}
          useSmartDashboard={false}
        />
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, Test Admin/)).toBeInTheDocument();
    });

    it('should use SmartDashboard when enabled', () => {
      render(
        <DashboardWrapper
          userRole="member"
          userName="Test User"
          userId="user-123"
          userTasks={mockTasks}
          useSmartDashboard={true}
        />
      );

      // Should render SmartDashboard instead of legacy components
      expect(screen.queryByText(/You are using the legacy dashboard/)).not.toBeInTheDocument();
    });
  });

  describe('error handling integration', () => {
    it('should display errors in dashboard', () => {
      const errors = ['Database error', 'Network timeout'];

      render(
        <DashboardWrapper
          userRole="admin"
          userName="Test Admin"
          errors={errors}
          useSmartDashboard={false}
        />
      );

      expect(screen.getByText(/Some data could not be loaded/)).toBeInTheDocument();
      expect(screen.getByText(/Database error, Network timeout/)).toBeInTheDocument();
    });

    it('should show role-specific error messages', () => {
      render(
        <DashboardWrapper
          userRole="member"
          userName="Test Member"
          userId="user-123"
          errors={['Task loading failed']}
          useSmartDashboard={false}
        />
      );

      // Member should see task-specific error context
      expect(screen.getByText(/Task loading failed/)).toBeInTheDocument();
    });
  });
});