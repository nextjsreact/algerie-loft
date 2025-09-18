import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleBasedAccess, withRoleBasedAccess, useRoleBasedAccess } from '@/components/auth/role-based-access';
import { renderHook } from '@testing-library/react';

// Mock the usePermissions hook
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: jest.fn((userRole) => ({
    hasPermission: jest.fn((resource, action, scope) => {
      // Mock permission logic for testing
      if (userRole === 'admin') return true;
      if (userRole === 'manager' && resource === 'dashboard') return true;
      if (userRole === 'member' && resource === 'tasks' && scope === 'own') return true;
      return false;
    }),
    canAccess: jest.fn((component) => {
      if (userRole === 'admin') return true;
      if (userRole === 'manager' && component === 'financial-dashboard') return true;
      return false;
    }),
    canAccessResource: jest.fn((resource) => {
      if (userRole === 'admin') return true;
      if (userRole === 'member' && resource === 'tasks') return true;
      return false;
    }),
    hasAnyRole: jest.fn((roles) => roles.includes(userRole)),
    hasRole: jest.fn((role) => userRole === role)
  }))
}));

describe('RoleBasedAccess Component', () => {
  const TestContent = () => <div data-testid="protected-content">Protected Content</div>;

  describe('role-based access', () => {
    it('should render content for allowed roles', () => {
      render(
        <RoleBasedAccess userRole="admin" allowedRoles={['admin', 'manager']}>
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content for disallowed roles', () => {
      render(
        <RoleBasedAccess userRole="member" allowedRoles={['admin', 'manager']}>
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Access Denied</div>;

      render(
        <RoleBasedAccess 
          userRole="member" 
          allowedRoles={['admin']} 
          fallback={<CustomFallback />}
        >
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('should render nothing when showFallback is false', () => {
      const { container } = render(
        <RoleBasedAccess 
          userRole="member" 
          allowedRoles={['admin']} 
          showFallback={false}
        >
          <TestContent />
        </RoleBasedAccess>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('permission-based access', () => {
    it('should render content when user has required permission', () => {
      render(
        <RoleBasedAccess userRole="manager" resource="dashboard" action="read">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user lacks required permission', () => {
      render(
        <RoleBasedAccess userRole="member" resource="financial" action="read">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should work with scope-based permissions', () => {
      render(
        <RoleBasedAccess userRole="member" resource="tasks" action="read" scope="own">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('component-based access', () => {
    it('should render content when user can access component', () => {
      render(
        <RoleBasedAccess userRole="manager" component="financial-dashboard">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user cannot access component', () => {
      render(
        <RoleBasedAccess userRole="member" component="financial-dashboard">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('resource-only access', () => {
    it('should render content when user can access resource', () => {
      render(
        <RoleBasedAccess userRole="member" resource="tasks">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user cannot access resource', () => {
      render(
        <RoleBasedAccess userRole="member" resource="financial">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('default behavior', () => {
    it('should render content when no restrictions are specified', () => {
      render(
        <RoleBasedAccess userRole="member">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('className handling', () => {
    it('should apply className when content is rendered', () => {
      const { container } = render(
        <RoleBasedAccess userRole="admin" allowedRoles={['admin']} className="test-class">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(container.firstChild).toHaveClass('test-class');
    });

    it('should apply className to fallback content', () => {
      const { container } = render(
        <RoleBasedAccess userRole="member" allowedRoles={['admin']} className="test-class">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('default access denied component', () => {
    it('should show user role in default fallback', () => {
      render(
        <RoleBasedAccess userRole="member" allowedRoles={['admin']}>
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByText(/Your current role \(member\)/)).toBeInTheDocument();
    });

    it('should show attempted resource in default fallback', () => {
      render(
        <RoleBasedAccess userRole="member" resource="financial" action="read">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByText(/financial:read/)).toBeInTheDocument();
    });

    it('should show attempted component in default fallback', () => {
      render(
        <RoleBasedAccess userRole="member" component="admin-panel">
          <TestContent />
        </RoleBasedAccess>
      );

      expect(screen.getByText(/admin-panel/)).toBeInTheDocument();
    });
  });
});

describe('withRoleBasedAccess HOC', () => {
  const TestComponent = ({ message }: { message: string }) => (
    <div data-testid="hoc-content">{message}</div>
  );

  it('should wrap component with role-based access control', () => {
    const WrappedComponent = withRoleBasedAccess(TestComponent, {
      allowedRoles: ['admin']
    });

    render(<WrappedComponent userRole="admin" message="Hello Admin" />);

    expect(screen.getByTestId('hoc-content')).toBeInTheDocument();
    expect(screen.getByText('Hello Admin')).toBeInTheDocument();
  });

  it('should deny access for unauthorized roles', () => {
    const WrappedComponent = withRoleBasedAccess(TestComponent, {
      allowedRoles: ['admin']
    });

    render(<WrappedComponent userRole="member" message="Hello Admin" />);

    expect(screen.queryByTestId('hoc-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});

describe('useRoleBasedAccess hook', () => {
  it('should return correct canRender function', () => {
    const { result } = renderHook(() => useRoleBasedAccess('admin'));

    expect(result.current.canRender({ allowedRoles: ['admin'] })).toBe(true);
    expect(result.current.canRender({ allowedRoles: ['member'] })).toBe(false);
  });

  it('should handle component-based access', () => {
    const { result } = renderHook(() => useRoleBasedAccess('manager'));

    expect(result.current.canRender({ component: 'financial-dashboard' })).toBe(true);
    expect(result.current.canRender({ component: 'admin-panel' })).toBe(false);
  });

  it('should handle permission-based access', () => {
    const { result } = renderHook(() => useRoleBasedAccess('member'));

    expect(result.current.canRender({ 
      resource: 'tasks', 
      action: 'read', 
      scope: 'own' 
    })).toBe(true);
    
    expect(result.current.canRender({ 
      resource: 'financial', 
      action: 'read' 
    })).toBe(false);
  });

  it('should filter renderable items correctly', () => {
    const { result } = renderHook(() => useRoleBasedAccess('manager'));

    const items = [
      { id: '1', type: 'dashboard' },
      { id: '2', type: 'financial' },
      { id: '3', type: 'admin' }
    ];

    const filtered = result.current.filterRenderableItems(items, (item) => ({
      resource: item.type,
      action: 'read'
    }));

    // Manager should be able to access dashboard but not admin features
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('dashboard');
  });
});