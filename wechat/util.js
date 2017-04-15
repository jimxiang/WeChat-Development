'use strict';

const xml2js = require('xml2js');
const Promise = require('bluebird');
const template = require('./template');

// 原始XML解析
exports.parseXMLAsync = function(xml) {
    return new Promise(function(resolve, reject) {
        xml2js.parseString(xml, {trim: true}, function(err, content) {
            if(err) {
                reject(err);
            } else {
                resolve(content);
            }
        });
    })
}

// 格式化为js对象
function formatMessage(result) {
    let message = {};

    if('object' === typeof result) {
        let keys = Object.keys(result);
        for(let i = 0; i < keys.length; i++) {
            let key = keys[i],
                item = result[key];

            if(!(item instanceof Array) || item.length === 0) {
                continue;
            }
            if(item.length === 1) {
                let val = item[0];
                if('object' === typeof value) {
                    message[key] = formatMessage(val);
                } else {
                    message[key] = ('' + val || '').trim();
                }
            }
            else {
                message[key] = [];
                for(let j = 0; j < item.length; j++) {
                    message[key].push(formatMessage(item[j]));
                }
            }
        }
    }
    return message;
}

exports.formatMessage = formatMessage;

// 返回XML给微信
exports.template = function(content, message) {
    let info = {},
        type = 'text',
        fromUsername = message.FromUserName,
        toUsername = message.ToUserName;
    if(Array.isArray(content)) {
        type = 'news';
    }

    type = (content && content.type) || type;
    info.content = content;
    info.createTime = new Date().getTime();
    info.fromUserName = fromUsername;
    info.toUserName = toUsername;
    info.msgType = type;

    return template.compiled(info);
}