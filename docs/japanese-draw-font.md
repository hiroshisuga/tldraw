# 欧文・日本語の draw フォント

`fonts.draw` に欧文用フォント、任意の `fonts.drawJapanese` に日本語用フォントの URL を指定すると、両方が `tldraw_draw` として登録されます。PR #235 と同じ `unicode-range` で文字を振り分け、両方の読み込み完了を待ってからエディターを表示します。フォントファイルを結合する必要はありません。

`drawJapanese` を指定しない場合、従来どおり `draw` の 1 ファイルを、文字範囲を制限せずに使います。

## BigBlueButton PR #235 と組み合わせる場合

1. この変更を含む tldraw をビルドして BBB に導入します。
2. PR #235 の `AMT.woff2` と `MRY-subset.woff2` を、従来どおり BBB から配信します。この PR はフォントファイル自体を追加しません。
3. `bigbluebutton-html5/imports/ui/components/whiteboard/service.js` の `getCustomEditorAssetUrls()` で、既存の `fonts` 設定の `draw` を変更し、`drawJapanese` を追加します。ほかのフォントの URL は維持します。

```js
fonts: {
  draw: `${BASENAME}/fonts/MA/AMT.woff2`,
  drawJapanese: `${BASENAME}/fonts/MA/MRY-subset.woff2`,
  serif: `${TL_TEXT_PATHS}/IBMPlexSerif-Medium.woff2`,
  sansSerif: `${TL_TEXT_PATHS}/IBMPlexSans-Medium.woff2`,
  monospace: `${TL_TEXT_PATHS}/IBMPlexMono-Medium.woff2`,
},
```

4. `styles.js` の `.tl-text-shape__wrapper[data-font='draw']` に対する `font-family: 'AMT', 'MRY', sans-serif` の上書きを削除し、tldraw 標準の `tldraw_draw` を使います。これにより入力・表示・文字サイズ計測・図形や矢印のラベルで同じフォントを使えます。

欧文・日本語の文字範囲は PR #235 と同じです。範囲外の文字は既存の `sans-serif` フォールバックを使います。SVG 出力では両方のフォントと文字範囲を埋め込みます。

確認時はブラウザのキャッシュを無効にし、日本語フォントの応答を遅らせても、その読み込み完了前にエディターが表示されないこと、`ABC 日本語 123` の入力・編集終了・再編集でフォントが切り替わらないことを確認してください。BBB の別クライアントでの表示も確認が必要です。録画プレイヤーへの適用はこの変更の対象外です。
