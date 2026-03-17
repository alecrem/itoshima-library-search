import { useEffect, useState } from "react";
import type { FloorMapData } from "~/lib/floormap-parser.server";

const floorMapCache = new Map<string, FloorMapData>();

type FloorMapProps = {
  biblioid: string;
  lcdcd: string;
  doclno: string;
  displcs: string;
};

export function FloorMap({ biblioid, lcdcd, doclno, displcs }: FloorMapProps) {
  const cacheKey = `${biblioid}:${lcdcd}:${doclno}`;
  const [data, setData] = useState<FloorMapData | null>(
    () => floorMapCache.get(cacheKey) ?? null
  );
  const [loading, setLoading] = useState(!floorMapCache.has(cacheKey));

  useEffect(() => {
    const cached = floorMapCache.get(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ biblioid, lcdcd, doclno, displcs });
    fetch(`/api/floormap?${params}`)
      .then((r) => r.json())
      .then((d: FloorMapData) => {
        floorMapCache.set(cacheKey, d);
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [biblioid, lcdcd, doclno, displcs, cacheKey]);

  if (loading) {
    return <div className="floor-map-loading"><span className="spinner" /> 地図を読み込み中…</div>;
  }

  if (!data || data.floors.length === 0) {
    return null;
  }

  return (
    <div className="floor-map">
      {data.floors.map((floor) => (
        <div key={floor.floor} className="floor-map-floor">
          <div className="floor-map-container">
            <img
              src={floor.imageUrl}
              alt={`${displcs} ${floor.floor}階 配置図`}
              className="floor-map-image"
            />
            <div
              className="floor-map-grid"
              style={{
                gridTemplateColumns: `repeat(${floor.gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${floor.gridRows}, 1fr)`,
              }}
            >
              {floor.stars.map((star) => (
                <div
                  key={`${star.row}-${star.col}`}
                  className="floor-map-star"
                  style={{
                    gridColumn: star.col + 1,
                    gridRow: star.row + 1,
                  }}
                >
                  ★
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
