'use strict';

const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const fs = require('fs');
const _ = require('lodash');
const util = require('./util');
const prefix = 'https://api.weixin.qq.com/cgi-bin/';
const mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
const semanticPrefix = 'https://api.weixin.qq.com/semantic/semproxy/search?';

const api = {
    access_token: prefix + 'token?grant_type=client_credential',
    temporary: {
        upload: prefix + 'media/upload?',
        fetch: prefix + 'media/get?'
    },
    permanent: {
        upload: prefix + 'material/add_material?',
        fetch: prefix + 'material/get_material?',
        uploadNews: prefix + 'material/add_news?',
        uploadNewsPic: prefix + 'media/uploadimg?',
        delete: prefix + 'material/del_material?',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        list: prefix + 'material/batchget_material?'
    },
    group: {
        create: prefix + 'groups/create?',
        get: prefix + 'groups/get?',
        check: prefix + 'groups/getid?',
        update: prefix + 'groups/update?',
        move: prefix + 'groups/members/update?',
        batchUpdate: prefix + 'groups/members/batchupdate?',
        delete: prefix + 'groups/delete?'
    },
    user: {
        remark: prefix + 'user/info/updateremark?',
        get: prefix + 'user/info?',
        batchGet: prefix + 'user/batchget?',
        list: prefix + 'user/get?'
    },
    mass: {
        group: prefix + 'message/mass/sendall?',
        openId: prefix + 'message/mass/send?',
        delete: prefix + 'message/mass/delete?',
        preview: prefix + 'message/mass/preview?',
        check: prefix + 'message/mass/get?'
    },
    menu: {
        create: prefix + 'menu/create?',
        get: prefix + 'menu/get?',
        delete: prefix + 'menu/delete?',
        current: prefix + 'get_current_selfmenu_info?'
    },
    qrcode: {
        create: prefix + 'qrcode/create?',
        show: mpPrefix + 'showqrcode?'
    },
    shortUrl: {
        create: prefix + 'shorturl?',
    },
    semanticPrefix: semanticPrefix,
    ticket: {
        get: prefix + 'ticket/getticket?'
    }
};
function Wechat(opts) {
    let that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.setAccessToken = opts.setAccessToken;
    this.setTicket = opts.setTicket;
    this.getTicket = opts.getTicket;
    this.fetchAccessToken();
}

Wechat.prototype.fetchAccessToken = function() {
    let that = this;

    // if(this.access_token && this.expires_in) {
    //     if(this.isValidAccessToken(this)) {
    //         return Promise.resolve(this);
    //     }
    // }
    return this.getAccessToken()
    .then(function(data) {
        try {
            data = JSON.parse(data);
        } catch(e) {
            return that.updateAccessToken();
        }
        if(that.isValidAccessToken(data)) {
            return new Promise(function(resolve, reject){
                resolve(data);
            });
        } else {
            return that.updateAccessToken();
        }
    })
    .then(function(data) {
        // that.access_token = data.access_token;
        // that.expires_in = data.expires_in;

        that.setAccessToken(data);

        return Promise.resolve(data);
    })
}

Wechat.prototype.fetchTicket = function(access_token) {
    let that = this;
    return this.getTicket()
    .then(function(data) {
        try {
            data = JSON.parse(data);
        } catch(e) {
            return that.updateTicket(access_token);
        }
        if(that.isValidTicket(data)) {
            return new Promise(function(resolve, reject){
                resolve(data);
            });
        } else {
            return that.updateTicket(access_token);
        }
    })
    .then(function(data) {
        that.setTicket(data);

        return Promise.resolve(data);
    })
}

Wechat.prototype.isValidTicket = function(data) {
    if(!data || !data.ticket || !data.expires_in) {
        return false;
    }
    let ticket = data.ticket,
        expires_in = data.expires_in,
        now = (new Date().getTime());

    if(ticket && now < expires_in) {
        return true;
    } else {
        return false;
    }
}

Wechat.prototype.isValidAccessToken = function(data) {
    if(!data || !data.access_token || !data.expires_in) {
        return false;
    }
    let access_token = data.access_token,
        expires_in = data.expires_in,
        now = (new Date().getTime());

    if(now < expires_in) {
        return true;
    } else {
        return false;
    }
}

Wechat.prototype.updateAccessToken = function() {
    let appID = this.appID,
        appSecret = this.appSecret,
        url = api.access_token + '&appid=' + appID + '&secret=' + appSecret;
    
    return new Promise(function(resolve, reject) {
        request({url: url, json: true}).then(function(res) {
            let data = res.body,
                now = (new Date().getTime()),
                expires_in = now + (data.expires_in - 20) * 1000;

            data.expires_in = expires_in;
            resolve(data);
        });
    });
}

Wechat.prototype.updateTicket = function(access_token) {
    let url = api.ticket.get + 'access_token=' + access_token + '&type=jsapi';
    
    return new Promise(function(resolve, reject) {
        request({url: url, json: true}).then(function(res) {
            let data = res.body,
                now = (new Date().getTime()),
                expires_in = now + (data.expires_in - 20) * 1000;

            data.expires_in = expires_in;
            resolve(data);
        });
    });
}

Wechat.prototype.uploadMaterial = function(type, material, permanent) {
    let that = this,
        form = {},
        uploadUrl = api.temporary.upload;
    if(permanent) {
        uploadUrl = api.permanent.upload;
        _.extend(form, permanent);
    }

    if('pic' === type) {
        uploadUrl = api.permanent.uploadNewsPic;
    }

    if('news' === type) {
        uploadUrl = api.permanent.uploadNews;
        form = material;
    }
    else {
        form.media = fs.createReadStream(material);
    }
        
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = uploadUrl + 'access_token=' + data.access_token;
            if(!permanent) {
                url += '&type=' + type;
            } else {
                form.access_token = data.access_token;
            }
            let options = {
                method: 'POST',
                url: url,
                json: true
            }
            if('news' === type) {
                options.body = form;
            } else {
                options.formData = form;
            }
            request(options)
            .then(function(res) {
                let _data = res.body;
                if(_data) {
                    resolve(_data);
                } else {
                    throw new Error('Upload material fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    })
}

Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    let that = this,
        form = {},
        fetchUrl = api.temporary.fetch;
    if(permanent) {
        fetchUrl = api.permanent.fetch;
    }
        
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = fetchUrl + 'access_token=' + data.access_token,
                form = {},
                options = {method: 'POST', url: url, json: true};

            if(permanent) {
                form.media_id = mediaId,
                form.access_token = data.access_token
                options.body = form;
            } else {
                if('video' === type) {
                    url = url.replace('https://', 'http://');
                }
                url += '&media_id=' + mediaId;
            }

            if('news' === type || 'video' === type) {
                request(options)
                .then(function(res) {
                    let _data = res.body;
                    if(_data) {
                        resolve(_data);
                    } else {
                        throw new Error('Upload material fails');
                    }
                })
                .catch(function(err) {
                    reject(err);
                })
            } else {
                resolve(url);
            }
        })
    })
}

Wechat.prototype.deleteMaterial = function(mediaId) {
    let that = this,
        form = {
            media_id: mediaId
        },
        deleteUrl = api.permanent.delete;
        
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = deleteUrl + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, body: form, json: true})
            .then(function(res) {
                let _data = res.body;
                if(_data) {
                    resolve(_data);
                } else {
                    throw new Error('Delete material fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    })
}

Wechat.prototype.updateMaterial = function(mediaId, newMaterial) {
    let that = this,
        form = {
            media_id: mediaId
        },
        updateUrl = api.permanent.update;
    _.extend(form, newMaterial);
        
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = updateUrl + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, body: form, json: true})
            .then(function(res) {
                let _data = res.body;
                if(_data) {
                    resolve(_data);
                } else {
                    throw new Error('Delete material fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    })
}


Wechat.prototype.getMaterialCount = function() {
    let that = this;
        
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.permanent.count + 'access_token=' + data.access_token;
            request({method: 'GET', url: url, json: true})
            .then(function(res) {
                let _data = res.body;
                if(_data) {
                    resolve(_data);
                } else {
                    throw new Error('Get the count of material fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    })
}

Wechat.prototype.getMaterialList = function(opts) {
    let that = this;
    opts.type = opts.type || 'image';
    opts.offset = opts.offset || 0;
    opts.count = opts.count || 1;
        
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.permanent.list + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, body: opts, json: true})
            .then(function(res) {
                let _data = res.body;
                if(_data) {
                    resolve(_data);
                } else {
                    throw new Error('Get the list of material fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    })
}

Wechat.prototype.createGroup = function(name) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.group.create + 'access_token=' + data.access_token,
                options = {
                    group: {
                        name: name
                    }
                }
            request({method: 'POST', url: url, json: true, body: options}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Create group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.getGroup = function() {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.group.get + 'access_token=' + data.access_token;
            request({url: url, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Get group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.checkGroup = function(openId) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.group.check + 'access_token=' + data.access_token,
                form = {
                    openid: openId
                };
            request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Check group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.updateGroup = function(id, name) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.group.update + 'access_token=' + data.access_token,
                form = {
                    group: {
                        id: id,
                        name: name
                    }
                };
            request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Update group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.moveGroup = function(openId, to) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url, form = {
                to_groupid: to
            };
            // 如果openId是数组就执行批量移动，否则单个移动
            if(_.isArray(openId)) {
                url = api.group.batchUpdate + 'access_token=' + data.access_token;
                form.openid_list = openId;
            } else {
                url = api.group.move + 'access_token=' + data.access_token;
                form.openid = openId;
            }
            
            request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Move group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.deleteGroup = function(id) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.group.delete + 'access_token=' + data.access_token,
                form = {
                    group: {
                        id: id
                    }
                };
            request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Delete group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.remarkUser = function(openId, remark) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.group.remark + 'access_token=' + data.access_token,
                form = {
                    openid: openId,
                    remark: remark
                };
            request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Remark user fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.getUser = function(openId, lang) {
    let that = this;
    lang = lang || 'zh_CN';
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url,
                options = {
                    json: true
                };
            if(_.isArray(openId)) {
                url = api.user.batchGet + 'access_token=' + data.access_token;
                options.method = 'POST';
                options.url = url;
                options.body = {
                    user_list: openId
                }
            } else {
                url = api.user.get + 'access_token=' + data.access_token + '&openid=' + openId + '&lang=' + lang;
                options.method = 'GET';
                options.url = url;
            }
            
            request(options).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Remark user fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.getUserList = function(openId) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.user.list + 'access_token=' + data.access_token;
            if(openId) {
                url +=  '&next_openid=' + openId;
            }
            request({url: url, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Get user list fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.sendByGroup = function(type, message, groupId) {
    let that = this,
        msg = {
            filter: {},
            msgtype: type
        };
    msg[type] = message;

    if(!groupId) {
        // 群发
        msg.filter.is_to_all = true;
    } else {
        msg.filter.is_to_all = false;
        msg.filter.group_id = groupId;
    }
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.mass.group  + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, json: true, body: msg}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Send to group fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.sendByOpenId = function(type, message, openId) {
    let that = this,
        msg = {
            touser: openId,
            msgtype: type
        };
    msg[type] = message;

    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.mass.openId  + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, json: true, body: msg}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Send by openid fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.deleteMass = function(msgId) {
    let that = this;

    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.mass.delete  + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, json: true, body: {msg_id: msgId}}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Delete mass fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.previewMass = function(type, message, openId) {
    let that = this,
        msg = {
            touser: openId,
            msgtype: type
        };
    msg[type] = message;

    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.mass.preview  + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, json: true, body: msg}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Preview mass fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.checkMass = function(msgId) {
    let that = this;

    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.mass.check  + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, json: true, body: {msg_id: msgId}}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Check mass fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.createMenu = function(menu) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.menu.create + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, json: true, body: menu}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Create menu fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.getMenu = function(menu) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.menu.get + 'access_token=' + data.access_token;
            request({url: url, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Get menu fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.deleteMenu = function(menu) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.menu.delete + 'access_token=' + data.access_token;
            request({url: url, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Delete menu fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.currentMenu = function(menu) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.menu.current + 'access_token=' + data.access_token;
            request({url: url, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Current menu fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.createQrcode = function(qr) {
    let that = this;
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.qrcode.create + 'access_token=' + data.access_token;
            request({method: 'POST', url: url, body: qr, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Create qrcode fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.showQrcode = function(ticket) {
    return api.qrcode.show + 'ticket=' + encodeURI(ticket);
}

Wechat.prototype.createShorturl = function(action, url) {
    let that = this;
    action = action || 'long2short';
    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.shortUrl.create + 'access_token=' + data.access_token,
                form = {
                    action: action,
                    long_url: url
                };
            request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Create shorturl fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.semantic = function(params) {
    let that = this;

    return new Promise(function(resolve, reject) {
        that
        .fetchAccessToken()
        .then(function(data) {
            let url = api.semanticPrefix + 'access_token=' + data.access_token;

            params.appid = data.appID;
            request({method: 'POST', url: url, body: params, json: true}).then(function(res) {
                let data = res.body;
                if(data) {
                    resolve(data);
                } else {
                    throw new Error('Create shorturl fails');
                }
            })
            .catch(function(err) {
                reject(err);
            })
        })
    });
}

Wechat.prototype.reply = function() {
    let content = this.body,
        message = this.weixin,
        xml = util.template(content, message);

    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
}

module.exports = Wechat;