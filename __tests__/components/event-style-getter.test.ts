import type { CalendarEvent } from '@/types/calendar';

// Mock the eventStyleGetter function
const eventStyleGetter = (event: CalendarEvent) => {
  let backgroundColor = '#3174ad';
  let borderColor = '#3174ad';
  let className = '';
  
  switch (event.status) {
    case 'confirmed':
      backgroundColor = '#10b981';
      borderColor = '#059669';
      break;
    case 'pending':
      backgroundColor = '#f59e0b';
      borderColor = '#d97706';
      break;
    case 'cancelled':
      backgroundColor = '#ef4444';
      borderColor = '#dc2626';
      break;
    case 'completed':
      backgroundColor = '#6b7280';
      borderColor = '#4b5563';
      break;
    case 'maintenance':
      backgroundColor = '#f97316'; // Orange-500
      borderColor = '#ea580c';
      className = 'rbc-event-maintenance';
      break;
    case 'renovation':
      backgroundColor = '#3b82f6'; // Blue-500
      borderColor = '#2563eb';
      className = 'rbc-event-renovation';
      break;
    case 'personal':
      backgroundColor = '#a855f7'; // Purple-500
      borderColor = '#9333ea';
      className = 'rbc-event-personal';
      break;
    case 'blocked':
    default:
      backgroundColor = '#d1d5db'; // Gray-300
      borderColor = '#9ca3af';
      className = 'rbc-event-blocked';
      break;
  }

  return {
    className,
    style: {
      backgroundColor,
      borderColor,
      color: 'white',
      border: `2px solid ${borderColor}`,
      borderRadius: '4px',
      fontSize: '12px',
      padding: '2px 4px',
      fontWeight: '500',
    },
  };
};

// Mock calendar event factory
const createMockEvent = (status: string, title: string = 'Test Event'): CalendarEvent => ({
  id: `test-${status}`,
  title,
  start: new Date(),
  end: new Date(),
  resource: {
    date: '2024-01-01',
    is_available: false,
    blocked_reason: status,
    price_override: null,
    minimum_stay: 1,
    reservation: null,
  },
  status,
  loftName: 'Test Loft',
});

describe('eventStyleGetter', () => {
  it('should return correct styles for confirmed reservations', () => {
    const event = createMockEvent('confirmed');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#10b981');
    expect(result.style.borderColor).toBe('#059669');
    expect(result.className).toBe('');
  });

  it('should return correct styles for pending reservations', () => {
    const event = createMockEvent('pending');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#f59e0b');
    expect(result.style.borderColor).toBe('#d97706');
    expect(result.className).toBe('');
  });

  it('should return correct styles for cancelled reservations', () => {
    const event = createMockEvent('cancelled');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#ef4444');
    expect(result.style.borderColor).toBe('#dc2626');
    expect(result.className).toBe('');
  });

  it('should return correct styles for completed reservations', () => {
    const event = createMockEvent('completed');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#6b7280');
    expect(result.style.borderColor).toBe('#4b5563');
    expect(result.className).toBe('');
  });

  it('should return correct styles for maintenance events', () => {
    const event = createMockEvent('maintenance');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#f97316');
    expect(result.style.borderColor).toBe('#ea580c');
    expect(result.className).toBe('rbc-event-maintenance');
  });

  it('should return correct styles for renovation events', () => {
    const event = createMockEvent('renovation');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#3b82f6');
    expect(result.style.borderColor).toBe('#2563eb');
    expect(result.className).toBe('rbc-event-renovation');
  });

  it('should return correct styles for personal use events', () => {
    const event = createMockEvent('personal');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#a855f7');
    expect(result.style.borderColor).toBe('#9333ea');
    expect(result.className).toBe('rbc-event-personal');
  });

  it('should return correct styles for blocked events', () => {
    const event = createMockEvent('blocked');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#d1d5db');
    expect(result.style.borderColor).toBe('#9ca3af');
    expect(result.className).toBe('rbc-event-blocked');
  });

  it('should return blocked styles for unknown status', () => {
    const event = createMockEvent('unknown-status');
    const result = eventStyleGetter(event);
    
    expect(result.style.backgroundColor).toBe('#d1d5db');
    expect(result.style.borderColor).toBe('#9ca3af');
    expect(result.className).toBe('rbc-event-blocked');
  });

  it('should always return consistent base styles', () => {
    const event = createMockEvent('maintenance');
    const result = eventStyleGetter(event);
    
    expect(result.style.color).toBe('white');
    expect(result.style.borderRadius).toBe('4px');
    expect(result.style.fontSize).toBe('12px');
    expect(result.style.padding).toBe('2px 4px');
    expect(result.style.fontWeight).toBe('500');
    expect(result.style.border).toContain('2px solid');
  });
});