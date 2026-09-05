<!--
  This file is to /verify-article what content/_reference/article-template.md
  is to /new-article: the authoritative shape of the output. Copy it to
  verify/reports/<slug>-verify.md and fill it in. Guidance lives in comments
  only — comments are stripped when the report is written.

  Rules:
  - No verdicts. Not "correct", not "confirmed", not "矛盾", not ✅/❌.
    Put the claim and the evidence side by side; Kelly judges.
  - Layer 1 code is lifted verbatim from the article. Never retyped.
  - Layer 4 "before" snippets are the one exception — they are newly written,
    so show them in full and label them as such.
  - Re-verifying a slug appends a new dated section at the bottom.
    Never overwrite an earlier run.

  Formatting — measured values must survive a reformat:
  - Never put a pipe character in a table cell, not even inside a code span.
    A Markdown formatter re-reads it as a column separator and collapses the
    row. This has already destroyed one report's main result table.
    A measured value containing pipes goes in a fenced block or a list below
    the table, with the table cell pointing to it.
  - Prefer a fenced block over a table whenever the values are raw output
    rather than short labels. A table is for comparison at a glance; it is
    not a container for captured stdout.

  Report body is written in Japanese.
-->

# 検証レポート: <slug>

- 対象ファイル: `content/knowledge-base/<category>/<slug>.md`
- 検証日: YYYY-MM-DD
- カテゴリ: <category> → 層1の方法: <jsdom + react-dom/client + act() / plain Node / 対象外(理由)>

<!-- 複数バージョンを使った場合は、どのinstallがどのバージョンかをここに書く。 -->

---

## Step 0: 棚卸し

<!-- 実行する前に、記事から拾った候補を全部ここに並べる。
     予測が明示されていない(コメントも隣接文も無い)コード片は
     「判定不能」とラベルする。推測で埋めない。

     「概念レベルの主張」と「Sourcesのリンク」は別バケツとして扱う。
     どの主張がどのURLの「近く」にあるかでは対応づけない —
     層3ではこの2つを独立した集合として全件照合する。 -->

**検証可能なコード片(N件)**

1. <行番号>: <コードが何をするか> → <記事が主張する出力と、それがどこに書かれているか>
2. ...

**バージョン差分の主張(N件)**

- <行番号>: 「<versionScope または本文からの引用>」 → 比較に必要なバージョン: <N>

**概念レベルの主張(Sourcesと照合すべきもの、N件)**

<!-- 初出で太字にされた用語、gotchaのcauseに書かれた仕組み、
     「なぜそうなるか」を述べている箇所など。記事中の位置と
     Sourcesの並び順は無関係 — ここでは主張だけを独立して拾う。 -->

- <行番号>: 「<記事からの引用、または主張の要約>」

**Sourcesのリンク(N件)**

1. <URL>
2. ...

**gotchas(N件)**

1. `<gotcha-slug>`
2. ...

**判定不能とラベルした箇所(N件)**

- <行番号>: <該当箇所と、なぜ判定できないか>

---

## Step 1: 実行(層1)

<!-- 1件につき: 記事からの引用 → 実行したスクリプト → 実測 → 環境。判定は書かない。
     ラッパー(state宣言、APIスタブ等)を書いた場合は、その全文を併記する。 -->

### 1. <主張の見出し>(<行番号>)

- 主張(<行番号>): 「<記事からの引用>」
- 実行スクリプト: `verify/<name>.mjs` — <何をするか1行で。コミットしない>
- 実測: <実際の出力>
- 環境: <React x.y.z / Node vXX>

### <バージョン差分がある場合>

<!-- current と legacy の両方で実行する。片方だけでは差分を実証できない。
     イベントハンドラ内だけを叩くコードは、どのバージョンでも同じ結果になり
     何も証明しない。主張が名指ししている場所(timeout / promise /
     native listener)を叩くこと。対照としてハンドラ内版も併せて測ると、
     測定自体が機能していることの裏づけになる。

     結果は表にしない — レンダー記録のような生の出力にはパイプが入りやすく、
     表に置くと再フォーマットで壊れる。バージョンごとの見出し+fencedブロックにする。 -->

- 主張(<行番号>): 「<引用>」
- 実行スクリプト: `verify/<name>.mjs` — <記事からの抜粋か新規作成かを明記>

**React <current>**

```
<更新を置いた場所>: レンダー<N>回
<レンダーごとの記録>
```

**React <legacy>**

```
<更新を置いた場所>: レンダー<N>回
<レンダーごとの記録>
```

**Known pitfalls再チェック**: <発生した場合、最初の方法・出た結果・別方法で撮り直した結果。発生しなければ「該当なし」と、避けた罠を1行で>

---

## Step 2: バージョン主張 vs 一次資料(層2)

<!-- コードで実証できない主張(なぜ変わったか、等)が対象。
     一次資料の該当箇所を短く引用し、記事の主張の真下に置く。 -->

### <行番号> — <主張の要約>

**主張**: 「<記事からの引用>」

**一次資料**(<URL>):

> <該当箇所の短い引用>

---

## Step 3: Sources監査(層3)

<!-- Sourcesはフラットな参考文献リストであって、1URL=1主張の脚注ではない。
     位置が近いという理由だけで対応づけない。

     手順:
     1. 全URLを先にfetchする(下の表)。
     2. Step 0で挙げた概念レベルの主張ごとに、fetch済みの全sourceを対象に
        支持する記述がないか探す。記事の用語が逐語で出てこなくても、
        一般的な記述が具体ケースを包含していれば支持とみなしてよい —
        ただしその判断根拠を一言添える。
     3. 全sourceを確認した上で、どのsourceにも支持する記述が見当たらなかった
        主張だけを「該当なし」として書く。近いURL1本に無かっただけでは
        該当なしにしない。
     4. fetch失敗・リンク切れは、対応する主張の有無と関係なくそのまま
        「リンク単体の所見」に書く。 -->

**fetch結果**

| リンク | fetch結果                   |
| ------ | --------------------------- |
| <URL>  | 成功 / 失敗(理由) / 未fetch |

### 概念レベルの主張ごとの照合(N件)

**<主張の見出し>(<行番号>)**

- 主張: 「<記事からの引用>」
- 確認したsource: 全<N>件(fetch済みのSources全体)
- 該当した記述:
  - <URL>: 「<引用>」 — <逐語一致か、一般的な記述が具体ケースを包含しているかを一言で>
  <!-- 複数のsourceが分担してカバーしている場合は全部列挙する。1本にまとめる必要はない -->
- 該当なし: <全sourceを確認した上でどれにも見当たらなかった場合のみここに書く。「該当した記述」と排他>

<!-- 主張ごとにこの見出しを繰り返す -->

**リンク単体の所見(fetch失敗・内容不一致等、N件)**

<!-- 特定の主張の有無とは別に、リンク自体が死んでいる/
     内容が変わっている等の所見はここに書く。無ければ「なし」。 -->

- <所見>

---

## Step 4: gotcha fix検証(層4)

<!-- beforeコードが記事からの抜粋か、symptom+causeから新規に書いたものかを
     必ず明記する。新規に書いた場合は全文を見せる — Kellyは結果だけでなく
     「再現として妥当か」も見る必要がある。
     fixが複数の選択肢を挙げている場合、どれを適用したかを書く。 -->

### <gotcha-slug>

- symptom: 「<frontmatterからの引用>」
- fix: 「<frontmatterからの引用>」
- beforeコードの出所: <記事の行番号からそのまま / symptom+causeから新規に作成>

```jsx
<新規に書いた場合はここに全文>
```

- 実測(symptom再現): <実際に起きたこと>
- afterコードの出所: <記事の行番号からそのまま / fixの記述から新規に作成。複数選択肢がある場合はどれか>
- 実測(fix適用後): <実際に起きたこと>

---

## まとめ(数値のみ、判定なし)

- 棚卸し: コード片\_\_件、バージョン差分\_\_件、概念レベルの主張\_\_件、Sources\_\_件、gotcha\_\_件、判定不能\_\_件
- 層1: \_\_件実行、うち2バージョン以上で実行\_\_件(legacy React \_\_)、Known pitfalls再チェック\_\_回、スクリプト\_\_件
- 層2: 一次資料\_\_件fetch、要フラグ\_\_件
- 層3: Sources\_\_件中\_\_件fetch、概念レベルの主張\_\_件を全source照合、該当なし\_\_件、リンク単体の所見\_\_件
- 層4: gotcha\_\_件中\_\_件検証、新規に書いたbeforeコード\_\_件
