import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component to test CSS styles
const TestCalendarStyles = () => {
  const customCalendarStyles = `
    .rbc-event-blocked {
      background-color: #a1a1aa !important;
      border-color: #71717a !important;
      font-weight: 500;
      color: white !important;
    }
    
    .rbc-event-maintenance {
      background-color: #f59e0b !important;
      border-color: #d97706 !important;
      font-weight: 500;
      color: white !important;
    }
    
    .rbc-event-renovation {
      background-color: #8b5cf6 !important;
      border-color: #7c3aed !important;
      font-weight: 500;
      color: white !important;
    }
    
    .rbc-event-content {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      line-height: 1.2;
      max-width: 100%;
    }
  `;

  return (
    <div>
      <style>{customCalendarStyles}</style>
      <div className="rbc-event-blocked" data-testid="blocked-event">
        Blocked Event
      </div>
      <div className="rbc-event-maintenance" data-testid="maintenance-event">
        Maintenance Event
      </div>
      <div className="rbc-event-renovation" data-testid="renovation-event">
        Renovation Event
      </div>
      <div className="rbc-event-content" data-testid="event-content">
        Event Content with Long Text That Should Be Truncated
      </div>
    </div>
  );
};

describe('Calendar Styles', () => {
  it('should render different event types with correct styling classes', () => {
    const { getByTestId } = render(<TestCalendarStyles />);
    
    // Test that elements with different classes are rendered
    expect(getByTestId('blocked-event')).toBeInTheDocument();
    expect(getByTestId('maintenance-event')).toBeInTheDocument();
    expect(getByTestId('renovation-event')).toBeInTheDocument();
    expect(getByTestId('event-content')).toBeInTheDocument();
    
    // Test that classes are applied
    expect(getByTestId('blocked-event')).toHaveClass('rbc-event-blocked');
    expect(getByTestId('maintenance-event')).toHaveClass('rbc-event-maintenance');
    expect(getByTestId('renovation-event')).toHaveClass('rbc-event-renovation');
    expect(getByTestId('event-content')).toHaveClass('rbc-event-content');
  });

  it('should have proper text content', () => {
    const { getByTestId } = render(<TestCalendarStyles />);
    
    expect(getByTestId('blocked-event')).toHaveTextContent('Blocked Event');
    expect(getByTestId('maintenance-event')).toHaveTextContent('Maintenance Event');
    expect(getByTestId('renovation-event')).toHaveTextContent('Renovation Event');
    expect(getByTestId('event-content')).toHaveTextContent('Event Content with Long Text That Should Be Truncated');
  });
});