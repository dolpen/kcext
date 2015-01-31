var models = {
    sub: {
        AbilityScore: function (nowmax) {
            this.current = nowmax[0]; // Lv100より上だとmaxより大きくなる
            this.max = nowmax[1]; // 近代化最大値
            this.itemScore = 0; // 装備補正値
        }
    },
    Type: function (raw) { // ship type master
        this.typeId = raw['api_id'];
        this.name = raw['api_name'];
    },
    Ship: function (raw) { // ship master
        this.shipId = raw['api_id'];
        this.typeId = raw['api_stype'];
        this.name = raw['api_name'];
        this.fuel = raw['api_fuel_max'];
        this.bullet = raw['api_bull_max'];
        this.type = null;
    },
    Weapon: function (raw) { // weapon master
        this.weaponId = raw['api_id'];
        this.name = raw['api_name'];
        this.endurance = raw['api_taik'];
        this.armor = raw['api_souk'];
        this.firePower = raw['api_houg'];
        this.torpedo = raw['api_raig'];
        this.speed = raw['api_soku'];
        this.bomb = raw['api_baku'];
        this.antiAir = raw['api_tyku'];
        this.antiSub = raw['api_tais'];
        this.fireAccuracy = raw['api_houm'];
        this.torpedoAccuracy = raw['api_raim'];
        this.fireEvasion = raw['api_houk'];
        this.torpedoEvasion = raw['api_raik'];
        this.bombEvasion = raw['api_bakk'];
        this.sight = raw['api_sakk'];
        this.luck = raw['api_luck'];
        this.range = raw['api_leng'];
    },
    Girl: function (raw) {
        this.girlId = raw['api_id'];
        this.shipId = raw['api_ship_id'];
        this.nowhp = raw['api_nowhp'];
        this.maxhp = raw['api_maxhp'];
        this.level = raw['api_lv'];
        this.exp = raw['api_exp'][0];
        this.condition = raw['api_cond'];
        this.fuel = raw['api_fuel'];
        this.bullet = raw['api_bull'];
        this.master = null;
        this.evasion = new models.sub.AbilityScore(raw['api_kaihi']);
        this.firePower = new models.sub.AbilityScore(raw['api_karyoku']);
        this.luck = new models.sub.AbilityScore(raw['api_lucky']);
        this.torpedo = new models.sub.AbilityScore(raw['api_raisou']);
        this.sight = new models.sub.AbilityScore(raw['api_sakuteki']);
        this.armor = new models.sub.AbilityScore(raw['api_soukou']);
        this.antiAir = new models.sub.AbilityScore(raw['api_taiku']);
        this.antiSub = new models.sub.AbilityScore(raw['api_taisen']);
        this.range = raw['api_leng'];
        this.equipmentIds = raw['api_slot'];
        this.equipments = null;
    },
    Equipment: function (raw) {
        this.equipmentId = raw['api_id'];
        this.weaponId = raw['api_slotitem_id'];
        this.locked = raw['api_locked'];
        this.level = raw['api_level'];
        this.weapon = null;
    },
    Fleet: function (raw) {
        this.fleetId = raw['api_id'];
        this.name = raw['api_name'];
        this.until = raw['api_mission'][2];
        this.girlIds = raw['api_ship'].filter(function (e) {
            return e > 0;
        });
        this.girls = null;
    },
    Repair: function (raw) {
        this.dockId = raw['api_id'];
        this.state = raw['api_state'];
        this.until = raw['api_complete_time'];
        this.girlId = raw['api_ship_id'];
        this.girl = null;
    },
    Sortie: function (raw) {
        this.cellId = raw['api_no'];
        this.bossCellId = raw['api_bosscell_no'] == null ? -1 : raw['api_bosscell_no'];
    },
    // 戦闘中の艦艇
    Player: function (shipId, now, max) {
        this.nowhp = now;
        this.maxhp = max;
        this.shipId = shipId;
        this.master = null;
    },
    // 戦闘そのもの
    Battle: function (raw, fleet) {
        this.friends = this._makeFriendShips(raw, fleet); // player
        this.enemies = this._makeEnemyShips(raw); // player
        this.logs = [];
        if (raw['api_kouku'] && raw['api_kouku']['api_stage3'])this._procAttack(raw['api_kouku']['api_stage3'], '航空');
        if (raw['api_support_flag'] == 1)this._procAttack3(raw['api_support_info']['api_support_airattack']['api_kouku']['api_stage3'], '航空支援');
        if (raw['api_support_flag'] == 2)this._procAttack3(raw['api_support_info']['api_support_airattack']['api_hourai'], '支援射撃');
        if (raw['api_support_flag'] == 3)this._procAttack3(raw['api_support_info']['api_support_airattack']['api_hourai'], '支援雷撃');
        if (raw['api_opening_atack'])this._procAttack(raw['api_opening_atack'], '開幕雷撃');
        if (raw['api_hougeki1'])this._procAttack2(raw['api_hougeki1'], '砲撃');
        if (raw['api_hougeki2'])this._procAttack2(raw['api_hougeki2'], '砲撃2');
        if (raw['api_hougeki3'])this._procAttack2(raw['api_hougeki3'], '砲撃3');
        if (raw['api_raigeki'])this._procAttack(raw['api_raigeki'], '雷撃');
        if (raw['api_hougeki'])this._procAttack2(raw['api_hougeki'], '夜戦');
    }
};


models.sub.AbilityScore.prototype = {
    addItemScore: function (itemScore) {
        this.current -= itemScore;
        this.itemScore += itemScore;
    },
    fixItemScore: function (itemScore) {
        this.itemScore += itemScore;
    },
    isFinished: function () { // has...
        return this.current >= this.max;
    },
    toString: function () {
        return '' + this.current + '/' + this.max;
    }
};

models.Ship.prototype = {
    assignType: function (type) {
        this.master = type[this.typeId];
    }
};
models.Girl.prototype = {
    assignMaster: function (ship) {
        this.master = ship[this.shipId];
    },
    setEquipment: function (equipments) {
        this.equipments = this.equipmentIds.filter(function (e) {
            return e >= 0 && equipments[e] != null;
        }).map(function (e) {
            return equipments[e];
        });
        console.log(this.getName());
        console.log(this.equipments);
        var self = this;
        this.equipments.each(function (e) {
            self.firePower.addItemScore(e.master.firePower);
            self.torpedo.addItemScore(e.master.torpedo);
            self.armor.addItemScore(e.master.armor);
            self.antiAir.addItemScore(e.master.antiAir);
        });
    },
    getName: function () {
        return utils.displayName(this.master);
    },
    getLifeState: function () {
        return '' + this.nowhp + ' / ' + this.maxhp
    },
    getLifeLevel: function () {
        return utils.lifeLevel(this.nowhp, this.maxhp);
    },
    getLifeLabel: function () {
        return utils.lifeLabel(this.nowhp, this.maxhp);
    },
    getFuelState: function () {
        return (this.master != null ? ('' + Math.floor(this.fuel * 100 / this.master.fuel)) : '?');
    },
    getBulletState: function () {
        return (this.master != null ? ('' + Math.floor(this.bullet * 100 / this.master.bullet)) : '?');
    },
    getConditionLevel: function () {
        return utils.conditionLevel(this.condition);
    },
    getFuelLevel: function () {
        return (this.master == null || this.fuel == this.master.fuel) ? 1 : 0;
    },
    getBulletLevel: function () {
        return (this.master == null || this.bullet == this.master.bullet) ? 1 : 0;
    },
    isWrecked: function () { // 大破ならtrue
        return utils.wrecked(this.nowhp, this.maxhp);
    },
    toString: function () {
        return 'Lv' + this.level + ' '
            + this.getName()
            + ' ' + this.getLifeState()
            + ' ' + this.getFuelState()
            + ' ' + this.getBulletState()
            + ' [' + this.condition + ']'
            + this.getLifeLabel();
    },
    toDom: function () {
        var life = this.getLifeLevel();
        return $('<tr />').addClass('girl girl' + life)
            .append($('<td />').addClass('lv').text(this.level))
            .append($('<td />').addClass('name').text(this.getName()))
            .append($('<td />').addClass('life l' + life).text(this.getLifeState()))
            .append($('<td />').addClass('fuel l' + this.getFuelLevel()).text(this.getFuelState()))
            .append($('<td />').addClass('bullet l' + this.getBulletLevel()).text(this.getBulletState()))
            .append($('<td />').addClass('cond l' + this.getConditionLevel()).text(this.condition))
            .append($('<td />').addClass('state l' + life).text(this.getLifeLabel()));
    },
    statusToDom: function () {
        return $('<tr />').addClass('girl')
            .append($('<td />').text(this.level))
            .append($('<td />').addClass('name').text(this.getName()))
            .append($('<td />').addClass('fire ' + (this.firePower.isFinished() ? 'max' : '')).text(this.firePower.toString()))
            .append($('<td />').addClass('torpedo ' + (this.torpedo.isFinished() ? 'max' : '')).text(this.torpedo.toString()))
            .append($('<td />').addClass('air ' + (this.antiAir.isFinished() ? 'max' : '')).text(this.antiAir.toString()))
            .append($('<td />').addClass('armor ' + (this.armor.isFinished() ? 'max' : '')).text(this.armor.toString()))
            .append($('<td />').text(this.equipments[0] != null ? this.equipments[0].master.name : ''))
            .append($('<td />').text(this.equipments[1] != null ? this.equipments[1].master.name : ''))
            .append($('<td />').text(this.equipments[2] != null ? this.equipments[2].master.name : ''))
            .append($('<td />').text(this.equipments[3] != null ? this.equipments[3].master.name : ''));
    }
};

models.Equipment.prototype = {
    assignMaster: function (weapon) {
        this.master = weapon[this.weaponId];
    }
};
models.Fleet.prototype = {
    assignMaster: function (girl) {
        this.girls = this.girlIds.map(function (e) {
            return girl[e];
        });
    },
    isFinished: function () {
        return this.until > 0 && new Date().getTime() >= this.until;
    },
    reset: function () {
        this.until = 0;
    },
    toDom: function () {
        var $ret = $('<table />').addClass('fleet').append(
            $('<tr />').addClass('info').append(
                $('<td />').addClass('fid').text('' + this.fleetId)
            ).append(
                $('<td />').attr('colspan', '6').addClass('name').text(this.name)
            )
        );
        this.girls.each(function (e) {
            $ret.append(e.toDom());
        });
        return $ret;
    }
};
models.Repair.prototype = {
    assignMaster: function (girl) {
        this.girl = girl[this.girlId];
    },
    getName: function () {
        return (this.girl != null ? this.girl.getName() : '(なし)');
    },
    isFinished: function () {
        return this.until > 0 && new Date().getTime() >= this.until;
    },
    reset: function () {
        this.until = 0;
    }
};
models.Sortie.prototype = {
    isBossCell: function () {
        return this.cellId == this.bossCellId;
    }
};
models.Player.prototype = {
    assignMaster: function (ship) {
        this.master = ship[this.shipId];
    },
    getName: function () {
        return utils.displayName(this.master);
    },
    getLifeState: function () {
        return '' + this.nowhp.toFixed(0) + ' / ' + this.maxhp.toFixed(0);
    },
    getLifeLevel: function () {
        return utils.lifeLevel(this.nowhp, this.maxhp);
    },
    getLifeLabel: function () {
        return utils.lifeLabel(this.nowhp, this.maxhp);
    },
    isWrecked: function () {
        return utils.wrecked(this.nowhp, this.maxhp);
    },
    damage: function (val) {
        this.nowhp = Math.max(this.nowhp - val, 0);
    },
    toDom: function () {
        var life = this.getLifeLevel();
        return $('<tr />').addClass('girl girl' + life)
            .append($('<td />').addClass('name').text(this.getName()))
            .append($('<td />').addClass('life l' + life).text(this.getLifeState()))
            .append($('<td />').addClass('state l' + life).text(this.getLifeLabel()));
    }
};
models.Battle.prototype = {
    assignMaster: function (ship) {
        this.friends.each(function (e) {
            e.assignMaster(ship);
        });
        this.enemies.each(function (e) {
            e.assignMaster(ship);
        });
    },
    _makeFriendShips: function (raw, fleet) {
        var ret = [];
        var decknum = (raw['api_dock_id'] ? raw['api_dock_id'] : raw['api_deck_id']) - 1;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = raw['api_maxhps'][i];
            if (x <= 0)return;
            ret.push(
                new models.Player(
                    fleet ? fleet[decknum].girls[i - 1].shipId : -1,
                    raw['api_nowhps'][i],
                    x)
            );
        });
        return ret;
    },
    _makeEnemyShips: function (raw) {
        var ret = [];
        [7, 8, 9, 10, 11, 12].each(function (i) {
            var x = raw['api_maxhps'][i];
            if (x <= 0)return;
            ret.push(
                new models.Player(
                    raw['api_ship_ke'][i - 6],
                    raw['api_nowhps'][i],
                    x)
            );
        });
        return ret;
    },
    _dest: function (dest) {
        return dest < 6
            ? this.friends[dest]
            : this.enemies[dest - 6];
    },
    damage: function (dest, val) {
        dest--;
        if (dest < 0)return;
        this._dest(dest).damage(val);
    },
    _procAttack: function (parent, situation) { // 順序のない攻撃の処理(雷撃や航空戦)
        var _self = this;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = Math.floor(parent['api_fdam'][i]);
            if (x <= 0)return;
            _self.damage(i, x);
            _self._log(i, x, situation);
        });
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = Math.floor(parent['api_edam'][i]);
            if (x <= 0)return;
            _self.damage(i + 6, x);
            _self._log(i + 6, x, situation);
        });
    },
    _procAttack2: function (parent, situation) { // 順序のある攻撃の処理(通常の砲撃や夜戦)
        var l = parent['api_df_list'].length;
        for (var i = 1; i < l; i++) {
            var s = parent['api_df_list'][i].length;
            for (var j = 0; j < s; j++) {
                var x = Math.floor(parent['api_damage'][i][j]);
                if (x <= 0)continue;
                this.damage(parent['api_df_list'][i][j], x);
                this._log(parent['api_df_list'][i][j], x, situation);
            }
        }
    },
    _procAttack3: function (parent, situation) { // 敵だけがダメージを受ける攻撃の処理(支援)
        var _self = this;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = Math.floor(parent['api_damage'][i]);
            if (x <= 0)return;
            _self.damage(i + 6, x);
            _self._log(i + 6, x, situation);
        });
    },
    _log: function (i, d, s) {
        this.logs.push((i > 6 ? ('敵' + (i - 6)) : ('味方' + i)) + '番艦に' + d + 'ダメージ(' + s + ')');
    },
    toDom: function () {
        var wrecked = false;
        var $res = $('<div />').addClass('result');
        var $ul = $('<ul />').addClass('battle');
        this.logs.each(function (e) {
            $ul.append($('<li />').addClass('log').text(e));
        });
        var $ftbl = $('<table />').addClass('fleet');
        this.friends.each(function (e) {
            if (e.isWrecked())wrecked = true;
            $ftbl.append(e.toDom());
        });
        var $etbl = $('<table />').addClass('fleet');
        this.enemies.each(function (e) {
            $etbl.append(e.toDom());
        });
        if (wrecked) {
            $res.append($('<p />').css('color', 'red').text('大破艦が出ました！'));
            $res.append($('<hr />'));
        }
        $res.append($ftbl);
        $res.append($('<hr />'));
        $res.append($etbl);
        $res.append($('<hr />'));
        $res.append($ul);
        return $res;
    }
};


var adaptors = {
    /**
     * @param master/api_start2
     * @return List{models.Type}
     */
    type: function (json) {
        var p = json['api_data']['api_mst_stype'];
        return p.map(function (x) {
            return new models.Type(x);
        });
    },
    /**
     * @param master/api_start2
     * @return List{models.Ship}
     */
    ship: function (json) {
        var p = json['api_data']['api_mst_ship'];
        return p.map(function (x) {
            return new models.Ship(x);
        });
    },
    /**
     * @param master/api_start2
     * @return List{models.Weapon}
     */
    weapon: function (json) {
        var p = json['api_data']['api_mst_slotitem'];
        return p.map(function (x) {
            return new models.Weapon(x);
        });
    },
    /**
     * @param member/slot_item
     * @return List{models.Equipment}
     */
    equipment: function (json) {
        var p = json['api_data'];
        return p.map(function (x) {
            return new models.Equipment(x);
        });
    },
    /**
     * @param member/port
     * @return List{models.Girl}
     */
    girl: function (json) {
        var p = json['api_data']['api_ship'];
        return p.map(function (x) {
            return new models.Girl(x);
        }).sort(function (a, b) {
            return b.exp - a.exp;
        });
    },
    /**
     * @param req/start
     * @return models.Sortie
     */
    sortie: function (json) {
        return new models.Sortie(json['api_data']);
    },
    /**
     * @param req/battle
     * @return models.Battle
     */
    battle: function (json, fleet) {
        return new models.Battle(json['api_data'], fleet);
    },
    /**
     * @param member/port
     * @return List{models.Fleet}
     */
    fleet: function (json) {
        var p = json['api_data']['api_deck_port'];
        return p.map(function (x) {
            return new models.Fleet(x);
        });
    },
    /**
     * @param member/port
     * @return List{models.Repair}
     */
    repair: function (json) {
        var p = json['api_data']['api_ndock'];
        return p.map(function (x) {
            return new models.Repair(x);
        });
    }
};

var caches = (function () {
    var c = function () {
        this.currentSotie = null;
        this.currentBattle = null;
        this.od = {
            approachBoss: 0,
            destroyLst: 0
        };
    };
    c.prototype = {
        toDom: function () {
            var $ul = $('<ul />').addClass('counts');
            $ul.append($('<li />').addClass('cnt').text('ボス到達 :' + this.od.approachBoss));
            $ul.append($('<li />').addClass('cnt').text('輸送艦狩り :' + this.od.destroyLst));
            return $ul;
        }
    };
    return new c();
})();
