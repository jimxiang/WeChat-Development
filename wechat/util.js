'use strict';

const xml2js = require('xml2js');
const Promise = require('bluebird');

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
                    message[key] = (val || '').trim();
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