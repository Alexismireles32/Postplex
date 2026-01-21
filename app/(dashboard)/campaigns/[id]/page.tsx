export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Campaign Details</h1>
      <p className="text-muted-foreground">
        Campaign ID: {id}
      </p>
      <p className="text-muted-foreground mt-2">
        Campaign detail page will be implemented in Stage 1
      </p>
    </div>
  );
}
