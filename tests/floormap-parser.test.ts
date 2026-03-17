import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseFloorMap } from "../app/lib/floormap-parser.server";

const fixture = readFileSync(
  join(__dirname, "fixtures/floormap.html"),
  "utf-8"
);

describe("parseFloorMap", () => {
  const data = parseFloorMap(fixture);

  it("extracts a single floor", () => {
    expect(data.floors).toHaveLength(1);
    expect(data.floors[0].floor).toBe(3);
  });

  it("extracts the image URL", () => {
    expect(data.floors[0].imageUrl).toBe(
      "https://www.lib-itoshima.jp/WebOpac/servlet/showImage?lcskbn=10&florno=3"
    );
  });

  it("extracts grid dimensions", () => {
    expect(data.floors[0].gridCols).toBe(40);
    expect(data.floors[0].gridRows).toBe(23);
  });

  it("extracts star positions", () => {
    expect(data.floors[0].stars).toEqual([
      { row: 13, col: 5 },
      { row: 13, col: 6 },
      { row: 13, col: 7 },
    ]);
  });

  it("returns empty floors for HTML with no floor map", () => {
    const empty = parseFloorMap("<html><body></body></html>");
    expect(empty.floors).toHaveLength(0);
  });

  it("returns floor with empty stars when function has no rows/cells", () => {
    const html = `
      <script>
      function change_backcolor2() {
        var id = "floor" + 2;
      }
      </script>
      <td id="file2" style="background-image:url('../servlet/showImage?lcskbn=10&florno=2')">
        <table id="floor2">
          <tr><td /><td /><td /></tr>
          <tr><td /><td /><td /></tr>
        </table>
      </td>`;
    const result = parseFloorMap(html);
    expect(result.floors).toHaveLength(1);
    expect(result.floors[0].floor).toBe(2);
    expect(result.floors[0].stars).toEqual([]);
  });

  it("extracts multiple floors", () => {
    const html = `
      <script>
      function change_backcolor1() {
        var id = "floor" + 1;
            this.document.getElementById(id).rows[2].cells[3].innerHTML ='<span><font color="#ff0000">★</font></span>';
              }
      function change_backcolor2() {
        var id = "floor" + 2;
            this.document.getElementById(id).rows[5].cells[10].innerHTML ='<span><font color="#ff0000">★</font></span>';
            this.document.getElementById(id).rows[5].cells[11].innerHTML ='<span><font color="#ff0000">★</font></span>';
              }
      </script>
      <td id="file1" style="background-image:url('../servlet/showImage?lcskbn=30&florno=1')">
        <table id="floor1">
          <tr><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /></tr>
        </table>
      </td>
      <td id="file2" style="background-image:url('../servlet/showImage?lcskbn=30&florno=2')">
        <table id="floor2">
          <tr><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
          <tr><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
        </table>
      </td>`;
    const result = parseFloorMap(html);
    expect(result.floors).toHaveLength(2);

    expect(result.floors[0].floor).toBe(1);
    expect(result.floors[0].gridCols).toBe(5);
    expect(result.floors[0].gridRows).toBe(3);
    expect(result.floors[0].stars).toEqual([{ row: 2, col: 3 }]);

    expect(result.floors[1].floor).toBe(2);
    expect(result.floors[1].gridCols).toBe(15);
    expect(result.floors[1].gridRows).toBe(6);
    expect(result.floors[1].stars).toEqual([
      { row: 5, col: 10 },
      { row: 5, col: 11 },
    ]);
  });
});
