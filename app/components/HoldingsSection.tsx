import { Fragment, useState } from "react";
import type { Holding } from "~/lib/parser.server";
import { FloorMap } from "./FloorMap";

export function HoldingsSection({ holdings, bookId }: { holdings: Holding[]; bookId: string }) {
  const [openMap, setOpenMap] = useState<string | null>(null);

  return (
    <section className="detail-section">
      <h3>所蔵情報</h3>
      <table className="holdings-table">
        <thead>
          <tr>
            <th>館</th>
            <th>種別</th>
            <th>場所</th>
            <th>状態</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const key = `${h.library}-${h.materialNo}`;
            const isOpen = openMap === key;
            return (
              <Fragment key={key}>
                <tr>
                  <td>{h.library}</td>
                  <td>{h.type}</td>
                  <td>{h.location}</td>
                  <td
                    className={
                      h.status.includes("貸出できます")
                        ? "status-available"
                        : "status-lent"
                    }
                  >
                    {h.status}
                  </td>
                  <td>
                    {h.floorMapParams && (
                      <button
                        type="button"
                        className="floor-map-toggle"
                        onClick={() => setOpenMap(isOpen ? null : key)}
                        aria-expanded={isOpen}
                      >
                        地図
                      </button>
                    )}
                  </td>
                </tr>
                {isOpen && h.floorMapParams && (
                  <tr>
                    <td colSpan={5} className="floor-map-cell">
                      <FloorMap
                        biblioid={bookId}
                        lcdcd={h.floorMapParams.lcdcd}
                        doclno={h.floorMapParams.doclno}
                        displcs={h.floorMapParams.displcs}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
