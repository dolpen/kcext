/**
 * devtools拡張の起動用スクリプト
 * パネルを追加したりする
 */
chrome.devtools.inspectedWindow.eval('document.baseURI', function (url) {
    // ゲームのページでなければ起動しない
    if (!
        [/http:\/\/www.dmm.com\/.*\/app_id=854854\/.*/, /http:\/\/osapi.dmm.com\/.*aid=854854.*/]
            .any(function (gameurl) {
                return gameurl.test(url)
            })
        )return;
    chrome.devtools.panels.create('情報', 'icon/icon.png', 'view/index.html');
});
