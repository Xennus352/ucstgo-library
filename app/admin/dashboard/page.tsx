import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

// Structured to log library book circulation data
const liveLibraryData = [
  {
    id: "TX-9021",
    borrower: "Soe Moe Kyaw",
    role: "Student",
    bookTitle: "Introduction to Algorithms, 4th Edition",
    status: "Borrowed",
    date: "2026-06-10",
    dueDate: "2026-06-24",
  },
  {
    id: "TX-9022",
    borrower: "Mg Thura Aung Htet",
    role: "Student",
    bookTitle: "Computer Vision: Algorithms and Applications",
    status: "Overdue",
    date: "2026-05-15",
    dueDate: "2026-05-29",
  },
  {
    id: "TX-9023",
    borrower: "Ma Hla",
    role: "Faculty",
    bookTitle: "Operations Research: An Introduction",
    status: "Returned",
    date: "2026-06-01",
    dueDate: "2026-06-15",
  },
];

export default function DashboardPage() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={liveLibraryData} />
    </>
  );
}
