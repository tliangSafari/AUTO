import { Activity, FileText } from "lucide-react"
import type { Target } from "@/app/types"

export const targets: Target[] = [
  {
    id: "amos",
    name: "AMOS",
    description: "AMOS Monitoring Platform",
    icon: <Activity className="w-6 h-6" />,
    color: "bg-[#699B1F]",
    dataTypes: [
      { id: "locus", name: "Locus Energy", description: "Solar monitoring and energy data", enabled: true },
      { id: "powertrack", name: "PowerTrack", description: "Asset performance tracking", enabled: false },
      { id: "configuration", name: "Configuration", description: "System settings and preferences", enabled: false },
    ],
  },
  {
    id: "wpr",
    name: "WPR",
    description: "Generate Weekly Progress Reports for solar projects",
    icon: <FileText className="w-6 h-6" />,
    color: "bg-[#699B1F]",
    dataTypes: [
      { id: "latest_report", name: "Latest Weekly Report", description: "Generate current week's solar project progress", enabled: true },
      { id: "custom_range", name: "Custom Date Range", description: "Generate report for specific time period", enabled: false },
      { id: "email_delivery", name: "Email Delivery", description: "Send report via email to stakeholders", enabled: false },
      { id: "performance_summary", name: "Performance Summary", description: "Weekly energy production and system metrics", enabled: false },
      {
        id: "maintenance_log",
        name: "Maintenance Activities",
        description: "Weekly maintenance events and system updates",
        enabled: false,
      },
    ],
  },
  {
    id: "jonas",
    name: "AM Automation",
    description: "Extract data from AM Automation system",
    icon: <FileText className="w-6 h-6" />,
    color: "bg-[#699B1F]",
    dataTypes: [
      { id: "vendors", name: "Vendors (AP-Vendor Inquiry)", description: "Extract vendor reports with pending invoices", enabled: true },
      { id: "accounts", name: "Accounts (GL Transactions)", description: "Extract GL transaction reports by account code", enabled: false },
    ],
  },
]