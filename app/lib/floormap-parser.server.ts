import * as cheerio from "cheerio";

export type FloorMapData = {
  floors: FloorInfo[];
};

export type FloorInfo = {
  floor: number;
  imageUrl: string;
  gridCols: number;
  gridRows: number;
  stars: { row: number; col: number }[];
};

export function parseFloorMap(html: string): FloorMapData {
  const floors: FloorInfo[] = [];

  // Extract star positions from change_backcolorN() functions
  // Pattern: rows[R].cells[C].innerHTML = '...<font color="#ff0000">★</font>...'
  const starsByFloor = new Map<number, { row: number; col: number }[]>();
  const starRegex = /getElementById\(id\)\.rows\[(\d+)\]\.cells\[(\d+)\]/g;
  const fnRegex = /function change_backcolor(\d+)\(\)\s*\{([\s\S]*?)\n\s*\}/g;

  for (const fnMatch of html.matchAll(fnRegex)) {
    const floor = parseInt(fnMatch[1], 10);
    const body = fnMatch[2];
    const stars: { row: number; col: number }[] = [];
    for (const starMatch of body.matchAll(starRegex)) {
      stars.push({
        row: parseInt(starMatch[1], 10),
        col: parseInt(starMatch[2], 10),
      });
    }
    if (stars.length > 0) {
      starsByFloor.set(floor, stars);
    }
  }

  // Extract floor image URLs and grid dimensions
  // Pattern: background-image:url('../servlet/showImage?lcskbn=X&florno=N')
  // Grid: table with id="floorN" has fixed 40 cols × 23 rows (640×368 image)
  const imageRegex = /id="file(\d+)"[^>]*background-image:url\('([^']+)'\)/g;
  const $ = cheerio.load(html);
  for (const imgMatch of html.matchAll(imageRegex)) {
    const floor = parseInt(imgMatch[1], 10);
    const relativeUrl = imgMatch[2];
    const imageUrl = relativeUrl.replace(/^\.\.\//, "https://www.lib-itoshima.jp/WebOpac/");

    // Count grid dimensions from the table
    const $table = $(`#floor${floor}`);
    const gridRows = $table.find("tr").length;
    const gridCols = $table.find("tr").first().find("td").length;

    floors.push({
      floor,
      imageUrl,
      gridCols,
      gridRows,
      stars: starsByFloor.get(floor) ?? [],
    });
  }

  return { floors };
}
