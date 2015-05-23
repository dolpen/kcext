var models;
models = {
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
        this.name = raw['api_name'] + ((raw['api_yomi'] == 'elite' || raw['api_yomi'] == 'flagship') ? raw['api_yomi'] : '');
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
    Port: function (fleets) {
        this.fleets = fleets;
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
    Docks: function (name, docks) {
        this.name = name;
        this.docks = docks;
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
    Player: function (shipId, idName, now, max) {
        this.starthp = now;
        this.nowhp = now;
        this.maxhp = max;
        this.idName = idName;
        this.shipId = shipId;
        this.master = null;
        this.girl = null;
    },
    // 戦闘そのもの
    Battle: function (raw, port, ship) {
        var fleet = port ? port.fleets : null;
        // 随伴艦隊の存在判定
        this.combinedFlag = raw['api_nowhps_combined'] != null;
        // 戦闘艦の情報(味方/敵/随伴艦)
        this.friends = this._makeFriendShips(raw, fleet); // player
        this.enemies = this._makeEnemyShips(raw); // player
        this.combined = this.combinedFlag ? this._makeCombinedShips(raw, fleet) : [];
        //索敵
        this.friendSearch = raw['api_search'] ? raw['api_search'][0] : 0; // 自分の索敵
        this.enemySearch = raw['api_search'] ? raw['api_search'][1] : 0; // 相手の索敵
        // 陣形
        this.friendForm = raw['api_formation'] ? raw['api_formation'][0] : 0; // 自分の陣形
        this.enemyForm = raw['api_formation'] ? raw['api_formation'][1] : 0; // 相手の陣形
        this.battleForm = raw['api_formation'] ? raw['api_formation'][2] : 0; // T字不利とか

        this.startLifeLevel = 0;
        this.endLifeLevel = 0;
        if (ship != null)this.assignMaster(ship);
        this.logs = [];
        var self = this;
        // 初期状態集計処理（大破艦発生判定）
        this.friends.each(function (e) {
            self.startLifeLevel = Math.max(self.startLifeLevel, e.getLifeLevel());
        });
        if (this.combinedFlag) {
            this.combined.each(function (e) {
                self.startLifeLevel = Math.max(self.startLifeLevel, e.getLifeLevel());
            });
        }


        // 航空攻撃の処理
        this._procAir(raw['api_kouku'], '航空');
        this._procAir(raw['api_kouku2'], '航空2');
        // 支援攻撃の処理
        var support = raw['api_support_flag'] ? raw['api_support_flag'] : 0;
        switch (support) {
            case 1: // 航空支援
                this._procAssist(raw['api_support_info']['api_support_airattack']['api_kouku']['api_stage3'], '航空支援');
                break;
            case 2: // 支援射撃
                this._procAssist(raw['api_support_info']['api_support_hourai'], '支援射撃');
                break;
            case 3: // あかんやつ
                this._procAssist(raw['api_support_info']['api_support_hourai'], '支援雷撃');
                break;
        }
        // 開幕雷撃
        this._procTorp(raw['api_opening_atack'], '開幕雷撃');
        // (陣形の表示)
        // 艦隊編成による分岐
        switch (kccaches.combined) {
            case 0: // 通常艦隊
                this._procShelling(raw['api_hougeki1'], '砲撃', false); // 主力
                this._procShelling(raw['api_hougeki2'], '砲撃2', false); // 主力
                this._procTorp(raw['api_raigeki'], '雷撃', false);
                break;
            case 1: // 機動部隊
                this._procShelling(raw['api_hougeki1'], '砲撃', true); // 随伴
                this._procShelling(raw['api_hougeki2'], '砲撃2', false); // 主力
                this._procShelling(raw['api_hougeki3'], '砲撃3', false); // 主力
                this._procTorp(raw['api_raigeki'], '雷撃', true); // 随伴
                break;
            case 2: // 水上部隊
                this._procShelling(raw['api_hougeki1'], '砲撃', false); // 主力
                this._procShelling(raw['api_hougeki2'], '砲撃2', false); // 主力
                this._procShelling(raw['api_hougeki3'], '砲撃3', true); // 随伴
                this._procTorp(raw['api_raigeki'], '雷撃', true); // 随伴
                break;
        }
        // 夜戦処理
        this._procShelling(raw['api_hougeki'], '夜戦', kccaches.combined != 0); // 連合艦隊なら夜戦は随伴
        // 最終ダメージ集計処理（大破艦発生判定）
        this.friends.each(function (e) {
            self.endLifeLevel = Math.max(self.endLifeLevel, e.getLifeLevel());
        });
        if (this.combinedFlag) {
            this.combined.each(function (e) {
                self.endLifeLevel = Math.max(self.endLifeLevel, e.getLifeLevel());
            });
        }
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
        var self = this;
        this.equipments.each(function (e) {
            if (e.master) {
                self.firePower.addItemScore(e.master.firePower);
                self.torpedo.addItemScore(e.master.torpedo);
                self.armor.addItemScore(e.master.armor);
                self.antiAir.addItemScore(e.master.antiAir);
            }
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
    hasEquipment: function (weaponId) {
        return this.equipments && this.equipments.any(function (e) {
            return e.weaponId = weaponId;
        });
    },
    useEquipment: function (weaponId) {
        if (!this.equipments)return false;
        var equipment = this.equipments.first(function (e) {
            return e.weaponId = weaponId;
        });
        if (!equipment.isPresent())return false;
        var equipmentId = equipment.orElse(null).equipmentId;
        this.equipments = this.equipments.filter(function (e) {
            return e.equipmentId != equipmentId;
        });
        return true;
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
            .append($('<td />').addClass('state l' + life).text(this.getLifeLabel()))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[0] ? this.equipments[0].getName() : ''))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[1] ? this.equipments[1].getName() : ''))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[2] ? this.equipments[2].getName() : ''))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[3] ? this.equipments[3].getName() : ''));
    },
    statusToDom: function () {
        return $('<tr />').addClass('girl')
            .append($('<td />').text(this.level))
            .append($('<td />').addClass('name').text(this.getName()))
            .append($('<td />').addClass('fire ' + (this.firePower.isFinished() ? 'max' : '')).text(this.firePower.toString()))
            .append($('<td />').addClass('torpedo ' + (this.torpedo.isFinished() ? 'max' : '')).text(this.torpedo.toString()))
            .append($('<td />').addClass('air ' + (this.antiAir.isFinished() ? 'max' : '')).text(this.antiAir.toString()))
            .append($('<td />').addClass('armor ' + (this.armor.isFinished() ? 'max' : '')).text(this.armor.toString()))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[0] ? this.equipments[0].getName() : ''))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[1] ? this.equipments[1].getName() : ''))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[2] ? this.equipments[2].getName() : ''))
            .append($('<td />').addClass('equip').text(this.equipments && this.equipments[3] ? this.equipments[3].getName() : ''));
    }
};

models.Equipment.prototype = {
    assignMaster: function (weapon) {
        this.master = weapon[this.weaponId];
    },
    getName: function () {
        return utils.displayName(this.master) + (this.level > 0 ? ('★+' + this.level) : '');
    }
};
models.Port.prototype = {
    assignMaster: function (girl) {
        this.fleets.each(function (e) {
            e.assignMaster(girl);
        });
    },
    toDom: function () {
        var $ret = $('<table />').addClass('fleet');
        this.fleets.each(function (e) {
            $ret.append($('<tr />').addClass('info').append(
                $('<td />').addClass('fid').text('' + e.fleetId)
            ).append(
                $('<td />').attr('colspan', '6').addClass('name').text(e.name + ' ' + e.getState())
            ));
            e.girls.each(function (e) {
                $ret.append(e.toDom());
            });
        });
        return $ret;
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
    getState: function () {
        return this.until > 0 ? ('遠征中 : ～' + utils.formatDate(new Date(this.until))) : '';
    },
    reset: function () {
        this.until = 0;
    }
};

models.Docks.prototype = {
    assignMaster: function (girl) {
        this.docks.each(function (e) {
            e.assignMaster(girl);
        });
    },
    toDom: function () {
        var $ret = $('<table />').addClass('docks').append(
            $('<tr />').addClass('info').append(
                $('<td />').text('■')
            ).append(
                $('<td />').text(this.name)
            )
        );
        this.docks.eachWithIndex(function (i, e) {
            $ret.append(e.toDom(i));
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
    getState: function () {
        if (this.until <= 0) {
            return '空き';
        } else if (this.isFinished()) {
            return '回収待ち';
        }
        return this.getName() + 'が修理中 : ～' + utils.formatDate(new Date(this.until));
    },
    isFinished: function () {
        return this.until > 0 && new Date().getTime() >= this.until;
    },
    reset: function () {
        this.until = 0;
    },
    toDom: function (i) {
        return $('<tr />').addClass('dock').append(
            $('<td />').text('' + i)
        ).append(
            $('<td />').text(this.getState())
        );
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
    assignGirl: function (girl) {
        this.girl = girl;
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
    isWreckedStart: function () {
        return utils.wrecked(this.starthp, this.maxhp);
    },
    damage: function (val) {
        this.nowhp = Math.max(this.nowhp - val, 0);
    },
    damageControl: function () {
        if (this.girl == null || this.girl.equipments == null)
            return -1;
        if (this.nowhp > 0)
            return -1;
        if (this.girl.hasEquipment(consts.repairNormalWeaponId)) {
            this.girl.useEquipment(consts.repairNormalWeaponId);
            this.nowhp = Math.floor(this.maxhp * 0.2);
            return consts.repairNormalWeaponId;
        } else if (this.girl.hasEquipment(consts.repairSpecialWeaponId)) {
            this.girl.useEquipment(consts.repairSpecialWeaponId);
            this.nowhp = this.maxhp;
            return consts.repairSpecialWeaponId;
        }
        return -1;
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
        this.combined.each(function (e) {
            e.assignMaster(ship);
        });
    },
    _makeFriendShips: function (raw, fleet) {
        var ret = [];
        var deck = fleet ? fleet[(raw['api_dock_id'] ? raw['api_dock_id'] : raw['api_deck_id']) - 1] : null;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = raw['api_maxhps'][i];
            if (x <= 0)return;
            var player =
                new models.Player(
                    deck ? deck.girls[i - 1].shipId : -1,
                        '味方' + i + '番艦',
                    raw['api_nowhps'][i],
                    x);
            if (deck)player.assignGirl(deck.girls[i - 1]);
            ret.push(player);
        });
        return ret;
    },
    _makeCombinedShips: function (raw, fleet) {
        var ret = [];
        var deck = fleet ? fleet[1] : null;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = raw['api_maxhps_combined'][i];
            if (x <= 0)return;
            ret.push(
                new models.Player(
                    deck ? deck.girls[i - 1].shipId : -1,
                        '随伴' + i + '番艦',
                    raw['api_nowhps_combined'][i],
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
                        '敵' + (i - 6) + '番艦',
                    raw['api_nowhps'][i],
                    x)
            );
        });
        return ret;
    },
    // ダメージ可算処理をし、ログに追加する
    _damage: function (target, val, context) {
        target.damage(val);
        //console.log(target.getName() + '(' + target.idName + ')に' + val + 'ダメージ(' + context + ')');
        this.logs.push(target.getName() + '(' + target.idName + ')に' + val + 'ダメージ(' + context + ')');
        switch (target.damageControl()) {
            case  consts.repairNormalWeaponId:
                this.logs.push(target.getName() + '(' + target.idName + ')のダメコン発動！(HPが' + target.nowhp + '回復)');
                break;
            case  consts.repairSpecialWeaponId:
                this.logs.push(target.getName() + '(' + target.idName + ')のダメコン発動！(HPが全回復)');
                break;
            default :
                break;
        }
    },
    _procAir: function (data, context) {
        if (!data)return;
        this._procTorp(data['api_stage3'], context, false);
        this._procTorp(data['api_stage3_combined'], context, true);
    },
    _procTorp: function (data, context, combined) { // 順序のない攻撃の処理(雷撃や航空戦)
        if (!data)return;
        var _self = this;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = Math.floor(data['api_fdam'][i]);
            if (x <= 0)return;
            if (combined) {
                _self._damage(_self.combined[i - 1], x, context);
            } else {
                _self._damage(_self.friends[i - 1], x, context);
            }
        });
        if (!data['api_edam'])return;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = Math.floor(data['api_edam'][i]);
            if (x <= 0)return;
            _self._damage(_self.enemies[i - 1], x, context);
        });
    },
    _procShelling: function (data, context, combined) {
        if (!data)return;
        var _self = this;
        var l = data['api_df_list'].length;
        for (var i = 1; i < l; i++) {
            var s = data['api_df_list'][i].length;
            for (var j = 0; j < s; j++) {
                var x = Math.floor(data['api_damage'][i][j]);
                var dest = data['api_df_list'][i][j];
                if (x <= 0)continue;
                if (dest > 6) {
                    _self._damage(_self.enemies[dest - 7], x, context);
                } else if (combined) {
                    _self._damage(_self.combined[dest - 1], x, context);
                } else {
                    _self._damage(_self.friends[dest - 1], x, context);
                }
            }
        }
    },
    _procAssist: function (data, context) { // 敵だけがダメージを受ける攻撃の処理(支援)
        if (!data)return;
        var _self = this;
        [1, 2, 3, 4, 5, 6].each(function (i) {
            var x = Math.floor(data['api_damage'][i]);
            if (x <= 0)return;
            _self._damage(_self.enemies[i - 1], x, context);
        });
    },
    getFriendSearchLabel: function () {
        return utils.searchLabel(this.friendSearch);
    },
    getEnemySearchLabel: function () {
        return utils.searchLabel(this.enemySearch);
    },
    getFriendFormationLabel: function () {
        return utils.formLabel(this.friendForm);
    },
    getEnemyFormationLabel: function () {
        return utils.formLabel(this.enemyForm);
    },
    getBattleFormationLabel: function () {
        return utils.battleLabel(this.battleForm);
    },
    isWrecked: function () {
        return this.endLifeLevel >= 4; // 4(大破)
    },
    isNewWrecked: function () {
        return  this.endLifeLevel >= 4 && this.startLifeLevel < 4;
    },
    toDom: function () {
        var $res = $('<div />').addClass('result');
        var $ul = $('<ul />').addClass('battle');
        $ul.append($('<li />').addClass('log').text('交戦 : ' + this.getBattleFormationLabel()));
        this.logs.each(function (e) {
            $ul.append($('<li />').addClass('log').text(e));
        });
        var $ftbl = $('<table />').addClass('fleet');
        $ftbl.append($('<tr />').append($('<td />').attr('colspan', '3').text('陣形:' + this.getFriendFormationLabel() + ' 索敵:' + this.getFriendSearchLabel())));
        this.friends.each(function (e) {
            $ftbl.append(e.toDom());
        });

        if (this.combinedFlag) {
            var $cmbl = $('<table />').addClass('fleet');
            $cmbl.append($('<tr />').append($('<td />').attr('colspan', '3').text(utils.combinedLabel())));
            this.combined.each(function (e) {
                $cmbl.append(e.toDom());
            });
        }
        var $etbl = $('<table />').addClass('fleet');
        $etbl.append($('<tr />').append($('<td />').attr('colspan', '3').text('陣形:' + this.getEnemyFormationLabel() + ' 索敵:' + this.getEnemySearchLabel())));
        this.enemies.each(function (e) {
            $etbl.append(e.toDom());
        });
        if (this.isWrecked()) {
            $res.append($('<div class="alert alert-danger" role="alert"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span><span class="sr-only">注意:</span> 味方艦が大破しています！</div>'));
            $res.append($('<hr />'));
        }
        var $friend = $('<div />').addClass('col-6 col-sm-6 col-lg-6');
        $friend.append($('<h4 />').text('自艦隊'));
        $friend.append($ftbl);
        if (this.combinedFlag) {
            $friend.append($('<hr />'));
            $friend.append($cmbl);
        }
        var $enemy = $('<div />').addClass('col-6 col-sm-6 col-lg-6');
        $enemy.append($('<h4 />').text('敵艦隊'));
        $enemy.append($etbl);
        $res.append($('<div />').addClass('row').append($friend).append($enemy));
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
    battle: function (json, port, ship) {
        return new models.Battle(json['api_data'], port, ship);
    },
    /**
     * @param member/port
     * @return Port{models.Fleet}
     */
    fleet: function (json) {
        var p = json['api_data']['api_deck_port'];
        return new models.Port(p.map(function (x) {
            return new models.Fleet(x);
        }));
    },
    /**
     * @param member/port
     * @return models.Docks[models.Repair]}
     */
    repair: function (json) {
        var p = json['api_data']['api_ndock'];
        return new models.Docks('修理ドック', p.map(function (x) {
            return new models.Repair(x);
        }));
    }
};

// APIを跨いで計算されたり保持されたりするもの
var kccaches = (function () {
    var c = function () {
        this.isWrecked = false;
        this.currentBattle = null;
        this.combined = 0;
        this.od = {
            approachBoss: 0,
            destroyLst: 0
        };
    };
    c.prototype = {
        // 戦闘時
        onBattle: function (battle) {
            this.currentBattle = battle;
            this.wrecked = battle.isWrecked();
        },
        // 戦闘終了時(主に沈めた輸送艦のコミット)
        onFinishBattle: function () {
            if (!this.currentBattle)return;
            this.od.destroyLst += this.currentBattle.enemies.filter(function (e) {
                return e.nowhp <= 0 && e.master != null;
            }).filter(function (e) {
                return e.master.typeId == consts.supplyShipTypeId;
            }).length;
        },
        // 進撃時安全チェック
        onSortie: function (sortie) {
            if (sortie.isBossCell()) {
                this.od.approachBoss++;
            }
        },
        // 進撃時安全チェック
        isSafeSortie: function () {
            return !this.isWrecked;
        },
        // 母港帰還時
        onBackPort: function (json) {
            this.wrecked = false; // ただし修理は必要
            this.combined = json['api_data']['api_combined_flag'] ? json['api_data']['api_combined_flag'] : 0;
        },
        toDom: function () {
            var $ul = $('<ul />').addClass('counts');
            $ul.append($('<li />').addClass('cnt').text('ボス到達 :' + this.od.approachBoss));
            $ul.append($('<li />').addClass('cnt').text('輸送艦狩り :' + this.od.destroyLst));
            return $ul;
        }
    };
    return new c();
})();
