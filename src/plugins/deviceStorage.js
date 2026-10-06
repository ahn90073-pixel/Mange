import { registerPlugin } from '@capacitor/core'

/**
 * Native DeviceStorage bridge.
 * This module is intentionally not imported by the UI, so the existing React
 * interface remains unchanged. Import it only from a feature that needs it.
 */
export const DeviceStorage = registerPlugin('DeviceStorage')
