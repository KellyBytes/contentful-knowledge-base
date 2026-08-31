Proposals

#: 1
slug: state-as-a-snapshot
One line: setCount の直後に count を読むと古いのはなぜか。1回のレンダーで state
は固定
difficulty: Beginner
Overlap risk: Low
prerequisites: —
────────────────────────────────────────
#: 2
slug: the-key-prop
One line: リストの key に index を使うと何が壊れるか。key は順番ではなく同一性
difficulty: Beginner
Overlap risk: Low
prerequisites: —
────────────────────────────────────────
#: 3
slug: rules-of-hooks
One line: なぜ hook を if の中で呼べないのか。呼び出し順が state の住所である
difficulty: Beginner
Overlap risk: Low
prerequisites: —
────────────────────────────────────────
#: 4
slug: controlled-and-uncontrolled-inputs
One line: value を渡したら input に文字が打てなくなった。どちらが値を持つのか
difficulty: Beginner
Overlap risk: Low
prerequisites: state-as-a-snapshot
────────────────────────────────────────
#: 5
slug: re-render-triggers
One line: このコンポーネントはなぜ再レンダリングされたのか。親・state・context
の3経路
difficulty: Intermediate
Overlap risk: Medium
prerequisites: state-as-a-snapshot, primitive-vs-reference-types
────────────────────────────────────────
#: 6
slug: the-dependency-array
One line: 依存配列に何を入れるのか。無限ループと、毎回変わる object / function
difficulty: Intermediate
Overlap risk: Medium
prerequisites: useeffect-cleanup, closures-explained
────────────────────────────────────────
#: 7
slug: usememo-and-usecallback
One line: メモ化して速くなる条件と、ならない条件。React 19 Compiler 以後の判断
difficulty: Intermediate
Overlap risk: Medium
prerequisites: re-render-triggers
────────────────────────────────────────
#: 8
slug: useref-and-escape-hatches
One line: 再レンダリングさせずに値を持ちたい。ref と state の使い分けと DOM
への出口
difficulty: Intermediate
Overlap risk: Low
prerequisites: state-as-a-snapshot
────────────────────────────────────────
#: 9
slug: context-and-re-renders
One line: Context を入れたら関係ないコンポーネントまで再レンダリングし始めた
difficulty: Intermediate
Overlap risk: Medium
prerequisites: re-render-triggers, usememo-and-usecallback
────────────────────────────────────────
#: 10
slug: error-boundaries
One line: 例外1つで画面が真っ白になる。何が捕まって、何が捕まらないのか
difficulty: Intermediate
Overlap risk: Low
prerequisites: promises-and-async-await

1. React カテゴリの土台です。useeffect-cleanup の interview answer は「state は再レンダーごとに固定される」を暗黙の前提にしていますが、それを説明する記事がどこにもありません。読後に、batching と updater form を「回避策」ではなく当然の帰結として使えます。

2. ルート CLAUDE.md が既知の罠として「React keys control identity」を挙げているのに、KB に一行もありません。読後に、index key でチェックボックスの状態がずれる現象を再現前に予測でき、逆に key を変えて意図的に state をリセットできます。

3. 「なぜ条件分岐の中で呼べないのか」を規則としてではなく、hook が呼び出し順で識別されているという実装事実から説明します。読後に Rendered fewer hooks than expected を読んで原因行を特定できます。#1 と並んで、独立して書ける数少ない一本です。

4. You provided a value prop to a form field without an onChange handler という逐語のエラーメッセージが取れる、gotcha 向きの題材です。読後に、フォームの値を state に置くべきか DOM に任せるべきかを、規模ではなく「何を検証したいか」で決められます。

5. 「props が変わっていないのに再レンダリングされる」は React で最も誤解される挙動です。読後に、DevTools の Profiler を開く前に3経路のどれかを言い当てられます。React の bailout が Object.is を使う点は JavaScript 側の提案 #2 に預けてリンクします。

6. ルート CLAUDE.md の既知の罠「Effect dependency arrays capture inputs, not outputs」が本体です。stale closure 自体は javascript/closures-explained の所有物なので触りません — この記事が引き取るのは「配列に何を書くか」と、object / function を依存に入れると毎回変わる問題の側だけです。

7. useMemo / useCallback / React.memo の3つは、単体では判断できず必ず組で出てきます。読後に、メモ化が効くのは参照が安定したときだけで、React.memo を挟まない useCallback はほぼ無意味だと説明できます。React 19 の Compiler で何が不要になるかも同じ枠で扱えます。

8. useeffect-cleanup の interview answer が「ref に書いただけならクリーンアップは要らない」と述べており、ref の理解を前提にしています。読後に、timer id を state に入れて無限ループを作る典型を避けられ、React 19 で forwardRef が不要になった点も押さえられます。

9. 「Context = 状態管理ライブラリの代わり」という誤解が最も高くつく場面です。読後に、value を useMemo で包む理由と、それでも解決しないので Context を分割する判断ができます。React カテゴリで未使用の state-management タグの最初の借り手になります。

10. React で未使用の error-handling タグの借り手です。読後に、event handler と非同期処理の例外は error boundary で捕まらないという分岐を説明できます — その「捕まらない理由」は promises-and-async-await の ## Error handling が既に持っているので、そこへ寄りかかる形で書けます。

---

Considered and rejected

既存記事が所有しているもの

候補: cleanup 関数がいつ走るか
所有者: react/useeffect-cleanup
どこに入れるべきか: ## Cleanup runs more often than you think + interview question
3TBIQB2LZrWr7G578HfqLZ。
────────────────────────────────────────
候補: StrictMode の二重実行
所有者: react/useeffect-cleanup
どこに入れるべきか: ## The trap: StrictMode double-runs your effect + gotcha
strictmode-double-invokes-effects。
────────────────────────────────────────
候補: effect 内の race condition / ignore フラグ
所有者: react/useeffect-cleanup
どこに入れるべきか: ## Where it shows up: the race you cannot reproduce locally +
gotcha stale-response-overwrites-newer-state。
────────────────────────────────────────
候補: useEffect(async () => {})
所有者: react/useeffect-cleanup
どこに入れるべきか: gotcha
async-effect-returns-promise-not-cleanup（逐語エラーメッセージ付き）。
────────────────────────────────────────
候補: AbortController でのキャンセル
所有者: react/useeffect-cleanup + promises-and-async-await
どこに入れるべきか: 上記 gotcha の fix と、promises の interview question
4y4gxD4BzDVgiUx6KQi7S7。
────────────────────────────────────────
候補: Stale closure in an effect
所有者: javascript/closures-explained
どこに入れるべきか: topic-ownership.md に明記。react/useeffect-cleanup は参照側。#6
も参照側に留める。
────────────────────────────────────────
候補: React における closure
所有者: javascript/closures-explained
どこに入れるべきか: ## Where closures show up in React。
────────────────────────────────────────
候補: state を直接書き換えると再レンダリングしない
所有者: javascript/primitive-vs-reference-types と
javascript/array-methods-and-immutable-updates（共有 gotcha
state-mutation-no-rerender）
どこに入れるべきか: ## Why React developers hit this constantly と ## Why React
insists on this。
────────────────────────────────────────
候補: immutable な更新パターン / spread / toSorted
所有者: javascript/array-methods-and-immutable-updates
どこに入れるべきか: ## The four update patterns。
────────────────────────────────────────
候補: ネストした state の更新 / Immer
所有者: javascript/array-methods-and-immutable-updates
どこに入れるべきか: interview question 3JehHvXUeBRiPAPxEevqC6。
────────────────────────────────────────
候補: class component と handler の this
所有者: javascript/this-and-binding-rules
どこに入れるべきか: ## Class fields are the modern fix。#10 が class component
に触れる際はここへリンクする。
────────────────────────────────────────
候補: listener / timer によるメモリリーク
所有者: javascript/closures-explained
どこに入れるべきか: ## The cost + 共有 gotcha
closure-retains-memory（react/useeffect-cleanup も同じ id を持つ）。

JavaScript 側の提案（\_ideas/20260831_javascript.md）が確保済み

この3件は同日の JavaScript 実行が territory を取ったために落ちました。React 単独で見れば提案していた候補です。

- debounce-and-throttle の React 版 — JavaScript 提案 #10 と症状（検索ボックスが毎キーでリクエストする）が同一で、closure と event loop に依存する点も同じです。React 固有の残りは「cleanup で timer を捨てる」だけなので、#6 の1セクションに収めます。
- conditional-rendering-pitfalls — 中核の {count && <JSX/>} が 0 を描画する件は、JavaScript 提案 #1 truthiness-and-falsy-values が falsy 値の一例として持つべきです。React 固有部分（undefined は描画されない、Fragment の扱い）だけでは1,000語に届きません。
- object-is-and-bailout — React が state 更新をスキップする判定は Object.is そのもので、JavaScript 提案 #2 loose-vs-strict-equality の範囲です。#5 が1段落で参照します。

長さで落としたもの（~1,000語未満＝既存記事の1セクション）

- usestate-lazy-initializer — useState(() => expensive()) の一点のみ。#1 の1セクション。
- forwardref-removal-in-react-19 — 移行手順だけで論点がありません。#8 の1セクション。
- useeffect-vs-uselayouteffect — 「paint の前か後か」で終わり、約900語。#6 の1セクション。
- fragments-and-keys — key は #2 が持ち、Fragment 単体では300語程度。
- useid-and-usedebugvalue — API 単位では記事になりません。#3 と #8 に分散。
- props-immutability — 「props を書き換えるな」の理由は共有 gotcha state-mutation-no-rerender と primitive-vs-reference-types が既に持っており、残りは片方向データフローの一段落だけです。#1 の導入に置きます。

長さで落としたもの（~2,200語超＝分割を提案）

- rendering-performance — 「なぜ再レンダリングされるか」と「メモ化でどう止めるか」を1本にすると確実に超過します。#5 と #7 に分割して提案しました。依存の向きは #5 → #7 です。
- state-management — useState / useReducer / Context / 外部ストアは1本に収まりません。今回は Context の再レンダリング問題（#9）だけを切り出し、usereducer-and-state-shape は次回に回します。

カテゴリ違いで落としたもの

- Server Components / 'use client' / streaming — Next.js。React 単体では境界が存在しません。
- Server Actions / useActionState / useFormStatus — Next.js。送信先が framework 依存です。
- Hydration mismatch — Next.js。SSR した HTML がなければ再現しません。
- Suspense によるデータ取得 — Next.js。React 単体では data source を持てず、例が作れません。
- React.lazy / code splitting — Next.js。bundler 依存。
- dangerouslySetInnerHTML と XSS — API は React ですが、本体は sanitize と CSP なので Web Fundamentals。未使用の security タグの借り手はそちらです。
- JSX のアクセシビリティ / semantic HTML — Web Fundamentals。
- CSS-in-JS / スタイリング — CSS & Styling。

今回は見送り（実在するトピックだが順番待ち）

- derived-state — 「props から計算できる値を state に置くと古くなる」は良いトピックですが、標準的な解決策の一つが key によるリマウント（#2）で、もう一つが再レンダリングの理解（#5）です。その2本が存在するまで境界が引けません。 次回に回します。
- usereducer-and-state-shape — 上記 state-management の分割の残り。#1 と #5 の後。
- usetransition-and-usedeferredvalue — #5 と #7 が前提。React カテゴリで最初の Advanced 候補になります（content-model.json:191-203 で Advanced は有効な値です）。
- custom-hooks — #3 が hook の呼び出し順を持った後でなければ、「なぜ切り出しても壊れないのか」が書けません。

その他

- react-19-changes — 「X の完全ガイド」型なので提案しません。個別の変更点（Compiler → #7、forwardRef → #8、onUncaughtError → #10、ref callback の cleanup → #8）を各記事の ## Version and environment notes に散らします。

---

Sequencing

order は article では Integer / 任意 / unique 制約なし（content-model.json:213-218）、lib/kb/sort.js は order → difficulty → title の順です。

執筆順（依存関係の順）

1. #1 state-as-a-snapshot — 前提なし。#4 #5 #8 の3本がここに寄りかかるので必ず最初。
2. #2 the-key-prop — 前提なし。独立して書けます。
3. #3 rules-of-hooks — 前提なし。ここまでの3本はどの順でも構いませんが、3本揃うまで Intermediate に進まないのが Beginner ゼロ状態の解消として重要です。
4. #4 controlled-and-uncontrolled-inputs — #1 が必要（「入力するたびに再レンダリングしている」が土台）。
5. #5 re-render-triggers — #1 が必要。以降の #7 #9 の共通前提。
6. #6 the-dependency-array — useeffect-cleanup と closures-explained が前提。#5 の後だと「依存が変わる＝effect が再実行される」を再説明せずに済みます。
7. #7 usememo-and-usecallback — #5 の後でなければ書けません（何を止めているのかが #5 の内容）。#6 の「毎回変わる object」も受けます。
8. #8 useref-and-escape-hatches — #1 が必要。#5〜#7 とは独立なので、順番を前に繰り上げても構いません。
9. #9 context-and-re-renders — #5 と #7 の両方が前提。value のメモ化が結論の半分を占めるため。
10. #10 error-boundaries — promises-and-async-await が前提。React 側の依存がないので、いつ書いても成立します。

order 値 — 判断が1つ要ります。

React には useeffect-cleanup が order: 10 で1本だけあり、その手前に Beginner を4本入れる必要があります。推奨は useeffect-cleanup を order: 60 に振り直すことです。1行の変更＋1回の push で済み、カテゴリに1本しかない今が最も安いタイミングです（JavaScript 側で7本の振り直しを見送ったのと同じ理由が、ここでは逆に働きます）。

| order | slug                               | difficulty   |
| ----- | ---------------------------------- | ------------ | ------------- |
| 10    | state-as-a-snapshot                | Beginner     |
| 20    | the-key-prop                       | Beginner     |
| 30    | rules-of-hooks                     | Beginner     |
| 40    | controlled-and-uncontrolled-inputs | Beginner     |
| 50    | re-render-triggers                 | Intermediate |
| 60    | useeffect-cleanup                  | Intermediate | ← 10 から変更 |
| 70    | the-dependency-array               | Intermediate |
| 80    | usememo-and-usecallback            | Intermediate |
| 90    | useref-and-escape-hatches          | Intermediate |
| 100   | context-and-re-renders             | Intermediate |
| 110   | error-boundaries                   | Intermediate |

既存記事に一切触れない代案も成立します — Beginner を 1 / 2 / 3 / 4、re-render-triggers を 5、useeffect-cleanup は 10 のまま、以降を 20〜60。並び順は同じになりますが、以後 Beginner を足す余地が 1 未満に無く、負数か再度の振り直しになります。

タグについて2点。 useeffect-cleanup は rendering / async / performance を持ちますが、interview-frequent を持っていません — JavaScript 側は7本すべてが持っており、React だけ外れている状態です。意図的でなければ揃えるべきですが、既存記事の変更なので今回は指摘に留めます。もう1点、state-management は React カテゴリで未使用で、上の提案では #9 だけが借り手になります。

ファイルは何も書いていません。
