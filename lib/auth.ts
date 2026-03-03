export function verifyOpsPassword(password: string): boolean {
  const correctPassword = process.env.OPS_PASSWORD
  if (!correctPassword) {
    console.warn("[v0] OPS_PASSWORD not configured")
    return false
  }
  return password === correctPassword
}
