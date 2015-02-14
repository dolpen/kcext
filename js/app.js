(function (d, w, $) {
    var db = {}; // localstorage
    w.db = db;
    w.devtoolsResponceListener
        .handle(/kcsapi\/api_start2$/, function (json) {
            var t = adaptors.type(json).tohash(function (e) {
                return e.typeId;
            });
            db['ship'] = adaptors.ship(json).each(function (e) {
                e.assignType(t);
            });
            db['ship_to_hash'] = db['ship'].tohash(function (e) {
                return e.shipId;
            });
            db['weapon_to_hash'] = adaptors.weapon(json).tohash(function (e) {
                return e.weaponId;
            });
        })
        .handle(/kcsapi\/api_get_member\/slot_item$/, function (json) {
            db['equipment'] = adaptors.equipment(json);
            if (db['weapon_to_hash']) {
                db['equipment'].each(function (e) {
                    e.assignMaster(db['weapon_to_hash']);
                });
            }
            db['equipment_to_hash'] = db['equipment'].tohash(function (e) {
                return e.equipmentId;
            });
        })
        .handle(/kcsapi\/api_port\/port$/, function (json) {
            db['girl'] = adaptors.girl(json);
            if (db['ship_to_hash']) {
                db['girl'].each(function (e) {
                    e.assignMaster(db['ship_to_hash']);
                });
            }
            if (db['equipment_to_hash']) {
                db['girl'].each(function (e) {
                    e.setEquipment(db['equipment_to_hash']);
                });
            }
            var g = db['girl'].tohash(function (e) {
                return e.girlId;
            });
            db['fleet'] = adaptors.fleet(json).each(function (e) {
                e.assignMaster(g);
            });
            db['repair'] = adaptors.repair(json).each(function (e) {
                e.assignMaster(g);
            });
            // update global object
            caches.onBackPort(json);

            // update UI
            var $v = $('#port');
            $v.empty();
            db['fleet'].each(function (e) {
                $v.append(e.toDom());
            });

            var $u = $('#girl');
            var $t = $('<table />');
            db['girl'].each(function (e) {
                $t.append(e.statusToDom());
            });
            $u.empty();
            $u.append($t);
        }).handle(/kcsapi\/api_req_(sortie|battle_midnight|practice|combined_battle)\/(sp_midnight|(midnight_|air)?battle(_water)?)$/, function (json) {
            var b = adaptors.battle(json, db['fleet'], db['ship_to_hash']);
            // update global object
            caches.onBattle(b);
            var $v = $('#battle');
            $v.empty();
            $v.append(b.toDom());
        }).handle(/kcsapi\/api_req_(sortie|combined_battle)\/battleresult$/, function (json) {
            caches.onFinishBattle();
            var $v = $('#stats');
            $v.empty();
            $v.append(caches.toDom());
        }).handle(/kcsapi\/api_req_map\/(start|next)$/, function (json) {
            var s = adaptors.sotie(json);
            caches.onSotie(s);
            var $v = $('#stats');
            $v.empty();
            $v.append(caches.toDom());
            if (!caches.isSafeSotie()) {
                $('#wreckedModal').modal('show');
            }
        }).listen();
    $('#wreckedModal').modal('show');
})(document, window, jQuery);