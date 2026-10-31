# app/styles — スタイルの地図

`app/globals.css` はこのフォルダのファイルを順に読み込むだけです。後ろに書いたファイルほど優先されます。
ルールの見本は `/dev/design-guideline`（ver0.31）にあります。

| ファイル | 中身 | こんなときに直す |
|---|---|---|
| `tokens.css` | 色・文字・角丸・深さの値と、Tailwind の `rounded-*` との結び付け | サイト全体の色や角丸を変えたい |
| `base.css` | フォント、`body`、フォーム要素の既定 | 文字の太さや既定のフォントを変えたい |
| `session-card.css` | 配信枠カード（フォルダ形） | カードの見た目を変えたい |
| `surfaces.css` | 面：`.ui-panel` / `.ui-sunken` / `.ui-float` / `.ui-modal`、幕の `.ui-scrim` | パネルや浮く面の作りを変えたい |
| `controls.css` | 入力欄、ボタン `.ui-btn`、操作ボタン `.ui-ctl`、切替、メニュー行、タイル | ボタンの見た目を変えたい |
| `legacy-v02.css` | 旧 ver0.2 の見本（ガイドページの旧タブ専用） | 基本は触らない |
| `transitions.css` | 画面遷移の演出（全画面ワイプ・画面下の帯） | 遷移の見た目を変えたい |
| `landing/*.css` | LP（`/lp`, `/for-vtubers`, `/for-mates`）固有の部分と挿絵 | LP のレイアウトを変えたい |

## 書くときの決まり

1. 画面（`.tsx`）に色・影・角丸の値を直書きしない。`var(--brand-*)` などの変数か、共通クラスを使う。
2. ボタンは `.ui-btn`（`<Button>`）、操作ボタンは `.ui-ctl`。その場で `bg-… rounded-… px-…` を組んでボタンを作らない。
3. ぼかした影は使わない。メニューやツールチップなど小さく浮くものは `.ui-float`（細い縁＋硬い厚み）、モーダルは `.ui-scrim` の幕＋`.ui-modal`（影なし）。ページに置く面は `.ui-panel`（平ら）。
4. 枠線で囲まない。区別は面の色の差で付ける。区切り線だけ `border-[var(--line)]`。
5. 角丸は `rounded-lg`（小 10px）/ `rounded-xl`（中 14px）/ `rounded-2xl`（大 18px）/ `rounded-full`。任意の値（`rounded-[28px]` など）は使わない。
6. 文字の最小は 11px。`text-[10px]` 以下は使わない。
7. 新しい見た目が必要になったら、まず `tokens.css` と共通クラスに足してから使う。
8. 色は役割で選ぶ。紫＝ブランドと操作・成功・オン、赤＝危険・LIVE、黄（`--brand-warning`）＝注意。白地に色の文字を書くときは `-ink`、薄い下敷きは `-soft` を使う。Tailwind 標準の色（`text-green-400` など）は使わない。
