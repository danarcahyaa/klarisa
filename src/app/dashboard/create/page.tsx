import { Suspense } from "react";
import { DraftEditor } from "@/components/draft-editor";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

export default function CreateContractPage(){return <Suspense fallback={<DashboardSkeleton variant="document"/>}><DraftEditor/></Suspense>;}
