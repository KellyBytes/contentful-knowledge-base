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

  Report body is written in Japanese.
-->

# 検証レポート: <slug>

- 対象ファイル: `content/knowledge-base/<category>/<slug>.md`
- 検証日: YYYY-MM-DD
- カテゴリ: <category> → 層1の方法: <jsdom + react-dom/client + act() / plain Node / 対象外(理由)>

---

## Step 0: 棚卸し

<!-- 実行する前に、記事から拾った候補を全部ここに並べる。
     予測が明示されていない(コメントも隣接文も無い)コード片は
     「判定不能」とラベルする。推測で埋めない。 -->

**検証可能なコード片(N件)**

1. <行番号>: <コードが何をするか> → <記事が主張する出力と、それがどこに書かれているか>
2. ...

**バージョン差分の主張(N件)**

- <versionScope または「Version and environment notes」からの引用> → 比較に必要なバージョン: <N>

**Sourcesのリンク(N件)**

1. <URL>
2. ...

**gotchas(N件)**

1. `<gotcha-slug>`
2. ...

**判定不能とラベルした箇所(N件)**

- <該当箇所と、なぜ判定できないか>

---

## Step 1: 実行(層1)

<!-- 1件につき: 記事からの引用 → 実行したスクリプト → 実測 → 環境。判定は書かない。 -->

### <主張の見出し>

- 主張: 「<記事からの引用>」
- 実行スクリプト: `verify/<name>.mjs` — <何をするか1行で。コミットしない>
- 実測: <実際の出力>
- 環境: <React x.y.z / Node vXX>

### <バージョン差分がある場合>

<!-- current と legacy の両方で実行する。片方だけでは差分を実証できない。
     イベントハンドラ内だけを叩くコードは、どのバージョンでも同じ結果になり
     何も証明しない。主張が名指ししている場所(timeout / promise /
     native listener)を叩くこと。 -->

- 主張: 「<引用>」
- 実行スクリプト: `verify/<name>.mjs`
- 実測(current, React <N>): <出力>
- 実測(legacy, React <N>): <出力>

**Known pitfalls再チェック**: <発生した場合、最初の方法・出た結果・別方法で撮り直した結果。発生しなければ「該当なし」>

---

## Step 2: バージョン主張 vs 一次資料(層2)

<!-- コードで実証できない主張(なぜ変わったか、等)が対象。
     一次資料の該当箇所を短く引用し、記事の主張の真下に置く。 -->

**主張**: 「<記事からの引用>」

**一次資料**(<URL>):

> <該当箇所の短い引用>

---

## Step 3: Sources監査(層3)

<!-- fetch失敗・リンク切れ・内容が主張と噛み合わないものは、
     スキップせずそのまま所見として書く。 -->

| リンク | fetch結果                   | 該当箇所の引用      |
| ------ | --------------------------- | ------------------- |
| <URL>  | 成功 / 失敗(理由) / 未fetch | <引用、または「—」> |

---

## Step 4: gotcha fix検証(層4)

### <gotcha-slug>

<!-- beforeコードが記事からの抜粋か、symptom+causeから新規に書いたものかを
     必ず明記する。新規に書いた場合は全文を見せる — Kellyは結果だけでなく
     「再現として妥当か」も見る必要がある。 -->

- beforeコードの出所: <記事の行番号からそのまま / symptom+causeから新規に作成>

```jsx
<新規に書いた場合はここに全文>
```

- 実測(symptom再現): <実際に起きたこと>
- 実測(fix適用後): <実際に起きたこと>

---

## まとめ(数値のみ、判定なし)

- 棚卸し: コード片\_\_件、バージョン差分\_\_件、Sources\_\_件、gotcha\_\_件、判定不能\_\_件
- 層1: \_\_件実行、うち2バージョン実行\_\_件(legacy React \_\_)、Known pitfalls再チェック\_\_回、スクリプト\_\_件
- 層2: 一次資料\_\_件fetch、要フラグ\_\_件
- 層3: \_\_件中\_\_件fetch
- 層4: gotcha\_\_件中\_\_件検証、新規に書いたbeforeコード\_\_件
