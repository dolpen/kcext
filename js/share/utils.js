var utils = {
    /**
     * @param now 現在値
     * @param max 最大値
     * @returns {boolean}(大破)
     */
    wrecked: function (now, max) {
        return max >= 4 * now;
    },
    /**
     * @param now 現在値
     * @param max 最大値
     * @returns {number}(健全,軽微,小破,中破,大破,撃沈)
     */
    lifeLevel: function (now, max) {
        if (now >= max) return 0;
        return [1, 2, 3, 4].first(function (e) {
            return now * 4 > max * (4 - e);
        }).orElse(5);
    },
    /**
     *
     * @param now 現在値
     * @param max 最大値
     * @returns {string}
     */
    lifeLabel: function (now, max) {
        return ['健全', '軽微', '小破', '中破', '大破', '撃沈'][utils.lifeLevel(now, max)];
    },
    /**
     * 指定インデックスの要素を取得
     * @param arr 配列
     * @param index インデックス
     * @param defaultIndex デフォルト
     * @returns {*}
     */
    getInRange: function (arr, index, defaultIndex) {
        return arr[(!index || index < 0 || index >= arr.length) ? defaultIndex : index];
    },
    /**
     *
     * @returns {string}
     */
    combinedLabel: function () {
        return utils.getInRange([
            '通常艦隊',
            '機動部隊',
            '水上部隊',
            '不明'
        ], caches.combined, 4);
    },
    /**
     *
     * @param searchId api_search[1-2]
     * @returns {string}
     */
    searchLabel: function (searchId) {
        return utils.getInRange([
            '索敵状態不明',
            '発見！',
            '発見！(索敵機未帰還機あり)',
            '発見できず…(索敵機未帰還機あり)',
            '発見できず…',
            '発見！(索敵機なし)',
            '索敵せず'
        ], searchId, 0);
    },
    /**
     *
     * @param battleForm api_formation[0-1]
     * @returns {string}
     */
    formLabel: function (battleForm) {
        return utils.getInRange([
            '陣形不明',
            '単縦陣', '複縦陣', '輪形陣', '梯形陣', '単横陣',
            '', '', '', '', '',
            '第一警戒航行序列', '第二警戒航行序列', '第三警戒航行序列', '第四警戒航行序列'
        ], battleForm, 0);
    },

    /**
     *
     * @param battleForm api_formation[2]
     * @returns {string}
     */
    battleLabel: function (battleForm) {
        return utils.getInRange(['戦闘形態不明', '同航戦', '反航戦', 'T字有利', 'T字不利'], battleForm, 0);
    },
    /**
     * @param now 現在値
     * @returns {number}(good,normal,lit,warn,critical)
     */
    conditionLevel: function (now) {
        return [0, 1, 2, 3].first(function (e) {
            return now >= 50 - e * 10;
        }).orElse(4);
    },
    /**
     *
     * @param master
     * @returns {string}
     */
    displayName: function (master) {
        return master && master.name ? master.name : '(不明)';
    },
    formatDate: function (date, format) {
        if (!format) format = 'YYYY-MM-DD hh:mm:ss';
        format = format.replace(/YYYY/g, date.getFullYear());
        format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
        format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
        format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
        format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
        format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
        if (format.match(/S/g)) {
            var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
            var length = format.match(/S/g).length;
            for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
        }
        return format;
    }
};
