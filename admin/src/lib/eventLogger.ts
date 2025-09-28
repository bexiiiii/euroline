// Event logging utility for frontend
export const logPageView = async (pageName: string, pageUrl: string) => {
  try {
    const response = await fetch('http://localhost:8080/api/admin/event-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType: 'PAGE_VIEW',
        entityType: 'ADMIN',
        description: `Просмотр страницы: ${pageName}`,
        details: `URL: ${pageUrl}`,
        success: true
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to log page view');
    }
  } catch (error) {
    console.warn('Error logging page view:', error);
  }
};

export const logUserAction = async (action: string, details?: string) => {
  try {
    const response = await fetch('http://localhost:8080/api/admin/event-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType: 'USER_ACTION',
        entityType: 'ADMIN',
        description: action,
        details: details || '',
        success: true
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to log user action');
    }
  } catch (error) {
    console.warn('Error logging user action:', error);
  }
};