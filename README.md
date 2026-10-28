# Google Chat 請求書自動保存ボット (Google Apps Script)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-green.svg)](https://developers.google.com/apps-script)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Chat%20API-orange.svg)](https://cloud.google.com/)

Google Chat 上に投稿された請求書・見積書・領収書などの添付ファイルを自動で検知し、指定した Google ドライブ（マイドライブ／共有ドライブ両対応）へリネームして保存する Google Apps Script (GAS) ボットです。

---

## 📌 機能概要

* **自動リネーム & 格納:**
  * チャットに `@ボット名 ... //案件名` とファイル（PDF・画像・Officeファイル等）を添えて投稿すると、自動で `【案件名】元のファイル名.拡張子` にリネームして保存します。
  * ファイル名に使うのは **`//` 以降（その行の終わりまで）** の文字列だけです。`//` より前の文章や、`@ボット` `@個人名` などのメンションは無視されます。全角の `／／` も使えます。
* **共有ドライブ対応:**
  * マイドライブだけでなく、組織で共有している Google ドライブ（共有ドライブ / 旧チームドライブ）への直接保存に対応しています。
* **即時フィードバック:**
  * 保存が完了すると、保存したファイル名一覧をスレッドへ即時返信します。
* **完全サーバーレス & 無料:**
  * 外部サーバーや追加有料サービスは不要。Google Workspace / Google Cloud Platform の標準無料枠内で動作します。

---

## 🔄 動作イメージ

```text
[ユーザー]
@請求書保存Bot @山田 太郎 さん、請求書届きました //株式会社サンプル案件
└ 📎 請求書_202610.pdf (添付)
       │
       ▼ (Google Chat API)
[Google Apps Script]
 1. メンションを除外し、「//」以降からプロジェクト名「株式会社サンプル案件」を抽出
 2. Chat Media API 経由で添付バイナリを取得
 3. 「【株式会社サンプル案件】請求書_202610.pdf」にリネーム
 4. 指定の共有ドライブフォルダへ保存
       │
       ▼ (完了通知)
[ボット]
✅ ドライブに保存しました！
・【株式会社サンプル案件】請求書_202610.pdf
```

---

## 📁 リポジトリ構成

```text
.
├── README.md               # 本ドキュメント
└── src/
    ├── appsscript.json     # GASマニフェスト（スコープ・ランタイム設定）
    └── Code.js             # ボット本体ロジック（イベント解析・Drive保存）
```

---

## 🚀 導入手順

### 1. 保存先フォルダの準備
1. 保存先となる Google ドライブ（または共有ドライブ）のフォルダを作成します。
2. フォルダURLから **フォルダID** を取得します。
   * 例: `https://drive.google.com/drive/folders/【ここの英数字】`

### 2. Google Cloud Platform (GCP) の設定
1. [Google Cloud Console](https://console.cloud.google.com/) で新規プロジェクトを作成します。
2. **「APIとサービス」 > 「ライブラリ」** から以下の **2つのAPI** を有効化します。
   * `Google Chat API`
   * `Google Drive API` (★必須)
3. **「OAuth 同意画面」** を構成します（User Type: 「内部」）。

### 3. Google Apps Script のデプロイ
1. [Google Apps Script](https://script.google.com/) で新規プロジェクトを作成します。
2. 左メニューの **プロジェクト設定（歯車マーク）** を開きます。
   * 「Google Cloud Platform（GCP）プロジェクト」に手順2のプロジェクト番号を設定。
   * 「『appsscript.json』マニフェスト ファイルをエディタで表示する」にチェック。
3. リポジトリの `src/appsscript.json` と `src/Code.js` を反映します。
   * `src/Code.js` の `FOLDER_ID` を手順1のフォルダIDに書き換えます。
4. エディタ上部の関数プルダウンから **`authorizeTest`** を選択して実行し、アカウントのアクセス権限を初回承認します。
5. **「デプロイ」 > 「新しいデプロイ」** を開き、種類に **「アドオン」** を選択してデプロイします。
6. 発行された **デプロイ ID** を控えます。

### 4. Google Chat API の構成
1. GCPコンソールの **「Google Chat API」 > 「構成 (Configuration)」** を開きます。
   * **アプリ名:** 任意のボット名（例: `請求書保存Bot`）
   * **機能:** 「1対1のメッセージを受信する」「スペースに参加する」にチェック
   * **接続設定:** 「Apps Script プロジェクト」を選択し、手順3で取得した **デプロイ ID** を入力
   * **公開設定:** 「ドメイン内の特定のユーザーとグループ」または組織全体を指定
2. 最下部の **「保存」** をクリックします。

### 5. 動作確認
1. Google Chat の対象スペースで「アプリを追加」からボットを招待します。
2. `@ボット名 //テスト案件` と入力し、ファイルを添付して送信します。
3. フォルダにファイルが格納され、Chatへ完了通知が返ればセットアップ完了です。

---

## ⚙️ 設定パラメータ

| 変数名 | ファイル | 説明 |
| :--- | :--- | :--- |
| `FOLDER_ID` | `src/Code.js` | 保存先フォルダのID。マイドライブ / 共有ドライブ両対応。 |
| `runtimeVersion` | `src/appsscript.json` | 実行ランタイム。`V8` を指定。 |

---

## ❓ よくあるトラブル (FAQ)

### Q. 「ボットから応答がありません」と表示され、ドライブにも保存されない
1. **初回手動承認の未完了:**
   GASエディタで `authorizeTest` を手動実行し、Googleアカウントのアクセス許可を完了させてください。
2. **Google Drive API の有効化漏れ:**
   GCPコンソール側で「Google Drive API」が有効化されていないと、ファイル作成権限が拒否されます。
3. **デプロイIDの更新漏れ:**
   コード修正後は「新バージョン」をデプロイし、発行された新しいデプロイIDをGCPのChat API構成画面へ反映させてください。

### Q. 共有ドライブへ保存できない
* ボットを実行しているユーザーアカウントが、対象の共有ドライブに対して「投稿者」または「コンテンツ管理者」以上の権限を持っているか確認してください。

---

## 📄 ライセンス

本プロジェクトは [MIT License](LICENSE) のもとで公開されています。