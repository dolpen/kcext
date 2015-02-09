(function (w) {
    var Handler = function (pattern, func) {
        this.pattern = pattern;
        this.func = func;
    };
    Handler.prototype = {
        test: function (str) {
            return this.pattern.test(str);
        },
        exec: function (obj) {
            return this.func(obj);
        }
    };
    var Listener = function () {
        this.chain = [];
        this.listening = false;
    };
    Listener.prototype = {
        /**
         * 待ち受け開始
         */
        listen: function () {
            if (this.listening)return;
            var _self = this;
            chrome.devtools.network.onRequestFinished.addListener(function (request) {
                var url = request.request.url.replace(/https?:\/\/.+?\//, "/");
                _self.chain.first(function (e) {
                    return e.test(url);
                }).ifPresent(function (e) {
                    request.getContent(function (content, encoding) {
                        var json = JSON.parse(content.replace('svdata=', ''));
                        //console.log('handle url : '+url);
                        e.exec(json);
                    });
                });
            });
            console.log('listen started');
            this.listening = true;
        },
        /**
         * 任意のURLに関数をハンドリングする
         *
         * @param pattern パスの正規表現
         * @param func 関数
         */
        handle: function (pattern, func) {
            this.chain.push(new Handler(pattern, func));
            return this;
        }
    };
    w.devtoolsResponceListener = new Listener();
})(window);
