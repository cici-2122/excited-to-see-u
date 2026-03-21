import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kamwlzsiyynwsjtqwmro.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbXdsenNpeXlud3NqdHF3bXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODMxNDcsImV4cCI6MjA4OTY1OTE0N30.oyzFGGVRcSsVk9NwDBG9c7FSAzejESm7PRkexWqwfTc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User identifiers and their properties
export const USER_IDS = {
  BIG_C: 'big-c-2122',  // You (Francis) - Green
  SMOL_R: 'smol-r-2122' // Partner - Blue
}

// Color schemes for each user
export const USER_COLORS = {
  [USER_IDS.BIG_C]: {
    primary: '#22C55E',      // Green-500
    primaryDark: '#16A34A',  // Green-600
    light: '#DCFCE7',        // Green-100
    name: 'C',
    displayName: 'C'
  },
  [USER_IDS.SMOL_R]: {
    primary: '#3B82F6',      // Blue-500
    primaryDark: '#2563EB',  // Blue-600
    light: '#DBEAFE',        // Blue-100
    name: 'R',
    displayName: 'R'
  }
}

// Get current user colors based on userId
export const getUserColors = (userId) => {
  return USER_COLORS[userId] || USER_COLORS[USER_IDS.SMOL_R]
}

// Get partner colors
export const getPartnerColors = (userId) => {
  return userId === USER_IDS.BIG_C 
    ? USER_COLORS[USER_IDS.SMOL_R] 
    : USER_COLORS[USER_IDS.BIG_C]
}

// Get partner ID
export const getPartnerId = (userId) => {
  return userId === USER_IDS.BIG_C ? USER_IDS.SMOL_R : USER_IDS.BIG_C
}
