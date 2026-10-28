// Googleドライブの保存先フォルダID
const FOLDER_ID = "1qZ2qS-PdsduU5o74JBEU0A9SLTT43xEZ";

// この記号以降の文字列をファイル名の【】に入れる（全角「／／」も可）
const NAME_MARKER = /\/\/|／／/;

/**
 * メッセージ本文からメンション（@ボット・@個人名）を取り除く。
 * Chat の annotations（USER_MENTION）があれば位置情報で正確に削除し、
 * 「@山田 太郎」のような空白入りの表示名にも対応する。
 */
function removeMentions(message) {
  var text = message.text || "";
  var mentions = (message.annotations || [])
    .filter(function (a) {
      return a.type === "USER_MENTION" && typeof a.startIndex === "number" && a.length > 0;
    })
    .sort(function (a, b) { return b.startIndex - a.startIndex; }); // 後ろから削除してずれを防ぐ

  mentions.forEach(function (a) {
    if (text.charAt(a.startIndex) === "@") {
      text = text.slice(0, a.startIndex) + text.slice(a.startIndex + a.length);
    }
  });

  // annotations で消せなかった @xxx も念のため削除
  return text.replace(/[@＠]\S+/g, "");
}

/**
 * 「//」以降の文字列（その行の終わりまで）をプロジェクト名として取り出す。
 * 「//」が無い場合は空文字を返す。
 */
function extractProjectName(message) {
  var text = removeMentions(message);
  var match = NAME_MARKER.exec(text);
  if (!match) return "";
  var after = text.slice(match.index + match[0].length);
  return after.split(/\r?\n/)[0].replace(/\s+/g, " ").trim();
}

function onMessage(event) {
  try {
    // Google Chat アプリ（アドオン形式）のイベント構造からメッセージを抽出
    var message = (event.chat && event.chat.messagePayload && event.chat.messagePayload.message)
                  || event.message
                  || {};

    // 「//」以降をプロジェクト名として取得（メンションは除外）
    var messageText = extractProjectName(message);

    if (!messageText) {
      return { "text": "⚠️ エラー：プロジェクト名が見つかりません。テキストに「//プロジェクト名」の形で記載してください。（例：@ボット 確認お願いします //株式会社サンプル案件）" };
    }

    var attachments = message.attachment || message.attachments || [];
    if (attachments.length === 0) {
      return { "text": "⚠️ エラー：ファイルが添付されていません。ファイルを添付して送信してください。" };
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var savedFileNames = [];

    for (var i = 0; i < attachments.length; i++) {
      var item = attachments[i];
      var resourceName = item.attachmentDataRef ? item.attachmentDataRef.resourceName : null;
      
      if (!resourceName) continue;

      var downloadUrl = "https://chat.googleapis.com/v1/media/" + resourceName + "?alt=media";
      var response = UrlFetchApp.fetch(downloadUrl, {
        headers: {
          "Authorization": "Bearer " + ScriptApp.getOAuthToken()
        },
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        var blob = response.getBlob();
        var originalName = item.contentName || "添付ファイル.pdf";
        var newName = "【" + messageText + "】" + originalName;
        
        blob.setName(newName);
        folder.createFile(blob);
        savedFileNames.push(newName);
      } else {
        return { "text": "⚠️ ダウンロード失敗 (HTTP " + response.getResponseCode() + "): " + response.getContentText() };
      }
    }

    if (savedFileNames.length > 0) {
      return {
        "text": "✅ ドライブに保存しました！\n・" + savedFileNames.join("\n・")
      };
    } else {
      return { "text": "⚠️ ファイルの保存に失敗しました。" };
    }

  } catch (error) {
    return { "text": "⚠️ エラーが発生しました: " + error.message };
  }
}

function onAddToSpace(event) {
  return { "text": "請求書保存ボットです！ファイルを添付し、テキストに「//プロジェクト名」を入力して送信してください。" };
}
