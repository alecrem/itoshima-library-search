import { describe, it, expect } from "vitest";
import { parseBookDetail } from "../app/lib/parser.server";

const htmlWithFloorMap = `<html><body>
<h3><strong><span class="underline">テスト書籍</span></strong></h3>
<div class="bookInfoTitle"><h5></h5></div>
<table class="bookItemInfo">
  <tr><th>著者</th><td><a href="javascript:list_author('123')">テスト著者</a></td></tr>
  <tr><th>出版者</th><td>テスト出版</td></tr>
  <tr><th>その他</th><td></td></tr>
</table>
<div class="bookState">予約数：0 貸出可能数：2 貸出件数：1</div>
<table summary="資料毎の状態表">
  <tbody>
    <tr>
      <td>1</td>
      <td>本館</td>
      <td>一般</td>
      <td>3階一般</td>
      <td>貸出できます</td>
      <td>114060916</td>
      <td><button class="formBtn putBtn" onclick="action_detailplace_subwindow(1, '10', 10282847, '本館');">表示</button></td>
    </tr>
    <tr>
      <td>2</td>
      <td>二丈館</td>
      <td>児童</td>
      <td>閉架１</td>
      <td>貸出中です</td>
      <td>120105580</td>
      <td></td>
    </tr>
  </tbody>
</table>
</body></html>`;

describe("parseBookDetail floor map params", () => {
  const detail = parseBookDetail(htmlWithFloorMap);

  it("extracts floorMapParams when button present", () => {
    expect(detail.holdings[0].floorMapParams).toEqual({
      lcdcd: "10",
      doclno: "10282847",
      displcs: "本館",
    });
  });

  it("omits floorMapParams when no button", () => {
    expect(detail.holdings[1].floorMapParams).toBeUndefined();
  });

  it("parses both holdings", () => {
    expect(detail.holdings).toHaveLength(2);
    expect(detail.holdings[0].library).toBe("本館");
    expect(detail.holdings[1].library).toBe("二丈館");
  });
});
