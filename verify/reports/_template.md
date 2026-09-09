<!--
  This file is to /verify-article what content/_reference/article-template.md
  is to /new-article: the authoritative shape of the output. Copy it to
  verify/reports/<slug>-verify.md and fill it in. Guidance lives in comments
  only — comments are stripped when the report is written.

  Rules:
  - No verdicts. Not "correct", not "confirmed", not "矛盾", not ✅/❌.
    Put the claim and the evidence side by side; Kelly judges.
  - Layer 1 code is lifted verbatim from the article. Never retyped.
  - Layer 4 snippets are the exception — before-snippets are newly written from
    symptom+cause, and after-snippets are frequently assembled too. Show both in
    full and label where every line came from.
  - Re-verifying a slug appends a new dated section at the bottom.
    Never overwrite an earlier run, and never grade one.

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

<!-- 再実行の場合はここに:
     - 前回からの記事側の変更(コミットハッシュと、それが何を変えたか)
     - 前回からのskill側の変更
     - その結果、今回新しく測る項目はどれか
     前回セクションの所見に触れる場合は「今回の照合ではこうだった」と
     今回の測定として書く。前回が間違っていた/解消した、とは書かない。 -->

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

**frontmatterのフィールド内にあった検証可能な主張(N件)**

<!-- gotcha の fix / cause、interviewQuestion の答えなどに、コード片を伴わずに
     書かれている検証可能な主張。「この書き方では効かない」「この形なら解決する」等。
     fenced block が無いので見落としやすい。層1に持っていく。 -->

- <行番号>(`<フィールド名>`): 「<引用>」

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

### <否定形の主張がある場合>

<!-- 「この書き方では効かない」「値は変わらない」等。
     差が出ないという結果は、測定系が壊れていても同じ形で出る。
     必ず同じスクリプト内に対照(差が出るはずのケース)を置き、
     その行も併記する。対照が期待通り差を示していることが、
     本題の「差が出ない」を読める結果にする。 -->

- 主張(<行番号>): 「<引用>」
- 実行スクリプト: `verify/<name>.mjs` — <記事からの抜粋か新規作成かを明記>
- 本題と対照の全文:

```jsx
<両方の全文>
```

- 実測:

```
[本題]  <出力>
[対照]  <出力>
```

- 対照の位置づけ: <対照が何を示せば測定系が機能していると言えるのか、1行で>
- 環境: <React x.y.z / Node vXX>

### <バージョン差分がある場合>

<!-- current と legacy の両方で実行する。片方だけでは差分を実証できない。
     イベントハンドラ内だけを叩くコードは、どのバージョンでも同じ結果になり
     何も証明しない。主張が名指ししている場所を「全部」叩くこと
     (timeout / promise / native listener を1つで代表させない)。
     対照としてハンドラ内版も併せて測ると、測定自体が機能していることの
     裏づけになる。

     結果は表にしない — レンダー記録のような生の出力にはパイプが入りやすく、
     表に置くと再フォーマットで壊れる。バージョンごとの見出し+fencedブロックにする。 -->

- 主張(<行番号>): 「<引用>」
- 主張が名指ししている場所: <列挙し、そのうちどれを測ったかを書く。全部測る>
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

**Known pitfalls再チェック**: <発生した場合、最初の方法・出た結果・別方法で撮り直した結果。発生しなければ「該当なし」と、避けた罠を1行ずつ>

---

## Step 2: バージョン主張 vs 一次資料(層2)

<!-- コードで実証できない主張(なぜ変わったか、等)が対象。
     一次資料の該当箇所を短く引用し、記事の主張の真下に置く。

     「変わっていない」という主張を、リリースノートに記載が無いことで
     支えている場合は、それが消極的証拠であることを明示する。
     そのページが何を列挙しているかを書き、主張の対象がその中に無いことを書き、
     「記載が無いことの提示であって、それ以上のものではない」と言い切る。
     層1で同じバージョンを実測できるなら、その実測を併記する。 -->

### <行番号> — <主張の要約>

**主張**: 「<記事からの引用>」

**一次資料**(<URL>):

> <該当箇所の短い引用>

<!-- 消極的証拠の場合はここに: そのページが列挙しているもの / 対象が含まれないこと /
     これは記載が無いことの提示にすぎない、という限定 / 対応する層1の実測への参照 -->

---

## Step 3: Sources監査(層3)

<!-- Sourcesはフラットな参考文献リストであって、1URL=1主張の脚注ではない。
     位置が近いという理由だけで対応づけない。

     手順:
     1. 全URLを先にfetchする(下の表)。
     2. Step 0で挙げた概念レベルの主張ごとに、fetch済みの全sourceを対象に
        支持する記述がないか探す。
     3. 主張ごとに「全面カバー / 一部カバー / 該当なし」のいずれかを1つ選ぶ。
        - 全面カバー: どれかのsourceが主張を述べている、または主張を含意する
          一般的な原則を述べている。逐語一致は不要。
        - 一部カバー: sourceは主張の一部を支持するが、記事はそれを超えたことを
          述べている。記事が正しいかどうかは論点ではない。引用が主張の全体を
          運びきっていない、という事実を可視化するための分類。
        - 該当なし: 全sourceを確認して、どれにも見当たらない。
        「この言い方自体はどのsourceにも無いが」と書き始めたら、それは
        一部カバー。全面カバーに畳み込まない。
        ただし単なる言い換え(記事の`const`とsourceの「呼び出しごとに新しく
        作られ再代入されない変数」など)は全面カバー。どちらなのかを1行で書く。
     4. fetch失敗・リンク切れは、対応する主張の有無と関係なくそのまま
        「リンク単体の所見」に書く。 -->

**fetch結果**

| リンク | fetch結果                   |
| ------ | --------------------------- |
| <URL>  | 成功 / 失敗(理由) / 未fetch |

<!-- 以降 S1 / S2 / ... の略号を使う場合はここで定義する -->

### 概念レベルの主張ごとの照合(N件)

**<主張の見出し>(<行番号>)**

- 主張: 「<記事からの引用>」
- 確認したsource: 全<N>件(fetch済みのSources全体)
- 分類: **全面カバー / 一部カバー / 該当なし**
- 該当した記述:
  - <URL>: 「<引用>」 — <逐語一致か、一般的な記述が具体ケースを包含しているか、1行で>
  <!-- 複数のsourceが分担してカバーしている場合は全部列挙する。1本にまとめる必要はない -->
- <一部カバーの場合> sourceが述べているのはどこまでで、記事がそこから何を足しているか:
  <!-- 例: 「4本が直接支持しているのは『更新ごとに1レンダーになる』までで、
       そこから中間状態を言うのは記事側の一歩」 -->

<!-- 主張ごとにこの見出しを繰り返す -->

### 一部カバーとした主張の一覧(N件)

<!-- 上の照合から一部カバーのものだけを行番号つきで再掲する。
     12件を通読しなくてもここだけで拾えるようにするための欄。
     Kellyが記事を直すか判断する対象は主にここ。無ければ「なし」。 -->

- <行番号>: <主張の要約> — <sourceが届いていない部分>

### リンク単体の所見(fetch失敗・内容不一致等、N件)

<!-- 特定の主張の有無とは別に、リンク自体が死んでいる/
     内容が変わっている等の所見はここに書く。無ければ「なし」。 -->

- <所見>

---

## Step 4: gotcha fix検証(層4)

<!-- beforeコードが記事からの抜粋か、symptom+causeから新規に書いたものかを
     必ず明記する。新規に書いた場合は全文を見せる — Kellyは結果だけでなく
     「再現として妥当か」も見る必要がある。

     afterコードも同じ扱い。1つの verbatim なスライスでない限り
     (継ぎ合わせ、prose の fix からの新規作成)、全文を見せて
     どの行がどこから来たかを書く。これまでに見つかった記事の誤りは
     コードブロックではなく fix の中にあった。

     fix が複数の選択肢を挙げている場合、「全部」を個別に適用して
     それぞれ報告する。3つの箇条書きは3回の after 実行になる。
     適用できない選択肢があれば、黙って落とさずその旨を書く。 -->

### <gotcha-slug>

- symptom: 「<frontmatterからの引用>」
- fix: 「<frontmatterからの引用>」
- fixの選択肢: <N>個(それぞれ個別に適用する)
- beforeコードの出所: <記事の行番号からそのまま / symptom+causeから新規に作成>

```jsx
<記事からの単一スライスでない場合はここに全文>
```

- 実測(symptom再現): <実際に起きたこと>

**fixの選択肢1(<箇条書きの内容>)を適用した版**

- 出所: <記事の行番号からそのまま / 記事の複数スライスの継ぎ合わせ(どの行とどの行か)/ prose の fix から新規に作成>

```jsx
<単一スライスでない場合はここに全文>
```

- 実測: <実際に起きたこと>

**fixの選択肢2(<箇条書きの内容>)を適用した版**

<!-- 選択肢の数だけ繰り返す。適用できないものがあれば理由を書く -->

---

## まとめ(数値のみ、判定なし)

- 棚卸し: コード片**件、frontmatter内の主張**件、バージョン差分**件、概念レベルの主張**件、Sources**件、gotcha**件、判定不能\_\_件
- 層1: **件実行、うち複数バージョンで実行**件(使ったバージョン: **)、否定形の主張**件(うち対照を置いた**件)、Known pitfalls再チェック**回、スクリプト\_\_件
- 層2: 一次資料**件fetch、消極的証拠(記載が無いことを根拠)**件、要フラグ\_\_件
- 層3: Sources**件中**件fetch、概念レベルの主張**件を全source照合、全面カバー**件 / 一部カバー**件 / 該当なし**件、リンク単体の所見\_\_件
- 層4: gotcha**件中**件検証、fixの選択肢**件中**件を個別適用、新規に書いたbeforeコード**件、新規に書いた/継ぎ合わせたafterコード**件
