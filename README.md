# 艦これプレイ情報表示拡張

## これは何(目的とコンセプト)
* 出撃前に艦娘のコンディションを見る
* 目を離していた時の戦闘結果を確認する
* 保有艦娘の所持装備や改修状況を確認する

## インストール方法
Flash PlayerはChrome内蔵のほうを使用してください

* cloneまたはzipでソースコード一式をダウンロードする
* Google Chromeの拡張機能設定ページを開く(右肩の三本線→設定→左列の拡張機能)
* [デベロッパー モード]にチェックを入れる
* [パッケージ化されていない拡張機能を読み込む]ボタンを押して、ダウンロードしてきたソースコード一式が含まれるディレクトリを指定する(これで拡張機能がインストールされる)

## 使い方
* Google Chromeの[デベロッパー ツール]を起動する(右肩の三本線→その他のツール→デベロッパーツール)
  * **デベロッパーツールを起動させておかないと動作しません**
  * Ctrl+Shift+J, F12 キーを押しても起動します。
  * デベロッパーツールが起動した状態で、艦これの画面を一度再読み込みしてください
  * デベロッパーツールの[情報]タブを開くと、情報表示画面が表示されます。


1. 母港タブでは、各艦隊の構成艦の状態（耐久、補給、コンディション）が表示されます
1. 戦闘タブでは、直近に行われた戦闘のログが表示されます
  * 大破時には警告メッセージが表示されます
1. 艦娘タブでは、各保有艦の改修値と装備が確認できます
1. Statsタブでは、画面を開いてからの補給艦撃沈数とボスマス到達数がカウントされています(β)

## 注意事項
* 修復要員、修復女神が絡む機能は未検証です。
* 連合艦隊には対応しましたが、未検証です。

## 仕組みなど
元々Google Chromeにあるネットワークをモニタリングする機能を使っています。
Flashでやり取りされる通信を読んでいるだけなので、表示に必要な情報をこの拡張からリクエストすることはありません。
そのため、ゲーム画面の表示と、こちらの表示更新のタイミングが合いません。先に結果が見えたり、母港画面に戻るまで情報が更新されなかったりしますがご容赦ください。
