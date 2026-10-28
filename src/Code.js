// Googleドライブの保存先フォルダID
const FOLDER_ID = "1qZ2qS-PdsduU5o74JBEU0A9SLTT43xEZ";

function onMessage(event) {
  try {
    // Google Chat アプリ（アドオン形式）のイベント構造からメッセージを抽出
    var message = (event.chat && event.chat.messagePayload && event.chat.messagePayload.message) 
                  || event.message 
                  || {};
    
    // メンションを除いた本文（argumentText）または本文テキストを取得
    var messageText = message.argumentText ? message.argumentText.trim() : "";
    if (!messageText && message.text) {
      messageText = message.text.replace(/@\S+/g, "").trim();
    }

    if (!messageText) {
      return { "text": "⚠️ エラー：プロジェクト名が入力されていません。テキスト欄にプロジェクト名を記載してください。" };
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
  return { "text": "請求書保存ボットです！ファイルを添付し、テキストに「プロジェクト名」を入力して送信してください。" };
}
