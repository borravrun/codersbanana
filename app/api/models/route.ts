export async function GET() {
    const fetchModels = await fetch("https://openrouter.ai/api/v1/models?output_modalities=image");
    const response = await fetchModels.json();
    const models = response.data.map((model: any) => ({
        id: model.id,
        name: model.name,
        chef: (model.id as string).split("/")[0],
        chefSlug: model.canonical_slug,
    }));
    return new Response(JSON.stringify(models), {
        headers: { "Content-Type": "application/json" },
    });
}