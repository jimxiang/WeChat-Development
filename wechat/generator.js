'use strict';

const sha1 = require('sha1');
const getRawBody = require('raw-body');
const Wechat = require('./wechat');
const util = require('./util');

module.exports = function(opts, handler) {
    let wechat = new Wechat(opts);

    return function *(next) {
        let that = this,
            token = opts.token,
            signature = this.query.signature,
            nonce = this.query.nonce,
            timestamp = this.query.timestamp,
            echostr = this.query.echostr;

        let str = [token, timestamp, nonce].sort().join(''),
            sha = sha1(str);

        if('GET' === this.method) {
            if(sha === signature) {
                this.body = echostr + '';
            } else {
                this.body = 'wrong';
            }
        } else if('POST' === this.method) {
            if(sha !== signature) {
                this.body = 'wrong';
                return false;
            }
            let data = yield getRawBody(this.req, {
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            });

            let content = yield util.parseXMLAsync(data);
            let message = util.formatMessage(content.xml);
            this.weixin = message;
            console.log(message);
    
            yield handler.call(this, next);

            // 回复
            wechat.reply.call(this);
        }
    }
}