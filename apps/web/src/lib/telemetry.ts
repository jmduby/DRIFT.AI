/**
 * Simple telemetry utility for tracking UI events
 * Currently a no-op implementation that logs to console
 */

export interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

/**
 * Track a telemetry event
 * @param event - The event name (e.g., 'ui_open_manual_upload')
 * @param properties - Optional properties to include with the event
 */
export function track(event: string, properties?: Record<string, any>): void {
  const telemetryEvent: TelemetryEvent = {
    event,
    properties,
    timestamp: new Date().toISOString()
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[Telemetry]', telemetryEvent);
  }

  // In production, this would send to your analytics service
  // Examples: PostHog, Mixpanel, Google Analytics, etc.
  // For now, it's a no-op to avoid any external dependencies
}

/**
 * Track UI interaction events
 */
export const trackUI = {
  openManualUpload: () => track('ui_open_manual_upload'),
  uploadSubmit: (fileSize?: number, fileName?: string) => 
    track('ui_upload_submit', { fileSize, fileName }),
  connectSourceClick: (source?: string) => 
    track('ui_connect_source_click', { source }),
  manageSourcesClick: () => 
    track('ui_manage_sources_click'),
  keyboardShortcut: (key: string, action: string) => 
    track('ui_keyboard_shortcut', { key, action })
};