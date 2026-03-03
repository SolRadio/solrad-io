import CommandCenter from "./CommandCenter"

export const metadata = {
  robots: { index: false, follow: false },
  title: "Command Center",
}

export default function CommandCenterPage() {
  return <CommandCenter />
}
