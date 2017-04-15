'use strict';

const path = require('path');
const util = require('./libs/util');
const access_token_file = path.join(__dirname, './config/access_token.txt');
const access_ticket_file = path.join(__dirname, './config/access_ticket.txt')
const config = {
    wechat: {
        appID: '',
        appSecret: '',
        token: '',
        getAccessToken: () => {
            return util.readFileAsync(access_token_file, 'utf-8');
        },
        setAccessToken: (data) => {
            data = JSON.stringify(data);
            return util.writeFileAsync(access_token_file, data);
        },
        getTicket: () => {
            return util.readFileAsync(access_ticket_file, 'utf-8');
        },
        setTicket: (data) => {
            data = JSON.stringify(data);
            return util.writeFileAsync(access_ticket_file, data);
        }
    }
}
module.exports = config;