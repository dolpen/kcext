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
        return master&&master.name ? master.name : '(不明)';
    }
};
