export function getCurrentWeekString() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}