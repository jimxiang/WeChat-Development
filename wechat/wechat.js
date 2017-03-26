'use strict';

const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
const prefix = 'https://api.weixin.qq.com/cgi-bin/';
const api = {
    access_token: prefix + 'token?grant_type=client_credential'
};
function Wechat(opts) {
    let that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.setAccessToken = opts.setAccessToken;

    this.getAccessToken()
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
        that.access_token = data.access_token;
        that.expires_in = data.expires_in;
        that.setAccessToken(data);
    })
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
    })
}
module.exports = Wechat;