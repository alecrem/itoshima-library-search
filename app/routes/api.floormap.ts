import type { Route } from "./+types/api.floormap";
import { fetchFloorMap } from "~/lib/library.server";
import { parseFloorMap } from "~/lib/floormap-parser.server";

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const biblioid = params.get("biblioid") ?? "";
  const lcdcd = params.get("lcdcd") ?? "";
  const doclno = params.get("doclno") ?? "";
  const displcs = params.get("displcs") ?? "";

  if (!biblioid || !lcdcd || !doclno || !displcs) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const html = await fetchFloorMap(biblioid, lcdcd, doclno, displcs);
  const data = parseFloorMap(html);

  return Response.json(data);
}
