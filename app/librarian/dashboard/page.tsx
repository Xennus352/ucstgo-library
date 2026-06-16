import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { getLiveCirculationData } from "@/app/actions/circulation";

export default async function DashboardPage() {
  // Directly read live data asynchronously on the server
  const result = await getLiveCirculationData();
  const liveLibraryData = result.success && result.data ? result.data : [];

  console.log('live data',liveLibraryData)
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      {/* If data fetch crashes or remains empty, fallback seamlessly */}
      {liveLibraryData.length > 0 ? (
        <DataTable data={liveLibraryData} />
      ) : (
        <div className="mx-4 lg:mx-6 p-8 text-center border rounded-xl border-dashed text-slate-500">
          No current active system borrow logs found.
        </div>
      )}
    </>
  );
}
